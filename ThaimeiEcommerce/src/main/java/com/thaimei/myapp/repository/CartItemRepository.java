package com.thaimei.myapp.repository;
import com.thaimei.myapp.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartCartIdAndProductProductId(Long cartId, Long productId);    
    List<CartItem> findByCartCartId(long cartId);
    Optional<CartItem> findByItemIdAndCart_User_Id(Long itemId, Long userId);
}
