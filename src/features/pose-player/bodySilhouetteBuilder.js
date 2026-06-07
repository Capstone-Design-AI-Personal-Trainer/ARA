function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function perpendicular(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return normalize(-dy, dx);
}

function offsetPoint(point, normal, amount) {
  return {
    x: point.x + normal.x * amount,
    y: point.y + normal.y * amount,
  };
}

function visible(point, minVisibility) {
  return point && (point.visibility ?? 1) >= minVisibility;
}

function buildLimb(start, end, startRadius, endRadius) {
  return {
    type: "limb",
    start,
    end,
    startRadius,
    endRadius,
    normal: perpendicular(start, end),
  };
}

function buildTorso(leftShoulder, rightShoulder, leftHip, rightHip, shoulderWidth, hipWidth) {
  const shoulderNormal = perpendicular(leftShoulder, rightShoulder);
  const hipNormal = perpendicular(leftHip, rightHip);

  return {
    type: "torso",
    topLeft: offsetPoint(leftShoulder, shoulderNormal, shoulderWidth * 0.08),
    topRight: offsetPoint(rightShoulder, shoulderNormal, -shoulderWidth * 0.08),
    bottomRight: offsetPoint(rightHip, hipNormal, -hipWidth * 0.08),
    bottomLeft: offsetPoint(leftHip, hipNormal, hipWidth * 0.08),
  };
}

export function buildBodySilhouette(frame, style) {
  const minVisibility = style.minVisibility;
  const leftShoulder = frame[11];
  const rightShoulder = frame[12];
  const leftElbow = frame[13];
  const rightElbow = frame[14];
  const leftWrist = frame[15];
  const rightWrist = frame[16];
  const leftHip = frame[23];
  const rightHip = frame[24];
  const leftKnee = frame[25];
  const rightKnee = frame[26];
  const leftAnkle = frame[27];
  const rightAnkle = frame[28];
  const nose = frame[0];
  const leftEar = frame[7];
  const rightEar = frame[8];

  if (
    !visible(leftShoulder, minVisibility)
    || !visible(rightShoulder, minVisibility)
    || !visible(leftHip, minVisibility)
    || !visible(rightHip, minVisibility)
  ) {
    return null;
  }

  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const hipWidth = distance(leftHip, rightHip);
  const neck = midpoint(leftShoulder, rightShoulder);
  const earDistance = visible(leftEar, minVisibility) && visible(rightEar, minVisibility)
    ? distance(leftEar, rightEar)
    : shoulderWidth * 0.52;
  const headRadiusX = Math.max(earDistance * 0.62, shoulderWidth * style.headScale * 0.24);
  const headRadiusY = headRadiusX * 1.22;

  const shapes = [
    {
      type: "head",
      center: visible(nose, minVisibility)
        ? { x: nose.x, y: neck.y - headRadiusY * 0.92 }
        : { x: neck.x, y: neck.y - headRadiusY * 0.92 },
      radiusX: headRadiusX,
      radiusY: headRadiusY,
    },
    buildTorso(leftShoulder, rightShoulder, leftHip, rightHip, shoulderWidth, hipWidth),
  ];

  if (visible(leftShoulder, minVisibility) && visible(leftElbow, minVisibility)) {
    shapes.push(buildLimb(leftShoulder, leftElbow, shoulderWidth * style.upperArmScale, shoulderWidth * style.upperArmScale * 0.92));
  }
  if (visible(leftElbow, minVisibility) && visible(leftWrist, minVisibility)) {
    shapes.push(buildLimb(leftElbow, leftWrist, shoulderWidth * style.lowerArmScale, shoulderWidth * style.handScale));
  }
  if (visible(rightShoulder, minVisibility) && visible(rightElbow, minVisibility)) {
    shapes.push(buildLimb(rightShoulder, rightElbow, shoulderWidth * style.upperArmScale, shoulderWidth * style.upperArmScale * 0.92));
  }
  if (visible(rightElbow, minVisibility) && visible(rightWrist, minVisibility)) {
    shapes.push(buildLimb(rightElbow, rightWrist, shoulderWidth * style.lowerArmScale, shoulderWidth * style.handScale));
  }
  if (visible(leftHip, minVisibility) && visible(leftKnee, minVisibility)) {
    shapes.push(buildLimb(leftHip, leftKnee, hipWidth * style.thighScale, hipWidth * style.thighScale * 0.82));
  }
  if (visible(leftKnee, minVisibility) && visible(leftAnkle, minVisibility)) {
    shapes.push(buildLimb(leftKnee, leftAnkle, hipWidth * style.calfScale, hipWidth * style.footScale));
  }
  if (visible(rightHip, minVisibility) && visible(rightKnee, minVisibility)) {
    shapes.push(buildLimb(rightHip, rightKnee, hipWidth * style.thighScale, hipWidth * style.thighScale * 0.82));
  }
  if (visible(rightKnee, minVisibility) && visible(rightAnkle, minVisibility)) {
    shapes.push(buildLimb(rightKnee, rightAnkle, hipWidth * style.calfScale, hipWidth * style.footScale));
  }

  return { shapes };
}
