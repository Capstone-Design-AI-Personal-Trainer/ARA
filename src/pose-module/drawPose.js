export const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 29],
  [29, 31],
  [28, 30],
  [30, 32],
]

export const KEY_JOINT_INDEXES = new Set([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28])

const JOINT_LABELS = {
  11: 'L shoulder',
  12: 'R shoulder',
  13: 'L elbow',
  14: 'R elbow',
  15: 'L wrist',
  16: 'R wrist',
}

function getContainRect(canvasWidth, canvasHeight, videoWidth, videoHeight) {
  if (!videoWidth || !videoHeight) {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
  }

  const canvasRatio = canvasWidth / canvasHeight
  const videoRatio = videoWidth / videoHeight

  if (videoRatio > canvasRatio) {
    const width = canvasWidth
    const height = canvasWidth / videoRatio
    return {
      x: 0,
      y: (canvasHeight - height) / 2,
      width,
      height,
    }
  }

  const height = canvasHeight
  const width = canvasHeight * videoRatio
  return {
    x: (canvasWidth - width) / 2,
    y: 0,
    width,
    height,
  }
}

function getPoint(landmark, rect, options = {}) {
  const x = options.mirrored ? 1 - landmark.x : landmark.x

  return {
    x: rect.x + x * rect.width,
    y: rect.y + landmark.y * rect.height,
  }
}

export function clearPoseCanvas(canvas) {
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  context.clearRect(0, 0, canvas.width, canvas.height)
}

export function drawPose(canvas, landmarks, videoSize, options = {}) {
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return

  context.clearRect(0, 0, canvas.width, canvas.height)

  if (!landmarks?.length) return

  const minVisibility = options.minVisibility ?? 0.45
  const rect = getContainRect(
    canvas.width,
    canvas.height,
    videoSize?.width,
    videoSize?.height
  )

  context.lineWidth = 4
  context.lineCap = 'round'

  landmarks.forEach((landmark, index) => {
    if (KEY_JOINT_INDEXES.has(index)) return
    if ((landmark.visibility ?? 1) < minVisibility) return

    const point = getPoint(landmark, rect, options)

    context.beginPath()
    context.arc(point.x, point.y, 3, 0, Math.PI * 2)
    context.fillStyle = 'rgba(255, 255, 255, 0.55)'
    context.fill()
  })

  POSE_CONNECTIONS.forEach(([startIndex, endIndex]) => {
    const start = landmarks[startIndex]
    const end = landmarks[endIndex]

    if (!start || !end) return
    if ((start.visibility ?? 1) < minVisibility || (end.visibility ?? 1) < minVisibility) return

    const startPoint = getPoint(start, rect, options)
    const endPoint = getPoint(end, rect, options)

    context.beginPath()
    context.moveTo(startPoint.x, startPoint.y)
    context.lineTo(endPoint.x, endPoint.y)
    context.strokeStyle = options.connectionColor ?? 'rgba(114, 227, 166, 0.9)'
    context.stroke()
  })

  landmarks.forEach((landmark, index) => {
    if (!KEY_JOINT_INDEXES.has(index)) return
    if ((landmark.visibility ?? 1) < minVisibility) return

    const point = getPoint(landmark, rect, options)

    context.beginPath()
    context.arc(point.x, point.y, 6, 0, Math.PI * 2)
    context.fillStyle = options.keyJointFillColor ?? '#ffffff'
    context.fill()
    context.lineWidth = 3
    context.strokeStyle = options.keyJointStrokeColor ?? '#72e3a6'
    context.stroke()

    if (options.showLabels !== false && JOINT_LABELS[index]) {
      context.font = '600 12px Pretendard, sans-serif'
      context.fillStyle = 'rgba(9, 11, 15, 0.82)'
      context.fillRect(point.x + 10, point.y - 18, 68, 18)
      context.fillStyle = '#ffffff'
      context.fillText(JOINT_LABELS[index], point.x + 14, point.y - 5)
    }
  })
}
