import { useEffect, useRef, useState } from 'react'

const DEFAULT_VIDEO_CONSTRAINTS = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

function getCameraErrorMessage(error) {
  if (error.name === 'NotAllowedError') {
    return '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
  }

  if (error.name === 'NotFoundError') {
    return '사용 가능한 카메라를 찾을 수 없습니다.'
  }

  return '카메라를 연결하는 중 문제가 발생했습니다.'
}

export function useCameraStream(videoRef, options = {}) {
  const {
    video = DEFAULT_VIDEO_CONSTRAINTS,
    audio = false,
    getErrorMessage,
  } = options
  const streamRef = useRef(null)
  const [cameraStatus, setCameraStatus] = useState('loading')
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('error')
        setCameraError('이 브라우저에서는 카메라 기능을 사용할 수 없습니다.')
        return
      }

      try {
        setCameraStatus('loading')

        const stream = await navigator.mediaDevices.getUserMedia({
          video,
          audio,
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setCameraStatus('ready')
      } catch (error) {
        if (!isMounted) return

        setCameraStatus('error')
        setCameraError(getErrorMessage?.(error) ?? getCameraErrorMessage(error))
      }
    }

    startCamera()

    return () => {
      isMounted = false

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [audio, getErrorMessage, video, videoRef])

  return { cameraStatus, cameraError, stream: streamRef.current }
}
