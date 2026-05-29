import React from "react";
import { getFeedbackState } from "../feedback/feedbackState";

export default function WorkoutFeedbackEffect({ state = "normal", message }) {
  const feedback = getFeedbackState(state);

  return (
    <div
      className={`junyoung-feedback-effect junyoung-feedback-effect-${state}`}
      style={{ borderColor: feedback.color }}
    >
      <span style={{ backgroundColor: feedback.color }} />
      <p>{message || feedback.message}</p>
    </div>
  );
}
