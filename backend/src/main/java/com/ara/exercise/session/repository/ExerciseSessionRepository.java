package com.ara.exercise.session.repository;

import com.ara.entity.User;
import com.ara.exercise.session.entity.ExerciseSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {
    List<ExerciseSession> findByUserOrderByCompletedAtDesc(User user);
    List<ExerciseSession> findByUserAndCompletedAtBetweenOrderByCompletedAtDesc(User user, LocalDateTime start, LocalDateTime end);
    long countByUser(User user);
}
