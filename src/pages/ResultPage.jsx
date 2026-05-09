import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const score = state?.score ?? 87;
  const reps = state?.reps ?? 12;
  const targetReps = state?.targetReps ?? 12;
  const durationSec = state?.durationSec ?? 402;
  const calories = state?.calories ?? 48;
  const exerciseName = state?.exerciseName || "레그 레이즈";

  return (
    <SequentialScreen className="screen-react result-screen">
      <div className="live-head">
        <button className="hero-back" onClick={() => navigate("/exercise")}>‹</button>
        <div>
          <p className="diag-eyebrow">SESSION COMPLETE</p>
          <h2 className="live-title">오늘도 잘 해냈어요</h2>
          <p className="muted-react">지난 7일 중 가장 안정적인 세션이에요.</p>
        </div>
      </div>

      <div className="glass-react card-react result-score-card">
        <div className="result-ring">
          <div className="result-ring-inner">
            <p className="diag-eyebrow">DAILY SCORE</p>
            <strong>{score}</strong>
            <small>/ 100</small>
          </div>
        </div>
      </div>

      <div className="result-stat-grid">
        <div className="glass-react card-react result-stat"><p>시간</p><strong>{fmtDuration(durationSec)}</strong></div>
        <div className="glass-react card-react result-stat"><p>정확도</p><strong>{score}%</strong></div>
        <div className="glass-react card-react result-stat"><p>반복</p><strong>{reps}회</strong></div>
        <div className="glass-react card-react result-stat"><p>칼로리</p><strong>{calories}</strong></div>
      </div>

      <div className="glass-react card-react result-chart-card">
        <div className="row-between">
          <p>7일 정확도</p>
          <strong className="records-kpi-value mint">+12%</strong>
        </div>
        <div className="result-mini-chart">
          <span style={{ height: "42%" }} />
          <span style={{ height: "46%" }} />
          <span style={{ height: "45%" }} />
          <span style={{ height: "50%" }} />
          <span style={{ height: "52%" }} />
          <span style={{ height: "55%" }} />
          <span style={{ height: "61%" }} />
        </div>
      </div>

      <div className="result-feedback-grid">
        <div className="glass-react card-react">
          <p className="result-bad">주의점</p>
          <p>- 어깨 비대칭 0.8cm</p>
          <p>- 오른팔 각도 부족</p>
        </div>
        <div className="glass-react card-react">
          <p className="result-good">개선됨</p>
          <p>- 무릎 떨림 감소</p>
          <p>- 안정성 +14%</p>
        </div>
      </div>

      <div className="live-actions">
        <button className="btn-react" onClick={() => navigate("/live", { state: { exerciseName } })}>다시 하기</button>
        <button className="btn-react primary" onClick={() => navigate("/records")}>기록으로 이동</button>
      </div>
      <p className="muted-react">목표 반복: {targetReps}회</p>
    </SequentialScreen>
  );
}
