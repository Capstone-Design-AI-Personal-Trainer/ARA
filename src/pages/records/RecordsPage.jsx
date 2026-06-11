import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, toSessionView } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { getWorkoutRecordings } from "../../features/junyoung/recording/workoutRecordingStore";
import { buildWorkoutReport } from "../../features/junyoung/report/workoutReport";
import {
  getCachedWorkoutHistory,
  mergeWorkoutHistory,
} from "../../features/workoutHistory/workoutHistoryStore";
import "./RecordsPage.css";

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
    const cachedRecords = getCachedWorkoutHistory();
    setSessions(cachedRecords);

    apiFetch("/api/exercise-sessions")
      .then(async (data) => {
        const sessionViews = data.map(toSessionView);
        setSessions(mergeWorkoutHistory(sessionViews, cachedRecords));
        try {
          const recordIds = mergeWorkoutHistory(sessionViews, cachedRecords)
            .flatMap((session) => [session.id, session.recordingKey])
            .filter(Boolean)
            .map(String);
          const recordings = await getWorkoutRecordings(recordIds);
          setRecordingsById(Object.fromEntries(recordings.map((recording) => [recording.id, recording])));
        } catch (error) {
          console.error("Failed to load local recordings:", error);
          setRecordingsById({});
        }
      })
      .catch((error) => {
        console.error("Failed to load exercise sessions:", error);
        setSessions(cachedRecords);
        getWorkoutRecordings(
          cachedRecords
            .flatMap((session) => [session.id, session.recordingKey])
            .filter(Boolean)
            .map(String),
        )
          .then((recordings) => {
            setRecordingsById(Object.fromEntries(recordings.map((recording) => [recording.id, recording])));
          })
          .catch(() => setRecordingsById({}));
      });
  }, []);

  return (
    <SequentialScreen className="screen-react records-page">
      <h2 className="records-page-title">기록</h2>

      <div className="glass-react card-react records-list-panel">
        <h3>운동 기록</h3>
        {sessions.length ? (
          <div className="record-session-list">
            {sessions.map((session) => (
              <WorkoutRecordCard
                key={session.id}
                session={session}
                hasRecording={Boolean(
                  recordingsById[String(session.id)]
                  || recordingsById[String(session.recordingKey)],
                )}
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
