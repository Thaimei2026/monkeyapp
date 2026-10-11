package com.thaimei.myapp.controller.sellers;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.thaimei.myapp.service.ProductService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.thaimei.myapp.security.CustomUserDetails;
import com.thaimei.myapp.model.User;
import com.thaimei.myapp.dto.ProductDto;
import com.thaimei.myapp.dto.sellersDto.AddProductDto;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.thaimei.myapp.dto.sellersDto.RestockDto;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/sellers")
public class SellerProductsController {
    private final ProductService productService;
    public SellerProductsController(ProductService productService) {
        this.productService = productService;
    }
    
    @PostMapping("/addProducts")
    public ResponseEntity<?> addProducts(@Valid @RequestBody AddProductDto addProductDto, @AuthenticationPrincipal CustomUserDetails customUserDetails ) {
        User user = customUserDetails.getUser();
        productService.saveProducts(addProductDto, user);
        //since success message is just a plain string we should wrap it in Map.of() so frontend never reveives plain string but always a JSON object.
        return ResponseEntity.ok(Map.of("message","product added successfully"));
    }

    @GetMapping("/getProducts")
    public ResponseEntity<Slice<ProductDto>> getProductsForSeller(@AuthenticationPrincipal CustomUserDetails customUserDetails , @RequestParam (defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        User user = customUserDetails.getUser();
        Pageable pageable = PageRequest.of(page, size);
        Slice <ProductDto> products = productService.getProductsForSeller(user, pageable);
        return ResponseEntity.ok(products);
    }

    @PatchMapping("/products/{productId}/stock")
    public ResponseEntity<Map<String, String>> restockProducts(@Valid @RequestBody RestockDto reStockDto, @PathVariable Long productId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        productService.restockProduct(productId, userDetails.getId(), reStockDto);
        return ResponseEntity.ok(Map.of("message", "Product restocked successfully"));
    }

    // rest naming convention uses the resources not the verb (not action)
    @DeleteMapping("/Stores/{storeId}/productId")
    // why uses both the @pathVariable and @RequestBody here? why not just use the @PathVariable to send the list of productIDs?
    // technically you could use just the pathVariable to send a list of productIds but there are some nuance to it.
    // URL length limits --> servers limit URLs to ~2048-8191 characters. If you have 100+ productIds you'll exceed the limit.
    // REST convention --> pathVariables are for single indentifier (one store, one product). for bulk data, use the body.
    // security --> URLs get logged everywhere. RequestBody data is private. Sensitive IDs in the body are safer.
    public ResponseEntity<?> removeProducts (@PathVariable Long storeId, @RequestBody List<Long> productIds, @AuthenticationPrincipal CustomUserDetails userDetails) {
        productService.deleteProducts(storeId, productIds,userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "products deleted successfully"));
    }
    
}
