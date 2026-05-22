import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import GuideVideo from "../components/GuideVideo";
import SequentialScreen from "../components/SequentialScreen";

export default function GuidePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [detail, setDetail] = React.useState(state?.detail || null);
  const [loading, setLoading] = React.useState(!detail);
  const [error, setError] = React.useState();
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    if (detail) return;
    let active = true;
    setLoading(true);
    apiFetch(`/api/exercises/${id}`)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((errorResponse) => {
        console.error("Failed to load exercise detail:", errorResponse);
        if (active) setError("운동 정보를 불러올 수 없습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detail, id]);

  if (loading) {
    return (
      <SequentialScreen className="screen-react">
        <h2>가이드 영상 로딩 중</h2>
        <p className="muted-react">잠시만 기다려주세요.</p>
      </SequentialScreen>
    );
  }

  if (error || !detail) {
    return (
      <SequentialScreen className="screen-react">
        <h2>운동 정보를 불러오지 못했습니다.</h2>
        <p className="muted-react">{error || "운동 데이터가 존재하지 않습니다."}</p>
        <button className="btn-react primary" onClick={() => navigate("/exercise")}>운동 목록으로 돌아가기</button>
      </SequentialScreen>
    );
  }

  return (
    <SequentialScreen className="screen-react">
      <div className="exercise-hero card-react">
        <button className="hero-back" onClick={() => navigate(-1)}>‹</button>
        <div className="hero-label">
          <h3>{detail.name}</h3>
          <div className="hero-meta">
            <span>{detail.subtitle}</span>
            <span>난이도 {detail.level}</span>
          </div>
        </div>
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">운동 설명</p>
        {detail.intro.map((line) => (
          <p key={line} className="muted-react detail-line">{line}</p>
        ))}
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">시범 영상</p>
        {detail.guideVideoUrl && !videoError ? (
          <GuideVideo src={detail.guideVideoUrl} title={`${detail.name} 가이드 영상`} onError={() => setVideoError(true)} />
        ) : (
          <div className="exercise-guide-video-placeholder" style={{ width: "100%", minHeight: 220, borderRadius: 18, background: "#121212", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd" }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ marginBottom: 10, fontWeight: 600 }}>시범 영상이 준비되지 않았습니다.</p>
              <p className="muted-react" style={{ margin: 0 }}>
                {detail.guideVideoUrl ? "영상 재생에 실패했습니다. 아래 버튼을 눌러 실시간 운동을 시작하세요." : "현재 등록된 시범 영상이 없습니다. 실시간 운동을 먼저 진행하세요."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">운동 단계</p>
        <ol className="detail-steps">
          {detail.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="glass-react card-react">
        <h3>앞으로 가능한 동작</h3>
        {detail.futureMoves.length ? (
          <div className="stack">
            {detail.futureMoves.map((move) => (
              <article key={move.id} className="glass-react card-react row-between">
                <div>
                  <strong>{move.name}</strong>
                  <p className="muted-react">{move.subtitle}</p>
                </div>
                <button className="btn-react" onClick={() => navigate(`/guide/${move.id}`, { state: { detail: null } })}>
                  보기
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-react">추천 동작이 없습니다.</p>
        )}
      </div>

      <button className="btn-react primary detail-start" onClick={() => navigate("/live", { state: { exerciseId: detail.id, exerciseName: detail.name } })}>
        실시간 운동 시작
      </button>
      {videoError ? (
        <p className="muted-react" style={{ marginTop: 10 }}>
          영상 재생이 불가할 때는 버튼을 눌러 바로 실시간 운동을 시작할 수 있습니다.
        </p>
      ) : null}
    </SequentialScreen>
  );
}
