package com.ara.controller.dto;

import lombok.Data;

@Data
public class ExerciseSessionRequest {
    private String exerciseId;
    private String exerciseName;
    private Integer accuracyScore;
    private Integer reps;
    private Integer targetReps;
    private Integer durationSec;
    private Integer calories;
    private String reason;
    private String memo;
}
