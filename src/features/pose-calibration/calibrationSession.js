import { averageBodyMetrics, computeBodyMetrics } from "./bodyMetrics";

export function createCalibrationSession() {
  return {
    samples: [],
  };
}

export function pushCalibrationSample(session, landmarks) {
  if (!session) return;
  const metrics = computeBodyMetrics(landmarks);
  if (!metrics) return;
  session.samples.push(metrics);
}

export function finalizeCalibrationSession(session) {
  const userMetrics = averageBodyMetrics(session?.samples || []);
  if (!userMetrics) return null;

  return {
    sampleCount: session.samples.length,
    userMetrics,
  };
}
