import React from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import SequentialScreen from "../../components/SequentialScreen";
import { buildInitialUserProfile, saveUserProfile } from "./userProfileStore";

const BODY_PARTS = [
  { id: "head", label: "머리", x: 50, y: 11 },
  { id: "shoulder", label: "어깨", x: 50, y: 25 },
  { id: "waist", label: "허리", x: 50, y: 49 },
  { id: "knee", label: "무릎", x: 50, y: 73 },
  { id: "ankle", label: "발목", x: 50, y: 94 },
];

function partLabel(id) {
  return BODY_PARTS.find((part) => part.id === id)?.label || "";
}

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);
  const [profile, setProfile] = React.useState(() => buildInitialUserProfile());
  const [selectedPart, setSelectedPart] = React.useState(profile.painPart || "");
  const [painLevel, setPainLevel] = React.useState(Number(profile.painLevel || 5));
  const [ripplePart, setRipplePart] = React.useState(null);
  const [rippleKey, setRippleKey] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const canContinueBasic = Boolean(profile.name && profile.age && profile.gender && profile.heightCm && profile.weightKg);
  const selectedPartLabel = partLabel(selectedPart);

  const saveAndStart = async () => {
    if (!selectedPart) return;

    const finalProfile = {
      ...profile,
      painPart: selectedPart,
      painLevel,
      targetAreas: selectedPartLabel,
      bio: profile.bio || `통증 강도 ${painLevel}/10`,
    };

    setSaving(true);
    const cachedProfile = saveUserProfile(finalProfile);

    try {
      await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: cachedProfile.name,
          heightCm: Number(cachedProfile.heightCm),
          weightKg: Number(cachedProfile.weightKg),
          targetAreas: cachedProfile.targetAreas,
          bio: cachedProfile.bio,
        }),
      });
    } catch (error) {
      console.error("Failed to sync profile setup:", error);
    } finally {
      setSaving(false);
      navigate("/home", { replace: true });
    }
  };

  const title = [
    "기본 정보를 알려주세요",
    "어느 부위가 불편하신가요?",
    "준비가 끝났어요",
  ][step];

  return (
    <SequentialScreen className="screen-react profile-setup-screen">
      <header className="profile-onboarding-head">
        <h1>{title}</h1>
      </header>

      <div className="profile-onboarding-main">
        {step === 0 ? (
          <>

          <div className="glass-react card-react stack profile-setup-form">
            <input className="field-react" name="name" placeholder="이름" value={profile.name} onChange={onChange} required />
            <div className="row-2">
              <input className="field-react" name="age" placeholder="나이" type="number" min="1" value={profile.age} onChange={onChange} required />
              <select className="field-react" name="gender" value={profile.gender} onChange={onChange} required>
                <option value="">성별</option>
                <option value="여성">여성</option>
                <option value="남성">남성</option>
                <option value="기타">기타</option>
                <option value="미입력">선택 안 함</option>
              </select>
            </div>
            <div className="row-2">
              <input className="field-react" name="heightCm" placeholder="키(cm)" type="number" min="1" value={profile.heightCm} onChange={onChange} required />
              <input className="field-react" name="weightKg" placeholder="몸무게(kg)" type="number" min="1" value={profile.weightKg} onChange={onChange} required />
            </div>
            <button className="btn-react primary" type="button" disabled={!canContinueBasic} onClick={() => setStep(1)}>
              다음
            </button>
          </div>
          </>
        ) : null}

        {step === 1 ? (
          <>

          <div className="profile-pain-panel">
            <div className="diag-body-wrap profile-body-picker">
              <svg viewBox="0 0 220 420" className="diag-skeleton" aria-hidden="true">
                <defs>
                  <radialGradient id="profileDiagAura" cx="50%" cy="42%" r="58%">
                    <stop offset="0%" stopColor="rgba(105, 181, 238, 0.2)" />
                    <stop offset="100%" stopColor="rgba(105, 181, 238, 0)" />
                  </radialGradient>
                </defs>
                <ellipse cx="110" cy="196" rx="84" ry="168" fill="url(#profileDiagAura)" />
                <g className="diag-skeleton-lines">
                  <line x1="110" y1="70" x2="110" y2="155" />
                  <line x1="110" y1="90" x2="75" y2="165" />
                  <line x1="110" y1="90" x2="145" y2="165" />
                  <line x1="110" y1="155" x2="110" y2="320" />
                  <line x1="95" y1="190" x2="95" y2="356" />
                  <line x1="125" y1="190" x2="125" y2="356" />
                  <circle cx="110" cy="52" r="25" />
                </g>
              </svg>

              {BODY_PARTS.map((part) => {
                const active = selectedPart === part.id;
                return (
                  <button
                    key={part.id}
                    className={[
                      "diag-hotspot",
                      `diag-hotspot-${part.id}`,
                      active ? "active" : "",
                    ].filter(Boolean).join(" ")}
                    style={{ left: `${part.x}%`, top: `${part.y}%` }}
                    onClick={() => {
                      setSelectedPart(part.id);
                      setRipplePart(part.id);
                      setRippleKey((prev) => prev + 1);
                    }}
                    aria-label={part.label}
                  >
                    {ripplePart === part.id ? <span key={`${part.id}-${rippleKey}`} className="diag-ripple" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="pain-slider-card profile-pain-card">
              <div className="pain-slider-value">
                <span>{painLevel}</span>
                <small>/ 10</small>
              </div>
              <input
                className="pain-slider"
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(event) => setPainLevel(Number(event.target.value))}
                aria-label="현재 통증의 정도"
              />
            </div>
          </div>

          <div className="profile-onboarding-actions">
            <button className="btn-react" type="button" onClick={() => setStep(0)}>이전</button>
            <button className="btn-react primary" type="button" disabled={!selectedPart} onClick={() => setStep(2)}>다음</button>
          </div>
          </>
        ) : null}

        {step === 2 ? (
          <>

          <div className="glass-react card-react profile-summary-card">
            <div><span>이름</span><strong>{profile.name}</strong></div>
            <div><span>기본 정보</span><strong>{profile.age}세 · {profile.gender}</strong></div>
            <div><span>신체 정보</span><strong>{profile.heightCm}cm · {profile.weightKg}kg</strong></div>
            <div><span>관리 부위</span><strong>{selectedPartLabel}</strong></div>
            <div><span>통증 강도</span><strong>{painLevel}/10</strong></div>
          </div>

          <div className="profile-onboarding-actions">
            <button className="btn-react" type="button" onClick={() => setStep(1)}>이전</button>
            <button className="btn-react primary" type="button" onClick={saveAndStart} disabled={saving}>
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </div>
          </>
        ) : null}
      </div>

      <div className="profile-stepper" aria-label="사용자 정보 입력 단계">
        {[0, 1, 2].map((item) => (
          <span key={item} className={item === step ? "active" : item < step ? "done" : ""} />
        ))}
      </div>
    </SequentialScreen>
  );
}
