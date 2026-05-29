export function createMedicalShareText(report = {}) {
  return [
    "ARA 운동 리포트",
    "",
    `운동명: ${report.exerciseName || "-"}`,
    `운동 시간: ${report.durationSec ?? 0}초`,
    `반복 횟수: ${report.reps ?? 0}/${report.targetReps ?? 0}`,
    `평균 정확도: ${report.accuracy ?? 0}%`,
    `상태: ${report.stateLabel || "-"}`,
    "",
    "주요 요약",
    report.summary || "-",
    "",
    "교정 포인트",
    ...(report.correctionPoints?.length ? report.correctionPoints : ["-"]),
    "",
    "통증/특이사항:",
    "",
    "담당 의료진 메모:",
  ].join("\n");
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
