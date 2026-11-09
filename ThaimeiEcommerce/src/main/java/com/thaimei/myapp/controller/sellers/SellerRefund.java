package com.thaimei.myapp.controller.sellers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.thaimei.myapp.service.RefundService;

import jakarta.validation.Valid;

import com.thaimei.myapp.security.CustomUserDetails;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.thaimei.myapp.dto.RefundResponseListDto;
import com.thaimei.myapp.dto.sellersDto.RejectRefundDto;

@RestController 
@RequestMapping ("/sellers")
public class SellerRefund {
    private final RefundService refundService;
    public SellerRefund(RefundService refundService) {
        this.refundService = refundService;
    }

    @GetMapping("/refunds")
    public ResponseEntity<RefundResponseListDto> getRefundsForSeller(@AuthenticationPrincipal CustomUserDetails userDetails) {
        RefundResponseListDto dtos = refundService.getSellerRefunds(userDetails.getId());
        return ResponseEntity.ok(dtos);
    }

    @PatchMapping ("/refunds/{refundId}/approve")
    public ResponseEntity<?> approveRefundBySeller(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long refundId) {
        refundService.approveRefundBySeller(userDetails.getId(), refundId);
        return ResponseEntity.ok(Map.of("message", "Refund approved successfully"));
    }

    @PatchMapping("/refunds/{refundId}/reject")
    public ResponseEntity<?> rejectRefundBySeller(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long refundId, @Valid @RequestBody RejectRefundDto dto) { 
        refundService.rejectRefundBySeller(userDetails.getId(), refundId, dto.getReason());
        return ResponseEntity.ok(Map.of("messge", "Refund Rejected successfully!"));
    }
}
