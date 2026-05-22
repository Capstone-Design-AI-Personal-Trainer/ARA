import React from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";
import { useAppContext } from "../contexts/AppContext";

const parts = {
  "무릎": [
    { id: "wall-squat", name: "벽 스쿼트", minutes: "8~12분" },
    { id: "leg-raise", name: "레그 레이즈", minutes: "8~12분" },
    { id: "slow-lunge", name: "슬로우 런지", minutes: "8~12분" },
  ],
  "허리": [
    { id: "bird-dog", name: "버드독", minutes: "8~12분" },
    { id: "bridge", name: "브릿지", minutes: "8~12분" },
    { id: "dead-bug", name: "데드버그", minutes: "8~12분" },
  ],
  "어깨": [
    { id: "shoulder-abduction-adduction", name: "Shoulder Abduction-Adduction", minutes: "8~12분" },
    { id: "front-raise", name: "Front Raise", minutes: "8~12분" },
    { id: "wall-slide", name: "월 슬라이드", minutes: "8~12분" },
  ],
};

export default function ExercisePage() {
  const [part, setPart] = React.useState("무릎");
  const navigate = useNavigate();
  const { diagnosis } = useAppContext();

  return (
    <SequentialScreen className="screen-react">
      <h2>운동 선택</h2>
      <div className="segment-react">
        {Object.keys(parts).map((p) => (
          <button key={p} className={part === p ? "active" : ""} onClick={() => setPart(p)}>{p}</button>
        ))}
      </div>
      <div className="stack">
        {parts[part].map((item) => (
          <article key={item.id} className="glass-react card-react row-between">
            <div>
              <strong>{item.name}</strong>
              <p className="muted-react">{part} 재활 · {item.minutes}</p>
            </div>
            <button className="btn-react primary" onClick={() => navigate(`/exercise/${item.id}`, { state: { part, ...item, diagnosis } })}>
              상세보기
            </button>
          </article>
        ))}
      </div>
    </SequentialScreen>
  );
}





