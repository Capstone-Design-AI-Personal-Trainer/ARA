package com.ara.exercise.session.entity;

import com.ara.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "exercise_id")
    private String exerciseId;

    @Column(name = "exercise_name", nullable = false)
    private String exerciseName;

    @Column(name = "accuracy_score", nullable = false)
    private Integer accuracyScore;

    @Column(nullable = false)
    private Integer reps;

    @Column(name = "target_reps")
    private Integer targetReps;

    @Column(name = "duration_sec")
    private Integer durationSec;

    private Integer calories;

    private String reason;

    @Column(name = "recording_key")
    private String recordingKey;

    @Column(name = "has_recording")
    @Builder.Default
    private Boolean hasRecording = false;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (completedAt == null) {
            completedAt = now;
        }
        createdAt = now;
    }
}
