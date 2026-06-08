import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, toSessionView } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import profileAvatar from "../../assets/profile-avatar.png";

export default function MyPage() {
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
    apiFetch("/api/exercise-sessions")
      .then((data) => setSessions(data.map(toSessionView)))
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
      if (!Number.isNaN(date.getTime())) {
        days.add(date.getDate());
      }
    });
    return Array.from(days);
  }, [sessions]);

  const handleDateClick = (day) => {
    const sessionForDay = sessions.find((session) => {
      const date = new Date(session.createdAt || session.completedAt);
      return date.getDate() === day;
    });
    if (sessionForDay) {
      navigate(`/replay/${sessionForDay.id}`);
    }
  };

  const attendanceDays = sessionDays;

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
        {Array.from({ length: 31 }, (_, idx) => {
          const day = idx + 1;
          const active = attendanceDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              className={`figma-calendar-cell ${active ? "active" : ""}`}
              onClick={() => handleDateClick(day)}
            >
              {day}
            </button>
          );
        })}
      </section>
    </SequentialScreen>
  );
}
