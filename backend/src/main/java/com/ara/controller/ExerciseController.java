package com.ara.controller;

import com.ara.controller.dto.ExerciseDetailResponse;
import com.ara.controller.dto.ExerciseSummaryResponse;
import com.ara.service.ExerciseDefinitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseDefinitionService exerciseDefinitionService;

    public ExerciseController(ExerciseDefinitionService exerciseDefinitionService) {
        this.exerciseDefinitionService = exerciseDefinitionService;
    }

    @GetMapping
    public ResponseEntity<List<ExerciseSummaryResponse>> getExercises() {
        return ResponseEntity.ok(exerciseDefinitionService.getAllSummaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseDetailResponse> getExerciseById(@PathVariable String id) {
        return exerciseDefinitionService.getById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
