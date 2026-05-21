package com.ara.controller.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MedicalReportResponse {
    private Long id;
    private String range;
    private Boolean anonymized;
    private Integer averageAccuracy;
    private Integer sessionCount;
    private String summary;
    private String createdAt;
}
