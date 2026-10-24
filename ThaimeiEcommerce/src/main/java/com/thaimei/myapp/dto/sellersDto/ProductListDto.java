package com.thaimei.myapp.dto.sellersDto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class ProductListDto {
    @NotEmpty(message="Atleast one product is required")
    @Size(max = 100, message ="Maximum 100 products per request")
    @Valid
    private List<AddProductDto> products;
}
