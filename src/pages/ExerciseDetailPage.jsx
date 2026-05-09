import React from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

const DETAIL_MAP = {
  "wall-squat": {
    title: "벽 스쿼트",
    subtitle: "무릎 재활 · 10 min",
    level: "하",
    intro: [
      "무릎 정렬 안정성을 돕는 기본 재활 운동입니다.",
      "벽을 기준으로 내려가며 하중을 천천히 분산하세요.",
      "통증이 있으면 범위를 줄여 진행합니다.",
    ],
    steps: ["준비자세", "엉덩이를 천천히 내리기", "무릎 정렬 유지하며 올라오기"],
  },
  "leg-raise": {
    title: "레그 레이즈",
    subtitle: "무릎 재활 · 10 min",
    level: "중",
    intro: ["대퇴사두근 활성화를 위한 기본 운동입니다.", "허리 들림 없이 코어를 고정하고 수행하세요."],
    steps: ["준비자세", "다리를 천천히 들어올리기", "호흡 유지하며 내리기"],
  },
  "slow-lunge": {
    title: "슬로우 런지",
    subtitle: "무릎 재활 · 12 min",
    level: "중",
    intro: ["좌우 균형과 무릎 안정성을 동시에 강화합니다."],
    steps: ["준비자세", "무릎이 안쪽으로 모이지 않게 하강", "중립 정렬로 복귀"],
  },
};

function fallbackDetail(id, state) {
  return {
    title: state?.name || id,
    subtitle: `${state?.part || "재활"} · ${state?.minutes || "10 min"}`,
    level: "중",
    intro: ["관절 안정성 향상을 위한 재활 운동입니다."],
    steps: ["준비자세", "권장 가동 범위에서 수행", "호흡 유지 후 종료"],
  };
}

export default function ExerciseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const { diagnosis } = useOutletContext();
  const detail = DETAIL_MAP[id] || fallbackDetail(id, state);
  const linkedDiagnosis = state?.diagnosis || (diagnosis?.updatedAt ? diagnosis : null);
  const backPath = state?.fromDiagnosis ? "/diagnosis" : "/exercise";
  const showAraRecommendation = Boolean(state?.fromDiagnosis);

  return (
    <SequentialScreen className="screen-react">
      <div className="exercise-hero card-react">
        <button className="hero-back" onClick={() => navigate(backPath)}>‹</button>
        <div className="hero-label">
          <h3>{detail.title}</h3>
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

      <button className="btn-react primary detail-start" onClick={() => navigate("/live", { state: { exerciseId: id, exerciseName: detail.title, diagnosis: linkedDiagnosis } })}>
        Start now
      </button>
    </SequentialScreen>
  );
}


