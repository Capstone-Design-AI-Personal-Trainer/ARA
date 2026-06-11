import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiFetch } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { useAppContext } from "../../contexts/AppContext";
import rehabCardEllipse from "../../assets/rehab-card-ellipse.svg";
import shoulderAbductionCard from "../../assets/exercises/shoulder/shoulder-abduction-card.png";
import shoulderRotationCard from "../../assets/exercises/shoulder/shoulder-rotation-card.png";
import shoulderScapulaCard from "../../assets/exercises/shoulder/shoulder-scapula-card.png";
import shoulderWallSlideCard from "../../assets/exercises/shoulder/shoulder-wall-slide-card.png";
import backBirdDogCard from "../../assets/exercises/back/back-bird-dog-card.png";
import backBridgeCard from "../../assets/exercises/back/back-bridge-card.png";
import backDeadBugCard from "../../assets/exercises/back/back-dead-bug-card.png";
import kneeWallSquatCard from "../../assets/exercises/knee/knee-wall-squat-card.png";
import kneeLegRaiseCard from "../../assets/exercises/knee/knee-leg-raise-card.png";
import kneeLungeCard from "../../assets/exercises/knee/knee-lunge-card.png";

const PART_ORDER = ["어깨", "허리", "무릎"];
const SHOULDER_CARD_IMAGES = {
  "shoulder-abduction": shoulderAbductionCard,
  "band-rotation": shoulderRotationCard,
  "scapula-retraction": shoulderScapulaCard,
  "wall-slide": shoulderWallSlideCard,
};
const EXERCISE_CARD_IMAGES = {
  ...SHOULDER_CARD_IMAGES,
  "bird-dog": backBirdDogCard,
  bridge: backBridgeCard,
  "dead-bug": backDeadBugCard,
  "wall-squat": kneeWallSquatCard,
  "leg-raise": kneeLegRaiseCard,
  "slow-lunge": kneeLungeCard,
};

function getExerciseCardImage(item) {
  const id = String(item.id || "").toLowerCase();
  const name = String(item.name || "");
  if (EXERCISE_CARD_IMAGES[id]) return EXERCISE_CARD_IMAGES[id];
  if (name.includes("외전")) return shoulderAbductionCard;
  if (name.includes("외회전") || name.includes("밴드")) return shoulderRotationCard;
  if (name.includes("견갑") || name.includes("모으기")) return shoulderScapulaCard;
  if (name.includes("버드독")) return backBirdDogCard;
  if (name.includes("브릿지")) return backBridgeCard;
  if (name.includes("데드버그")) return backDeadBugCard;
  if (name.includes("스쿼트")) return kneeWallSquatCard;
  if (name.includes("레그 레이즈")) return kneeLegRaiseCard;
  if (name.includes("런지")) return kneeLungeCard;
  if (name.includes("벽") || name.includes("슬라이드")) return shoulderWallSlideCard;
  return shoulderAbductionCard;
}

const FALLBACK_EXERCISES = [
  { id: "wall-squat", name: "벽 스쿼트", part: "무릎", subtitle: "무릎 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "leg-raise", name: "레그 레이즈", part: "무릎", subtitle: "무릎 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "slow-lunge", name: "슬로우 런지", part: "무릎", subtitle: "무릎 재활 · 12 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "bird-dog", name: "버드독", part: "허리", subtitle: "허리 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "bridge", name: "브릿지", part: "허리", subtitle: "허리 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "dead-bug", name: "데드버그", part: "허리", subtitle: "허리 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "shoulder-abduction", name: "어깨 외전", part: "어깨", subtitle: "어깨 재활 · 10 min", guideVideoUrl: "https://www.youtube.com/embed/Lyhpfw_tP5c" },
  { id: "band-rotation", name: "밴드 외회전", part: "어깨", subtitle: "어깨 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "scapula-retraction", name: "견갑골 모으기", part: "어깨", subtitle: "어깨 재활 · 10 min", guideVideoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "wall-slide", name: "벽 슬라이드", part: "어깨", subtitle: "어깨 재활 · 10 min", guideVideoUrl: "https://www.youtube.com/embed/i_0zLUcE-zk" },
];

export default function ExercisePage() {
  const [part, setPart] = React.useState("어깨");
  const [exerciseSummaries, setExerciseSummaries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState();
  const [offlineMode, setOfflineMode] = React.useState(false);
  const navigate = useNavigate();
  const { diagnosis } = useAppContext();

  const openExercise = (item) => {
    navigate(`/guide/${item.id}`, { state: { diagnosis, detail: item, fromExerciseList: true } });
  };

  React.useEffect(() => {
    let active = true;
    if (!API_BASE_URL) {
      setExerciseSummaries(FALLBACK_EXERCISES);
      setOfflineMode(false);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    apiFetch("/api/exercises")
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setExerciseSummaries(list);
        if (list.length === 0) {
          setError("운동 목록이 비어있습니다. 기본 운동 목록을 표시합니다.");
          setExerciseSummaries(FALLBACK_EXERCISES);
          setOfflineMode(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load exercises:", err);
        if (!active) return;
        setError("운동 목록을 불러오지 못했습니다. 기본 운동 목록을 표시합니다.");
        setExerciseSummaries(FALLBACK_EXERCISES);
        setOfflineMode(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const grouped = React.useMemo(() => {
    return exerciseSummaries.reduce((acc, item) => {
      const key = item.part || "기타";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [exerciseSummaries]);

  const parts = PART_ORDER.filter((key) => grouped[key]?.length);

  React.useEffect(() => {
    if (parts.length > 0 && !parts.includes(part)) {
      setPart(parts[0]);
    }
  }, [parts, part]);

  if (loading) {
    return (
      <SequentialScreen className="screen-react">
        <h2>운동 목록 로딩 중</h2>
        <p className="muted-react">잠시만 기다려주세요.</p>
      </SequentialScreen>
    );
  }

  if (!exerciseSummaries.length) {
    return (
      <SequentialScreen className="screen-react">
        <h2>운동 목록을 불러올 수 없습니다.</h2>
        <p className="muted-react">데이터를 불러오는 중 문제가 발생했습니다. 다시 시도해 보세요.</p>
      </SequentialScreen>
    );
  }

  return (
    <SequentialScreen className="screen-react exercise-selection-screen">
      <h2 className="exercise-selection-title">재활 선택</h2>
      {offlineMode ? (
        <div className="glass-react card-react" style={{ marginBottom: 16 }}>
          <p className="muted-react" style={{ margin: 0 }}>
            서버 연결에 실패하여 기본 운동 목록을 표시합니다. 백엔드가 준비되면 자동으로 정상 목록으로 전환됩니다.
          </p>
        </div>
      ) : null}
      <div className="segment-react exercise-part-tabs">
        {parts.map((p) => (
          <button key={p} className={part === p ? "active" : ""} onClick={() => setPart(p)}>{p}</button>
        ))}
      </div>

      <div className="stack exercise-card-list">
        {(grouped[part] || []).map((item) => {
          const cardImage = getExerciseCardImage(item);
          return (
            <article key={item.id} className="figma-rehab-card">
              <div>
                <strong>{item.name}</strong>
                <p>{item.subtitle?.match(/\d+\s*min/i)?.[0]?.replace(/\s+/g, "") || "10mins"}</p>
                <button onClick={() => openExercise(item)}>
                  상세보기
                </button>
              </div>
              <div className="figma-rehab-visual" aria-hidden="true">
                <img className="figma-rehab-ellipse" src={rehabCardEllipse} alt="" />
                <img className="figma-rehab-character" src={cardImage} alt="" />
              </div>
            </article>
          );
        })}
      </div>
    </SequentialScreen>
  );
}
