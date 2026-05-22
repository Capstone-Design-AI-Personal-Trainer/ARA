package com.ara.service;

import com.ara.controller.dto.MedicalReportRequest;
import com.ara.controller.dto.MedicalReportResponse;
import com.ara.entity.ExerciseSession;
import com.ara.entity.MedicalReport;
import com.ara.entity.User;
import com.ara.repository.ExerciseSessionRepository;
import com.ara.repository.MedicalReportRepository;
import com.ara.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalReportService {

    private final MedicalReportRepository medicalReportRepository;
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final UserRepository userRepository;

    public MedicalReportService(
        MedicalReportRepository medicalReportRepository,
        ExerciseSessionRepository exerciseSessionRepository,
        UserRepository userRepository
    ) {
        this.medicalReportRepository = medicalReportRepository;
        this.exerciseSessionRepository = exerciseSessionRepository;
        this.userRepository = userRepository;
    }

    public MedicalReportResponse createReport(String email, MedicalReportRequest request) {
        User user = findUser(email);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserOrderByCompletedAtDesc(user);
        int sessionCount = sessions.size();
        int averageAccuracy = sessionCount == 0
            ? 0
            : (int) Math.round(sessions.stream()
                .mapToInt(ExerciseSession::getAccuracyScore)
                .average()
                .orElse(0));

        String range = request.getRange() == null || request.getRange().isBlank()
            ? "최근 7일"
            : request.getRange();
        String summary = String.format(
            "%s 기준 운동 %d회, 평균 정확도 %d%%",
            range,
            sessionCount,
            averageAccuracy
        );

        MedicalReport report = MedicalReport.builder()
            .user(user)
            .range(range)
            .anonymized(request.getAnonymized() == null ? true : request.getAnonymized())
            .averageAccuracy(averageAccuracy)
            .sessionCount(sessionCount)
            .summary(summary)
            .build();

        return toResponse(medicalReportRepository.save(report));
    }

    public List<MedicalReportResponse> getReports(String email) {
        User user = findUser(email);
        return medicalReportRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private MedicalReportResponse toResponse(MedicalReport report) {
        return MedicalReportResponse.builder()
            .id(report.getId())
            .range(report.getRange())
            .anonymized(report.getAnonymized())
            .averageAccuracy(report.getAverageAccuracy())
            .sessionCount(report.getSessionCount())
            .summary(report.getSummary())
            .createdAt(report.getCreatedAt() != null ? report.getCreatedAt().toString() : "")
            .build();
    }
}
