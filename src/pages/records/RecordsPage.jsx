import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, toSessionView } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { getWorkoutRecordings } from "../../features/junyoung/recording/workoutRecordingStore";
import { buildWorkoutReport } from "../../features/junyoung/report/workoutReport";
import "./RecordsPage.module.css";

function formatDate(value) {
  if (!value) return "날짜 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatDuration(seconds = 0) {
  if (!seconds) return "시간 없음";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (!min) return `${sec}초`;
  return `${min}분 ${sec}초`;
}

function WorkoutRecordCard({ session, hasRecording, onOpen }) {
  const report = buildWorkoutReport(session);

  return (
    <button
      className={`record-session-card record-session-card-${report.state}`}
      type="button"
      onClick={onOpen}
    >
      <div className="record-session-head">
        <div>
          <p className="record-date">{formatDate(session.createdAt)}</p>
          <h4>{session.exerciseName}</h4>
        </div>
        <div className="record-card-badges">
          {hasRecording ? <span className="record-video-dot">녹화</span> : null}
          <span className="record-state-badge">{report.stateLabel}</span>
        </div>
      </div>

      <div className="record-metric-grid">
        <div>
          <span>정확도</span>
          <strong>{report.accuracy}%</strong>
        </div>
        <div>
          <span>횟수</span>
          <strong>{report.reps}{report.targetReps ? `/${report.targetReps}` : ""}회</strong>
        </div>
        <div>
          <span>운동 시간</span>
          <strong>{formatDuration(report.durationSec)}</strong>
        </div>
      </div>

      <div className="record-compact-foot">
        <span>{hasRecording ? "녹화와 피드백 보기" : "피드백 보기"}</span>
        <span aria-hidden="true">›</span>
      </div>
    </button>
  );
}

export default function RecordsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = React.useState([]);
  const [recordingsById, setRecordingsById] = React.useState({});

  React.useEffect(() => {
    apiFetch("/api/exercise-sessions")
      .then(async (data) => {
        const sessionViews = data.map(toSessionView);
        setSessions(sessionViews);
        try {
          const recordings = await getWorkoutRecordings(sessionViews.map((session) => String(session.id)));
          setRecordingsById(Object.fromEntries(recordings.map((recording) => [recording.id, recording])));
        } catch (error) {
          console.error("Failed to load local recordings:", error);
          setRecordingsById({});
        }
      })
      .catch((error) => {
        console.error("Failed to load exercise sessions:", error);
        setSessions([]);
        setRecordingsById({});
      });
  }, []);

  return (
    <SequentialScreen className="screen-react">
      <h2>기록</h2>

      <div className="glass-react card-react">
        <h3>운동 기록</h3>
        {sessions.length ? (
          <div className="record-session-list">
            {sessions.slice(0, 5).map((session) => (
              <WorkoutRecordCard
                key={session.id}
                session={session}
                hasRecording={Boolean(recordingsById[String(session.id)])}
                onOpen={() => navigate(`/replay/${session.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="muted-react">저장된 운동 기록이 없습니다.</p>
        )}
      </div>
    </SequentialScreen>
  );
}
