import React from "react";
import { apiFetch, toSessionView } from "../api";
import SequentialScreen from "../components/SequentialScreen";
import { MedicalExportPanel, WeeklyBriefCard } from "../components/records/RecordsWidgets";
import "./RecordsPage.module.css";

export default function RecordsPage() {
  const [sessions, setSessions] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [message, setMessage] = React.useState("");

  const loadLeaderboard = React.useCallback(() => {
    apiFetch("/api/leaderboard")
      .then(setLeaderboard)
      .catch((error) => console.error("Failed to load leaderboard:", error));
  }, []);

  React.useEffect(() => {
    apiFetch("/api/exercise-sessions")
      .then((data) => setSessions(data.map(toSessionView)))
      .catch((error) => {
        console.error("Failed to load exercise sessions:", error);
        setSessions([]);
      });
    apiFetch("/api/medical-reports")
      .then(setReports)
      .catch((error) => console.error("Failed to load medical reports:", error));
    loadLeaderboard();
  }, [loadLeaderboard]);

  const avg = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
    : 78;

  const handleGenerate = async ({ range, anonymized }) => {
    try {
      const report = await apiFetch("/api/medical-reports", {
        method: "POST",
        body: JSON.stringify({ range, anonymized }),
      });
      setReports((prev) => [report, ...prev]);
      setMessage(`리포트 저장 완료 · ${report.summary}`);
    } catch (error) {
      console.error("Failed to save medical report:", error);
      setMessage("리포트 저장에 실패했습니다.");
    }
  };

  return (
    <SequentialScreen className="screen-react">
      <h2>기록 / 통계</h2>

      <WeeklyBriefCard
        period="최근 7일"
        accuracyDelta={avg}
        painBefore={1.6}
        painAfter={1.1}
        riskPostureDelta={-23}
        goals={["어깨 안정성 루틴 3회", "허리 과신전 경고 20% 감소"]}
      />

      <div className="glass-react card-react">
        <div className="row-between">
          <h3>리더보드</h3>
          <span className="muted-react">상위 8명</span>
        </div>
        <div className="stack">
          {leaderboard.map((row) => (
            <div key={`${row.rank}-${row.name}`} className="session-item row-between">
              <div>
                <strong>{row.rank}. {row.name}</strong>
                <p className="muted-react">
                  정확도 {row.score}% · 운동 {row.sessionCount}회 · {row.badge}
                </p>
              </div>
              {row.currentUser ? <span className="rank-badge">ME</span> : null}
            </div>
          ))}
        </div>
      </div>

      <MedicalExportPanel defaultRange="최근 7일" onGenerateReport={handleGenerate} />

      <div className="glass-react card-react">
        <h3>저장된 의료 리포트</h3>
        {reports.length ? (
          <div className="stack">
            {reports.slice(0, 5).map((report) => (
              <p key={report.id} className="muted-react">
                {report.summary} · {report.anonymized ? "익명" : "실명"}
              </p>
            ))}
          </div>
        ) : (
          <p className="muted-react">저장된 리포트가 없습니다.</p>
        )}
      </div>

      <div className="glass-react card-react">
        <h3>DB 저장 운동 기록</h3>
        {sessions.length ? (
          <div className="stack">
            {sessions.slice(0, 5).map((session) => (
              <p key={session.id} className="muted-react">
                {session.exerciseName} · 정확도 {session.score}% · {session.reps}회
              </p>
            ))}
          </div>
        ) : (
          <p className="muted-react">저장된 운동 기록이 없습니다.</p>
        )}
      </div>

      {message ? (
        <div className="glass-react card-react">
          <p className="muted-react">{message}</p>
        </div>
      ) : null}
    </SequentialScreen>
  );
}
