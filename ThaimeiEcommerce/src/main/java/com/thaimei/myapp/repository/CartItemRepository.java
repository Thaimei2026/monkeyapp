package com.thaimei.myapp.repository;
import com.thaimei.myapp.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartCartIdAndProductProductId(Long cartId, Long productId);    
    List<CartItem> findByCartCartId(long cartId);
    Optional<CartItem> findByItemIdAndCart_User_Id(Long itemId, Long userId);

    @Modifying 
    @Query("DELETE FROM CartItem c WHERE c.cart.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
