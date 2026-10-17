package com.thaimei.myapp.service;
import org.springframework.stereotype.Service;
import com.thaimei.myapp.model.Payment;
import com.thaimei.myapp.model.ProcessWebhook;
import com.thaimei.myapp.dto.PaymentDto;
import com.thaimei.myapp.enums.PaymentStatus;
import com.thaimei.myapp.error.AppException;
import com.thaimei.myapp.error.ResourceNotFoundException;
import com.thaimei.myapp.error.WebhookProcessingException;

import org.modelmapper.ModelMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.stripe.model.Charge;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.thaimei.myapp.repository.ProcessWebhookRepo;
import com.thaimei.myapp.repository.UserRepository;

import jakarta.transaction.Transactional;

import com.thaimei.myapp.repository.OrderRepo;
import com.thaimei.myapp.enums.OrderStatusEnum;
import com.thaimei.myapp.model.OrderItems;
import com.thaimei.myapp.model.Orders;
import com.thaimei.myapp.model.User;
import com.thaimei.myapp.repository.PaymentRepo;
import com.thaimei.myapp.repository.ProductsRepo;
import com.thaimei.myapp.dto.OrderSummary;

@Service
public class PaymentService {
    private final RefundService refundService;
    private final PaymentRepo paymentRepo;
    private final ModelMapper modelMapper;
    private final ProcessWebhookRepo processWebhookRepo;
    private final UserRepository userRepo;
    private final OrderRepo orderRepo;
    private final ProductsRepo productsRepo;
    public PaymentService(ProductsRepo productsRepo, PaymentRepo paymentRepo, ModelMapper modelMapper, ProcessWebhookRepo processWebhookRepo, UserRepository userRepo, OrderRepo orderRepo, RefundService refundService) {
        this.productsRepo=productsRepo;
        this.paymentRepo=paymentRepo;
        this.modelMapper=modelMapper;
        this.processWebhookRepo=processWebhookRepo;
        this.userRepo=userRepo;
        this.orderRepo=orderRepo;
        this.refundService=refundService;
    }
    public PaymentDto getPaymentDetailsByPaymentId(String paymentId, User user) {
        Payment paymentDetails =paymentRepo.findByPaymentId(paymentId)
        .orElseThrow(() -> new ResourceNotFoundException("No payment is found"));

        if(!user.getId().equals(paymentDetails.getUser().getId())) {
            throw new AppException("You don't own this payment", 403);
        }

        List<OrderSummary> orderSummaries  = paymentDetails.getOrders().stream()
        .map(o -> new OrderSummary(o.getId(), o.getStatus()))
        .toList();
        
        PaymentDto dto = modelMapper.map(paymentDetails, PaymentDto.class);
        dto.setOrders(orderSummaries);
        return dto;
    }

    @Transactional
    public boolean  savePaymentDetails(Object paymentObject) {
        if(paymentObject instanceof PaymentIntent intent) {
            //Map lookup using the key, since metadata is Map
            String orderIdsStr=intent.getMetadata().get("orderIds");
            if(orderIdsStr == null) {
                //write to you application's console/standard output, not ideal for production.
                System.out.println("No orderIds found in metadata for PaymentIntent: " + intent.getId());
                return false;
            }
            //declare the type as String array, split creates the array splitting the ids by comma.
            String[] orderIds = orderIdsStr.split(",");
            String userId = intent.getMetadata().get("userId");

            if(userId == null) {
                System.out.println("no userId found in metadata for PaymentIntent:" + intent.getId());
                return false;
            }
            
            //One payment row per paymentIntent --> idempotency via findByPaymentId
            //if paymentId exists update the existing one with the incoming data.
            //multiple orderIds could hold a reference to the same payemntId/intentId.
            Payment payment = paymentRepo.findByPaymentId(intent.getId())
            //else create a new Payment object.
            .orElse(new Payment());

            User user =userRepo.findById(Long.valueOf(userId)).orElse(null);
            if (user == null) {
                System.out.println("user not found for id: "+ userId);
                return false;
            }

            payment.setUser(user);
            payment.setPaymentId(intent.getId());
            //get the totalprice from Stripe, divide it by 100 to converts it back to normal unit, since Stripe takes money in smallest unit.
            payment.setTotalAmount(BigDecimal.valueOf(intent.getAmount()).divide(BigDecimal.valueOf(100))); 
            payment.setCurrency(intent.getCurrency().toUpperCase()); // Convert to standard currency code.
            payment.setPaymentStatus(mapStripeStatus(intent.getStatus()));
            // uses a ternary operator to check if the payment method is null, if it is null, it sets it to "UNKNOWN", otherwise it sets it to the actual payment method.
            payment.setPaymentMethod(intent.getPaymentMethod() != null ? intent.getPaymentMethod() : "UNKNOWN");
            paymentRepo.save(payment);

            //set the order status after the payment status is set, successful payment means successful orders.
            OrderStatusEnum newOrderStatus = switch(payment.getPaymentStatus()) {
                case SUCCESSFUL -> OrderStatusEnum.PLACED;
                case FAILED -> OrderStatusEnum.FAILED;
                default -> OrderStatusEnum.PENDING;
            };
        
            for (String orderId: orderIds) {
                Orders order = orderRepo.findById(Long.valueOf(orderId)).orElse(null);
                if(order == null) {
                    System.out.println("order not found for id:" + orderId);
                    throw new WebhookProcessingException("orderId doesn't exist");
                } 
                order.setPayment(payment);
                if(order.getStatus() == OrderStatusEnum.PENDING) {
                    if(newOrderStatus == OrderStatusEnum.PLACED) {
                        order.setStatus(OrderStatusEnum.PLACED);
                    } else if(newOrderStatus == OrderStatusEnum.FAILED) {
                        for(OrderItems oi: order.getOrderItems()) {
                            productsRepo.addStock(oi.getProduct().getProductId(), oi.getQuantity());
                        }
                        order.setStatus(OrderStatusEnum.FAILED);
                    }
                }
                orderRepo.save(order);
            }
            return true;
        }
       return false;
    }

    @Transactional
    public boolean handleChargeRefunded(Charge charge) {
        Payment payment = paymentRepo.findByPaymentId(charge.getPaymentIntent()).orElse(null);
        if(payment == null) {
            System.out.println("no payment found for PaymentIntent:" + charge.getPaymentIntent());
            return false;
        }
        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        paymentRepo.save(payment);

        for(Refund r: charge.getRefunds().getData()) {
            String refundRecordId = r.getMetadata().get("refundRecord");
            if(refundRecordId != null && "succeeded".equals(r.getStatus())) {
                 refundService.completeRefund(Long.valueOf(refundRecordId));
            }
        }
        return true;
    }

    public boolean eventExists(String eventId) {
        return processWebhookRepo.existsById(eventId);
    }

    //this is a  newer Switch expression.
    //map the Stripe payment status to our internal PaymentStatus enum, this is useful for standardizing the status values across different payment providers.
    private PaymentStatus mapStripeStatus(String stripeStatus) {
        return switch(stripeStatus) {
            case "succeeded" -> PaymentStatus.SUCCESSFUL;
            case "requires_payment_method", "canceled" -> PaymentStatus.FAILED;
            //the sign "->" here is not a lambda expression, it is a new syntax for switch expressions introduced in Java 12, which allows for more concise and readable code.
            case "refunded" -> PaymentStatus.REFUNDED;
            case "processing", "requires_action", "requires_confirmation", "requires_capture" -> PaymentStatus.PENDING;
            //default case is used to handle any unexpected or unknown status values, mapping them to PENDING as a safe fallback.
            default -> PaymentStatus.PENDING;
        };
    }

    //save the eventId to the event entity
    public void markEventProcessed(String eventId) {
        //constructor injector, reliable if there are less fields
        processWebhookRepo.save(new ProcessWebhook(eventId, Instant.now()));
    }
}
