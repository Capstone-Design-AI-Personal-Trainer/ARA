import React from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../../components/SequentialScreen";
import { useAppContext } from "../../contexts/AppContext";
import bodySilhouette from "../../assets/body-silhouette.png";

const BODY_PARTS = [
  { id: "shoulder", label: "어깨", x: 50, y: 23 },
  { id: "waist", label: "허리", x: 50, y: 45 },
  { id: "knee", label: "무릎", x: 50, y: 69 },
];

const EXERCISE_DETAILS = {
  "shoulder-abduction": { id: "shoulder-abduction", name: "어깨 외전", part: "어깨", subtitle: "어깨 재활 · 10 min", level: "초급", intro: ["어깨 관절의 가동 범위를 부드럽게 확인하는 운동입니다."], steps: ["팔을 몸 옆에 둡니다.", "통증 없는 범위에서 천천히 옆으로 들어 올립니다.", "어깨가 올라가지 않게 유지하며 돌아옵니다."], guideVideoUrl: "https://www.youtube.com/embed/Lyhpfw_tP5c" },
  "wall-slide": { id: "wall-slide", name: "벽 슬라이드", part: "어깨", subtitle: "어깨 재활 · 10 min", level: "중급", intro: ["벽을 이용해 어깨의 안정성과 가동 범위를 개선합니다."], steps: ["벽을 마주 보고 팔을 벽에 붙입니다.", "가능한 범위까지 천천히 위로 밀어 올립니다.", "어깨에 부담이 없도록 천천히 내려옵니다."], guideVideoUrl: "https://www.youtube.com/embed/i_0zLUcE-zk" },
  "scapula-retraction": { id: "scapula-retraction", name: "견갑골 모으기", part: "어깨", subtitle: "어깨 재활 · 10 min", level: "중급", intro: ["견갑골 주변 안정성을 높이고 자세를 교정하는 운동입니다."], steps: ["등을 곧게 세우고 어깨 힘을 뺍니다.", "양쪽 견갑골을 등 중앙으로 천천히 모읍니다.", "목에 힘이 들어가지 않게 유지합니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  "band-rotation": { id: "band-rotation", name: "밴드 외회전", part: "어깨", subtitle: "어깨 재활 · 10 min", level: "초급", intro: ["어깨 회전근개를 강화하고 안정성을 높입니다."], steps: ["팔꿈치를 몸 옆에 붙이고 90도로 굽힙니다.", "어깨 높이를 유지하며 손을 바깥쪽으로 회전합니다.", "반동 없이 천천히 시작 위치로 돌아옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  "bird-dog": { id: "bird-dog", name: "버드독", part: "허리", subtitle: "허리 재활 · 10 min", level: "초급", intro: ["허리 안정성과 코어 조절 능력을 강화합니다."], steps: ["네발기기 자세에서 척추를 중립으로 유지합니다.", "반대쪽 팔과 다리를 천천히 뻗습니다.", "몸통이 흔들리지 않게 유지하며 돌아옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  bridge: { id: "bridge", name: "브릿지", part: "허리", subtitle: "허리 재활 · 10 min", level: "중급", intro: ["둔근과 햄스트링을 활성화해 허리 지지력을 높입니다."], steps: ["무릎을 세우고 바닥에 눕습니다.", "골반을 천천히 들어 올립니다.", "허리를 꺾지 않게 주의하며 내려옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  "dead-bug": { id: "dead-bug", name: "데드버그", part: "허리", subtitle: "허리 재활 · 10 min", level: "중급", intro: ["코어를 안정화하고 허리 부담을 줄이는 운동입니다."], steps: ["누워서 팔과 무릎을 들어 준비합니다.", "반대쪽 팔과 다리를 천천히 내립니다.", "허리가 뜨지 않게 유지하며 돌아옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  "slow-lunge": { id: "slow-lunge", name: "슬로우 런지", part: "무릎", subtitle: "무릎 재활 · 12 min", level: "중급", intro: ["좌우 균형을 유지하며 무릎과 고관절 안정성을 강화합니다."], steps: ["한 발을 앞으로 내딛습니다.", "앞쪽 무릎이 발끝 방향을 따라가게 내려갑니다.", "발바닥으로 바닥을 밀며 돌아옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  "wall-squat": { id: "wall-squat", name: "벽 스쿼트", part: "무릎", subtitle: "무릎 재활 · 10 min", level: "초급", intro: ["벽을 지지대로 사용해 무릎 정렬을 연습합니다."], steps: ["등을 벽에 기대고 발을 골반 너비로 둡니다.", "무릎이 안쪽으로 모이지 않게 내려갑니다.", "통증 없는 범위에서 천천히 올라옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  "leg-raise": { id: "leg-raise", name: "레그 레이즈", part: "무릎", subtitle: "무릎 재활 · 10 min", level: "중급", intro: ["다리를 곧게 들어 올려 허벅지 앞쪽 근육을 활성화합니다."], steps: ["누워서 한쪽 무릎을 세우고 반대쪽 다리를 곧게 둡니다.", "곧게 편 다리를 천천히 들어 올립니다.", "허리가 뜨지 않게 주의하며 내려옵니다."], guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
};

const RECOMMENDATIONS = {
  shoulder: [
    { max: 3, exerciseIds: ["shoulder-abduction", "wall-slide"] },
    { max: 6, exerciseIds: ["scapula-retraction", "band-rotation"] },
    { max: 10, exerciseIds: ["wall-slide", "scapula-retraction"], caution: "통증이 강한 편입니다. 무리하지 말고 가능한 범위 안에서 천천히 진행하세요." },
  ],
  waist: [
    { max: 3, exerciseIds: ["bird-dog", "bridge"] },
    { max: 6, exerciseIds: ["bridge", "dead-bug"] },
    { max: 10, exerciseIds: ["dead-bug"], caution: "통증이 강한 편입니다. 허리에 부담이 느껴지면 즉시 중단하고 휴식하세요." },
  ],
  knee: [
    { max: 3, exerciseIds: ["slow-lunge", "wall-squat"] },
    { max: 6, exerciseIds: ["leg-raise", "wall-squat"] },
    { max: 10, exerciseIds: ["leg-raise"], caution: "통증이 강한 편입니다. 무릎에 체중이 과하게 실리는 동작은 피해주세요." },
  ],
};

function partLabel(id) {
  return BODY_PARTS.find((p) => p.id === id)?.label || "";
}

function getRecommendation(part, level) {
  const ranges = RECOMMENDATIONS[part] || RECOMMENDATIONS.knee;
  return ranges.find((range) => level <= range.max) || ranges[ranges.length - 1];
}

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const { diagnosis, setDiagnosis } = useAppContext();
  const [selectedPart, setSelectedPart] = React.useState(null);
  const [painLevel, setPainLevel] = React.useState(diagnosis?.painLevel ?? 5);
  const [ripplePart, setRipplePart] = React.useState(null);
  const [rippleKey, setRippleKey] = React.useState(0);
  const selectedPartLabel = selectedPart ? partLabel(selectedPart) : null;
  const recommendation = selectedPart ? getRecommendation(selectedPart, painLevel) : null;

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
        <img className="diag-body-image" src={bodySilhouette} alt="" aria-hidden="true" />

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
        disabled={!selectedPart}
        onClick={() => {
          const primaryExerciseId = recommendation?.exerciseIds?.[0] || "leg-raise";
          navigate(`/guide/${primaryExerciseId}`, {
            state: {
              fromDiagnosis: true,
              detail: EXERCISE_DETAILS[primaryExerciseId],
              selectedPart,
              painLevel,
              partLabel: selectedPartLabel,
              recommendedExerciseIds: recommendation?.exerciseIds || [primaryExerciseId],
              recommendationCaution: recommendation?.caution || null,
              diagnosisAt: Date.now(),
            },
          });
        }}
      >
        {selectedPart ? `${selectedPartLabel} 맞춤 운동 보기 →` : "부위를 선택해주세요"}
      </button>
    </SequentialScreen>
  );
}


