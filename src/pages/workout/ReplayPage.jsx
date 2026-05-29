import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api";
import GuideVideo from "../../components/GuideVideo";
import SequentialScreen from "../../components/SequentialScreen";
import ReplayVideo from "../../features/junyoung/replay/ReplayVideo";
import { getWorkoutRecording } from "../../features/junyoung/recording/workoutRecordingStore";
import { buildWorkoutReport } from "../../features/junyoung/report/workoutReport";
import "./ReplayPage.module.css";

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(value) {
  if (!value) return "오늘의 운동";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "오늘의 운동";
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function getMotivation(report) {
  if (report.state === "success") return "오늘 자세가 안정적으로 유지됐어요. 이 감각을 다음 운동까지 가져가면 좋아요.";
  if (report.state === "normal") return "오늘도 회복 루틴을 이어갔어요. 속도만 조금 더 천천히 가져가면 더 좋아집니다.";
  return "완료한 것 자체가 회복의 핵심이에요. 다음에는 한 동작만 더 안정적으로 만들어봐요.";
}

function getPrimaryFocus(report) {
  if (report.state === "success") return "다음 운동에서는 같은 자세로 반복 수를 안정적으로 유지해보세요.";
  if (report.state === "normal") return "팔을 내릴 때 2초 정도 천천히 버티는 것에 집중해보세요.";
  return "정확도보다 움직임을 작고 천천히 만드는 것부터 시작해보세요.";
}

export default function ReplayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = React.useState(null);
  const [exercise, setExercise] = React.useState(null);
  const [recordingUrl, setRecordingUrl] = React.useState("");
  const [error, setError] = React.useState();
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    let objectUrl = "";

    apiFetch(`/api/exercise-sessions/${id}`)
      .then((data) => {
        setSession(data);
        if (data.exerciseId) {
          apiFetch(`/api/exercises/${data.exerciseId}`).then(setExercise).catch(() => {});
        }
        return getWorkoutRecording(id);
      })
      .then((recording) => {
        if (recording?.blob) {
          objectUrl = URL.createObjectURL(recording.blob);
          setRecordingUrl(objectUrl);
        }
      })
      .catch((loadError) => {
        console.error("Failed to load session:", loadError);
        setError("녹화 영상을 불러올 수 없습니다.");
      });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (error) {
    return (
      <SequentialScreen className="screen-react">
        <h2>기록을 불러올 수 없습니다.</h2>
        <p className="muted-react">{error}</p>
        <button className="btn-react primary" onClick={() => navigate("/mypage")}>마이페이지로 돌아가기</button>
      </SequentialScreen>
    );
  }

  if (!session) {
    return (
      <SequentialScreen className="screen-react">
        <h2>로딩 중...</h2>
        <p className="muted-react">잠시만 기다려주세요.</p>
      </SequentialScreen>
    );
  }

  const report = buildWorkoutReport({
    exerciseName: session.exerciseName,
    durationSec: session.durationSec,
    reps: session.reps,
    targetReps: session.targetReps,
    score: session.accuracyScore,
  });
  const feedbackLines = [
    report.summary,
    report.goodPoints[0] || report.correctionPoints[0] || "다음 운동에서는 같은 속도로 반복해보세요.",
    getPrimaryFocus(report),
  ];
  const targetLabel = report.targetReps ? `${report.reps}/${report.targetReps}회` : `${report.reps}회`;
  const replayVideo = exercise?.guideVideoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return (
    <SequentialScreen className="screen-react replay-report-screen">
      <div className="exercise-hero card-react">
        <button className="hero-back" onClick={() => navigate(-1)}>‹</button>
        <div className="hero-label">
          <h3>{session.exerciseName}</h3>
          <div className="hero-meta">
            <span>{fmtDate(session.completedAt || session.createdAt)}</span>
            <span>{targetLabel}</span>
            <span>{fmtDuration(session.durationSec || 0)}</span>
          </div>
        </div>
      </div>

      <div className="glass-react card-react report-summary-card">
        <p className="report-kicker">오늘의 회복 기록</p>
        <h3>{report.exerciseName} 완료</h3>
        <p className="muted-react">{getMotivation(report)}</p>
        <div className="report-progress-row">
          <span>이번 주 루틴</span>
          <strong>기록 저장 완료</strong>
        </div>
      </div>

      <div className="report-stat-strip">
        <div className="glass-react card-react result-stat"><p>정확도</p><strong>{session.accuracyScore}%</strong></div>
        <div className="glass-react card-react result-stat"><p>반복</p><strong>{targetLabel}</strong></div>
        <div className="glass-react card-react result-stat"><p>시간</p><strong>{fmtDuration(session.durationSec || 0)}</strong></div>
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">AI 피드백</p>
        <div className="report-feedback-head">
          <span className={`report-state-pill report-state-${report.state}`}>{report.stateLabel}</span>
          <strong>{report.summary}</strong>
        </div>
        <div className="report-feedback-list">
          {feedbackLines.slice(1).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">녹화 영상 다시보기</p>
        {recordingUrl ? (
          <ReplayVideo src={recordingUrl} />
        ) : (
          <div className="exercise-guide-video-placeholder" style={{ width: "100%", minHeight: 220, borderRadius: 18, background: "#121212", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd" }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>저장된 로컬 녹화가 없습니다.</p>
              <p className="muted-react" style={{ margin: 0 }}>
                이 기기에서 녹화가 저장된 기록만 실제 운동 영상을 다시 볼 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {!recordingUrl && !videoError ? (
        <div className="glass-react card-react detail-card">
          <p className="detail-title">시범 영상</p>
          <GuideVideo src={replayVideo} title={`${session.exerciseName} 시범 영상`} onError={() => setVideoError(true)} />
        </div>
      ) : videoError ? (
        <div className="glass-react card-react detail-card">
          <p className="muted-react">시범 영상을 표시할 수 없습니다.</p>
        </div>
      ) : null}

      <div className="glass-react card-react detail-card">
        <p className="detail-title">다음 회복 루틴</p>
        <div className="report-next-action">
          <div>
            <strong>다음에는 이것만 집중</strong>
            <p className="muted-react">{getPrimaryFocus(report)}</p>
          </div>
          <button className="btn-react primary" onClick={() => navigate("/live", { state: { exerciseId: session.exerciseId, exerciseName: session.exerciseName } })}>
            다시 하기
          </button>
        </div>
      </div>

      {exercise?.futureMoves?.length ? (
        <div className="glass-react card-react">
          <h3>다음 추천 동작</h3>
          <div className="stack">
            {exercise.futureMoves.map((move) => (
              <article key={move.id} className="glass-react card-react row-between">
                <div>
                  <strong>{move.name}</strong>
                  <p className="muted-react">{move.subtitle}</p>
                </div>
                <button className="btn-react" onClick={() => navigate(`/guide/${move.id}`)}>
                  보기
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="live-actions">
        <button className="btn-react" onClick={() => navigate("/records")}>기록으로 돌아가기</button>
        <button className="btn-react primary" onClick={() => navigate("/live", { state: { exerciseId: session.exerciseId, exerciseName: session.exerciseName } })}>
          실시간으로 다시 하기
        </button>
      </div>
    </SequentialScreen>
  );
}
