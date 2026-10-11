package com.thaimei.myapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.thaimei.myapp.model.ProductsModel;
import java.util.List;
import java.util.Optional;

import com.thaimei.myapp.model.StoreModel;
import com.thaimei.myapp.enums.Category;
import com.thaimei.myapp.enums.Color;
import com.thaimei.myapp.enums.ProductStatus;
import com.thaimei.myapp.enums.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;



@Repository
public interface ProductsRepo extends JpaRepository<ProductsModel, Long>, JpaSpecificationExecutor<ProductsModel>  {
    List<ProductsModel> findByName(String name);
    ProductsModel  findByStoreModelAndCategoryAndColorAndSize(StoreModel store, Category category, Color color, Size size);
    Page <ProductsModel> findByStoreModelIn(List<StoreModel> stores, Pageable pageable); 
    //filters the products by it's status (the default is set to ACTIVE)  
    Slice <ProductsModel> findAllByProductStatus( ProductStatus status, Pageable pageable);
    List<ProductsModel> findAllByProductIdInAndStoreModel_storeId(List<Long> productIds, Long storeId);

    @Modifying
    // :, this inditcates that the variable is a placeholder for the parameter that will be passed to the method.
    // @Param is what connects your Java method arguments to the named placeholders (:id, :qty) in the JPQL string.
    // this returns an int representing how many rows the database actually modified.
    @Query("UPDATE ProductsModel p SET p.quantity = p.quantity - :qty " + "WHERE p.productId = :id AND p.quantity >= :qty")
    int decreaseStock(@Param ("id") long id, @Param("qty") int qty);

    Optional<ProductsModel> findByProductIdAndStoreModel_User_Id(Long productId, Long userId);

    @Modifying 
    @Query("UPDATE ProductsModel p SET p.quantity = p.quantity + :qty WHERE p.productId = :id")
    int addStock(@Param("id") Long id, @Param("qty") int qty);
}
