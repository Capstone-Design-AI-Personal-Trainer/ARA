import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import {
  deleteWorkoutRecording,
  getWorkoutRecording,
  saveWorkoutRecording,
} from "../../features/junyoung/recording/workoutRecordingStore";
import "./ResultPage.module.css";

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const score = state?.score ?? 87;
  const reps = state?.reps ?? 12;
  const targetReps = state?.targetReps ?? 12;
  const durationSec = state?.durationSec ?? 402;
  const calories = state?.calories ?? 48;
  const exerciseName = state?.exerciseName || "레그 레이즈";
  const [saveStatus, setSaveStatus] = React.useState("saving");
  const [savedSessionId, setSavedSessionId] = React.useState(null);
  const [recordingStatus, setRecordingStatus] = React.useState(state?.recordingId ? "saving" : "none");
  const [futureMoves, setFutureMoves] = React.useState([]);
  const savedRef = React.useRef(false);

  React.useEffect(() => {
    if (state?.exerciseId) {
      apiFetch(`/api/exercises/${state.exerciseId}`)
        .then((detail) => setFutureMoves(detail.futureMoves || []))
        .catch(() => setFutureMoves([]));
    }
  }, [state?.exerciseId]);

  React.useEffect(() => {
    let ignore = false;

    async function saveSession() {
      if (savedRef.current) return;
      savedRef.current = true;

      try {
        const saved = await apiFetch("/api/exercise-sessions", {
          method: "POST",
          body: JSON.stringify({
            exerciseId: state?.exerciseId,
            exerciseName,
            accuracyScore: score,
            reps,
            targetReps,
            durationSec,
            calories,
            reason: state?.reason,
            memo: `${exerciseName} ${reps}회`,
          }),
        });
        if (state?.recordingId && saved?.id) {
          const recording = await getWorkoutRecording(state.recordingId);
          if (recording?.blob) {
            await saveWorkoutRecording({
              ...recording,
              id: String(saved.id),
              exerciseName,
              score,
              reps,
              durationSec,
              calories,
            });
            await deleteWorkoutRecording(state.recordingId);
            if (!ignore) setRecordingStatus("saved");
          } else if (!ignore) {
            setRecordingStatus("missing");
          }
        }
        if (!ignore) setSavedSessionId(saved?.id ?? null);
        if (!ignore) setSaveStatus("saved");
      } catch (error) {
        console.error("Failed to save exercise session:", error);
        if (!ignore) setSaveStatus("failed");
        if (!ignore && state?.recordingId) setRecordingStatus("failed");
      }
    }

    saveSession();
    return () => {
      ignore = true;
    };
  }, [calories, durationSec, exerciseName, reps, score, state, targetReps]);

  return (
    <SequentialScreen className="screen-react result-screen">
      <div className="result-head">
        <h2 className="live-title">오늘의 운동 결과</h2>
        <p className="muted-react">운동 기록은 사용자 계정에 연결되어 DB에 저장됩니다.</p>
      </div>

      <div className="glass-react card-react result-score-card">
        <div className="result-ring">
          <div className="result-ring-inner">
            <p className="diag-eyebrow">DAILY SCORE</p>
            <strong>{score}</strong>
            <small>/ 100</small>
          </div>
        </div>
      </div>

      <div className="result-stat-grid">
        <div className="glass-react card-react result-stat"><p>시간</p><strong>{fmtDuration(durationSec)}</strong></div>
        <div className="glass-react card-react result-stat"><p>정확도</p><strong>{score}%</strong></div>
        <div className="glass-react card-react result-stat"><p>반복</p><strong>{reps}회</strong></div>
        <div className="glass-react card-react result-stat"><p>칼로리</p><strong>{calories}</strong></div>
      </div>

      <div className="glass-react card-react result-chart-card">
        <div className="row-between">
          <p>7일 정확도</p>
          <strong className="records-kpi-value mint">+12%</strong>
        </div>
        <div className="result-mini-chart">
          <span style={{ height: "42%" }} />
          <span style={{ height: "46%" }} />
          <span style={{ height: "45%" }} />
          <span style={{ height: "50%" }} />
          <span style={{ height: "52%" }} />
          <span style={{ height: "55%" }} />
          <span style={{ height: "61%" }} />
        </div>
      </div>

      <div className="result-feedback-grid">
        <div className="glass-react card-react">
          <p className="result-bad">주의점</p>
          <p>- 어깨 비대칭 0.8cm</p>
          <p>- 오른쪽 각도 부족</p>
        </div>
        <div className="glass-react card-react">
          <p className="result-good">개선됨</p>
          <p>- 무릎 흔들림 감소</p>
          <p>- 안정성 +14%</p>
        </div>
      </div>

      {futureMoves.length ? (
        <div className="glass-react card-react">
          <h3>앞으로 가능한 동작</h3>
          <div className="stack">
            {futureMoves.map((move) => (
              <article key={move.id} className="glass-react card-react row-between">
                <div>
                  <strong>{move.name}</strong>
                  <p className="muted-react">{move.subtitle}</p>
                </div>
                <button className="btn-react" onClick={() => navigate(`/guide/${move.id}`)}>보기</button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="live-actions">
        <button className="btn-react" onClick={() => navigate("/live", { state: { exerciseId: state?.exerciseId, exerciseName } })}>다시 하기</button>
        <button className="btn-react primary" onClick={() => navigate("/records")}>기록으로 이동</button>
      </div>

      {savedSessionId && recordingStatus === "saved" ? (
        <button className="btn-react" onClick={() => navigate(`/replay/${savedSessionId}`)}>
          녹화 다시보기
        </button>
      ) : null}

      {saveStatus === "saving" ? <p className="muted-react">기록 저장 중...</p> : null}
      {saveStatus === "saved" ? <p className="muted-react">기록이 DB에 저장되었습니다.</p> : null}
      {saveStatus === "failed" ? <p className="muted-react">기록 저장에 실패했습니다.</p> : null}
      {recordingStatus === "saving" ? <p className="muted-react">녹화 저장 중...</p> : null}
      {recordingStatus === "saved" ? <p className="muted-react">녹화가 이 기기에 저장되었습니다.</p> : null}
      {recordingStatus === "failed" || recordingStatus === "missing" ? <p className="muted-react">녹화 저장에 실패했습니다.</p> : null}
      <p className="muted-react">목표 반복: {targetReps}회</p>
    </SequentialScreen>
  );
}
