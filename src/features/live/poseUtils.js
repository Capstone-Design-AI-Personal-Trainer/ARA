const SKELETON_LINKS = [
  [11, 13], [13, 15], [12, 14], [14, 16], [11, 12],
  [11, 23], [12, 24],
];
const DISPLAY_LANDMARKS = new Set([0, 1, 4, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]);

function getCoverRect(canvasWidth, canvasHeight, videoWidth, videoHeight) {
  if (!videoWidth || !videoHeight) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }

  const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
  const width = videoWidth * scale;
  const height = videoHeight * scale;

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}

function getCoverPoint(point, rect) {
  return {
    x: rect.x + (1 - point.x) * rect.width,
    y: rect.y + point.y * rect.height,
  };
}

export function drawSkeleton(ctx, pose, canvasWidth, canvasHeight, videoWidthOrOptions, videoHeight) {
  const options = typeof videoWidthOrOptions === "object" && videoWidthOrOptions !== null
    ? videoWidthOrOptions
    : {};
  const {
    lineWidth = 2,
    lineColor = "rgba(111,207,205,0.9)",
    pointColor = "rgba(163,230,229,0.95)",
    pointRadius = 3.8,
    minVisibility = 0.45,
  } = options;
  const links = [
    ...SKELETON_LINKS,
  ];
  const rect = getCoverRect(
    canvasWidth,
    canvasHeight,
    typeof videoWidthOrOptions === "number" ? videoWidthOrOptions : undefined,
    videoHeight
  );

  ctx.lineWidth = lineWidth;
  links.forEach(([aIdx, bIdx]) => {
    const a = pose[aIdx];
    const b = pose[bIdx];
    if (!a || !b || a.visibility < minVisibility || b.visibility < minVisibility) return;
    const start = getCoverPoint(a, rect);
    const end = getCoverPoint(b, rect);
    ctx.strokeStyle = lineColor;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });
  pose.forEach((p, index) => {
    if (!DISPLAY_LANDMARKS.has(index)) return;
    if (!p || p.visibility < minVisibility) return;
    const point = getCoverPoint(p, rect);
    ctx.fillStyle = pointColor;
    ctx.beginPath();
    ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function hasVisible(...points) {
  return points.every((p) => p && p.visibility > 0.55);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function safeVisibility(p) {
  return p?.visibility ?? 1;
}

export function computeBodyMetrics(lm) {
  const lShoulder = lm[11];
  const rShoulder = lm[12];
  const lHip = lm[23];
  const rHip = lm[24];
  const lAnkle = lm[27];
  const rAnkle = lm[28];

  if (!hasVisible(lShoulder, rShoulder, lHip, rHip, lAnkle, rAnkle)) return null;

  const shoulderCenter = midpoint(lShoulder, rShoulder);
  const hipCenter = midpoint(lHip, rHip);

  return {
    shoulderWidth: distance(lShoulder, rShoulder),
    hipWidth: distance(lHip, rHip),
    torsoLen: distance(shoulderCenter, hipCenter),
    center: hipCenter,
  };
}

export function computeScaleFromMetrics(userMetrics, gtMetrics) {
  if (!userMetrics || !gtMetrics) return { sx: 1, sy: 1, s: 1 };

  const torsoRatio = gtMetrics.torsoLen > 0 ? userMetrics.torsoLen / gtMetrics.torsoLen : 1;
  const shoulderRatio =
    gtMetrics.shoulderWidth > 0 ? userMetrics.shoulderWidth / gtMetrics.shoulderWidth : 1;
  const uniformScale = torsoRatio * 0.6 + shoulderRatio * 0.4;
  return { sx: uniformScale, sy: uniformScale, s: uniformScale };
}

export function transformGtFrame(gtFrame, gtCenter, userCenter, scale) {
  if (!Array.isArray(gtFrame) || !gtCenter || !userCenter || !scale) return [];
  const sx = scale.sx ?? scale.s ?? 1;
  const sy = scale.sy ?? scale.s ?? 1;

  return gtFrame.map((p) => {
    if (!p) return p;
    return {
      ...p,
      x: userCenter.x + (p.x - gtCenter.x) * sx,
      y: userCenter.y + (p.y - gtCenter.y) * sy,
    };
  });
}

export function calcPoseError(userLm, gtLm, minVisibility = 0.45) {
  if (!Array.isArray(userLm) || !Array.isArray(gtLm) || userLm.length === 0 || gtLm.length === 0) {
    return { meanDistance: Infinity, comparedCount: 0 };
  }

  let sum = 0;
  let count = 0;
  const compareCount = Math.min(userLm.length, gtLm.length);
  for (let i = 0; i < compareCount; i += 1) {
    const a = userLm[i];
    const b = gtLm[i];
    if (!a || !b) continue;
    if (safeVisibility(a) < minVisibility || safeVisibility(b) < minVisibility) continue;
    sum += distance(a, b);
    count += 1;
  }

  return {
    meanDistance: count > 0 ? sum / count : Infinity,
    comparedCount: count,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function angleDeg(a, b, c) {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const mag1 = Math.hypot(abx, aby);
  const mag2 = Math.hypot(cbx, cby);
  if (mag1 < 1e-6 || mag2 < 1e-6) return null;
  const cos = clamp((abx * cbx + aby * cby) / (mag1 * mag2), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

export function calcPoseScore(userLm, gtLm, options = {}) {
  const minVisibility = options.minVisibility ?? 0.45;
  const distanceBad = options.distanceBad ?? 0.22;
  const distanceGood = options.distanceGood ?? 0.025;
  const weightedJoints = options.weightedJoints ?? [
    [11, 1.2], [12, 1.2], [13, 1.5], [14, 1.5], [15, 1.8], [16, 1.8], [23, 1.0], [24, 1.0],
  ];

  let weightedSum = 0;
  let weightTotal = 0;
  for (const [idx, weight] of weightedJoints) {
    const u = userLm[idx];
    const g = gtLm[idx];
    if (!u || !g) continue;
    if (safeVisibility(u) < minVisibility || safeVisibility(g) < minVisibility) continue;
    const d = distance(u, g);
    const jointScore = clamp((distanceBad - d) / (distanceBad - distanceGood), 0, 1) * 100;
    weightedSum += jointScore * weight;
    weightTotal += weight;
  }
  const distanceScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

  const angleTriples = [
    [11, 13, 15], [12, 14, 16], [23, 11, 13], [24, 12, 14],
  ];
  let angleSum = 0;
  let angleCount = 0;
  for (const [a, b, c] of angleTriples) {
    const ua = userLm[a];
    const ub = userLm[b];
    const uc = userLm[c];
    const ga = gtLm[a];
    const gb = gtLm[b];
    const gc = gtLm[c];
    if (!ua || !ub || !uc || !ga || !gb || !gc) continue;
    if (
      safeVisibility(ua) < minVisibility
      || safeVisibility(ub) < minVisibility
      || safeVisibility(uc) < minVisibility
      || safeVisibility(ga) < minVisibility
      || safeVisibility(gb) < minVisibility
      || safeVisibility(gc) < minVisibility
    ) continue;

    const uAngle = angleDeg(ua, ub, uc);
    const gAngle = angleDeg(ga, gb, gc);
    if (uAngle == null || gAngle == null) continue;
    const diff = Math.abs(uAngle - gAngle);
    const angleScore = clamp((35 - diff) / 35, 0, 1) * 100;
    angleSum += angleScore;
    angleCount += 1;
  }
  const angleScore = angleCount > 0 ? angleSum / angleCount : distanceScore;

  const baseScore = 0.7 * distanceScore + 0.3 * angleScore;
  return clamp(Math.round(baseScore), 0, 100);
}

export function calcDelayPenalty(delaySec, config = {}) {
  const freeDelaySec = config.freeDelaySec ?? 0.2;
  const maxDelaySec = config.maxDelaySec ?? 0.6;
  const maxPenalty = config.maxPenalty ?? 12;
  const hardPenalty = config.hardPenalty ?? 12;
  const d = Math.abs(delaySec);
  if (d <= freeDelaySec) return 0;
  if (d <= maxDelaySec) {
    return ((d - freeDelaySec) / (maxDelaySec - freeDelaySec)) * maxPenalty;
  }
  return maxPenalty + hardPenalty;
}

export function calcFrameScore(poseScore, delaySec, visibilityRatio, config = {}) {
  const delayPenalty = calcDelayPenalty(delaySec, config);
  const visibilityPenalty = visibilityRatio >= 0.55 ? 0 : (0.55 - visibilityRatio) * 25;
  return clamp(Math.round(poseScore - delayPenalty - visibilityPenalty), 0, 100);
}

export function findBestGtInWindow({
  elapsedSec,
  gtFrames,
  gtFps,
  windowSec = 0.45,
  userLm,
  gtMetrics,
  userMetrics,
  scale,
  minVisibility = 0.45,
}) {
  if (!gtFrames?.length || !gtMetrics || !userMetrics || !scale) return null;

  const centerIndex = Math.floor(elapsedSec * gtFps);
  const halfWindowFrames = Math.max(1, Math.round(windowSec * gtFps));
  let best = null;

  for (let delta = -halfWindowFrames; delta <= halfWindowFrames; delta += 1) {
    const idx = ((centerIndex + delta) % gtFrames.length + gtFrames.length) % gtFrames.length;
    const gtRaw = gtFrames[idx];
    if (!gtRaw) continue;

    const adjustedGt = transformGtFrame(gtRaw, gtMetrics.center, userMetrics.center, scale);
    const poseScore = calcPoseScore(userLm, adjustedGt, { minVisibility });
    const visibilityRatio = adjustedGt.reduce((acc, p) => acc + (safeVisibility(p) >= minVisibility ? 1 : 0), 0) / adjustedGt.length;
    const delaySec = delta / gtFps;
    const frameScore = calcFrameScore(poseScore, delaySec, visibilityRatio, {
      freeDelaySec: 0.2,
      maxDelaySec: windowSec,
      maxPenalty: 12,
      hardPenalty: 12,
    });

    if (!best || frameScore > best.frameScore) {
      best = {
        gtIndex: idx,
        adjustedGt,
        poseScore,
        delaySec,
        visibilityRatio,
        frameScore,
      };
    }
  }
  return best;
}

export function buildPoseSignals(lm, calibration = null) {
  const nose = lm[0];
  const leftEyeInner = lm[1];
  const rightEyeInner = lm[4];
  const leftEar = lm[7];
  const rightEar = lm[8];
  const lShoulder = lm[11];
  const rShoulder = lm[12];
  const lHip = lm[23];
  const rHip = lm[24];
  const lWrist = lm[15];
  const rWrist = lm[16];

  const faceOk = (
    hasVisible(nose, leftEyeInner, rightEyeInner)
    || hasVisible(nose, leftEar, rightEar)
  );
  const shoulderOk = hasVisible(lShoulder, rShoulder) && Math.abs(lShoulder.y - rShoulder.y) < 0.08;
  const pelvisOk = hasVisible(lHip, rHip) && Math.abs(lHip.y - rHip.y) < 0.08;

  const shoulderWidth = hasVisible(lShoulder, rShoulder) ? distance(lShoulder, rShoulder) : 0.18;
  const wristSpread = hasVisible(lWrist, rWrist) ? distance(lWrist, rWrist) : 0;
  const calibratedShoulderWidth = calibration?.shoulderWidth || shoulderWidth;
  const shoulderBase = Math.max(shoulderWidth, calibratedShoulderWidth * 0.6);

  return {
    faceOk,
    shoulderOk,
    pelvisOk,
    allGood: faceOk && shoulderOk && pelvisOk,
    open: wristSpread > shoulderBase * 1.45,
    closed: wristSpread < shoulderBase * 1.15,
  };
}

export function calcCoachMessage({ allGood, open }) {
  if (!allGood) return "얼굴, 어깨, 골반이 화면 중앙에 오도록 맞춰주세요.";
  if (open) return "좋아요. 천천히 원위치로 돌아오세요.";
  return "천천히 양팔을 옆으로 벌려주세요.";
}
