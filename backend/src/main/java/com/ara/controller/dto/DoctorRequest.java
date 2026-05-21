package com.ara.controller.dto;

import lombok.Data;

@Data
public class DoctorRequest {
    private String name;
    private String hospital;
    private String department;
    private String phone;
    private String email;
    private String notes;
    private Boolean primaryDoctor;
}
