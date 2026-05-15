package com.ara.service;

import com.ara.entity.User;
import com.ara.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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

        // 기존 사용자 찾기 또는 새 사용자 생성
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
}
