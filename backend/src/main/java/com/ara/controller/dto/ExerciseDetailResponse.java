package com.ara.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseDetailResponse {
    private String id;
    private String name;
    private String part;
    private String subtitle;
    private String level;
    private List<String> intro;
    private List<String> steps;
    private String guideVideoUrl;
    private List<ExerciseSummaryResponse> futureMoves;
    private String mediaPipeJson;
}
