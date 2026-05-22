package com.ara.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String bio;
    private Integer heightCm;
    private Integer weightKg;
    private String targetAreas;
    private Boolean voiceEnabled;
    private Boolean vibrationEnabled;
    private Boolean mirrorEnabled;
    private Boolean reportEnabled;
    private String createdAt;
}
