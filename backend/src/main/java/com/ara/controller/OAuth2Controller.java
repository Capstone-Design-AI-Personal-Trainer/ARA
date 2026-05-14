package com.ara.controller;

import com.ara.controller.dto.AuthResponse;
import com.ara.entity.User;
import com.ara.security.JwtUtil;
import com.ara.service.CustomOAuth2User;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
public class OAuth2Controller {

    private final JwtUtil jwtUtil;

    public OAuth2Controller(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/oauth2/success")
    public void oauth2Success(HttpServletResponse response, Authentication authentication) throws IOException {
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            CustomOAuth2User oauth2User = (CustomOAuth2User) oauthToken.getPrincipal();
            User user = oauth2User.getUser();

            String token = jwtUtil.generateToken(user.getEmail());

            // 프론트엔드로 리다이렉트하면서 토큰 전달
            String redirectUrl = String.format("http://localhost:5173/login?token=%s&email=%s&name=%s",
                token, user.getEmail(), user.getName());
            response.sendRedirect(redirectUrl);
        }
    }

    @GetMapping("/oauth2/user")
    public ResponseEntity<AuthResponse> getCurrentOAuth2User(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            CustomOAuth2User oauth2User = (CustomOAuth2User) oauthToken.getPrincipal();
            User user = oauth2User.getUser();

            String token = jwtUtil.generateToken(user.getEmail());

            AuthResponse response = AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .message("OAuth2 login successful")
                .build();

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body(
            AuthResponse.builder().message("Not an OAuth2 authentication").build()
        );
    }
}
