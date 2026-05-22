package com.ara.service;

import com.ara.controller.dto.LeaderboardResponse;
import com.ara.entity.ExerciseSession;
import com.ara.entity.LeaderboardEntry;
import com.ara.entity.User;
import com.ara.repository.ExerciseSessionRepository;
import com.ara.repository.LeaderboardEntryRepository;
import com.ara.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class LeaderboardService {

    private final LeaderboardEntryRepository leaderboardEntryRepository;
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final UserRepository userRepository;

    public LeaderboardService(
        LeaderboardEntryRepository leaderboardEntryRepository,
        ExerciseSessionRepository exerciseSessionRepository,
        UserRepository userRepository
    ) {
        this.leaderboardEntryRepository = leaderboardEntryRepository;
        this.exerciseSessionRepository = exerciseSessionRepository;
        this.userRepository = userRepository;
    }

    public List<LeaderboardResponse> getLeaderboard(String email) {
        seedDummyEntries();

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserOrderByCompletedAtDesc(user);
        int currentUserScore = sessions.isEmpty()
            ? 78
            : (int) Math.round(sessions.stream()
                .mapToInt(ExerciseSession::getAccuracyScore)
                .average()
                .orElse(78));

        List<LeaderboardResponse> rows = new ArrayList<>();
        rows.add(LeaderboardResponse.builder()
            .name("김동국")
            .score(currentUserScore)
            .sessionCount(sessions.size())
            .badge("내 기록")
            .currentUser(true)
            .build());

        leaderboardEntryRepository.findAllByOrderByScoreDescSessionCountDesc()
            .forEach(entry -> rows.add(LeaderboardResponse.builder()
                .name(entry.getName())
                .score(entry.getScore())
                .sessionCount(entry.getSessionCount())
                .badge(entry.getBadge())
                .currentUser(false)
                .build()));

        rows.sort(Comparator
            .comparing(LeaderboardResponse::getScore).reversed()
            .thenComparing(LeaderboardResponse::getSessionCount, Comparator.reverseOrder()));

        List<LeaderboardResponse> topRows = rows.stream().limit(8).toList();
        for (int i = 0; i < topRows.size(); i++) {
            topRows.get(i).setRank(i + 1);
        }
        return topRows;
    }

    private void seedDummyEntries() {
        if (leaderboardEntryRepository.count() > 0) {
            return;
        }

        leaderboardEntryRepository.saveAll(List.of(
            entry("박서연", 96, 42, "정확도 마스터"),
            entry("이준호", 94, 37, "꾸준함"),
            entry("최민지", 91, 31, "회복 루틴"),
            entry("정하윤", 89, 29, "균형 개선"),
            entry("오지훈", 86, 25, "성실 운동"),
            entry("한유진", 84, 21, "자세 안정"),
            entry("강태민", 82, 18, "새싹 랭커")
        ));
    }

    private LeaderboardEntry entry(String name, int score, int sessionCount, String badge) {
        return LeaderboardEntry.builder()
            .name(name)
            .score(score)
            .sessionCount(sessionCount)
            .badge(badge)
            .build();
    }
}
