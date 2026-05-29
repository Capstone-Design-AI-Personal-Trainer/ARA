import React from "react";
import { getFeedbackState } from "../feedback/feedbackState";

export default function WorkoutReaction({ state = "normal" }) {
  const feedback = getFeedbackState(state);

  return (
    <div className={`junyoung-reaction junyoung-reaction-${state}`}>
      <p className="junyoung-reaction-label">{feedback.label}</p>
      <p className="junyoung-reaction-message">{feedback.message}</p>
    </div>
  );
}
