# Pose Module

React 프로젝트에서 MediaPipe 자세 추출 기능만 옮겨 쓰기 위한 모듈입니다.

이 폴더는 현재 앱 UI와 분리된 복사용 모듈입니다. 외부 React 프로젝트에서 UI를 새로 만들고, 환자 웹캠 영상에서 관절 좌표만 추출할 때 사용합니다.

## 설치

외부 React 프로젝트에서 아래 패키지가 필요합니다.

```bash
npm install @mediapipe/tasks-vision
```

## 복사할 파일

이 폴더 전체를 외부 프로젝트의 `src/pose-module` 같은 위치로 복사합니다. 현재 저장소에서는 찾기 쉽게 프로젝트 최상단에 두었습니다.

```text
pose-module/
  accuracy-module/
  drawPose.js
  index.js
  package.json
  README.md
  useCameraStream.js
  usePoseTracker.js
```

## 기본 사용법

```jsx
import { useRef } from 'react'
import { useCameraStream, usePoseTracker } from './pose-module'

export default function PoseView() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const { cameraStatus, cameraError } = useCameraStream(videoRef)
  const { poseStatus, detectedJointCounts } = usePoseTracker({
    videoRef,
    canvasRef,
    enabled: cameraStatus === 'ready',
    onPose: ({ landmarks, worldLandmarks, counts }) => {
      // landmarks: MediaPipe 33개 2D 관절 좌표
      // worldLandmarks: 3D world 좌표
      // counts: 감지된 주요 관절/전체 관절 수
    },
  })

  return (
    <div style={{ position: 'relative', width: 640, aspectRatio: '16 / 9' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {cameraStatus === 'error' && <p>{cameraError}</p>}
      <p>{poseStatus}: {detectedJointCounts.total}/33</p>
    </div>
  )
}
```

## 옵션

`usePoseTracker`에서 자주 바꿀 옵션입니다.

```js
usePoseTracker({
  videoRef,
  canvasRef,
  enabled: true,
  draw: true,
  mirrored: true,
  minVisibility: 0.45,
  targetFps: 30,
  onPose: (result) => {},
  onError: (error) => {},
})
```

## 주의사항

- 카메라는 `localhost` 또는 HTTPS 환경에서만 안정적으로 동작합니다.
- 현재 기본 모델과 WASM은 외부 CDN에서 불러옵니다.
- 병원/기관 네트워크에서 Google Storage나 jsDelivr가 막히면 모델 로딩이 실패할 수 있습니다.
- 실제 서비스에서는 `.task` 모델 파일과 WASM 파일을 자체 서버나 public 폴더에 두고 `modelAssetPath`, `wasmPath` 옵션으로 경로를 넘기는 것을 권장합니다.
- 이 모듈은 관절 추출까지만 담당합니다. 정답 영상 비교, 각도 계산, 점수화, 피드백 문구는 별도 로직으로 분리하는 것이 좋습니다.
- 이 폴더를 `frontend/src` 밖에서 현재 Vite 앱이 직접 import하도록 연결하면 빌드 설정 문제가 생길 수 있습니다. 외부 프로젝트에 붙일 때는 해당 프로젝트의 `src/pose-module` 안으로 복사해서 사용하는 것을 권장합니다.

## 어깨 재활 Accuracy 계산

`accuracy-module`은 어깨 충돌 증후군 재활 운동에서 한쪽 팔의 정확도를 계산합니다.

```js
import { calcShoulderRehabAccuracy } from './pose-module'

const result = calcShoulderRehabAccuracy({
  side: 'left',
  userLandmarks, // MediaPipe 33개 landmark
  gtLandmarks, // 같은 프레임의 GT 33개 landmark
  suitArmRegion, // GT 우주복 팔 허용 영역
})

console.log(result.accuracy)
console.log(result.parts)
```

기본 계산식은 아래 세 점수의 가중 평균입니다.

```text
accuracy =
  팔이 GT 우주복 팔 영역 안에 들어온 정도 40%
+ 사용자 팔 중심선이 GT 어깨-팔꿈치-손목 기준선과 가까운 정도 35%
+ 사용자 어깨/팔꿈치 각도가 GT와 가까운 정도 25%
```

`suitArmRegion`은 polygon 또는 capsule 형태를 받을 수 있습니다. 아직 별도 우주복 영역 데이터가 없다면 `gtLandmarks`의 어깨-팔꿈치-손목 기준선으로 임시 capsule 허용 영역을 자동 생성합니다.
