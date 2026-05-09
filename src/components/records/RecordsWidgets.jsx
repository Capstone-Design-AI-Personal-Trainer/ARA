import React from "react";
import { motion } from "framer-motion";

function animatedNumber(value, suffix = "") {
  return <span>{value}{suffix}</span>;
}

export function WeeklyBriefCard({ period, accuracyDelta, painTrend, riskPostureDelta, goals }) {
  return (
    <motion.article className="glass-react card-react records-brief" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="row-between">
        <h3>이번 주 회복 브리핑</h3>
        <span className="muted-react">{period}</span>
      </div>
      <div className="records-kpi-grid">
        <div>
          <p className="muted-react">정확도 변화</p>
          <strong className="records-kpi-value mint">{animatedNumber(accuracyDelta, "%")}</strong>
        </div>
        <div>
          <p className="muted-react">통증 변화</p>
          <strong className="records-kpi-value">{painTrend}</strong>
        </div>
        <div>
          <p className="muted-react">위험자세 빈도</p>
          <strong className="records-kpi-value mint">{animatedNumber(riskPostureDelta, "%")}</strong>
        </div>
      </div>
      <div className="records-goals">
        <p className="muted-react">다음 주 권장 목표</p>
        {goals.map((goal) => (
          <p key={goal} className="records-goal-item">• {goal}</p>
        ))}
      </div>
    </motion.article>
  );
}

export function RecoveryHeatmap({ parts, days, matrix, onCellClick }) {
  return (
    <article className="glass-react card-react">
      <div className="row-between">
        <h3>부위별 회복 히트맵</h3>
        <span className="muted-react">최근 7일</span>
      </div>
      <div className="heatmap-grid" style={{ gridTemplateColumns: `88px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => <div key={d} className="heatmap-day">{d}</div>)}
        {parts.map((part, row) => (
          <React.Fragment key={part}>
            <div className="heatmap-part">{part}</div>
            {matrix[row].map((score, col) => {
              const level = score > 80 ? "l4" : score > 65 ? "l3" : score > 45 ? "l2" : "l1";
              return (
                <motion.button
                  key={`${part}-${col}`}
                  className={`heatmap-cell ${level}`}
                  onClick={() => onCellClick?.(part, days[col], score)}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: row * 0.08 + col * 0.03 }}
                >
                  {score}
                </motion.button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="records-badges">
        <span className="records-badge warn">주의 부위: 어깨</span>
        <span className="records-badge good">개선 부위: 무릎</span>
      </div>
    </article>
  );
}

export function MedicalExportPanel({ defaultRange = "최근 7일", onGenerateReport }) {
  const [range, setRange] = React.useState(defaultRange);
  const [anonymized, setAnonymized] = React.useState(true);

  return (
    <article className="glass-react card-react">
      <h3>의료 공유용 요약 내보내기</h3>
      <div className="records-export-options">
        <label className="records-label">기간</label>
        <select className="field-react records-select" value={range} onChange={(e) => setRange(e.target.value)}>
          <option>최근 7일</option>
          <option>최근 30일</option>
          <option>이번 달</option>
        </select>
        <label className="records-check">
          <input type="checkbox" checked={anonymized} onChange={(e) => setAnonymized(e.target.checked)} />
          익명화 포함
        </label>
      </div>
      <motion.button
        className="btn-react primary records-export-btn"
        whileTap={{ scale: 0.98 }}
        animate={{ boxShadow: ["0 0 0 rgba(163,230,229,0)", "0 0 18px rgba(163,230,229,0.35)", "0 0 0 rgba(163,230,229,0)"] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        onClick={() => onGenerateReport?.({ range, anonymized })}
      >
        의료 공유 리포트 생성
      </motion.button>
    </article>
  );
}
