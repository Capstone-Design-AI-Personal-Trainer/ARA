export function drawSkeleton(ctx, pose, w, h) {
  const links = [
    [11, 13], [13, 15], [12, 14], [14, 16], [11, 12],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28],
  ];
  ctx.lineWidth = 2;
  links.forEach(([aIdx, bIdx]) => {
    const a = pose[aIdx];
    const b = pose[bIdx];
    if (!a || !b || a.visibility < 0.45 || b.visibility < 0.45) return;
    ctx.strokeStyle = "rgba(111,207,205,0.9)";
    ctx.beginPath();
    ctx.moveTo((1 - a.x) * w, a.y * h);
    ctx.lineTo((1 - b.x) * w, b.y * h);
    ctx.stroke();
  });
  pose.forEach((p) => {
    if (!p || p.visibility < 0.45) return;
    ctx.fillStyle = "rgba(163,230,229,0.95)";
    ctx.beginPath();
    ctx.arc((1 - p.x) * w, p.y * h, 3.8, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function hasVisible(...points) {
  return points.every((p) => p && p.visibility > 0.55);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function buildPoseSignals(lm) {
  const nose = lm[0];
  const lShoulder = lm[11];
  const rShoulder = lm[12];
  const lHip = lm[23];
  const rHip = lm[24];
  const lAnkle = lm[27];
  const rAnkle = lm[28];
  const lWrist = lm[15];
  const rWrist = lm[16];

  const faceOk = hasVisible(nose);
  const shoulderOk = hasVisible(lShoulder, rShoulder) && Math.abs(lShoulder.y - rShoulder.y) < 0.08;
  const pelvisOk = hasVisible(lHip, rHip) && Math.abs(lHip.y - rHip.y) < 0.08;
  const feetOk = hasVisible(lAnkle, rAnkle) && lAnkle.y < 0.98 && rAnkle.y < 0.98;

  const shoulderWidth = hasVisible(lShoulder, rShoulder) ? distance(lShoulder, rShoulder) : 0.18;
  const wristSpread = hasVisible(lWrist, rWrist) ? distance(lWrist, rWrist) : 0;

  return {
    faceOk,
    shoulderOk,
    pelvisOk,
    feetOk,
    allGood: faceOk && shoulderOk && pelvisOk && feetOk,
    open: wristSpread > shoulderWidth * 1.45,
    closed: wristSpread < shoulderWidth * 1.15,
  };
}

export function calcPostureScore({ faceOk, shoulderOk, pelvisOk, feetOk }) {
  return Math.round((faceOk ? 25 : 10) + (shoulderOk ? 25 : 10) + (pelvisOk ? 25 : 10) + (feetOk ? 25 : 10));
}

export function calcCoachMessage({ allGood, open }) {
  if (!allGood) return "중립 정렬이 흐트러졌어요. 어깨와 골반을 맞춰주세요.";
  if (open) return "좋아요. 천천히 원위치로 돌아오세요.";
  return "천천히 양팔을 옆으로 벌려주세요.";
}

