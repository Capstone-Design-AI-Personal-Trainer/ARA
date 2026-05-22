package com.ara.repository;

import com.ara.entity.ExerciseSession;
import com.ara.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {
    List<ExerciseSession> findByUserOrderByCompletedAtDesc(User user);
    long countByUser(User user);
}
