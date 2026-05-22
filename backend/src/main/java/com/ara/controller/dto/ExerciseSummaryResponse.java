package com.ara.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseSummaryResponse {
    private String id;
    private String name;
    private String part;
    private String subtitle;
    private String guideVideoUrl;
}
