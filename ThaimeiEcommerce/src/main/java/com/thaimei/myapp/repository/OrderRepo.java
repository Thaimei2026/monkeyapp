package com.thaimei.myapp.repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.thaimei.myapp.enums.OrderStatusEnum;
import com.thaimei.myapp.model.Orders;
import org.springframework.data.domain.Pageable;
import com.thaimei.myapp.model.User;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Slice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepo extends JpaRepository<Orders, Long> {
    // the "_" here removes the ambiguity in the method name.
    public List<Orders>  findByUser_Id (Long id);
    Slice<Orders> findByStore_User(User user, Pageable pageable);
    Slice<Orders> findByStore_StoreId(Long storeId, Pageable pageable);
    Optional<Orders>findByOrderItems_Id(Long itemId);
    List<Orders> findByStatusAndCreationTimeBefore(OrderStatusEnum status, LocalDateTime cutoff);

    //this will be used for fetching orders by userId (getmethod())
    @Query("SELECT DISTINCT o FROM Orders o " +
        "LEFT JOIN FETCH o.orderItems oi " +
        "LEFT JOIN FETCH oi.product " +
        "WHERE o.user.id = :userId"
    )
    List<Orders> findByUserIdWithItems(@Param("userId") Long userId);

    // It makes the database lock that order’s row while your cancel transaction is running. Anyone else trying to change or lock the same row has to wait until your transaction finishes.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Orders> findByIdAndUser_Id(Long orderId, Long userId);
}
