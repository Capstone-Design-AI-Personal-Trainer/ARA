import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, toSessionView } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { MedicalExportPanel } from "../../components/records/RecordsWidgets";
import { getWorkoutRecordings } from "../../features/junyoung/recording/workoutRecordingStore";
import { buildInitialUserProfile, saveUserProfile } from "../../features/userProfile/userProfileStore";

function toDateLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(seconds = 0) {
  if (!seconds) return "0초";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (!min) return `${sec}초`;
  return `${min}분 ${sec}초`;
}

const MY_PANEL_ITEMS = [
  { id: "body", label: "신체 기준값" },
  { id: "profile", label: "내 정보 저장" },
  { id: "doctor", label: "주치의 등록" },
  { id: "medical", label: "의료 공유용 요약 내보내기" },
  { id: "pending", label: "저장 대기 기록" },
  { id: "saved", label: "내 저장 기록" },
  { id: "settings", label: "앱 설정" },
];

export default function MyPage() {
  const { state } = useLocation();
  const [sessions, setSessions] = React.useState([]);
  const [pending, setPending] = React.useState(state?.pendingSession || null);
  const [doctors, setDoctors] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [recordingsById, setRecordingsById] = React.useState({});
  const [reportMessage, setReportMessage] = React.useState("");
  const [profile, setProfile] = React.useState(() => buildInitialUserProfile());
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
  const [activePanel, setActivePanel] = React.useState(null);
  const [selectedDay, setSelectedDay] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    apiFetch("/api/exercise-sessions")
      .then(async (data) => {
        const sessionViews = data.map(toSessionView);
        setSessions(sessionViews);
        try {
          const recordings = await getWorkoutRecordings(sessionViews.map((session) => String(session.recordingKey || session.id)));
          setRecordingsById(Object.fromEntries(recordings.map((recording) => [recording.id, recording])));
        } catch (error) {
          console.error("Failed to load local recordings:", error);
          setRecordingsById({});
        }
      })
      .catch((error) => console.error("Failed to load exercise sessions:", error));

    apiFetch("/api/doctors")
      .then(setDoctors)
      .catch((error) => console.error("Failed to load doctors:", error));

    apiFetch("/api/medical-reports")
      .then(setReports)
      .catch((error) => console.error("Failed to load medical reports:", error));

    if (!localStorage.getItem("token")) {
      navigate("/", { replace: true });
    }
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

  const handleGenerateReport = async ({ range, anonymized }) => {
    try {
      const report = await apiFetch("/api/medical-reports", {
        method: "POST",
        body: JSON.stringify({ range, anonymized }),
      });
      setReports((prev) => [report, ...prev]);
      setReportMessage(`리포트 저장 완료 · ${report.summary}`);
    } catch (error) {
      console.error("Failed to save medical report:", error);
      setReportMessage("리포트 저장에 실패했습니다.");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
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
    const cachedProfile = saveUserProfile(profile);
    setProfile(cachedProfile);

    try {
      const saved = await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: cachedProfile.name,
          heightCm: Number(cachedProfile.heightCm),
          weightKg: Number(cachedProfile.weightKg),
          targetAreas: cachedProfile.targetAreas,
          bio: cachedProfile.bio,
        }),
      });
      const syncedProfile = saveUserProfile({ ...cachedProfile, ...saved });
      setProfile(syncedProfile);
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
  };

  const selectedDaySessions = React.useMemo(() => {
    if (selectedDay === null) return [];
    return sessions.filter((session) => {
      const date = new Date(session.createdAt || session.completedAt);
      return !Number.isNaN(date.getTime()) && date.getDate() === selectedDay;
    });
  }, [selectedDay, sessions]);

  const attendanceDays = sessionDays;
  const primaryDoctor = doctors[0];
  const daysInCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const panelTitle = MY_PANEL_ITEMS.find((item) => item.id === activePanel)?.label;
  const displayName = profile.name || "사용자";
  const avatarInitial = displayName.trim().charAt(0) || "U";
  const heightLabel = profile.heightCm ? `${profile.heightCm} cm` : "-";
  const weightLabel = profile.weightKg ? `${profile.weightKg} kg` : "-";
  const targetAreasLabel = profile.targetAreas || "-";

  return (
    <SequentialScreen className="screen-react my-page-screen">
      <header className="my-head">
        <div className="row-between">
          <h2>마이페이지</h2>
          <button className="icon-gear" aria-label="설정" onClick={() => setActivePanel("settings")}>⚙</button>
        </div>
      </header>

      <div className="my-card my-profile">
        <div className="avatar">{avatarInitial}</div>
        <div>
          <h3>{displayName}</h3>
          <p className="my-muted">{heightLabel} · {weightLabel}</p>
        </div>
      </div>

      {!activePanel ? <div className="my-card">
        <div className="calendar-box">
          {Array.from({ length: daysInCurrentMonth }, (_, idx) => {
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
          <div className="stack" style={{ marginTop: 12 }}>
            {selectedDaySessions.length ? (
              selectedDaySessions.map((session) => {
                const hasRecording = Boolean(session.hasRecording || recordingsById[String(session.recordingKey || session.id)]);
                return (
                  <div key={session.id} className="session-item my-session-item row-between">
                    <div>
                      <strong>{session.exerciseName || session.memo}</strong>
                      <p className="my-muted">
                        정확도 {session.score ?? 0}% · {session.reps ?? 0}{session.targetReps ? `/${session.targetReps}` : ""}회 · {formatDuration(session.durationSec)}
                      </p>
                    </div>
                    <button className="btn-react" onClick={() => navigate(`/replay/${session.id}`)}>
                      {hasRecording ? "녹화 보기" : "기록 보기"}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="my-muted">{selectedDay}일에는 저장된 재활 기록이 없습니다.</p>
            )}
          </div>
        ) : null}
      </div> : null}

      {!activePanel ? (
        <div className="my-card my-menu-list">
          {MY_PANEL_ITEMS.map((item) => (
            <button
              key={item.id}
              className="my-menu-row"
              type="button"
              onClick={() => setActivePanel(item.id)}
            >
              <span>
                {item.label}
                {item.id === "medical" && reports.length ? <em>{reports.length}</em> : null}
                {item.id === "saved" && sessions.length ? <em>{sessions.length}</em> : null}
                {item.id === "pending" && pending ? <em>1</em> : null}
              </span>
              <span className="my-menu-chevron">›</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="my-panel-back" type="button" onClick={() => setActivePanel(null)}>
          <span>‹</span>
          <strong>{panelTitle}</strong>
          <em>목록으로</em>
        </button>
      )}

      {activePanel === "body" ? <div className="my-card">
        <p className="my-section-title">신체 기준값</p>
        <div className="my-list">
          <div><span>나이</span><span>{profile.age ? `${profile.age}세` : "-"}</span></div>
          <div><span>성별</span><span>{profile.gender || "-"}</span></div>
          <div><span>키</span><span>{heightLabel}</span></div>
          <div><span>몸무게</span><span>{weightLabel}</span></div>
          <div><span>목표 부위</span><span>{targetAreasLabel}</span></div>
          <div>
            <span>주치의</span>
            <span>{primaryDoctor ? `${primaryDoctor.hospital || ""} ${primaryDoctor.name}`.trim() : "미등록"}</span>
          </div>
        </div>
      </div> : null}

      {activePanel === "profile" ? <div className="my-card">
        <p className="my-section-title">내 정보 저장</p>
        <form className="stack" onSubmit={onSaveProfile}>
          <input className="field-react" name="name" placeholder="이름" value={profile.name} onChange={onProfileChange} />
          <input className="field-react" name="age" placeholder="나이" type="number" value={profile.age} onChange={onProfileChange} />
          <select className="field-react" name="gender" value={profile.gender} onChange={onProfileChange}>
            <option value="">성별</option>
            <option value="여성">여성</option>
            <option value="남성">남성</option>
            <option value="기타">기타</option>
            <option value="미입력">선택 안 함</option>
          </select>
          <input className="field-react" name="heightCm" placeholder="키(cm)" type="number" value={profile.heightCm} onChange={onProfileChange} />
          <input className="field-react" name="weightKg" placeholder="몸무게(kg)" type="number" value={profile.weightKg} onChange={onProfileChange} />
          <input className="field-react" name="targetAreas" placeholder="목표 부위" value={profile.targetAreas} onChange={onProfileChange} />
          <input className="field-react" name="bio" placeholder="메모" value={profile.bio} onChange={onProfileChange} />
          <button className="btn-react primary" type="submit">내 정보 저장</button>
        </form>
      </div> : null}

      {activePanel === "doctor" ? <div className="my-card">
        <p className="my-section-title">주치의 등록</p>
        <form className="stack" onSubmit={onAddDoctor}>
          <input className="field-react" name="hospital" placeholder="병원명" value={doctorForm.hospital} onChange={onDoctorChange} />
          <input className="field-react" name="name" placeholder="의사 이름" value={doctorForm.name} onChange={onDoctorChange} required />
          <input className="field-react" name="department" placeholder="진료과" value={doctorForm.department} onChange={onDoctorChange} />
          <input className="field-react" name="phone" placeholder="연락처" value={doctorForm.phone} onChange={onDoctorChange} />
          <button className="btn-react primary" type="submit">주치의 저장</button>
        </form>
      </div> : null}

      {activePanel === "medical" ? <MedicalExportPanel defaultRange="최근 7일" onGenerateReport={handleGenerateReport} /> : null}

      {activePanel === "medical" ? <div className="my-card">
        <p className="my-section-title">저장된 의료 리포트</p>
        {reports.length ? (
          <div className="stack">
            {reports.slice(0, 5).map((report) => (
              <p key={report.id} className="my-muted">
                {report.summary} · {report.anonymized ? "익명" : "실명"}
              </p>
            ))}
          </div>
        ) : (
          <p className="my-muted">저장된 리포트가 없습니다.</p>
        )}
        {reportMessage ? <p className="muted-react" style={{ marginTop: 10 }}>{reportMessage}</p> : null}
      </div> : null}

      {activePanel === "settings" ? <div className="my-card">
        <p className="my-section-title">앱 설정</p>
        <div className="my-list">
          <button className="setting-row" onClick={() => toggleSetting("voice")}><span>음성 코칭</span><span className={`toggle ${settings.voice ? "on" : ""}`} /></button>
          <button className="setting-row" onClick={() => toggleSetting("vibration")}><span>진동 피드백</span><span className={`toggle ${settings.vibration ? "on" : ""}`} /></button>
          <button className="setting-row" onClick={() => toggleSetting("mirror")}><span>미러 자동 연결</span><span className={`toggle ${settings.mirror ? "on" : ""}`} /></button>
          <button className="setting-row" onClick={() => toggleSetting("report")}><span>병원 자동 리포트</span><span className={`toggle ${settings.report ? "on" : ""}`} /></button>
          <div><span>텍스트 크기</span><span>중간 ›</span></div>
        </div>
      </div> : null}

      {activePanel === "pending" ? <div className="my-card">
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
      </div> : null}

      {activePanel === "saved" ? <div className="my-card">
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
      </div> : null}

      {!activePanel ? (
        <button className="logout-btn" type="button" onClick={handleLogout}>
          로그아웃
        </button>
      ) : null}
      {activePanel === "settings" ? <p className="my-version">ARA · v1.4.2</p> : null}
    </SequentialScreen>
  );
}
