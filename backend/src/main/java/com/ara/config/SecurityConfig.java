package com.ara.config;

import com.ara.repository.UserRepository;
import com.ara.security.OAuth2LoginModeStore;
import com.ara.security.JwtAuthenticationFilter;
import com.ara.security.JwtUtil;
import com.ara.service.CustomOAuth2UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String OAUTH2_STATE_COOKIE_NAME = "oauth2_state";
    private static final int OAUTH2_STATE_COOKIE_MAX_AGE_SECONDS = 180;
    private static final Map<String, OAuth2AuthorizationRequest> AUTHORIZATION_REQUESTS =
        new ConcurrentHashMap<>();

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2LoginModeStore oauth2LoginModeStore;

    public SecurityConfig(
        JwtUtil jwtUtil,
        UserRepository userRepository,
        CustomOAuth2UserService customOAuth2UserService,
        OAuth2LoginModeStore oauth2LoginModeStore
    ) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oauth2LoginModeStore = oauth2LoginModeStore;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil, userRepository);
    }

    @Bean
    public SecurityFilterChain filterChain(
        HttpSecurity http,
        ClientRegistrationRepository clientRegistrationRepository
    ) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(HttpMethod.POST, "/api/auth/signup").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers("/api/auth/oauth2/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/login/oauth2/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authorization -> authorization
                    .authorizationRequestResolver(authorizationRequestResolver(clientRegistrationRepository))
                    .authorizationRequestRepository(authorizationRequestRepository())
                )
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler((request, response, authentication) -> {
                    // OAuth2 로그인 성공 후 JWT 토큰 생성 및 리다이렉트
                    OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
                    com.ara.service.CustomOAuth2User oauth2User =
                        (com.ara.service.CustomOAuth2User) oauthToken.getPrincipal();
                    com.ara.entity.User user = oauth2User.getUser();

                    String token = jwtUtil.generateToken(user.getEmail());
                    String mode = request.getParameter("state") == null
                        ? "login"
                        : oauth2LoginModeStore.remove(request.getParameter("state")).orElse("login");

                    // 프론트엔드로 리다이렉트하면서 토큰 전달
                    String redirectUrl = String.format(
                        "http://localhost:5173/login?token=%s&email=%s&name=%s&mode=%s",
                        token,
                        URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                        URLEncoder.encode(user.getName(), StandardCharsets.UTF_8),
                        URLEncoder.encode(mode, StandardCharsets.UTF_8)
                    );
                    response.sendRedirect(redirectUrl);
                })
                .failureHandler((request, response, exception) -> {
                    if (request.getParameter("state") != null) {
                        oauth2LoginModeStore.remove(request.getParameter("state"));
                    }
                    String redirectUrl = String.format(
                        "http://localhost:5173/login?oauthError=%s",
                        URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8)
                    );
                    response.sendRedirect(redirectUrl);
                })
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.disable());

        return http.build();
    }

    @Bean
    public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
        return new AuthorizationRequestRepository<>() {
            @Override
            public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
                return getState(request)
                    .map(AUTHORIZATION_REQUESTS::get)
                    .orElse(null);
            }

            @Override
            public void saveAuthorizationRequest(
                OAuth2AuthorizationRequest authorizationRequest,
                HttpServletRequest request,
                HttpServletResponse response
            ) {
                if (authorizationRequest == null) {
                    getState(request).ifPresent(AUTHORIZATION_REQUESTS::remove);
                    deleteCookie(response, OAUTH2_STATE_COOKIE_NAME);
                    return;
                }

                AUTHORIZATION_REQUESTS.put(authorizationRequest.getState(), authorizationRequest);
                oauth2LoginModeStore.save(
                    authorizationRequest.getState(),
                    String.valueOf(authorizationRequest.getAttribute("mode"))
                );

                Cookie cookie = new Cookie(OAUTH2_STATE_COOKIE_NAME, authorizationRequest.getState());
                cookie.setPath("/");
                cookie.setHttpOnly(true);
                cookie.setMaxAge(OAUTH2_STATE_COOKIE_MAX_AGE_SECONDS);
                response.addCookie(cookie);
            }

            @Override
            public OAuth2AuthorizationRequest removeAuthorizationRequest(
                HttpServletRequest request,
                HttpServletResponse response
            ) {
                String state = request.getParameter("state");
                if (state == null || state.isBlank()) {
                    state = getState(request).orElse(null);
                }

                OAuth2AuthorizationRequest authorizationRequest =
                    state == null ? null : AUTHORIZATION_REQUESTS.remove(state);
                deleteCookie(response, OAUTH2_STATE_COOKIE_NAME);
                return authorizationRequest;
            }

            private java.util.Optional<String> getState(HttpServletRequest request) {
                Cookie[] cookies = request.getCookies();
                if (cookies == null) {
                    return java.util.Optional.empty();
                }

                return Arrays.stream(cookies)
                    .filter(cookie -> cookie.getName().equals(OAUTH2_STATE_COOKIE_NAME))
                    .map(Cookie::getValue)
                    .findFirst();
            }

            private void deleteCookie(HttpServletResponse response, String name) {
                Cookie cookie = new Cookie(name, "");
                cookie.setPath("/");
                cookie.setHttpOnly(true);
                cookie.setMaxAge(0);
                response.addCookie(cookie);
            }
        };
    }

    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver(
        ClientRegistrationRepository clientRegistrationRepository
    ) {
        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
            new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");

        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                return customize(defaultResolver.resolve(request), request);
            }

            @Override
            public OAuth2AuthorizationRequest resolve(
                HttpServletRequest request,
                String clientRegistrationId
            ) {
                return customize(defaultResolver.resolve(request, clientRegistrationId), request);
            }

            private OAuth2AuthorizationRequest customize(
                OAuth2AuthorizationRequest authorizationRequest,
                HttpServletRequest request
            ) {
                if (authorizationRequest == null) {
                    return authorizationRequest;
                }

                String mode = "signup".equals(request.getParameter("mode")) ? "signup" : "login";
                Map<String, Object> attributes = new LinkedHashMap<>(authorizationRequest.getAttributes());
                attributes.put("mode", mode);

                if (!"signup".equals(mode) || !request.getRequestURI().endsWith("/naver")) {
                    return OAuth2AuthorizationRequest.from(authorizationRequest)
                        .attributes(attributes)
                        .build();
                }

                Map<String, Object> additionalParameters =
                    new LinkedHashMap<>(authorizationRequest.getAdditionalParameters());
                additionalParameters.put("auth_type", "reprompt");

                return OAuth2AuthorizationRequest.from(authorizationRequest)
                    .attributes(attributes)
                    .additionalParameters(additionalParameters)
                    .build();
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Collections.singletonList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
