import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import GuideVideo from "../components/GuideVideo";
import SequentialScreen from "../components/SequentialScreen";

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getFeedback(score) {
  if (score >= 90) {
    return ["정확도가 매우 높습니다.", "유지하면서 다음 단계 동작을 시도해보세요."];
  }
  if (score >= 75) {
    return ["자세가 안정적입니다.", "어깨와 무릎 정렬을 조금 더 맞추면 좋습니다."];
  }
  return ["정렬 교정이 필요합니다.", "천천히 반복하며 자세를 점검하세요."];
}

export default function ReplayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = React.useState(null);
  const [exercise, setExercise] = React.useState(null);
  const [error, setError] = React.useState();
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    apiFetch(`/api/exercise-sessions/${id}`)
      .then((data) => {
        setSession(data);
        if (data.exerciseId) {
          apiFetch(`/api/exercises/${data.exerciseId}`).then(setExercise).catch(() => {});
        }
      })
      .catch((loadError) => {
        console.error("Failed to load session:", loadError);
        setError("녹화 영상을 불러올 수 없습니다.");
      });
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

  const feedbackLines = getFeedback(session.accuracyScore || 0);
  const replayVideo = exercise?.guideVideoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return (
    <SequentialScreen className="screen-react">
      <div className="exercise-hero card-react">
        <button className="hero-back" onClick={() => navigate(-1)}>‹</button>
        <div className="hero-label">
          <h3>{session.exerciseName}</h3>
          <div className="hero-meta">
            <span>{session.memo || "운동 기록"}</span>
            <span>{fmtDuration(session.durationSec || 0)}</span>
          </div>
        </div>
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">녹화 영상 다시보기</p>
        {!videoError ? (
          <GuideVideo src={replayVideo} title={`${session.exerciseName} 다시보기 영상`} onError={() => setVideoError(true)} />
        ) : (
          <div className="exercise-guide-video-placeholder" style={{ width: "100%", minHeight: 220, borderRadius: 18, background: "#121212", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd" }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>녹화 영상을 표시할 수 없습니다.</p>
              <p className="muted-react" style={{ margin: 0 }}>
                이 운동의 시범 영상이 없거나 재생에 실패했습니다. 실시간 운동으로 다시 시도해보세요.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="result-stat-grid">
        <div className="glass-react card-react result-stat"><p>정확도</p><strong>{session.accuracyScore}%</strong></div>
        <div className="glass-react card-react result-stat"><p>반복</p><strong>{session.reps}회</strong></div>
        <div className="glass-react card-react result-stat"><p>시간</p><strong>{fmtDuration(session.durationSec || 0)}</strong></div>
        <div className="glass-react card-react result-stat"><p>칼로리</p><strong>{session.calories || 0} kcal</strong></div>
      </div>

      <div className="result-feedback-grid">
        <div className="glass-react card-react">
          <p className="result-bad">실제 피드백</p>
          {feedbackLines.map((line) => (
            <p key={line} className="muted-react">- {line}</p>
          ))}
        </div>
        <div className="glass-react card-react">
          <p className="result-good">목표 개선점</p>
          <p className="muted-react">- 자세를 더 천천히 유지하세요.</p>
          <p className="muted-react">- 가슴과 골반을 일직선으로 만들면 정확도가 올라갑니다.</p>
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
        <button className="btn-react" onClick={() => navigate("/mypage")}>마이페이지 돌아가기</button>
        <button className="btn-react primary" onClick={() => navigate("/live", { state: { exerciseId: session.exerciseId, exerciseName: session.exerciseName } })}>
          실시간으로 다시 하기
        </button>
      </div>
    </SequentialScreen>
  );
}
