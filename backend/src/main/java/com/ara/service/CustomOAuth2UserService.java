package com.ara.service;

import com.ara.entity.User;
import com.ara.repository.UserRepository;
import com.ara.security.OAuth2LoginModeStore;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final OAuth2LoginModeStore oauth2LoginModeStore;

    public CustomOAuth2UserService(UserRepository userRepository, OAuth2LoginModeStore oauth2LoginModeStore) {
        this.userRepository = userRepository;
        this.oauth2LoginModeStore = oauth2LoginModeStore;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oauth2User.getAttributes();

        String email = null;
        String name = null;
        String providerId = null;

        switch (registrationId.toLowerCase()) {
            case "kakao":
                Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
                if (kakaoAccount != null) {
                    email = (String) kakaoAccount.get("email");
                    Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                    if (profile != null) {
                        name = (String) profile.get("nickname");
                    }
                }
                providerId = String.valueOf(attributes.get("id"));
                break;
            case "naver":
                // Naver wraps user data inside "response" key
                Map<String, Object> naverResponse = (Map<String, Object>) attributes.get("response");
                if (naverResponse != null) {
                    email = (String) naverResponse.get("email");
                    name = (String) naverResponse.get("name");
                    providerId = (String) naverResponse.get("id");
                }
                break;
            default:
                throw new OAuth2AuthenticationException("Unsupported OAuth2 provider: " + registrationId);
        }

        // 이메일 없으면 provider + id로 임시 이메일 생성
        if (email == null) {
            email = registrationId.toLowerCase() + "_" + providerId + "@ara.local";
        }

        final String finalEmail = email;
        final String finalName = name;
        final String finalRegistrationId = registrationId.toUpperCase();
        final String finalProviderId = providerId;
        final String mode = resolveMode();

        // 로그인은 기존 사용자만 허용하고, 회원가입일 때만 새 사용자를 생성한다.
        User user = userRepository.findByProviderTypeAndProviderId(finalRegistrationId, finalProviderId)
            .orElseGet(() -> {
                // 이메일로 기존 사용자 찾기 (소셜 로그인 전환)
                return userRepository.findByEmail(finalEmail)
                    .map(existingUser -> {
                        existingUser.setProviderType(finalRegistrationId);
                        existingUser.setProviderId(finalProviderId);
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        if (!"signup".equals(mode)) {
                            throw new OAuth2AuthenticationException("가입되지 않은 소셜 계정입니다. 먼저 회원가입을 진행해 주세요.");
                        }
                        // 새 사용자 생성
                        User newUser = User.builder()
                            .email(finalEmail)
                            .name(finalName != null ? finalName : "사용자")
                            .providerType(finalRegistrationId)
                            .providerId(finalProviderId)
                            .build();
                        return userRepository.save(newUser);
                    });
            });

        return new CustomOAuth2User(user, attributes);
    }

    private String resolveMode() {
        ServletRequestAttributes requestAttributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (requestAttributes == null) {
            return "login";
        }

        HttpServletRequest request = requestAttributes.getRequest();
        return oauth2LoginModeStore.find(request.getParameter("state")).orElse("login");
    }
}
