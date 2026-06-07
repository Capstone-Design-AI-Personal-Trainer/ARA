import { computeBodyMetrics } from "./bodyMetrics";

const FIT_SCALE = 0.9;
const MIN_SCALE = 0.55;
const MAX_SCALE = 1.45;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeScaleFromMetrics(userMetrics, gtMetrics) {
  if (!userMetrics || !gtMetrics) return { sx: 1, sy: 1 };

  const torsoRatio = gtMetrics.torsoLen > 0 ? userMetrics.torsoLen / gtMetrics.torsoLen : 1;
  const shoulderRatio = gtMetrics.shoulderWidth > 0
    ? userMetrics.shoulderWidth / gtMetrics.shoulderWidth
    : 1;
  const hipRatio = gtMetrics.hipWidth > 0 ? userMetrics.hipWidth / gtMetrics.hipWidth : 1;
  const baseScale = userMetrics.inferredFromUpperBodyOnly
    ? shoulderRatio
    : torsoRatio * 0.35 + shoulderRatio * 0.5 + hipRatio * 0.15;
  const uniformScale = clamp(baseScale * FIT_SCALE, MIN_SCALE, MAX_SCALE);

  return { sx: uniformScale, sy: uniformScale };
}

export function transformGtFrame(gtFrame, gtCenter, userCenter, scale) {
  if (!Array.isArray(gtFrame) || !gtCenter || !userCenter || !scale) return gtFrame;

  return gtFrame.map((point) => {
    if (!point) return point;
    return {
      ...point,
      x: userCenter.x + (point.x - gtCenter.x) * scale.sx,
      y: userCenter.y + (point.y - gtCenter.y) * scale.sy,
    };
  });
}

export function applyCalibrationToGtFrame(gtFrame, calibration) {
  const userMetrics = calibration?.userMetrics;
  if (!userMetrics || !Array.isArray(gtFrame)) return gtFrame;

  const gtMetrics = computeBodyMetrics(gtFrame, 0.2);
  if (!gtMetrics) return gtFrame;

  const scale = computeScaleFromMetrics(userMetrics, gtMetrics);
  const gtAnchor = gtMetrics.shoulderCenter || gtMetrics.center;
  const userAnchor = calibration?.overlayCenter || userMetrics.shoulderCenter || userMetrics.center;
  return transformGtFrame(gtFrame, gtAnchor, userAnchor, scale);
}
