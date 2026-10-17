package com.thaimei.myapp.repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.thaimei.myapp.enums.OrderStatusEnum;
import com.thaimei.myapp.model.Orders;
import org.springframework.data.domain.Pageable;
import com.thaimei.myapp.model.User;
import org.springframework.data.domain.Slice;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepo extends JpaRepository<Orders, Long> {
    // the "_" here removes the ambiguity in the method name.
    public List<Orders>  findByUser_Id (Long id);
    Slice<Orders> findByStore_User(User user, Pageable pageable);
    Slice<Orders> findByStore_StoreId(Long storeId, Pageable pageable);
    Optional<Orders>findByOrderItems_Id(Long itemId);
     List<Orders> findByStatusAndCreationTimeBefore(OrderStatusEnum status, LocalDateTime cutoff);
}
