import React from "react";

export default function RecordingControl({
  isSupported = true,
  isRecording = false,
  onStart,
  onStop,
}) {
  if (!isSupported) {
    return <p className="junyoung-recording-status">이 브라우저는 녹화를 지원하지 않습니다.</p>;
  }

  return (
    <button
      className={`junyoung-recording-button ${isRecording ? "recording" : ""}`}
      type="button"
      onClick={isRecording ? onStop : onStart}
    >
      {isRecording ? "녹화 종료" : "녹화 시작"}
    </button>
  );
}
