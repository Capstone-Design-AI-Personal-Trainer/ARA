package com.ara.controller.dto;

import lombok.Data;

@Data
public class MedicalReportRequest {
    private String range;
    private Boolean anonymized;
}
