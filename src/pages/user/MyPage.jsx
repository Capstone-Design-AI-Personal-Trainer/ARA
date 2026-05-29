import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, toSessionView } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";

function toDateLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function MyPage() {
  const { state } = useLocation();
  const [sessions, setSessions] = React.useState([]);
  const [pending, setPending] = React.useState(state?.pendingSession || null);
  const [doctors, setDoctors] = React.useState([]);
  const [profile, setProfile] = React.useState({
    name: "김동국",
    heightCm: 178,
    weightKg: 65,
    targetAreas: "어깨, 허리",
    bio: "",
  });
  const [doctorForm, setDoctorForm] = React.useState({
    name: "",
    hospital: "",
    department: "",
    phone: "",
  });
  const [settings, setSettings] = React.useState({
    voice: true,
    vibration: true,
    mirror: true,
    report: false,
  });
  const [selectedDay, setSelectedDay] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    apiFetch("/api/exercise-sessions")
      .then((data) => setSessions(data.map(toSessionView)))
      .catch((error) => console.error("Failed to load exercise sessions:", error));

    apiFetch("/api/doctors")
      .then(setDoctors)
      .catch((error) => console.error("Failed to load doctors:", error));

    apiFetch("/api/users/profile")
      .then((data) => setProfile({
        name: data.name || "김동국",
        heightCm: data.heightCm || 178,
        weightKg: data.weightKg || 65,
        targetAreas: data.targetAreas || "어깨, 허리",
        bio: data.bio || "",
      }))
      .catch((error) => console.error("Failed to load profile:", error));
  }, []);

  const onSavePending = async () => {
    if (!pending) return;
    try {
      const saved = await apiFetch("/api/exercise-sessions", {
        method: "POST",
        body: JSON.stringify({
          exerciseName: pending.memo || "운동",
          accuracyScore: pending.score,
          reps: pending.reps || 0,
          memo: pending.memo,
        }),
      });
      setSessions((prev) => [toSessionView(saved), ...prev]);
      setPending(null);
    } catch (error) {
      console.error("Failed to save pending session:", error);
    }
  };

  const onDelete = async (id) => {
    try {
      await apiFetch(`/api/exercise-sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onDoctorChange = (event) => {
    const { name, value } = event.target;
    setDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveProfile = async (event) => {
    event.preventDefault();
    try {
      const saved = await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name,
          heightCm: Number(profile.heightCm),
          weightKg: Number(profile.weightKg),
          targetAreas: profile.targetAreas,
          bio: profile.bio,
        }),
      });
      setProfile({
        name: saved.name || "김동국",
        heightCm: saved.heightCm || 178,
        weightKg: saved.weightKg || 65,
        targetAreas: saved.targetAreas || "어깨, 허리",
        bio: saved.bio || "",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const onAddDoctor = async (event) => {
    event.preventDefault();
    try {
      const saved = await apiFetch("/api/doctors", {
        method: "POST",
        body: JSON.stringify({
          ...doctorForm,
          primaryDoctor: doctors.length === 0,
        }),
      });
      setDoctors((prev) => [saved, ...prev]);
      setDoctorForm({ name: "", hospital: "", department: "", phone: "" });
    } catch (error) {
      console.error("Failed to save doctor:", error);
    }
  };

  const sessionDays = React.useMemo(() => {
    const days = new Set();
    sessions.forEach((session) => {
      const date = new Date(session.createdAt || session.completedAt);
      if (!Number.isNaN(date.getTime())) {
        days.add(date.getDate());
      }
    });
    return Array.from(days);
  }, [sessions]);

  const handleDateClick = (day) => {
    setSelectedDay(day);
    const sessionForDay = sessions.find((session) => {
      const date = new Date(session.createdAt || session.completedAt);
      return date.getDate() === day;
    });
    if (sessionForDay) {
      navigate(`/replay/${sessionForDay.id}`);
    }
  };

  const attendanceDays = sessionDays;
  const primaryDoctor = doctors[0];

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
          <h3>{profile.name || "김동국"}</h3>
          <p className="my-muted">{profile.heightCm || 178} cm · {profile.weightKg || 65} kg</p>
          <span className="rank-badge">RANK A · LV 14</span>
        </div>
      </div>

      <div className="my-stats">
        <div className="my-card"><p className="my-muted">연속 일수</p><strong>14일</strong></div>
        <div className="my-card"><p className="my-muted">평균 정확도</p><strong>{sessions.length ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length) : 78}%</strong></div>
        <div className="my-card"><p className="my-muted">총 운동</p><strong>{sessions.length}회</strong></div>
      </div>

      <div className="my-card">
        <p className="my-section-title">신체 기준값</p>
        <div className="my-list">
          <div><span>키</span><span>{profile.heightCm || 178} cm</span></div>
          <div><span>몸무게</span><span>{profile.weightKg || 65} kg</span></div>
          <div><span>목표 부위</span><span>{profile.targetAreas || "어깨, 허리"}</span></div>
          <div>
            <span>주치의</span>
            <span>{primaryDoctor ? `${primaryDoctor.hospital || ""} ${primaryDoctor.name}`.trim() : "미등록"}</span>
          </div>
        </div>
      </div>

      <div className="my-card">
        <p className="my-section-title">내 정보 저장</p>
        <form className="stack" onSubmit={onSaveProfile}>
          <input className="field-react" name="name" placeholder="이름" value={profile.name} onChange={onProfileChange} />
          <input className="field-react" name="heightCm" placeholder="키(cm)" type="number" value={profile.heightCm} onChange={onProfileChange} />
          <input className="field-react" name="weightKg" placeholder="몸무게(kg)" type="number" value={profile.weightKg} onChange={onProfileChange} />
          <input className="field-react" name="targetAreas" placeholder="목표 부위" value={profile.targetAreas} onChange={onProfileChange} />
          <input className="field-react" name="bio" placeholder="메모" value={profile.bio} onChange={onProfileChange} />
          <button className="btn-react primary" type="submit">내 정보 저장</button>
        </form>
      </div>

      <div className="my-card">
        <p className="my-section-title">주치의 등록</p>
        <form className="stack" onSubmit={onAddDoctor}>
          <input className="field-react" name="hospital" placeholder="병원명" value={doctorForm.hospital} onChange={onDoctorChange} />
          <input className="field-react" name="name" placeholder="의사 이름" value={doctorForm.name} onChange={onDoctorChange} required />
          <input className="field-react" name="department" placeholder="진료과" value={doctorForm.department} onChange={onDoctorChange} />
          <input className="field-react" name="phone" placeholder="연락처" value={doctorForm.phone} onChange={onDoctorChange} />
          <button className="btn-react primary" type="submit">주치의 저장</button>
        </form>
      </div>

      <div className="my-card">
        <p className="my-section-title">이번 달 출석</p>
        <div className="calendar-box">
          {Array.from({ length: 28 }, (_, idx) => {
            const day = idx + 1;
            const active = attendanceDays.includes(day);
            const today = day === new Date().getDate();
            return (
              <button
                key={day}
                type="button"
                className={`calendar-cell ${active ? "active" : ""} ${today ? "today" : ""} ${selectedDay === day ? "selected" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
        {selectedDay !== null ? (
          <p className="muted-react" style={{ marginTop: 12 }}>
            {attendanceDays.includes(selectedDay)
              ? `${selectedDay}일 기록이 있어 녹화 영상 보기로 이동합니다.`
              : `${selectedDay}일에는 저장된 기록이 없습니다.`}
          </p>
        ) : null}
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
