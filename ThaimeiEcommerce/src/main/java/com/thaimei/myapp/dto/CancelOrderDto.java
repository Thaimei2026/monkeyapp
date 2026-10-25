package com.thaimei.myapp.dto;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class CancelOrderDto {
    @NotNull(message = "This field cannot be null")
    @NotEmpty(message = "ItemId cannot be empty")
    private List<Long> itemId;
}
