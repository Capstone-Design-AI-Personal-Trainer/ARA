import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import HomePage from "./pages/home/HomePage";
import ExercisePage from "./pages/exercise/ExercisePage";
import GuidePage from "./pages/exercise/GuidePage";
import ReplayPage from "./pages/workout/ReplayPage";
import DiagnosisPage from "./pages/workout/DiagnosisPage";
import LivePage from "./pages/workout/LivePage";
import ResultPage from "./pages/workout/ResultPage";
import RecordsPage from "./pages/records/RecordsPage";
import MyPage from "./pages/user/MyPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/exercise" element={<ExercisePage />} />
        <Route path="/exercise/:id" element={<GuidePage />} />
        <Route path="/guide/:id" element={<GuidePage />} />
        <Route path="/diagnosis" element={<DiagnosisPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/replay/:id" element={<ReplayPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
