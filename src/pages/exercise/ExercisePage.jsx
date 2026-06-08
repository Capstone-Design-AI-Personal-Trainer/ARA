import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { useAppContext } from "../../contexts/AppContext";
import rehabCardEllipse from "../../assets/rehab-card-ellipse.svg";
import shoulderRehabCharacter from "../../assets/shoulder-rehab-character.svg";

const PART_ORDER = ["어깨", "허리", "무릎"];

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
    <SequentialScreen className="screen-react">
      <h2>재활 선택</h2>
      {offlineMode ? (
        <div className="glass-react card-react" style={{ marginBottom: 16 }}>
          <p className="muted-react" style={{ margin: 0 }}>
            서버 연결에 실패하여 기본 운동 목록을 표시합니다. 백엔드가 준비되면 자동으로 정상 목록으로 전환됩니다.
          </p>
        </div>
      ) : null}
      <div className="segment-react">
        {parts.map((p) => (
          <button key={p} className={part === p ? "active" : ""} onClick={() => setPart(p)}>{p}</button>
        ))}
      </div>

      <div className="stack">
        {(grouped[part] || []).map((item) => {
          const isShoulderAbduction = item.id === "shoulder-abduction";
          if (isShoulderAbduction) {
            return (
              <article key={item.id} className="figma-rehab-card">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.subtitle?.match(/\d+\s*min/)?.[0]?.replace(" ", "") || "10mins"}</p>
                  <button onClick={() => openExercise(item)}>
                    상세보기
                  </button>
                </div>
                <div className="figma-rehab-visual" aria-hidden="true">
                  <img className="figma-rehab-ellipse" src={rehabCardEllipse} alt="" />
                  <img className="figma-rehab-character" src={shoulderRehabCharacter} alt="" />
                </div>
              </article>
            );
          }

          return (
            <article key={item.id} className="glass-react card-react row-between">
              <div>
                <strong>{item.name}</strong>
                <p className="muted-react">{item.subtitle}</p>
              </div>
              <button className="btn-react primary" onClick={() => openExercise(item)}>
                상세보기
              </button>
            </article>
          );
        })}
      </div>
    </SequentialScreen>
  );
}
