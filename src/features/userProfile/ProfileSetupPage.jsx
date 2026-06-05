import React from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../../components/SequentialScreen";
import { buildInitialUserProfile, saveUserProfile } from "./userProfileStore";

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(() => buildInitialUserProfile());

  React.useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    saveUserProfile(profile);
    navigate("/home", { replace: true });
  };

  return (
    <SequentialScreen className="screen-react profile-setup-screen">
      <header className="hero-react">
        <h1>사용자 정보</h1>
        <p>마이페이지와 운동 기록에 사용할 기본 정보를 입력하세요</p>
      </header>

      <form className="glass-react card-react stack" onSubmit={onSubmit}>
        <input
          className="field-react"
          name="name"
          placeholder="이름"
          value={profile.name}
          onChange={onChange}
          required
        />
        <div className="row-2">
          <input
            className="field-react"
            name="age"
            placeholder="나이"
            type="number"
            min="1"
            value={profile.age}
            onChange={onChange}
          />
          <select className="field-react" name="gender" value={profile.gender} onChange={onChange}>
            <option value="">성별</option>
            <option value="여성">여성</option>
            <option value="남성">남성</option>
            <option value="기타">기타</option>
            <option value="미입력">선택 안 함</option>
          </select>
        </div>
        <div className="row-2">
          <input
            className="field-react"
            name="heightCm"
            placeholder="키(cm)"
            type="number"
            min="1"
            value={profile.heightCm}
            onChange={onChange}
            required
          />
          <input
            className="field-react"
            name="weightKg"
            placeholder="몸무게(kg)"
            type="number"
            min="1"
            value={profile.weightKg}
            onChange={onChange}
            required
          />
        </div>
        <input
          className="field-react"
          name="targetAreas"
          placeholder="관리 부위 예: 허리, 어깨"
          value={profile.targetAreas}
          onChange={onChange}
          required
        />
        <textarea
          className="field-react profile-textarea"
          name="bio"
          placeholder="통증, 재활 목적, 참고사항"
          value={profile.bio}
          onChange={onChange}
        />
        <button className="btn-react primary" type="submit">
          저장하고 시작하기
        </button>
      </form>
    </SequentialScreen>
  );
}
