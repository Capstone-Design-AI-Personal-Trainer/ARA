package com.ara.controller;

import com.ara.controller.dto.ExerciseSessionRequest;
import com.ara.controller.dto.ExerciseSessionResponse;
import com.ara.service.ExerciseSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<List<ExerciseSessionResponse>> getSessions(Authentication authentication) {
        return ResponseEntity.ok(exerciseSessionService.getSessions(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExerciseSessionResponse> getSession(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(exerciseSessionService.getSession(authentication.getName(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(Authentication authentication, @PathVariable Long id) {
        exerciseSessionService.deleteSession(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
