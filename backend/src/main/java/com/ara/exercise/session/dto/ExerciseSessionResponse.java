package com.ara.exercise.session.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExerciseSessionResponse {
    private Long id;
    private String exerciseId;
    private String exerciseName;
    private Integer accuracyScore;
    private Integer reps;
    private Integer targetReps;
    private Integer durationSec;
    private Integer calories;
    private String reason;
    private String recordingKey;
    private Boolean hasRecording;
    private String memo;
    private String completedAt;
    private String createdAt;
}
