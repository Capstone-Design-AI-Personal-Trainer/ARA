import React from "react";
import SequentialScreen from "../components/SequentialScreen";
import { MedicalExportPanel, RecoveryHeatmap, WeeklyBriefCard } from "../components/records/RecordsWidgets";
import "./RecordsPage.module.css";

const STORAGE_KEY = "rehab_sessions";

function readSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const HEATMAP_PARTS = ["목", "어깨", "허리", "무릎"];
const HEATMAP_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function buildMatrix() {
  return [
    [62, 66, 71, 74, 69, 76, 79],
    [48, 52, 58, 60, 57, 63, 66],
    [55, 59, 64, 68, 70, 74, 77],
    [68, 73, 76, 81, 84, 87, 90],
  ];
}

export default function RecordsPage() {
  const [sessions, setSessions] = React.useState([]);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    setSessions(readSessions());
  }, []);

  const avg = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
    : 78;

  const handleGenerate = ({ range, anonymized }) => {
    const stamp = new Date().toLocaleString("ko-KR");
    setMessage(`리포트 생성 완료 · ${range} · ${anonymized ? "익명화" : "실명"} · ${stamp}`);
  };

  return (
    <SequentialScreen className="screen-react">
      <h2>기록 / 통계</h2>

      <WeeklyBriefCard
        period="5/6 ~ 5/12"
        accuracyDelta={avg}
        painBefore={1.6}
        painAfter={1.1}
        riskPostureDelta={-23}
        goals={["어깨 안정화 루틴 3회", "허리 과신전 경고 20% 감소"]}
      />

      <RecoveryHeatmap
        parts={HEATMAP_PARTS}
        days={HEATMAP_DAYS}
        matrix={buildMatrix()}
        onCellClick={(part, day, score) => setMessage(`${day} ${part} 회복 점수 ${score}점`)}
      />

      <MedicalExportPanel defaultRange="최근 7일" onGenerateReport={handleGenerate} />

      {message ? (
        <div className="glass-react card-react">
          <p className="muted-react">{message}</p>
        </div>
      ) : null}
    </SequentialScreen>
  );
}

