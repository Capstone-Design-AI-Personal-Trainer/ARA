function visible(point, minVisibility) {
  return point && (point.visibility ?? 1) >= minVisibility;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function drawCapsule(ctx, from, to, radius) {
  if (radius <= 0) return;
  ctx.lineWidth = radius * 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

// Fill the polygon, then stroke it with round joins: the result is the polygon
// uniformly inflated outward by `radius` with rounded corners.
function drawInflatedPolygon(ctx, points, radius) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
  if (radius > 0) {
    ctx.lineWidth = radius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

// Draws the whole suit silhouette as one filled union.
// `pad` is a signed pixel offset added to every part radius, so an outer pass
// (pad = 0) and an inner pass (pad = -strokeWidth) stay parallel everywhere
// and leave a ring of constant thickness.
function drawSuitShape(ctx, frame, style, pad = 0) {
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

  // Torso: follow the real shoulder/hip landmarks, inflated by the suit bulk.
  const torsoRadius = shoulderWidth * 0.2 + pad;
  drawInflatedPolygon(
    ctx,
    [leftShoulder, rightShoulder, rightHip, leftHip],
    Math.max(torsoRadius, 0.5)
  );

  // Head + neck connector so the helmet always merges into the torso.
  const earDistance = visible(leftEar, minVisibility) && visible(rightEar, minVisibility)
    ? distance(leftEar, rightEar)
    : shoulderWidth * 0.52;
  const baseHeadRadiusX = Math.max(earDistance * 0.66, shoulderWidth * 0.3);
  const headRadiusX = baseHeadRadiusX + pad;
  const headRadiusY = baseHeadRadiusX * 1.18 + pad;
  const headCenter = {
    x: visible(nose, minVisibility) ? nose.x : neck.x,
    y: neck.y - (baseHeadRadiusX * 1.18) * 0.95,
  };
  if (headRadiusX > 1 && headRadiusY > 1) {
    ctx.beginPath();
    ctx.ellipse(headCenter.x, headCenter.y, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCapsule(ctx, neck, headCenter, shoulderWidth * 0.14 + pad);
  }

  // Arms: roomy capsules along the actual shoulder-elbow-wrist landmarks.
  const upperArmRadius = shoulderWidth * 0.19 + pad;
  const forearmRadius = shoulderWidth * 0.16 + pad;
  [
    [leftShoulder, leftElbow, upperArmRadius],
    [leftElbow, leftWrist, forearmRadius],
    [rightShoulder, rightElbow, upperArmRadius],
    [rightElbow, rightWrist, forearmRadius],
  ].forEach(([start, end, radius]) => {
    if (visible(start, minVisibility) && visible(end, minVisibility)) {
      drawCapsule(ctx, start, end, radius);
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

  // Outer silhouette, then punch out the same shape shrunk by strokeWidth so
  // only a constant-width outline ring remains (interior stays transparent).
  bufferCtx.fillStyle = style.stroke;
  bufferCtx.strokeStyle = style.stroke;
  const drewShape = drawSuitShape(bufferCtx, frame, style, 0);
  if (!drewShape) return;

  bufferCtx.globalCompositeOperation = "destination-out";
  bufferCtx.fillStyle = "#000";
  bufferCtx.strokeStyle = "#000";
  drawSuitShape(bufferCtx, frame, style, -strokeWidth);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 5;
  ctx.drawImage(buffer, 0, 0);
  ctx.restore();
}
