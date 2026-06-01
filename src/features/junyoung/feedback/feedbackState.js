export const FEEDBACK_STATE = {
  success: {
    label: "성공",
    color: "#72e3a6",
    message: "자세가 안정적이에요.",
    reaction: "good",
  },
  normal: {
    label: "보통",
    color: "#ffce6a",
    message: "조금만 더 천천히 유지해요.",
    reaction: "focus",
  },
  correction: {
    label: "교정",
    color: "#ff6b6b",
    message: "어깨와 골반 정렬을 맞춰주세요.",
    reaction: "warning",
  },
};

export function getFeedbackState(state) {
  return FEEDBACK_STATE[state] ?? FEEDBACK_STATE.normal;
}
