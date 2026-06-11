function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isVisible(point, minVisibility = 0.55) {
  return Boolean(point) && (point.visibility ?? 1) >= minVisibility;
}

function segmentLength(a, b, minVisibility) {
  if (!isVisible(a, minVisibility) || !isVisible(b, minVisibility)) return null;
  return distance(a, b);
}

function averageSides(left, right) {
  if (left != null && right != null) return (left + right) / 2;
  return left ?? right ?? null;
}

export function computeBodyMetrics(landmarks, minVisibility = 0.55) {
  const leftShoulder = landmarks?.[11];
  const rightShoulder = landmarks?.[12];
  const leftHip = landmarks?.[23];
  const rightHip = landmarks?.[24];

  if (
    !isVisible(leftShoulder, minVisibility)
    || !isVisible(rightShoulder, minVisibility)
  ) {
    return null;
  }

  const shoulderCenter = midpoint(leftShoulder, rightShoulder);
  const shouldersWidth = distance(leftShoulder, rightShoulder);
  const hasHips = isVisible(leftHip, minVisibility) && isVisible(rightHip, minVisibility);
  const hipCenter = hasHips
    ? midpoint(leftHip, rightHip)
    : {
      x: shoulderCenter.x,
      y: shoulderCenter.y + shouldersWidth * 1.1,
    };
  const hipWidth = hasHips ? distance(leftHip, rightHip) : shouldersWidth * 0.9;
  const torsoLen = hasHips ? distance(shoulderCenter, hipCenter) : shouldersWidth * 1.45;
  const upperArmLen = averageSides(
    segmentLength(leftShoulder, landmarks?.[13], minVisibility),
    segmentLength(rightShoulder, landmarks?.[14], minVisibility)
  );
  const forearmLen = averageSides(
    segmentLength(landmarks?.[13], landmarks?.[15], minVisibility),
    segmentLength(landmarks?.[14], landmarks?.[16], minVisibility)
  );

  return {
    shoulderWidth: shouldersWidth,
    shoulderCenter,
    hipWidth,
    torsoLen,
    upperArmLen,
    forearmLen,
    center: hipCenter,
    inferredFromUpperBodyOnly: !hasHips,
  };
}

export function averageBodyMetrics(samples) {
  if (!samples?.length) return null;

  const total = samples.reduce((acc, sample) => ({
    shoulderWidth: acc.shoulderWidth + sample.shoulderWidth,
    hipWidth: acc.hipWidth + sample.hipWidth,
    torsoLen: acc.torsoLen + sample.torsoLen,
    shoulderCenterX: acc.shoulderCenterX + sample.shoulderCenter.x,
    shoulderCenterY: acc.shoulderCenterY + sample.shoulderCenter.y,
    centerX: acc.centerX + sample.center.x,
    centerY: acc.centerY + sample.center.y,
  }), {
    shoulderWidth: 0,
    hipWidth: 0,
    torsoLen: 0,
    shoulderCenterX: 0,
    shoulderCenterY: 0,
    centerX: 0,
    centerY: 0,
  });

  const count = samples.length;
  return {
    shoulderWidth: total.shoulderWidth / count,
    shoulderCenter: {
      x: total.shoulderCenterX / count,
      y: total.shoulderCenterY / count,
    },
    hipWidth: total.hipWidth / count,
    torsoLen: total.torsoLen / count,
    upperArmLen: averageDefined(samples, "upperArmLen"),
    forearmLen: averageDefined(samples, "forearmLen"),
    center: {
      x: total.centerX / count,
      y: total.centerY / count,
    },
  };
}

function averageDefined(samples, key) {
  const values = samples.map((sample) => sample[key]).filter((value) => value != null);
  if (!values.length) return null;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}
