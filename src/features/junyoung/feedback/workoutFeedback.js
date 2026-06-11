import { getAccuracyState } from "./poseScore";
import { getFeedbackState } from "./feedbackState";

export function buildWorkoutFeedback(score) {
  const state = getAccuracyState(score);
  const feedback = getFeedbackState(state);

  return {
    state,
    ...feedback,
  };
}
