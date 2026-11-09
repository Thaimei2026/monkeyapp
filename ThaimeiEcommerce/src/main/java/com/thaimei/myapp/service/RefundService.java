package com.thaimei.myapp.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.net.RequestOptions;
import com.stripe.param.RefundCreateParams;
import com.thaimei.myapp.dto.RefundDto;
import com.thaimei.myapp.dto.RefundItemRequestDto;
import com.thaimei.myapp.dto.RefundResponseListDto;
import com.thaimei.myapp.dto.ResponseRefundDto;
import com.thaimei.myapp.dto.UserSideRefundDto;
import com.thaimei.myapp.dto.UserSideResponseRefundDto;
import com.thaimei.myapp.enums.OrderStatusEnum;
import com.thaimei.myapp.enums.RefundStatus;
import com.thaimei.myapp.error.AppException;
import com.thaimei.myapp.error.ResourceNotFoundException;
import com.thaimei.myapp.model.OrderItems;
import com.thaimei.myapp.model.Orders;
import com.thaimei.myapp.model.RefundModel;
import com.thaimei.myapp.repository.OrderItemRepo;
import com.thaimei.myapp.repository.RefundRepo;
import com.thaimei.myapp.model.Payment;

import org.springframework.transaction.annotation.Transactional;



@Service
public class RefundService {
    private final static int REFUND_WINDOWS_HOURS = 24;
    private final RefundRepo refundRepo;
    private final OrderItemRepo orderItemRepo;

    public RefundService(RefundRepo refundRepo, OrderItemRepo orderItemRepo) {
        this.refundRepo = refundRepo;
        this.orderItemRepo = orderItemRepo;
    }

    @Transactional
    public void requestRefund(RefundDto dto, Long userId) {
        for(RefundItemRequestDto itemreq: dto.getItems()) {
            OrderItems item = orderItemRepo.findById(itemreq.getItemId())
            .orElseThrow(() -> new ResourceNotFoundException ("no item found!" + itemreq.getItemId()));

            Orders order = item.getOrders();
            if(!order.getUser().getId().equals(userId)) {
                throw new AppException("you don't own this order" , 403);
            }


            int qty = itemreq.getQuantity();
            if(qty <= 0 || qty > item.getQuantity()) {
                throw new AppException("Invalid quantity for item " + item.getId(), 400);
            }

            

            if(order.getStatus() != OrderStatusEnum.CONFIRMED) {
                throw new AppException("Order is not eligible for refund yet", 400);
            } 

            if(order.getDeliveredAt() == null) {
                throw new AppException("Order is not delivered yet", 400);
            }

            if (LocalDateTime.now().isAfter(order.getDeliveredAt().plusHours(REFUND_WINDOWS_HOURS))) {
                throw new AppException("Refund window has expired", 400);
            }

            boolean alreadyRefunding = refundRepo.findByOrderItem_IdAndStatusIn(item.getId(),List.of(RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.COMPLETED)).isPresent();
            if (alreadyRefunding) {
                throw new AppException("this item has been refunded or being processed", 400);
            }
            BigDecimal amount = item.getPriceAtPurchase().multiply(BigDecimal.valueOf(qty));

            RefundModel record = new RefundModel();
            record.setOrder(order);
            record.setOrderItem(item);
            record.setAmount(amount);
            record.setQuantity(qty);
            record.setStatus(RefundStatus.PENDING);
            refundRepo.save(record);
        }
    }

    // admin approve refund.
    @Transactional(noRollbackFor = AppException.class)
    public void approveRefund(Long refundId) {
        RefundModel refund = refundRepo.findById(refundId)
        .orElseThrow(()-> new ResourceNotFoundException ("refund Request not found" + refundId));

        //admin will have the authority to apporove refunds rejected by seller.
        if(refund.getStatus() != RefundStatus.PENDING && refund.getStatus() != RefundStatus.REJECTED) {
            throw new AppException("only pending refunds request can be approved", 400);
        }
        sendToStripe(refund);
    }

    // seller approve refund.
    @Transactional(noRollbackFor = AppException.class)
    public void approveRefundBySeller(Long sellerId, Long refundId) {
        RefundModel refund = refundRepo.findById(refundId)
        .orElseThrow(()-> new ResourceNotFoundException ("refund Request not found " + refundId));

        if(!refund.getOrder().getStore().getUser().getId().equals(sellerId)) {
            throw new AppException("you can't manage this refund", 403);
        }

        if(refund.getStatus() != RefundStatus.PENDING) {
            throw new AppException("only pending refunds request can be approved", 400);
        }
        sendToStripe(refund);
    }

    // call stripe API to process refund, if success, update refund status to processing, if failed, update refund status to failed.
    private void sendToStripe(RefundModel refund) {
        Payment payment = refund.getOrder().getPayment();
        if(payment == null) {
            throw new AppException("Payment not found for this order", 400);
        }

        try {
            RefundCreateParams params = RefundCreateParams.builder()
            .setPaymentIntent(payment.getPaymentId())
            .setAmount(refund.getAmount().multiply(BigDecimal.valueOf(100)).longValue())
            .putMetadata("refundRecord", refund.getId().toString())
            .build();

            // setIdempotencyKey is a method that Stripe’s Java library defines on RequestOptions.builder()
            // RequestOptions: a Stripe class that carries per-request settings (like the idempotency key) alongside the main request parameters.
            // It controls how a request is sent, not what is requested.
            Refund.create(params, RequestOptions.builder()
                .setIdempotencyKey("refund-"+ refund.getId())
                .build());
            refund.setStatus(RefundStatus.PROCESSING);
            refundRepo.save(refund);
        } catch (StripeException e) {
            refund.setStatus(RefundStatus.FAILED);
            refundRepo.save(refund);
            throw new AppException("Failed to process refund" + e.getMessage(), 502);
        }

    }

    // get refunds for admin base on refund status.
    public RefundResponseListDto getRefunds() {
        return toResponse(refundRepo.findByStatus(RefundStatus.PENDING));
    }

    // fetch refunds for sellers base on refund status and seller ID
    public RefundResponseListDto getSellerRefunds(Long sellerId) {
        return toResponse(refundRepo.findByStatusAndOrder_Store_User_Id(RefundStatus.PENDING, sellerId));
    }

    // convert refund model to response DTO
    private RefundResponseListDto toResponse(List<RefundModel> refunds) {
        List<ResponseRefundDto> dtos = refunds.stream()
        .map(r -> new ResponseRefundDto(
            r.getId(),
            r.getStatus(),
            r.getOrderItem().getProduct().getName(),
            r.getQuantity(),
            r.getAmount(),
            r.getCreatedAt(),
            r.getRejectionReason()))
        .toList();

        RefundResponseListDto response = new RefundResponseListDto();
        response.setRefundResponseList(dtos);
        return response;
    }

    // Reject refund by seller
    @Transactional 
    public void rejectRefundBySeller(Long sellerId, Long refundId, String reason) {
        RefundModel refund = refundRepo.findById(refundId)
        .orElseThrow(() -> new ResourceNotFoundException("refund request not found"));
        if(!refund.getOrder().getStore().getUser().getId().equals(sellerId)) {
            throw new AppException("you can't manage this refund", 403);
        }
        if(refund.getStatus() != RefundStatus.PENDING) {
            throw new AppException("only pending refund request can be rejected", 400);
        }
        refund.setStatus(RefundStatus.REJECTED);
        refund.setRejectionReason(reason);
        refundRepo.save(refund);
    }

    // Reject refund by admin
    @Transactional 
    public void rejectRefundByAdmin(Long refundId, String reason) {
        RefundModel refund = refundRepo.findById(refundId)
        .orElseThrow(() -> new ResourceNotFoundException("refund request not found"));

        if(refund.getStatus() != RefundStatus.PENDING) {
            throw new AppException("Only Pending refund request can be rejected", 400);
        }
        refund.setStatus(RefundStatus.REJECTED);
        refund.setRejectionReason(reason);
        refundRepo.save(refund);
    }

    // stripe calles this.
    @Transactional 
    public void completeRefund(Long refundRecordId) {
        RefundModel refund = refundRepo.findById(refundRecordId)
        .orElseThrow(() -> new ResourceNotFoundException("Refund record not found for this Id" + refundRecordId));

        if(refund.getStatus() == RefundStatus.COMPLETED) {
            return;
        }

        if(refund.getStatus() != RefundStatus.PROCESSING) {
            throw new AppException("Only processing refund can be completed", 400);
        }

        refund.setCompletedAt(LocalDateTime.now());
        refund.setStatus(RefundStatus.COMPLETED);
        refundRepo.save(refund);
    }

    // stripe calles this.
    @Transactional
    public void failRefund(Long refundRecordId) {
        RefundModel refund = refundRepo.findById(refundRecordId)
        .orElseThrow(() -> new ResourceNotFoundException("Refund Record not found for this Id" + refundRecordId));

        if(refund.getStatus() == RefundStatus.FAILED) {
            return;
        }
        if(refund.getStatus() != RefundStatus.PROCESSING) {
            throw new AppException("Only processing refund request can be failed", 400);
        }

        refund.setStatus(RefundStatus.FAILED);
        refundRepo.save(refund);
    }

    public UserSideResponseRefundDto getRefundForUser(Long userId) {
        List<RefundModel> refunds = refundRepo.findByOrder_User_Id(userId);
        List<UserSideRefundDto> dtos = refunds.stream()
        .map(refund -> new UserSideRefundDto(
            refund.getId(),
            refund.getOrderItem().getProduct().getName(),
            refund.getQuantity(),
            refund.getAmount(),
            refund.getStatus(),
            refund.getCreatedAt(),
            refund.getRejectionReason()
        ))
        .toList();

        UserSideResponseRefundDto response = new UserSideResponseRefundDto();
        response.setRefunds(dtos);
        return response;
    }

    //called when an order is cancelled, rejected by the seller, or delivery failed.
    // the caller is responsible for checking who is alloed to do that action.
    @Transactional(noRollbackFor = AppException.class)
    public void refundOrderAutomatically(Orders order, List<OrderItems> items) {
        if(order.getPayment() == null) return; // never paid nothing to refund.
    

        for(OrderItems item: items) {
            boolean exists = refundRepo.findByOrderItem_IdAndStatusIn(item.getId(), List.of(RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.COMPLETED)).isPresent();
            if(exists) continue; // already refunded or in progress

            RefundModel refund = new RefundModel();
            refund.setOrder(order);
            refund.setOrderItem(item);
            refund.setQuantity(item.getQuantity());
            refund.setAmount(item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())));
            refund.setStatus(RefundStatus.PENDING);
            refundRepo.save(refund);

            // call Stripe API to process refund, if success, update refund status to processing, if failed, update refund status to failed.
            try {
                sendToStripe(refund);
            } catch (AppException e) {
                System.out.println("Auto refund failed for item " + item.getId() + ": " + e.getMessage());
            }
        }
    }
}
