import React from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../../components/SequentialScreen";
import { useAppContext } from "../../contexts/AppContext";

const BODY_PARTS = [
  { id: "head", label: "머리", x: 50, y: 11 },
  { id: "shoulder", label: "어깨", x: 50, y: 25 },
  { id: "knee", label: "무릎", x: 50, y: 73 },
  { id: "ankle", label: "발목", x: 50, y: 94 },
];

function partLabel(id) {
  return BODY_PARTS.find((p) => p.id === id)?.label || "";
}

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const { diagnosis, setDiagnosis } = useAppContext();
  const [selectedPart, setSelectedPart] = React.useState(null);
  const [painLevel, setPainLevel] = React.useState(diagnosis?.painLevel ?? 5);
  const [ripplePart, setRipplePart] = React.useState(null);
  const [rippleKey, setRippleKey] = React.useState(0);

  React.useEffect(() => {
    setDiagnosis((prev) => ({
      ...prev,
      selectedPart,
      partLabel: selectedPart ? partLabel(selectedPart) : null,
      painLevel,
      updatedAt: Date.now(),
    }));
  }, [selectedPart, painLevel, setDiagnosis]);

  return (
    <SequentialScreen className="screen-react diagnosis-screen">
      <header>
        <h2 className="diag-title">어느 부위가 불편하신가요?</h2>
        <p className="diag-sub">통증 부위를 터치하거나 음성으로 말해주세요.</p>
      </header>

      <div className="diag-body-wrap">
        <svg viewBox="0 0 220 420" className="diag-skeleton" aria-hidden="true">
          <defs>
            <radialGradient id="diagTwinAura" cx="50%" cy="42%" r="58%">
              <stop offset="0%" stopColor="rgba(105, 181, 238, 0.2)" />
              <stop offset="100%" stopColor="rgba(105, 181, 238, 0)" />
            </radialGradient>
          </defs>
          <ellipse cx="110" cy="196" rx="84" ry="168" fill="url(#diagTwinAura)" />
          <g className="diag-skeleton-lines">
            <line x1="110" y1="70" x2="110" y2="155" />
            <line x1="110" y1="90" x2="75" y2="165" />
            <line x1="110" y1="90" x2="145" y2="165" />
            <line x1="110" y1="155" x2="110" y2="320" />
            <line x1="95" y1="190" x2="95" y2="356" />
            <line x1="125" y1="190" x2="125" y2="356" />
            <circle cx="110" cy="52" r="25" />
          </g>
        </svg>

        {BODY_PARTS.map((p) => {
          const active = selectedPart === p.id;
          const className = [
            "diag-hotspot",
            `diag-hotspot-${p.id}`,
            active ? "active" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={p.id}
              className={className}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => {
                setSelectedPart(p.id);
                setRipplePart(p.id);
                setRippleKey((prev) => prev + 1);
              }}
              aria-label={p.label}
            >
              {ripplePart === p.id ? <span key={`${p.id}-${rippleKey}`} className="diag-ripple" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      <div className="pain-slider-section">
        <p className="diag-block-title">현재 통증의 정도</p>
        <div className="pain-slider-card">
          <div className="pain-slider-value">
            <span>{painLevel}</span>
            <small>/ 10</small>
          </div>
          <input
            className="pain-slider"
            type="range"
            min="0"
            max="10"
            step="1"
            value={painLevel}
            onChange={(event) => setPainLevel(Number(event.target.value))}
            aria-label="현재 통증의 정도"
          />
          <div className="pain-scale" aria-hidden="true">
            {Array.from({ length: 11 }, (_, value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
        </div>
      </div>

      <button
        className="btn-react primary diag-cta"
        onClick={() =>
          navigate("/exercise/leg-raise", {
            state: {
              fromDiagnosis: true,
              selectedPart,
              painLevel,
              partLabel: selectedPart ? partLabel(selectedPart) : null,
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


