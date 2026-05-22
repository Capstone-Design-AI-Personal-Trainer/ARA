package com.ara.controller.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DoctorResponse {
    private Long id;
    private String name;
    private String hospital;
    private String department;
    private String phone;
    private String email;
    private String notes;
    private Boolean primaryDoctor;
    private String assignedAt;
}
