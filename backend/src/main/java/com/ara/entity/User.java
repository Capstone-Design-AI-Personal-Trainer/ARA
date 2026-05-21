package com.ara.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = true)
    private String password;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean voiceEnabled = true;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean vibrationEnabled = true;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT true")
    private Boolean mirrorEnabled = true;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean reportEnabled = false;
    
    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(name = "target_areas")
    private String targetAreas;
    
    @Column(name = "provider_type")
    private String providerType; // LOCAL, GOOGLE, KAKAO, NAVER
    
    @Column(name = "provider_id")
    private String providerId;
    
    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private java.time.LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
