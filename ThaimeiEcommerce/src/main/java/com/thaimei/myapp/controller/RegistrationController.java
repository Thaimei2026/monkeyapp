package com.thaimei.myapp.controller;
import org.springframework.web.bind.annotation.RestController;
import com.thaimei.myapp.service.RegistrationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import com.thaimei.myapp.dto.UserRegistrationDto;
import jakarta.validation.Valid; 
import com.thaimei.myapp.dto.JwtResponse;
import com.thaimei.myapp.security.JwtUtil;
import com.thaimei.myapp.service.UserService;
import com.thaimei.myapp.security.CustomUserDetails;



@RestController
@RequestMapping("/customers")
public class RegistrationController {
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    private final RegistrationService registrationService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    public RegistrationController(UserService userService,RegistrationService registrationService, JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.registrationService = registrationService;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        
    }
   
    @PostMapping("/signup")
    public ResponseEntity<?> registration(@Valid @RequestBody UserRegistrationDto dto ) {
            registrationService.registerUser(dto);
    
             Authentication authentication =  authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())
             );
             //getPrincipal() gets the userDeatails user's identity 
             CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
             long userId = userDetails.getId();
             //convert userId to string since subject in jwt is typed as String
            String token=jwtUtil.generateToken(String.valueOf(userId), jwtExpiration);
            
        return ResponseEntity.ok(new JwtResponse(token, dto.getUsername()));
    }
       
    }
   