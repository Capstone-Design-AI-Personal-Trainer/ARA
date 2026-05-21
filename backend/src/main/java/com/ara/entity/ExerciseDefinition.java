package com.ara.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "exercise_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseDefinition {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String part;

    private String subtitle;

    private String level;

    @Column(columnDefinition = "TEXT")
    private String introJson;

    @Column(columnDefinition = "TEXT")
    private String stepsJson;

    private String guideVideoUrl;

    @Column(columnDefinition = "TEXT")
    private String futureMoveIdsJson;

    @Column(columnDefinition = "TEXT")
    private String mediaPipeJson;
}
