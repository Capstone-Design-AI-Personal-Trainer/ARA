package com.ara.service;

import com.ara.controller.dto.UserProfileRequest;
import com.ara.controller.dto.UserProfileResponse;
import com.ara.entity.User;
import com.ara.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final String DEMO_NAME = "김동국";
    private static final int DEMO_HEIGHT_CM = 178;
    private static final int DEMO_WEIGHT_KG = 65;
    private static final String DEMO_TARGET_AREAS = "어깨, 허리";

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
            .name(DEMO_NAME)
            .heightCm(DEMO_HEIGHT_CM)
            .weightKg(DEMO_WEIGHT_KG)
            .targetAreas(DEMO_TARGET_AREAS)
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
                            .name(DEMO_NAME)
                            .heightCm(DEMO_HEIGHT_CM)
                            .weightKg(DEMO_WEIGHT_KG)
                            .targetAreas(DEMO_TARGET_AREAS)
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
        ensureDemoProfile(user);
        return UserProfileResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .bio(user.getBio())
            .heightCm(user.getHeightCm())
            .weightKg(user.getWeightKg())
            .targetAreas(user.getTargetAreas())
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
        if (request.getHeightCm() != null) {
            user.setHeightCm(request.getHeightCm());
        }
        if (request.getWeightKg() != null) {
            user.setWeightKg(request.getWeightKg());
        }
        if (request.getTargetAreas() != null) {
            user.setTargetAreas(request.getTargetAreas());
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
            .heightCm(updatedUser.getHeightCm())
            .weightKg(updatedUser.getWeightKg())
            .targetAreas(updatedUser.getTargetAreas())
            .voiceEnabled(updatedUser.getVoiceEnabled())
            .vibrationEnabled(updatedUser.getVibrationEnabled())
            .mirrorEnabled(updatedUser.getMirrorEnabled())
            .reportEnabled(updatedUser.getReportEnabled())
            .createdAt(updatedUser.getCreatedAt() != null ? updatedUser.getCreatedAt().toString() : "")
            .build();
    }

    private void ensureDemoProfile(User user) {
        boolean changed = false;
        if (!DEMO_NAME.equals(user.getName())) {
            user.setName(DEMO_NAME);
            changed = true;
        }
        if (user.getHeightCm() == null) {
            user.setHeightCm(DEMO_HEIGHT_CM);
            changed = true;
        }
        if (user.getWeightKg() == null) {
            user.setWeightKg(DEMO_WEIGHT_KG);
            changed = true;
        }
        if (user.getTargetAreas() == null || user.getTargetAreas().isBlank()) {
            user.setTargetAreas(DEMO_TARGET_AREAS);
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }
    }
}
