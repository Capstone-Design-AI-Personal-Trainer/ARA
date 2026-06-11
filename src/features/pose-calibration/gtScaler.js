import { computeBodyMetrics } from "./bodyMetrics";

const FIT_SCALE = 1.0;
const MIN_SCALE = 0.55;
const MAX_SCALE = 1.45;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function normalizeVector(dx, dy) {
  const len = Math.hypot(dx, dy);
  if (!len) return null;
  return { x: dx / len, y: dy / len };
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

function movePoint(frame, index, x, y) {
  const point = frame[index];
  if (!point) return null;
  const delta = { x: x - point.x, y: y - point.y };
  frame[index] = { ...point, x, y };
  return delta;
}

function shiftPoints(frame, indices, delta) {
  if (!delta) return;
  indices.forEach((index) => {
    const point = frame[index];
    if (!point) return;
    frame[index] = { ...point, x: point.x + delta.x, y: point.y + delta.y };
  });
}

// Place a left/right landmark pair on `center`, keeping the GT pair direction
// but forcing the user's measured width.
function retargetPair(frame, leftIndex, rightIndex, center, width) {
  const left = frame[leftIndex];
  const right = frame[rightIndex];
  if (!left || !right || !width) return { leftDelta: null, rightDelta: null };

  const axis = normalizeVector(right.x - left.x, right.y - left.y) || { x: -1, y: 0 };
  return {
    leftDelta: movePoint(frame, leftIndex, center.x - axis.x * width / 2, center.y - axis.y * width / 2),
    rightDelta: movePoint(frame, rightIndex, center.x + axis.x * width / 2, center.y + axis.y * width / 2),
  };
}

// Keep the GT segment direction but force the user's measured segment length.
function retargetSegment(frame, fromIndex, toIndex, targetLen) {
  const from = frame[fromIndex];
  const to = frame[toIndex];
  if (!from || !to || !targetLen) return null;

  const dir = normalizeVector(to.x - from.x, to.y - from.y);
  if (!dir) return null;
  return movePoint(frame, toIndex, from.x + dir.x * targetLen, from.y + dir.y * targetLen);
}

const ARM_SEGMENTS = [[11, 13], [13, 15], [12, 14], [14, 16]];

function segmentLen2D(frame, fromIndex, toIndex) {
  const from = frame?.[fromIndex];
  const to = frame?.[toIndex];
  if (!from || !to) return null;
  return Math.hypot(to.x - from.x, to.y - from.y);
}

// Longest 2D length of each arm segment across the whole GT clip — the frame
// where the limb is flattest against the camera plane. Used as the reference
// for per-frame foreshortening.
export function computeGtSegmentMax(frames) {
  if (!Array.isArray(frames) || !frames.length) return null;

  const result = {};
  ARM_SEGMENTS.forEach(([fromIndex, toIndex]) => {
    let max = 0;
    frames.forEach((frame) => {
      const len = segmentLen2D(frame, fromIndex, toIndex);
      if (len != null && len > max) max = len;
    });
    if (max > 0) result[`${fromIndex}-${toIndex}`] = max;
  });
  return result;
}

// Re-pose the uniformly scaled GT frame onto the user's measured proportions:
// GT supplies joint directions, the scan calibration supplies segment lengths.
// Arm segments always use the full measured length, so the overlay arm starts
// at the user's size instead of growing as the GT arm flattens out.
export function retargetFrameToUserMetrics(frame, userMetrics) {
  if (!Array.isArray(frame) || !userMetrics) return frame;

  const result = frame.map((point) => (point ? { ...point } : point));
  const leftShoulder = result[11];
  const rightShoulder = result[12];
  const leftHip = result[23];
  const rightHip = result[24];
  if (!leftShoulder || !rightShoulder) return result;

  const shoulderCenter = midpoint(leftShoulder, rightShoulder);
  retargetPair(result, 11, 12, shoulderCenter, userMetrics.shoulderWidth);

  if (leftHip && rightHip && userMetrics.torsoLen) {
    const gtHipCenter = midpoint(leftHip, rightHip);
    const torsoDir = normalizeVector(
      gtHipCenter.x - shoulderCenter.x,
      gtHipCenter.y - shoulderCenter.y
    ) || { x: 0, y: 1 };
    const hipCenter = {
      x: shoulderCenter.x + torsoDir.x * userMetrics.torsoLen,
      y: shoulderCenter.y + torsoDir.y * userMetrics.torsoLen,
    };
    const { leftDelta, rightDelta } = retargetPair(
      result,
      23,
      24,
      hipCenter,
      userMetrics.hipWidth
    );
    shiftPoints(result, [25, 27, 29, 31], leftDelta);
    shiftPoints(result, [26, 28, 30, 32], rightDelta);
  }

  retargetSegment(result, 11, 13, userMetrics.upperArmLen);
  retargetSegment(result, 12, 14, userMetrics.upperArmLen);
  shiftPoints(result, [17, 19, 21], retargetSegment(result, 13, 15, userMetrics.forearmLen));
  shiftPoints(result, [18, 20, 22], retargetSegment(result, 14, 16, userMetrics.forearmLen));

  return result;
}

export function applyCalibrationToGtFrame(gtFrame, calibration) {
  const userMetrics = calibration?.userMetrics;
  if (!userMetrics || !Array.isArray(gtFrame)) return gtFrame;

  const gtMetrics = calibration?.gtMetrics || computeBodyMetrics(gtFrame, 0.2);
  if (!gtMetrics) return gtFrame;

  const scale = computeScaleFromMetrics(userMetrics, gtMetrics);
  const gtAnchor = calibration?.gtAnchor || gtMetrics.shoulderCenter || gtMetrics.center;
  const userAnchor = calibration?.overlayCenter || userMetrics.shoulderCenter || userMetrics.center;
  const scaled = transformGtFrame(gtFrame, gtAnchor, userAnchor, scale);
  return retargetFrameToUserMetrics(scaled, userMetrics);
}
