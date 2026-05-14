package com.ara.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {
    private String name;
    private String bio;
    private Boolean voiceEnabled;
    private Boolean vibrationEnabled;
    private Boolean mirrorEnabled;
    private Boolean reportEnabled;
}
