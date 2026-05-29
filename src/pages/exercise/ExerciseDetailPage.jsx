import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { useAppContext } from "../../contexts/AppContext";

function fallbackDetail(id, state) {
  return {
    id,
    name: state?.name || state?.title || id,
    subtitle: state?.subtitle || `${state?.part || "재활"} · ${state?.minutes || "10 min"}`,
    level: state?.level || "중",
    intro: state?.intro || ["관절 안정성 향상을 위한 재활 운동입니다."],
    steps: state?.steps || ["준비자세", "권장 가동 범위에서 수행", "호흡 유지 후 종료"],
    guideVideoUrl: state?.guideVideoUrl || "",
    futureMoves: state?.futureMoves || [],
  };
}

function normalizeDetail(id, state) {
  if (!state?.detail) {
    return null;
  }
  const detail = state.detail;
  if (detail.intro && detail.steps) {
    return {
      ...fallbackDetail(id, state),
      ...detail,
    };
  }
  return fallbackDetail(id, { ...state, ...detail });
}

export default function ExerciseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const { diagnosis } = useAppContext();
  const [detail, setDetail] = React.useState(normalizeDetail(id, state));
  const [loading, setLoading] = React.useState(!normalizeDetail(id, state));
  const [error, setError] = React.useState();

  React.useEffect(() => {
    if (detail) return;
    let active = true;
    setLoading(true);
    apiFetch(`/api/exercises/${id}`)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((err) => {
        console.error("Failed to load exercise detail:", err);
        if (active) setError("운동 정보를 불러올 수 없습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detail, id]);

  const linkedDiagnosis = state?.diagnosis || (diagnosis?.updatedAt ? diagnosis : null);
  const backPath = state?.fromDiagnosis ? "/diagnosis" : "/exercise";
  const showAraRecommendation = Boolean(state?.fromDiagnosis);

  if (loading) {
    return (
      <SequentialScreen className="screen-react">
        <h2>운동 상세 정보를 불러오는 중</h2>
        <p className="muted-react">잠시만 기다려주세요.</p>
      </SequentialScreen>
    );
  }

  if (error || !detail) {
    return (
      <SequentialScreen className="screen-react">
        <h2>운동 정보를 불러올 수 없습니다.</h2>
        <p className="muted-react">{error || "운동 데이터가 존재하지 않습니다."}</p>
        <button className="btn-react primary" onClick={() => navigate(backPath)}>운동 목록으로 돌아가기</button>
      </SequentialScreen>
    );
  }

  return (
    <SequentialScreen className="screen-react">
      <div className="exercise-hero card-react">
        <button className="hero-back" onClick={() => navigate(backPath)}>‹</button>
        <div className="hero-label">
          <h3>{detail.name}</h3>
          <div className="hero-meta">
            <span>{detail.subtitle}</span>
            <span>난이도 {detail.level}</span>
          </div>
        </div>
      </div>

      {showAraRecommendation ? (
        <div className="ai-insight-box ara-recommendation-box">
          <p className="diag-eyebrow">ARA RECOMMENDATION</p>
          <p>현재 상태에 맞는 우선 운동으로 레그 레이즈를 권장합니다. 천천히 정확한 자세로 시작하세요.</p>
        </div>
      ) : null}

      <div className="glass-react card-react detail-card">
        <p className="detail-title">운동 소개</p>
        {detail.intro.map((line) => (
          <p key={line} className="muted-react detail-line">{line}</p>
        ))}
      </div>

      <div className="glass-react card-react detail-card">
        <p className="detail-title">운동방법</p>
        <ol className="detail-steps">
          {detail.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <button className="btn-react primary detail-start" onClick={() => navigate(`/guide/${id}`, { state: { exerciseId: id, exerciseName: detail.name, detail, diagnosis: linkedDiagnosis } })}>
        가이드 영상 보기
      </button>
    </SequentialScreen>
  );
}




