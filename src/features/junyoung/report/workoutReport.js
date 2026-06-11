import { getAccuracyState } from "../feedback/poseScore";
import { getFeedbackState } from "../feedback/feedbackState";

export function buildWorkoutReport(session = {}) {
  const accuracy = session.accuracy ?? session.score ?? 0;
  const state = getAccuracyState(accuracy);
  const feedback = getFeedbackState(state);

  return {
    exerciseName: session.exerciseName || "운동",
    durationSec: session.durationSec ?? 0,
    reps: session.reps ?? 0,
    targetReps: session.targetReps ?? 0,
    accuracy,
    state,
    stateLabel: feedback.label,
    summary: feedback.message,
    goodPoints: state === "success" ? ["자세가 안정적으로 유지되었습니다."] : [],
    correctionPoints: state === "correction" ? [feedback.message] : [],
    nextTips: ["카메라에 얼굴, 어깨, 골반이 모두 들어오도록 거리를 조정하세요."],
    recordingUrl: session.recordingUrl || "",
  };
}
