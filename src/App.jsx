import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import ProfileSetupPage from "./features/userProfile/ProfileSetupPage";
import HomePage from "./pages/HomePage";
import ExercisePage from "./pages/ExercisePage";
import GuidePage from "./pages/GuidePage";
import ReplayPage from "./pages/ReplayPage";
import DiagnosisPage from "./pages/DiagnosisPage";
import LivePage from "./pages/LivePage";
import ResultPage from "./pages/ResultPage";
import RecordsPage from "./pages/RecordsPage";
import MyPage from "./pages/MyPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
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
