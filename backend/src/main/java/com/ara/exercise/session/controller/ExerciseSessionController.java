package com.ara.exercise.session.controller;

import com.ara.exercise.session.dto.ExerciseSessionRequest;
import com.ara.exercise.session.dto.ExerciseSessionResponse;
import com.ara.exercise.session.service.ExerciseSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/exercise-sessions")
public class ExerciseSessionController {

    private final ExerciseSessionService exerciseSessionService;

    public ExerciseSessionController(ExerciseSessionService exerciseSessionService) {
        this.exerciseSessionService = exerciseSessionService;
    }

    @PostMapping
    public ResponseEntity<ExerciseSessionResponse> createSession(
        Authentication authentication,
        @RequestBody ExerciseSessionRequest request
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(exerciseSessionService.createSession(authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<ExerciseSessionResponse>> getSessions(
        Authentication authentication,
        @RequestParam(required = false) LocalDate date
    ) {
        if (date != null) {
            return ResponseEntity.ok(exerciseSessionService.getSessionsByDate(authentication.getName(), date));
        }
        return ResponseEntity.ok(exerciseSessionService.getSessions(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseSessionResponse> getSession(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(exerciseSessionService.getSession(authentication.getName(), id));
    }

    @PatchMapping("/{id}/recording")
    public ResponseEntity<ExerciseSessionResponse> updateRecordingMetadata(
        Authentication authentication,
        @PathVariable Long id,
        @RequestBody ExerciseSessionRequest request
    ) {
        return ResponseEntity.ok(exerciseSessionService.updateRecordingMetadata(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(Authentication authentication, @PathVariable Long id) {
        exerciseSessionService.deleteSession(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
