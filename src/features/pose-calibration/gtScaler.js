import { computeBodyMetrics } from "./bodyMetrics";

export function computeScaleFromMetrics(userMetrics, gtMetrics) {
  if (!userMetrics || !gtMetrics) return { sx: 1, sy: 1 };

  const torsoRatio = gtMetrics.torsoLen > 0 ? userMetrics.torsoLen / gtMetrics.torsoLen : 1;
  const shoulderRatio = gtMetrics.shoulderWidth > 0
    ? userMetrics.shoulderWidth / gtMetrics.shoulderWidth
    : 1;
  const hipRatio = gtMetrics.hipWidth > 0 ? userMetrics.hipWidth / gtMetrics.hipWidth : 1;
  const uniformScale = torsoRatio * 0.5 + shoulderRatio * 0.3 + hipRatio * 0.2;

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
  const overlayCenter = calibration?.overlayCenter || { x: 0.5, y: 0.5 };
  return transformGtFrame(gtFrame, gtMetrics.center, overlayCenter, scale);
}
