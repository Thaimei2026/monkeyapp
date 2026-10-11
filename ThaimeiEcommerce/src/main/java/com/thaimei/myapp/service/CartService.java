package com.thaimei.myapp.service;
import com.thaimei.myapp.model.Cart;
import com.thaimei.myapp.repository.CartRepository;
import org.springframework.stereotype.Service;
import com.thaimei.myapp.dto.CartDto;
import com.thaimei.myapp.dto.AddItem;
import com.thaimei.myapp.model.CartItem;
import com.thaimei.myapp.model.ProductsModel;
import com.thaimei.myapp.repository.CartItemRepository;
import java.util.Optional;
import com.thaimei.myapp.repository.ProductsRepo;
import java.math.BigDecimal;
import com.thaimei.myapp.repository.UserRepository;

import jakarta.transaction.Transactional;

import com.thaimei.myapp.model.User;
import com.thaimei.myapp.error.AppException;
import com.thaimei.myapp.error.ResourceNotFoundException;
import java.util.List;
import com.thaimei.myapp.dto.CartItemDto;


@Service
public class CartService {
    private final  CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductsRepo productsRepo;
    private final UserRepository userRepository;
    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, ProductsRepo productsRepo, UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productsRepo = productsRepo;
        this .userRepository = userRepository;
    }

    public CartDto getCartByUserId(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
        .orElseThrow(()-> new ResourceNotFoundException("cart not found for current User"));
        // if the cart is empty return the empty cart as it is, empty is not an exception.
        if (cart.getCartItems().isEmpty()) {
            CartDto emptyCart = new CartDto();
            emptyCart.setCartId(cart.getCartId());
            emptyCart.setItems(List.of());
            emptyCart.setTotalquantity(0);
            emptyCart.setTotalPrice(BigDecimal.ZERO);
            return emptyCart;
        }

        List <CartItemDto> itemDtos = cart.getCartItems().stream()
        .map(item -> {
            CartItemDto cartItemDto = new CartItemDto();
            cartItemDto.setItemId(item.getItemId());
            cartItemDto.setProductId(item.getProduct().getProductId());
            cartItemDto.setQuantity(item.getQuantity());
            cartItemDto.setPrice(item.getProduct().getPrice());
            cartItemDto.setProductName(item.getProduct().getName());
            cartItemDto.setImageURL(item.getProduct().getImageURL());
            cartItemDto.setDescription(item.getProduct().getDescription());
            cartItemDto.setTotalPrice(item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            return cartItemDto;
        })
        .toList();

        // first declare the accumulator
        BigDecimal cartTotalPrice = itemDtos.stream()
        //pull each element from the stream and call a method on it (getTotalPrice), method reference 
        .map(CartItemDto::getTotalPrice)

        //the first parameter is the partialResult(set to zero) and the second is the stream's element.
        // this expands to (total, element) -> total.add(element), adding each element to partialResult.

        //reduce(), combines all the elements in a stream into a single value by repeatedly applying the combining function.
        .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = itemDtos.stream()
        // pull each streamed elements call the getQuantity on it, convert the stream<CartItemDto> which is a object into InStream<> a primitive type so that we can call the .sum() method on it.
        // Object doesn't have the sum() method on it so we have to convert it.
        .mapToInt(CartItemDto::getQuantity)
        .sum();

        CartDto cartDto = new CartDto();
        cartDto.setCartId(cart.getCartId());
        cartDto.setItems(itemDtos);
        cartDto.setTotalquantity(totalQuantity);
        cartDto.setTotalPrice(cartTotalPrice);
        return cartDto;
    }

    
    @Transactional
    //return an int the quantity of the items in the cart, so that we can instantly display the number of items in the cart after adding the items.
    public int  addItemsToCart(AddItem addItem, long userId) {

        User user = userRepository.findById(userId) 
        .orElseThrow (()-> new ResourceNotFoundException ("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
        .orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        });

        
        ProductsModel product = productsRepo.findById(addItem.getProductId())
        .orElseThrow(()  -> new ResourceNotFoundException("product not found"));

        //check if item already exists in cart if true merge quantities.
        Optional<CartItem> existingItem= cartItemRepository.findByCartCartIdAndProductProductId(cart.getCartId(), addItem.getProductId());

        // .map(), a method of Optional<> if the object exist return the value, else 0
        int currentQtyInCart = existingItem.map(CartItem::getQuantity).orElse(0);

        // add the current cartItem quantity with the new incoming quantity.
        int totalRequestQty = currentQtyInCart + addItem.getQuantity();
        
        if(existingItem.isPresent()) {
            //extract the existing item and update quantity.
            CartItem item =existingItem.get();
            item.setQuantity(totalRequestQty);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setProduct(product);
            newItem.setCart(cart);
            newItem.setQuantity(addItem.getQuantity());
            cartItemRepository.save(newItem);
        }

        //pulls the quantity and sum it up to display it in the product listing page.
        return cartItemRepository.findByCartCartId(cart.getCartId())
        .stream()
        .mapToInt(CartItem::getQuantity)
        .sum();
    }

    public void removeItems(Long itemId, Long userId) {
        CartItem item = cartItemRepository.findById(itemId)
        .orElseThrow(()-> new ResourceNotFoundException("item not found in the cart"));

        if(!item.getCart().getUser().getId().equals(userId)) {
            throw new AppException("you don't own this cart", 403);
        }
        cartItemRepository.delete(item);
    }

    @Transactional 
    public void changeQuantity(Long itemId, Long userId, int change) {
        CartItem item = cartItemRepository.findByIdAndCart_User_Id(itemId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Item not found!"));

        int newQuantity = item.getQuantity() + change;
        if (newQuantity <=0) {
            cartItemRepository.delete(item);
        }else {
                item.setQuantity(newQuantity);
            }
    }
}
