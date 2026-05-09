import React from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

export default function LoginPage() {
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <SequentialScreen className="screen-react">
      <header className="hero-react">
        <h1>Personal AI Trainer</h1>
        <p>오늘의 움직임이 회복을 만듭니다</p>
      </header>
      <div className="glass-react card-react">
        <form className="stack" onSubmit={onSubmit}>
          <input className="field-react" placeholder="이메일" type="email" required />
          <input className="field-react" placeholder="비밀번호" type="password" required />
          <button className="btn-react primary" type="submit">시작하기</button>
        </form>
      </div>
    </SequentialScreen>
  );
}

