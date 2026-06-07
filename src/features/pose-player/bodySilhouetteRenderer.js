function drawEllipse(ctx, center, radiusX, radiusY) {
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawRoundedLimb(ctx, shape) {
  const { start, end, startRadius, endRadius, normal } = shape;
  const startAngle = Math.atan2(normal.y, normal.x);
  const endAngle = Math.atan2(-normal.y, -normal.x);

  ctx.beginPath();
  ctx.moveTo(start.x + normal.x * startRadius, start.y + normal.y * startRadius);
  ctx.lineTo(end.x + normal.x * endRadius, end.y + normal.y * endRadius);
  ctx.arc(end.x, end.y, endRadius, startAngle, endAngle);
  ctx.lineTo(start.x - normal.x * startRadius, start.y - normal.y * startRadius);
  ctx.arc(start.x, start.y, startRadius, endAngle, startAngle);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTorso(ctx, torso) {
  ctx.beginPath();
  ctx.moveTo(torso.topLeft.x, torso.topLeft.y);
  ctx.quadraticCurveTo(
    (torso.topLeft.x + torso.topRight.x) / 2,
    torso.topLeft.y - Math.abs(torso.topRight.x - torso.topLeft.x) * 0.08,
    torso.topRight.x,
    torso.topRight.y
  );
  ctx.lineTo(torso.bottomRight.x, torso.bottomRight.y);
  ctx.quadraticCurveTo(
    (torso.bottomRight.x + torso.bottomLeft.x) / 2,
    Math.max(torso.bottomRight.y, torso.bottomLeft.y) + Math.abs(torso.bottomRight.x - torso.bottomLeft.x) * 0.1,
    torso.bottomLeft.x,
    torso.bottomLeft.y
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawBodySilhouette(ctx, silhouette, style) {
  if (!ctx || !silhouette) return;

  ctx.fillStyle = style.fill;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  silhouette.shapes.forEach((shape) => {
    if (shape.type === "head") drawEllipse(ctx, shape.center, shape.radiusX, shape.radiusY);
    if (shape.type === "torso") drawTorso(ctx, shape);
    if (shape.type === "limb") drawRoundedLimb(ctx, shape);
  });
}
