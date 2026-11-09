package com.thaimei.myapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.thaimei.myapp.enums.RefundStatus;
import com.thaimei.myapp.model.RefundModel;

public interface  RefundRepo extends JpaRepository<RefundModel, Long> {
    Optional<RefundModel> findByOrderItem_IdAndStatusIn(Long itemId, List<RefundStatus> statuses);
    List<RefundModel> findByStatus (RefundStatus status);
    List<RefundModel> findByOrder_User_Id(Long userId);
    List<RefundModel> findByStatusAndOrder_Store_User_Id(RefundStatus status, Long sellerId);
}
