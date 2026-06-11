import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, toSessionView } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import profileAvatar from "../../assets/profile-avatar.png";
import {
  getCachedWorkoutHistory,
  mergeWorkoutHistory,
} from "../../features/workoutHistory/workoutHistoryStore";

export default function MyPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const [sessions, setSessions] = React.useState([]);
  const [profile, setProfile] = React.useState({
    name: "Ara",
    heightCm: 178,
    weightKg: 70,
    targetAreas: "어깨, 허리",
    bio: "",
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    const cachedSessions = getCachedWorkoutHistory();
    setSessions(cachedSessions);

    apiFetch("/api/exercise-sessions")
      .then((data) => setSessions(mergeWorkoutHistory(data.map(toSessionView), cachedSessions)))
      .catch((error) => console.error("Failed to load exercise sessions:", error));

    apiFetch("/api/users/profile")
      .then((data) => setProfile({
        name: data.name || "Ara",
        heightCm: data.heightCm || 178,
        weightKg: data.weightKg || 70,
        targetAreas: data.targetAreas || "어깨, 허리",
        bio: data.bio || "",
      }))
      .catch((error) => console.error("Failed to load profile:", error));
  }, []);

  const sessionDays = React.useMemo(() => {
    const days = new Set();
    sessions.forEach((session) => {
      const date = new Date(session.createdAt || session.completedAt);
      if (
        !Number.isNaN(date.getTime())
        && date.getFullYear() === currentYear
        && date.getMonth() === currentMonth
      ) {
        days.add(date.getDate());
      }
    });
    return Array.from(days);
  }, [sessions, currentMonth, currentYear]);

  const handleDateClick = (day) => {
    const sessionForDay = sessions.find((session) => {
      const date = new Date(session.createdAt || session.completedAt);
      return (
        date.getFullYear() === currentYear
        && date.getMonth() === currentMonth
        && date.getDate() === day
      );
    });
    if (sessionForDay) {
      navigate(`/replay/${sessionForDay.id}`);
    }
  };

  const attendanceDays = sessionDays;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("oauth_mode");
    navigate("/login", { replace: true });
  };

  return (
    <SequentialScreen className="screen-react my-page-screen">
      <h2 className="my-title">마이 페이지</h2>

      <section className="figma-profile-summary">
        <img className="figma-profile-avatar" src={profileAvatar} alt="" />
        <h3>{profile.name || "Ara"}</h3>
        <p>{profile.heightCm || 178}cm {profile.weightKg || 70} KG</p>
      </section>

      <section className="figma-profile-menu">
        <button onClick={() => navigate("/records")}>
          <span className="figma-menu-icon">▭</span>
          <span>재활 기록</span>
          <span className="figma-menu-arrow">›</span>
        </button>
        <button>
          <span className="figma-menu-icon">⇧</span>
          <span>의료 공유용 요약 내보내기</span>
          <span className="figma-menu-arrow">›</span>
        </button>
      </section>

      <p className="figma-calendar-title">이번달 출석</p>
      <section className="figma-calendar-box">
        {Array.from({ length: daysInCurrentMonth }, (_, idx) => {
          const day = idx + 1;
          const active = attendanceDays.includes(day);
          const isToday = day === todayDate;
          return (
            <button
              key={day}
              type="button"
              className={`figma-calendar-cell ${active ? "active" : ""} ${isToday ? "today" : ""}`}
              onClick={() => handleDateClick(day)}
              aria-current={isToday ? "date" : undefined}
            >
              {day}
            </button>
          );
        })}
      </section>

      <button type="button" className="figma-logout-btn" onClick={handleLogout}>
        로그아웃
      </button>
    </SequentialScreen>
  );
}
