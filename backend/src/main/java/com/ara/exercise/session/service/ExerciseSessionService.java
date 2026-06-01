package com.ara.exercise.session.service;

import com.ara.entity.User;
import com.ara.exercise.session.dto.ExerciseSessionRequest;
import com.ara.exercise.session.dto.ExerciseSessionResponse;
import com.ara.exercise.session.entity.ExerciseSession;
import com.ara.exercise.session.repository.ExerciseSessionRepository;
import com.ara.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ExerciseSessionService {

    private final ExerciseSessionRepository exerciseSessionRepository;
    private final UserRepository userRepository;

    public ExerciseSessionService(
        ExerciseSessionRepository exerciseSessionRepository,
        UserRepository userRepository
    ) {
        this.exerciseSessionRepository = exerciseSessionRepository;
        this.userRepository = userRepository;
    }

    public ExerciseSessionResponse createSession(String email, ExerciseSessionRequest request) {
        User user = findUser(email);
        String exerciseName = request.getExerciseName() == null || request.getExerciseName().isBlank()
            ? "운동"
            : request.getExerciseName();

        ExerciseSession session = ExerciseSession.builder()
            .user(user)
            .exerciseId(request.getExerciseId())
            .exerciseName(exerciseName)
            .accuracyScore(defaultValue(request.getAccuracyScore(), 0))
            .reps(defaultValue(request.getReps(), 0))
            .targetReps(request.getTargetReps())
            .durationSec(request.getDurationSec())
            .calories(request.getCalories())
            .reason(request.getReason())
            .recordingKey(request.getRecordingKey())
            .hasRecording(Boolean.TRUE.equals(request.getHasRecording()))
            .memo(request.getMemo())
            .build();

        return toResponse(exerciseSessionRepository.save(session));
    }

    public ExerciseSessionResponse updateRecordingMetadata(String email, Long id, ExerciseSessionRequest request) {
        User user = findUser(email);
        ExerciseSession session = exerciseSessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Exercise session not found: " + id));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Exercise session does not belong to current user");
        }

        session.setRecordingKey(request.getRecordingKey());
        session.setHasRecording(Boolean.TRUE.equals(request.getHasRecording()));
        return toResponse(exerciseSessionRepository.save(session));
    }

    public List<ExerciseSessionResponse> getSessions(String email) {
        User user = findUser(email);
        return exerciseSessionRepository.findByUserOrderByCompletedAtDesc(user)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public List<ExerciseSessionResponse> getSessionsByDate(String email, LocalDate date) {
        User user = findUser(email);
        return exerciseSessionRepository.findByUserAndCompletedAtBetweenOrderByCompletedAtDesc(
                user,
                date.atStartOfDay(),
                date.atTime(LocalTime.MAX)
            )
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public void deleteSession(String email, Long id) {
        User user = findUser(email);
        ExerciseSession session = exerciseSessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Exercise session not found: " + id));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Exercise session does not belong to current user");
        }

        exerciseSessionRepository.delete(session);
    }

    public ExerciseSessionResponse getSession(String email, Long id) {
        User user = findUser(email);
        ExerciseSession session = exerciseSessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Exercise session not found: " + id));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Exercise session does not belong to current user");
        }

        return toResponse(session);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private int defaultValue(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private ExerciseSessionResponse toResponse(ExerciseSession session) {
        return ExerciseSessionResponse.builder()
            .id(session.getId())
            .exerciseId(session.getExerciseId())
            .exerciseName(session.getExerciseName())
            .accuracyScore(session.getAccuracyScore())
            .reps(session.getReps())
            .targetReps(session.getTargetReps())
            .durationSec(session.getDurationSec())
            .calories(session.getCalories())
            .reason(session.getReason())
            .recordingKey(session.getRecordingKey())
            .hasRecording(Boolean.TRUE.equals(session.getHasRecording()))
            .memo(session.getMemo())
            .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : "")
            .createdAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : "")
            .build();
    }
}
