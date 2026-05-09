import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

export default function ResultPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const score = state?.score ?? 87;

  return (
    <SequentialScreen className="screen-react">
      <div className="glass-react card-react">
        <h2>운동 결과</h2>
        <div className="score-react">{score}점</div>
        <p className="muted-react">어깨 정렬과 허리 안정성을 조금 더 보완해보세요.</p>
      </div>
      <div className="row-2">
        <button className="btn-react" onClick={() => navigate("/live")}>다시 하기</button>
        <button
          className="btn-react primary"
          onClick={() =>
            navigate("/mypage", {
              state: {
                pendingSession: {
                  score,
                  memo: "오늘 운동 결과",
                  createdAt: new Date().toISOString(),
                },
              },
            })
          }
        >
          마이페이지에서 저장
        </button>
      </div>
    </SequentialScreen>
  );
}


