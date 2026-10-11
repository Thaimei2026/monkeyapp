package com.thaimei.myapp.dto.sellersDto;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class RestockDto {

    @NotNull(message = "quantity cannot be null")
    @Positive (message = "quantity cannot be negative")
    private Integer quantity;
    
}
