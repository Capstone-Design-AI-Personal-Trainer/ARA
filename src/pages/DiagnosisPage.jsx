import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

const BODY_PARTS = [
  { id: "neck", label: "목", x: 50, y: 14 },
  { id: "right_shoulder", label: "오른쪽 어깨", x: 34, y: 27 },
  { id: "left_shoulder", label: "왼쪽 어깨", x: 66, y: 27 },
  { id: "waist", label: "허리", x: 50, y: 50 },
  { id: "left_knee", label: "왼쪽 무릎", x: 56, y: 82 },
  { id: "right_knee", label: "오른쪽 무릎", x: 44, y: 82 },
];

const PAIN_LEVELS = [
  { value: 0, emoji: "😊", label: "없음" },
  { value: 1, emoji: "🙂", label: "적음" },
  { value: 2, emoji: "😐", label: "보통" },
  { value: 3, emoji: "😟", label: "조금" },
  { value: 4, emoji: "😣", label: "많이" },
];

function partLabel(id) {
  return BODY_PARTS.find((p) => p.id === id)?.label || "허리";
}

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const { diagnosis, setDiagnosis } = useOutletContext();
  const [selectedPart, setSelectedPart] = React.useState(diagnosis?.selectedPart || "waist");
  const [painLevel, setPainLevel] = React.useState(diagnosis?.painLevel ?? 2);

  React.useEffect(() => {
    setDiagnosis((prev) => ({
      ...prev,
      selectedPart,
      partLabel: partLabel(selectedPart),
      painLevel,
      updatedAt: Date.now(),
    }));
  }, [selectedPart, painLevel, setDiagnosis]);

  return (
    <SequentialScreen className="screen-react diagnosis-screen">
      <header>
        <p className="diag-eyebrow">STEP 01 · 진단</p>
        <h2 className="diag-title">어느 부위가 불편하신가요?</h2>
        <p className="diag-sub">통증 부위를 터치하거나 음성으로 말해주세요.</p>
      </header>

      <div className="diag-body-wrap">
        <svg viewBox="0 0 220 420" className="diag-skeleton" aria-hidden="true">
          <g stroke="rgba(148,225,238,0.55)" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round">
            <line x1="110" y1="70" x2="110" y2="155" />
            <line x1="110" y1="90" x2="75" y2="165" />
            <line x1="110" y1="90" x2="145" y2="165" />
            <line x1="110" y1="155" x2="110" y2="320" />
            <line x1="95" y1="190" x2="95" y2="320" />
            <line x1="125" y1="190" x2="125" y2="320" />
          </g>
          <circle cx="110" cy="16" r="14" fill="rgba(147,214,230,0.14)" stroke="rgba(188,242,252,0.4)" />
        </svg>

        {BODY_PARTS.map((p) => {
          const active = selectedPart === p.id;
          return (
            <button
              key={p.id}
              className={`diag-hotspot ${active ? "active" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => setSelectedPart(p.id)}
              aria-label={p.label}
            />
          );
        })}
      </div>

      <div className="diag-selected">
        <p>주요 부위</p>
        <strong>{partLabel(selectedPart)}</strong>
      </div>

      <div>
        <p className="diag-block-title">현재 통증의 정도</p>
        <div className="pain-level-row">
          {PAIN_LEVELS.map((level) => (
            <button
              key={level.value}
              className={`pain-chip ${painLevel === level.value ? "active" : ""}`}
              onClick={() => setPainLevel(level.value)}
            >
              <span>{level.emoji}</span>
              <small>{level.label}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="ai-insight-box">
        <p className="diag-eyebrow">ARA INSIGHT</p>
        <p>지난 7일 평균 통증 1.4 → 0.8. 회복 추세를 유지하기에 좋은 상태예요.</p>
      </div>

      <button
        className="btn-react primary diag-cta"
        onClick={() =>
          navigate("/exercise/leg-raise", {
            state: {
              fromDiagnosis: true,
              selectedPart,
              painLevel,
              partLabel: partLabel(selectedPart),
              diagnosisAt: Date.now(),
            },
          })
        }
      >
        추천 운동 보기 →
      </button>
    </SequentialScreen>
  );
}
