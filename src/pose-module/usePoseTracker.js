import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { clearPoseCanvas, drawPose, KEY_JOINT_INDEXES } from './drawPose'

const DEFAULT_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const DEFAULT_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'

async function createPoseLandmarker(vision, options) {
  const modelOptions = {
    runningMode: 'VIDEO',
    numPoses: options.numPoses ?? 1,
    minPoseDetectionConfidence: options.minPoseDetectionConfidence ?? 0.5,
    minPosePresenceConfidence: options.minPosePresenceConfidence ?? 0.5,
    minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
  }

  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: options.modelAssetPath ?? DEFAULT_MODEL_PATH,
        delegate: options.delegate ?? 'GPU',
      },
      ...modelOptions,
    })
  } catch (error) {
    if (options.delegate === 'CPU') throw error

    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: options.modelAssetPath ?? DEFAULT_MODEL_PATH,
        delegate: 'CPU',
      },
      ...modelOptions,
    })
  }
}

function countVisibleJoints(landmarks, minVisibility) {
  const total = landmarks.filter((landmark) => (landmark.visibility ?? 1) >= minVisibility).length
  const key = landmarks.filter(
    (landmark, index) =>
      KEY_JOINT_INDEXES.has(index) && (landmark.visibility ?? 1) >= minVisibility
  ).length

  return { key, total }
}

export function usePoseTracker({
  videoRef,
  canvasRef,
  enabled = true,
  draw = true,
  mirrored = true,
  minVisibility = 0.45,
  targetFps = 30,
  wasmPath = DEFAULT_WASM_PATH,
  modelAssetPath = DEFAULT_MODEL_PATH,
  delegate = 'GPU',
  numPoses = 1,
  minPoseDetectionConfidence = 0.5,
  minPosePresenceConfidence = 0.5,
  minTrackingConfidence = 0.5,
  onPose,
  onError,
}) {
  const poseLandmarkerRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const lastPoseStatusUpdateRef = useRef(0)
  const lastDetectionTimeRef = useRef(0)
  const onPoseRef = useRef(onPose)
  const onErrorRef = useRef(onError)
  const [poseStatus, setPoseStatus] = useState('idle')
  const [landmarks, setLandmarks] = useState([])
  const [detectedJointCounts, setDetectedJointCounts] = useState({
    key: 0,
    total: 0,
  })

  useEffect(() => {
    onPoseRef.current = onPose
  }, [onPose])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!enabled) {
      setPoseStatus('idle')
      return undefined
    }

    let isMounted = true

    async function initializePoseLandmarker() {
      try {
        setPoseStatus('loading')

        const vision = await FilesetResolver.forVisionTasks(wasmPath)
        const poseLandmarker = await createPoseLandmarker(vision, {
          modelAssetPath,
          delegate,
          numPoses,
          minPoseDetectionConfidence,
          minPosePresenceConfidence,
          minTrackingConfidence,
        })

        if (!isMounted) {
          poseLandmarker.close()
          return
        }

        poseLandmarkerRef.current = poseLandmarker
        setPoseStatus('detecting')

        function detectPose() {
          const video = videoRef.current
          const canvas = canvasRef?.current
          const landmarker = poseLandmarkerRef.current

          if (!video || !landmarker) {
            animationFrameRef.current = requestAnimationFrame(detectPose)
            return
          }

          const now = performance.now()
          const minFrameGap = targetFps > 0 ? 1000 / targetFps : 0
          const shouldAnalyze = now - lastDetectionTimeRef.current >= minFrameGap

          if (shouldAnalyze && video.videoWidth > 0 && video.videoHeight > 0) {
            lastDetectionTimeRef.current = now

            if (canvas) {
              const nextWidth = canvas.clientWidth
              const nextHeight = canvas.clientHeight

              if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth
                canvas.height = nextHeight
              }
            }

            if (lastVideoTimeRef.current !== video.currentTime) {
              lastVideoTimeRef.current = video.currentTime
              const result = landmarker.detectForVideo(video, now)
              const nextLandmarks = result.landmarks?.[0] ?? []
              const counts = countVisibleJoints(nextLandmarks, minVisibility)

              if (draw && canvas) {
                drawPose(canvas, nextLandmarks, {
                  width: video.videoWidth,
                  height: video.videoHeight,
                }, {
                  mirrored,
                  minVisibility,
                })
              }

              onPoseRef.current?.({
                landmarks: nextLandmarks,
                worldLandmarks: result.worldLandmarks?.[0] ?? [],
                rawResult: result,
                counts,
                timestamp: now,
              })

              const shouldUpdateState = now - lastPoseStatusUpdateRef.current > 300
              if (shouldUpdateState) {
                lastPoseStatusUpdateRef.current = now
                setLandmarks(nextLandmarks)
                setDetectedJointCounts(counts)
                setPoseStatus(counts.total > 0 ? 'detecting' : 'no-pose')
              }
            }
          }

          animationFrameRef.current = requestAnimationFrame(detectPose)
        }

        detectPose()
      } catch (error) {
        console.error(error)
        onErrorRef.current?.(error)
        if (isMounted) setPoseStatus('error')
      }
    }

    initializePoseLandmarker()

    return () => {
      isMounted = false

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close()
        poseLandmarkerRef.current = null
      }

      clearPoseCanvas(canvasRef?.current)
    }
  }, [
    canvasRef,
    delegate,
    draw,
    enabled,
    minPoseDetectionConfidence,
    minPosePresenceConfidence,
    minTrackingConfidence,
    mirrored,
    minVisibility,
    modelAssetPath,
    numPoses,
    targetFps,
    videoRef,
    wasmPath,
  ])

  return { poseStatus, landmarks, detectedJointCounts }
}
