function visible(point, minVisibility) {
  return point && (point.visibility ?? 1) >= minVisibility;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function drawLimb(ctx, points, radius) {
  const visiblePoints = points.filter(Boolean);
  if (visiblePoints.length < 2) return;

  ctx.lineWidth = radius * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
  for (let index = 1; index < visiblePoints.length; index += 1) {
    ctx.lineTo(visiblePoints[index].x, visiblePoints[index].y);
  }
  ctx.stroke();
}

function drawTorso(ctx, leftShoulder, rightShoulder, leftHip, rightHip, inflate = 1) {
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const topPad = shoulderWidth * 0.1 * inflate;
  const sidePad = shoulderWidth * 0.2 * inflate;
  const lowerPad = shoulderWidth * 0.28 * inflate;
  const neck = midpoint(leftShoulder, rightShoulder);
  const torsoBottom = {
    x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
    y: Math.min(
      midpoint(leftHip, rightHip).y,
      midpoint(leftShoulder, rightShoulder).y + shoulderWidth * 0.82 * inflate
    ),
  };

  ctx.beginPath();
  ctx.moveTo(leftShoulder.x - sidePad, leftShoulder.y + topPad);
  ctx.quadraticCurveTo(neck.x, neck.y - shoulderWidth * 0.18 * inflate, rightShoulder.x + sidePad, rightShoulder.y + topPad);
  ctx.quadraticCurveTo(
    torsoBottom.x + shoulderWidth * 0.48 * inflate,
    (rightShoulder.y + torsoBottom.y) / 2,
    torsoBottom.x + lowerPad,
    torsoBottom.y
  );
  ctx.quadraticCurveTo(torsoBottom.x, torsoBottom.y + shoulderWidth * 0.08 * inflate, torsoBottom.x - lowerPad, torsoBottom.y);
  ctx.quadraticCurveTo(
    torsoBottom.x - shoulderWidth * 0.48 * inflate,
    (leftShoulder.y + torsoBottom.y) / 2,
    leftShoulder.x - sidePad,
    leftShoulder.y + topPad
  );
  ctx.closePath();
  ctx.fill();
}

function strokeTorsoOutline(ctx, leftShoulder, rightShoulder, leftHip, rightHip, style) {
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const topPad = shoulderWidth * 0.1;
  const sidePad = shoulderWidth * 0.2;
  const lowerPad = shoulderWidth * 0.28;
  const neck = midpoint(leftShoulder, rightShoulder);
  const torsoBottom = {
    x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
    y: Math.min(
      midpoint(leftHip, rightHip).y,
      midpoint(leftShoulder, rightShoulder).y + shoulderWidth * 0.82
    ),
  };

  ctx.save();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.strokeWidth ?? 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(leftShoulder.x - sidePad, leftShoulder.y + topPad);
  ctx.quadraticCurveTo(neck.x, neck.y - shoulderWidth * 0.18, rightShoulder.x + sidePad, rightShoulder.y + topPad);
  ctx.quadraticCurveTo(
    torsoBottom.x + shoulderWidth * 0.48,
    (rightShoulder.y + torsoBottom.y) / 2,
    torsoBottom.x + lowerPad,
    torsoBottom.y
  );
  ctx.quadraticCurveTo(torsoBottom.x, torsoBottom.y + shoulderWidth * 0.08, torsoBottom.x - lowerPad, torsoBottom.y);
  ctx.quadraticCurveTo(
    torsoBottom.x - shoulderWidth * 0.48,
    (leftShoulder.y + torsoBottom.y) / 2,
    leftShoulder.x - sidePad,
    leftShoulder.y + topPad
  );
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHead(ctx, headCenter, radiusX, radiusY) {
  ctx.beginPath();
  ctx.ellipse(headCenter.x, headCenter.y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSuitShape(ctx, frame, style, inset = 0) {
  const minVisibility = style.minVisibility ?? 0.35;
  const leftShoulder = frame[11];
  const rightShoulder = frame[12];
  const leftElbow = frame[13];
  const rightElbow = frame[14];
  const leftWrist = frame[15];
  const rightWrist = frame[16];
  const leftHip = frame[23];
  const rightHip = frame[24];
  const nose = frame[0];
  const leftEar = frame[7];
  const rightEar = frame[8];

  if (
    !visible(leftShoulder, minVisibility)
    || !visible(rightShoulder, minVisibility)
    || !visible(leftHip, minVisibility)
    || !visible(rightHip, minVisibility)
  ) {
    return false;
  }

  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const neck = midpoint(leftShoulder, rightShoulder);
  const earDistance = visible(leftEar, minVisibility) && visible(rightEar, minVisibility)
    ? distance(leftEar, rightEar)
    : shoulderWidth * 0.52;
  const headRadiusX = Math.max(earDistance * 0.66, shoulderWidth * 0.28) - inset;
  const headRadiusY = headRadiusX * 1.18;
  const headCenter = visible(nose, minVisibility)
    ? { x: nose.x, y: neck.y - headRadiusY * 0.82 }
    : { x: neck.x, y: neck.y - headRadiusY * 0.82 };

  if (headRadiusX > 1 && headRadiusY > 1) {
    drawHead(ctx, headCenter, headRadiusX, headRadiusY);
  }

  drawTorso(ctx, leftShoulder, rightShoulder, leftHip, rightHip, inset > 0 ? 0.72 : 1);

  const armRadius = Math.max(shoulderWidth * 0.17 - inset, 1);
  const forearmRadius = Math.max(shoulderWidth * 0.145 - inset, 1);

  [
    [[leftShoulder, leftElbow], armRadius],
    [[leftElbow, leftWrist], forearmRadius],
    [[rightShoulder, rightElbow], armRadius],
    [[rightElbow, rightWrist], forearmRadius],
  ].forEach(([points, radius]) => {
    const [start, end] = points;
    if (visible(start, minVisibility) && visible(end, minVisibility)) {
      drawLimb(ctx, points, radius);
    }
  });

  return true;
}

export function drawBodyOutline(ctx, frame, style) {
  const strokeWidth = style.strokeWidth ?? 5;
  const buffer = document.createElement("canvas");
  buffer.width = ctx.canvas.width;
  buffer.height = ctx.canvas.height;
  const bufferCtx = buffer.getContext("2d");
  if (!bufferCtx) return;

  bufferCtx.fillStyle = style.stroke;
  bufferCtx.strokeStyle = style.stroke;
  const drewShape = drawSuitShape(bufferCtx, frame, style, 0);
  if (!drewShape) return;

  bufferCtx.globalCompositeOperation = "destination-out";
  bufferCtx.fillStyle = "#000";
  bufferCtx.strokeStyle = "#000";
  drawSuitShape(bufferCtx, frame, style, strokeWidth);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 5;
  ctx.drawImage(buffer, 0, 0);
  if (visible(frame[11], style.minVisibility) && visible(frame[12], style.minVisibility)
    && visible(frame[23], style.minVisibility) && visible(frame[24], style.minVisibility)) {
    strokeTorsoOutline(ctx, frame[11], frame[12], frame[23], frame[24], style);
  }
  ctx.restore();
}
