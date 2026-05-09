import React from "react";
import { useLocation } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

const STORAGE_KEY = "rehab_sessions";

function readSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSessions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function toDateLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function MyPage() {
  const { state } = useLocation();
  const [sessions, setSessions] = React.useState([]);
  const [pending, setPending] = React.useState(state?.pendingSession || null);
  const [settings, setSettings] = React.useState({
    voice: true,
    vibration: true,
    mirror: true,
    report: false,
  });

  React.useEffect(() => {
    setSessions(readSessions());
  }, []);

  const onSavePending = () => {
    if (!pending) return;
    const next = [{ id: Date.now(), ...pending }, ...sessions];
    setSessions(next);
    writeSessions(next);
    setPending(null);
  };

  const onDelete = (id) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    writeSessions(next);
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const attendanceDays = [1, 2, 3, 5, 6, 7, 8, 9];

  return (
    <SequentialScreen className="screen-react my-page-screen">
      <header className="my-head">
        <div className="row-between">
          <h2>마이페이지</h2>
          <button className="icon-gear" aria-label="설정">⚙</button>
        </div>
      </header>

      <div className="my-card my-profile">
        <div className="avatar">김</div>
        <div>
          <h3>김동국</h3>
          <p className="my-muted">178 cm · 65 kg</p>
          <span className="rank-badge">RANK A · LV 14</span>
        </div>
      </div>

      <div className="my-stats">
        <div className="my-card"><p className="my-muted">연속 일수</p><strong>14일</strong></div>
        <div className="my-card"><p className="my-muted">평균 정확도</p><strong>{sessions.length ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length) : 78}%</strong></div>
        <div className="my-card"><p className="my-muted">총 운동</p><strong>{sessions.length || 36}회</strong></div>
      </div>

      <div className="my-card">
        <p className="my-section-title">신체 기준값</p>
        <div className="my-list">
          <div><span>키</span><span>178 cm</span></div>
          <div><span>몸무게</span><span>65 kg</span></div>
          <div><span>목표 부위</span><span>어깨, 허리</span></div>
          <div><span>주치의</span><span>강남재활의학과 이동국</span></div>
        </div>
      </div>

      <div className="my-card">
        <p className="my-section-title">이번 달 출석</p>
        <div className="calendar-box">
          {Array.from({ length: 28 }, (_, idx) => {
            const day = idx + 1;
            const active = attendanceDays.includes(day);
            const today = day === 9;
            return (
              <div key={day} className={`calendar-cell ${active ? "active" : ""} ${today ? "today" : ""}`}>
                {day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="my-card">
        <p className="my-section-title">앱 설정</p>
        <div className="my-list">
          <button className="setting-row" onClick={() => toggleSetting("voice")}><span>음성 코칭</span><span className={`toggle ${settings.voice ? "on" : ""}`} /></button>
          <button className="setting-row" onClick={() => toggleSetting("vibration")}><span>진동 피드백</span><span className={`toggle ${settings.vibration ? "on" : ""}`} /></button>
          <button className="setting-row" onClick={() => toggleSetting("mirror")}><span>미러 자동 연결</span><span className={`toggle ${settings.mirror ? "on" : ""}`} /></button>
          <button className="setting-row" onClick={() => toggleSetting("report")}><span>병원 자동 리포트</span><span className={`toggle ${settings.report ? "on" : ""}`} /></button>
          <div><span>텍스트 크기</span><span>중간 ›</span></div>
        </div>
      </div>

      <div className="my-card">
        <p className="my-section-title">기록</p>
        <div className="my-list">
          <div><span>통증 기록</span><span>›</span></div>
          <div><span>운동 히스토리</span><span>›</span></div>
          <div><span>병원 공유 내역</span><span>›</span></div>
        </div>
      </div>

      <div className="my-card">
        <p className="my-section-title">저장 대기 기록</p>
        {pending ? (
          <div className="stack">
            <div className="session-item my-session-item">
              <strong>{pending.memo}</strong>
              <p className="my-muted">정확도 {pending.score}% · {toDateLabel(pending.createdAt)}</p>
            </div>
            <button className="btn-react primary" onClick={onSavePending}>이 기록 저장하기</button>
          </div>
        ) : (
          <p className="my-muted">현재 저장 대기 중인 기록이 없습니다.</p>
        )}
      </div>

      <div className="my-card">
        <p className="my-section-title">내 저장 기록</p>
        {sessions.length ? (
          <div className="stack">
            {sessions.map((s) => (
              <div key={s.id} className="session-item my-session-item row-between">
                <div>
                  <strong>{s.memo}</strong>
                  <p className="my-muted">정확도 {s.score}% · {toDateLabel(s.createdAt)}</p>
                </div>
                <button className="btn-react" onClick={() => onDelete(s.id)}>삭제</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="my-muted">저장된 기록이 없습니다.</p>
        )}
      </div>

      <button className="logout-btn">로그아웃</button>
      <p className="my-version">ARA · v1.4.2</p>
    </SequentialScreen>
  );
}


