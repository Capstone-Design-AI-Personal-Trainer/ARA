package com.ara.service;

import com.ara.controller.dto.UserProfileRequest;
import com.ara.controller.dto.UserProfileResponse;
import com.ara.entity.User;
import com.ara.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User createUser(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
            .email(email)
            .password(passwordEncoder.encode(password))
            .name(name)
            .voiceEnabled(true)
            .vibrationEnabled(true)
            .mirrorEnabled(true)
            .reportEnabled(false)
            .build();

        return userRepository.save(user);
    }

    public User createOAuth2User(String email, String name, String providerType, String providerId) {
        // 기존 사용자 확인
        return userRepository.findByProviderTypeAndProviderId(providerType, providerId)
            .orElseGet(() -> {
                // 이메일로 기존 사용자 찾기
                return userRepository.findByEmail(email)
                    .map(existingUser -> {
                        existingUser.setProviderType(providerType);
                        existingUser.setProviderId(providerId);
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        // 새 OAuth2 사용자 생성
                        User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .providerType(providerType)
                            .providerId(providerId)
                            .build();
                        return userRepository.save(newUser);
                    });
            });
    }

    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public UserProfileResponse getUserProfile(String email) {
        User user = findByEmail(email);
        return UserProfileResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .bio(user.getBio())
            .voiceEnabled(user.getVoiceEnabled())
            .vibrationEnabled(user.getVibrationEnabled())
            .mirrorEnabled(user.getMirrorEnabled())
            .reportEnabled(user.getReportEnabled())
            .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "")
            .build();
    }

    public UserProfileResponse updateUserProfile(String email, UserProfileRequest request) {
        User user = findByEmail(email);
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getVoiceEnabled() != null) {
            user.setVoiceEnabled(request.getVoiceEnabled());
        }
        if (request.getVibrationEnabled() != null) {
            user.setVibrationEnabled(request.getVibrationEnabled());
        }
        if (request.getMirrorEnabled() != null) {
            user.setMirrorEnabled(request.getMirrorEnabled());
        }
        if (request.getReportEnabled() != null) {
            user.setReportEnabled(request.getReportEnabled());
        }

        User updatedUser = userRepository.save(user);
        
        return UserProfileResponse.builder()
            .id(updatedUser.getId())
            .email(updatedUser.getEmail())
            .name(updatedUser.getName())
            .bio(updatedUser.getBio())
            .voiceEnabled(updatedUser.getVoiceEnabled())
            .vibrationEnabled(updatedUser.getVibrationEnabled())
            .mirrorEnabled(updatedUser.getMirrorEnabled())
            .reportEnabled(updatedUser.getReportEnabled())
            .createdAt(updatedUser.getCreatedAt() != null ? updatedUser.getCreatedAt().toString() : "")
            .build();
    }
}
