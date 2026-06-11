export function getAccuracyState(score) {
  if (score >= 80) return "success";
  if (score >= 60) return "normal";
  return "correction";
}

export function clampAccuracy(score) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getAverageAccuracy(samples = []) {
  if (!samples.length) return 0;

  const total = samples.reduce((sum, sample) => sum + clampAccuracy(sample), 0);
  return clampAccuracy(total / samples.length);
}
