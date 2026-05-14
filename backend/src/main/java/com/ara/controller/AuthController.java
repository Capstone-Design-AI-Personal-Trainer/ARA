package com.ara.controller;

import com.ara.controller.dto.AuthRequest;
import com.ara.controller.dto.AuthResponse;
import com.ara.controller.dto.OAuth2LoginRequest;
import com.ara.entity.User;
import com.ara.security.JwtUtil;
import com.ara.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthRequest request) {
        try {
            User user = userService.createUser(request.getEmail(), request.getPassword(), request.getName());
            String token = jwtUtil.generateToken(user.getEmail());

            AuthResponse response = AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .message("User created successfully")
                .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(AuthResponse.builder()
                    .message("Signup failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            User user = userService.findByEmail(request.getEmail());

            if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                        .message("Invalid credentials")
                        .build());
            }

            String token = jwtUtil.generateToken(user.getEmail());

            AuthResponse response = AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .message("Login successful")
                .build();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .message("Login failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/oauth2/login")
    public ResponseEntity<?> initiateOAuth2Login(@RequestBody OAuth2LoginRequest request) {
        // Kakao 또는 Naver만 지원
        if (!request.getProvider().toLowerCase().matches("kakao|naver")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(AuthResponse.builder()
                    .message("Only Kakao and Naver are supported")
                    .build());
        }

        return ResponseEntity.ok(AuthResponse.builder()
            .message("Redirect to OAuth2 provider")
            .build());
    }
}
