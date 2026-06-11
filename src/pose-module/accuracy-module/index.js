const LANDMARKS = {
  left: {
    shoulder: 11,
    elbow: 13,
    wrist: 15,
  },
  right: {
    shoulder: 12,
    elbow: 14,
    wrist: 16,
  },
}

const DEFAULT_WEIGHTS = {
  containment: 0.4,
  centerline: 0.35,
  angle: 0.25,
}

const DEFAULT_JOINT_WEIGHTS = {
  shoulder: 0.1,
  elbow: 0.45,
  wrist: 0.45,
}

const DEFAULT_CONTAINMENT_JOINT_WEIGHTS = {
  shoulder: 0.2,
  elbow: 0.35,
  wrist: 0.45,
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function toPoint(point) {
  if (!point) return null
  if (Array.isArray(point)) return { x: point[0], y: point[1] }
  return { x: point.x, y: point.y }
}

function distance(a, b) {
  if (!a || !b) return Infinity
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function distanceToSegment(point, start, end) {
  if (!point || !start || !end) return Infinity

  const dx = end.x - start.x
  const dy = end.y - start.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return distance(point, start)

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq, 0, 1)
  return distance(point, {
    x: start.x + t * dx,
    y: start.y + t * dy,
  })
}

function pointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = toPoint(polygon[i])
    const pj = toPoint(polygon[j])
    if (!pi || !pj) continue

    const intersects =
      pi.y > point.y !== pj.y > point.y
      && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    if (intersects) inside = !inside
  }

  return inside
}

function distanceToPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length === 0) return Infinity
  if (pointInPolygon(point, polygon)) return 0

  let minDistance = Infinity
  for (let i = 0; i < polygon.length; i += 1) {
    const start = toPoint(polygon[i])
    const end = toPoint(polygon[(i + 1) % polygon.length])
    minDistance = Math.min(minDistance, distanceToSegment(point, start, end))
  }
  return minDistance
}

function distanceToCapsule(point, capsule) {
  const start = toPoint(capsule.start)
  const end = toPoint(capsule.end)
  const radius = capsule.radius ?? 0
  return Math.max(0, distanceToSegment(point, start, end) - radius)
}

function normalizeRegion(region) {
  if (!region) return []
  if (Array.isArray(region)) return [{ polygon: region }]
  if (region.polygon || region.start || region.polygons || region.capsules) return [region]
  return []
}

function distanceToRegion(point, region) {
  const regions = normalizeRegion(region)
  let minDistance = Infinity

  regions.forEach((item) => {
    if (item.polygon) {
      minDistance = Math.min(minDistance, distanceToPolygon(point, item.polygon))
    }

    if (Array.isArray(item.polygons)) {
      item.polygons.forEach((polygon) => {
        minDistance = Math.min(minDistance, distanceToPolygon(point, polygon))
      })
    }

    if (item.start && item.end) {
      minDistance = Math.min(minDistance, distanceToCapsule(point, item))
    }

    if (Array.isArray(item.capsules)) {
      item.capsules.forEach((capsule) => {
        minDistance = Math.min(minDistance, distanceToCapsule(point, capsule))
      })
    }
  })

  return minDistance
}

function scoreDistance(distanceValue, goodDistance, badDistance) {
  if (!Number.isFinite(distanceValue)) return 0
  if (distanceValue <= goodDistance) return 100
  if (distanceValue >= badDistance) return 0
  return clamp(((badDistance - distanceValue) / (badDistance - goodDistance)) * 100)
}

function angleDeg(a, b, c) {
  if (!a || !b || !c) return null

  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const mag1 = Math.hypot(abx, aby)
  const mag2 = Math.hypot(cbx, cby)
  if (mag1 < 1e-6 || mag2 < 1e-6) return null

  const cos = clamp((abx * cbx + aby * cby) / (mag1 * mag2), -1, 1)
  return (Math.acos(cos) * 180) / Math.PI
}

function vectorAngleDeg(start, end) {
  if (!start || !end) return null
  return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI
}

function angleDiffDeg(a, b) {
  if (a == null || b == null) return null
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

function getArm(landmarks, side) {
  const indexes = LANDMARKS[side]
  if (!indexes || !Array.isArray(landmarks)) return null

  return {
    shoulder: toPoint(landmarks[indexes.shoulder]),
    elbow: toPoint(landmarks[indexes.elbow]),
    wrist: toPoint(landmarks[indexes.wrist]),
  }
}

function getJointRegion(suitArmRegion, jointName) {
  if (!suitArmRegion) return null
  if (Array.isArray(suitArmRegion) || suitArmRegion.polygon || suitArmRegion.start) {
    return suitArmRegion
  }

  if (jointName === 'shoulder') {
    return suitArmRegion.shoulder || suitArmRegion.upperArm || suitArmRegion.fullArm || suitArmRegion.arm
  }

  if (jointName === 'elbow') {
    return suitArmRegion.elbow || suitArmRegion.upperArm || suitArmRegion.forearm || suitArmRegion.fullArm || suitArmRegion.arm
  }

  return suitArmRegion.wrist || suitArmRegion.forearm || suitArmRegion.fullArm || suitArmRegion.arm
}

function weightedAverage(parts, weights) {
  let sum = 0
  let total = 0

  Object.entries(parts).forEach(([key, value]) => {
    const weight = weights[key] ?? 0
    if (!Number.isFinite(value) || weight <= 0) return
    sum += value * weight
    total += weight
  })

  return total > 0 ? sum / total : 0
}

export function buildArmSuitRegionFromGt(gtArm, config = {}) {
  if (!gtArm?.shoulder || !gtArm?.elbow || !gtArm?.wrist) return null

  const upperArmRadius = config.upperArmRadius ?? 0.055
  const forearmRadius = config.forearmRadius ?? 0.05
  const jointRadius = config.jointRadius ?? 0.065

  return {
    upperArm: {
      capsules: [
        { start: gtArm.shoulder, end: gtArm.elbow, radius: upperArmRadius },
        { start: gtArm.shoulder, end: gtArm.shoulder, radius: jointRadius },
        { start: gtArm.elbow, end: gtArm.elbow, radius: jointRadius },
      ],
    },
    forearm: {
      capsules: [
        { start: gtArm.elbow, end: gtArm.wrist, radius: forearmRadius },
        { start: gtArm.elbow, end: gtArm.elbow, radius: jointRadius },
        { start: gtArm.wrist, end: gtArm.wrist, radius: jointRadius },
      ],
    },
  }
}

export function calcArmContainmentScore(userArm, suitArmRegion, config = {}) {
  const maxOutsideDistance = config.maxOutsideDistance ?? 0.08
  const weights = {
    ...DEFAULT_CONTAINMENT_JOINT_WEIGHTS,
    ...(config.jointWeights || {}),
  }

  const jointScores = {}
  ;['shoulder', 'elbow', 'wrist'].forEach((jointName) => {
    const point = userArm?.[jointName]
    const region = getJointRegion(suitArmRegion, jointName)
    const outsideDistance = distanceToRegion(point, region)
    jointScores[jointName] = scoreDistance(outsideDistance, 0, maxOutsideDistance)
  })

  return {
    score: Math.round(weightedAverage(jointScores, weights)),
    jointScores,
  }
}

export function calcArmCenterlineScore(userArm, gtArm, config = {}) {
  const goodDistance = config.goodDistance ?? 0.025
  const badDistance = config.badDistance ?? 0.18
  const weights = {
    ...DEFAULT_JOINT_WEIGHTS,
    ...(config.jointWeights || {}),
  }

  const jointScores = {
    shoulder: scoreDistance(distance(userArm?.shoulder, gtArm?.shoulder), goodDistance, badDistance),
    elbow: scoreDistance(distance(userArm?.elbow, gtArm?.elbow), goodDistance, badDistance),
    wrist: scoreDistance(distance(userArm?.wrist, gtArm?.wrist), goodDistance, badDistance),
  }

  return {
    score: Math.round(weightedAverage(jointScores, weights)),
    jointScores,
  }
}

export function calcArmAngleScore(userArm, gtArm, config = {}) {
  const shoulderBadDiffDeg = config.shoulderBadDiffDeg ?? 45
  const elbowBadDiffDeg = config.elbowBadDiffDeg ?? 35
  const shoulderWeight = config.shoulderWeight ?? 0.6
  const elbowWeight = config.elbowWeight ?? 0.4

  const userShoulderAngle = vectorAngleDeg(userArm?.shoulder, userArm?.elbow)
  const gtShoulderAngle = vectorAngleDeg(gtArm?.shoulder, gtArm?.elbow)
  const shoulderDiff = angleDiffDeg(userShoulderAngle, gtShoulderAngle)

  const userElbowAngle = angleDeg(userArm?.shoulder, userArm?.elbow, userArm?.wrist)
  const gtElbowAngle = angleDeg(gtArm?.shoulder, gtArm?.elbow, gtArm?.wrist)
  const elbowDiff = angleDiffDeg(userElbowAngle, gtElbowAngle)

  const shoulderScore = shoulderDiff == null
    ? 0
    : scoreDistance(shoulderDiff, 0, shoulderBadDiffDeg)
  const elbowScore = elbowDiff == null
    ? 0
    : scoreDistance(elbowDiff, 0, elbowBadDiffDeg)

  return {
    score: Math.round((shoulderScore * shoulderWeight + elbowScore * elbowWeight) / (shoulderWeight + elbowWeight)),
    angleDiffs: {
      shoulder: shoulderDiff,
      elbow: elbowDiff,
    },
    angleScores: {
      shoulder: shoulderScore,
      elbow: elbowScore,
    },
  }
}

export function calcShoulderRehabAccuracy({
  userLandmarks,
  gtLandmarks,
  side = 'left',
  suitArmRegion,
  weights = DEFAULT_WEIGHTS,
  containment = {},
  centerline = {},
  angle = {},
} = {}) {
  const userArm = getArm(userLandmarks, side)
  const gtArm = getArm(gtLandmarks, side)

  if (!userArm || !gtArm) {
    return {
      accuracy: 0,
      side,
      reason: 'missing-arm-landmarks',
      parts: null,
    }
  }

  const region = suitArmRegion || buildArmSuitRegionFromGt(gtArm)
  const containmentResult = calcArmContainmentScore(userArm, region, containment)
  const centerlineResult = calcArmCenterlineScore(userArm, gtArm, centerline)
  const angleResult = calcArmAngleScore(userArm, gtArm, angle)

  const normalizedWeights = {
    ...DEFAULT_WEIGHTS,
    ...weights,
  }
  const accuracy = Math.round(
    containmentResult.score * normalizedWeights.containment
    + centerlineResult.score * normalizedWeights.centerline
    + angleResult.score * normalizedWeights.angle
  )

  return {
    accuracy: clamp(accuracy),
    side,
    userArm,
    gtArm,
    parts: {
      containment: containmentResult,
      centerline: centerlineResult,
      angle: angleResult,
    },
  }
}

export { LANDMARKS as ARM_LANDMARKS }
