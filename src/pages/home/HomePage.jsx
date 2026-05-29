import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RehabHomeScreen from "../../RehabHomeScreen";

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  return <RehabHomeScreen />;
}
