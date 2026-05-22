import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

const BYPASS_LOGIN = ["true", "1", "yes", "on"].includes(
  String(import.meta.env.VITE_BYPASS_LOGIN || "")
    .trim()
    .toLowerCase()
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // OAuth2 로그인 성공 후 백엔드가 ?token=...&email=...&name=... 로 리다이렉트해줌
  useEffect(() => {
    if (BYPASS_LOGIN) {
      localStorage.setItem("token", "dev-bypass-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: "dev@local.test",
          name: "Dev User",
        })
      );
      navigate("/home");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const name = params.get("name");
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ email, name }));
      navigate("/home");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (BYPASS_LOGIN) {
      localStorage.setItem("token", "dev-bypass-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: formData.email || "dev@local.test",
          name: formData.name || "Dev User",
        })
      );
      navigate("/home");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };

      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // JWT 토큰 저장
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.email,
            name: data.name,
          })
        );

        navigate("/home");
      } else {
        setError(data.message || "오류가 발생했습니다.");
      }
    } catch (error) {
      setError("서버 연결에 실패했습니다.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth2Login = (provider) => {
    window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
  };

  return (
    <SequentialScreen className="screen-react">
      <header className="hero-react">
        <h1>Personal AI Trainer</h1>
        <p>오늘의 움직임이 회복을 만듭니다</p>
      </header>
      <div className="glass-react card-react">
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <button
            className={`btn-react ${isLogin ? "primary" : ""}`}
            onClick={() => setIsLogin(true)}
            style={{ marginRight: "10px" }}
          >
            로그인
          </button>
          <button className={`btn-react ${!isLogin ? "primary" : ""}`} onClick={() => setIsLogin(false)}>
            회원가입
          </button>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              className="field-react"
              placeholder="이름"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required={!isLogin}
            />
          )}
          <input
            className="field-react"
            placeholder="이메일"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            className="field-react"
            placeholder="비밀번호"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {error && <div style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</div>}

          <button className="btn-react primary" type="submit" disabled={loading}>
            {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ marginBottom: "10px", color: "#666" }}>또는</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="btn-react"
              onClick={() => handleOAuth2Login("kakao")}
              style={{ backgroundColor: "#fee500", color: "#000" }}
            >
              Kakao
            </button>
            <button
              className="btn-react"
              onClick={() => handleOAuth2Login("naver")}
              style={{ backgroundColor: "#03c75a", color: "white" }}
            >
              Naver
            </button>
          </div>
        </div>
      </div>
    </SequentialScreen>
  );
}
