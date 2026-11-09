package com.thaimei.myapp.controller.admincontroller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.thaimei.myapp.service.RefundService;

import jakarta.validation.Valid;

import com.thaimei.myapp.dto.RefundResponseListDto;
import com.thaimei.myapp.dto.sellersDto.RejectRefundDto;

@RestController
@RequestMapping("/admin")
public class ApproveRefund {
    private final RefundService refundService;

    public ApproveRefund(RefundService refundService) {
        this.refundService = refundService;
    }

    @PatchMapping("/refund/approve/{refundId}")
    public ResponseEntity<?> approveRefund (@PathVariable Long refundId) {
        refundService.approveRefund(refundId);
        return ResponseEntity.ok(Map.of("message", "Refund approved"));
    }

    @GetMapping("/refund/pullrefund")
    public ResponseEntity<RefundResponseListDto> pullRefund () {
        RefundResponseListDto returnRefunds = refundService.getRefunds();
        return ResponseEntity.ok(returnRefunds);
    }

    @PatchMapping("/refund/reject/{refundId}")
    public ResponseEntity<?> rejectRefund (@PathVariable Long refundId, @Valid @RequestBody RejectRefundDto dto) {
        refundService.rejectRefundByAdmin(refundId, dto.getReason());
        return ResponseEntity.ok(Map.of("message", "Refund rejected"));
    }
}
