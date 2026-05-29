# ARA - AI Personal Trainer

React + Vite 기반의 AI 재활/운동 코칭 웹앱입니다. `/live` 화면에서는 웹캠과 MediaPipe Pose Landmarker를 사용해 사용자의 관절 좌표를 실시간으로 추출하고, 자세 상태와 반복 횟수, 정확도를 화면에 표시합니다.

## 실행 전 필요 조건

- Node.js
- npm
- 카메라가 연결된 PC 또는 노트북
- Chrome, Edge, Safari 등 카메라 권한을 지원하는 브라우저
- 인터넷 연결

MediaPipe 모델 파일을 외부 CDN에서 불러오기 때문에 인터넷 연결이 필요합니다.

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

실행 후 터미널에 표시되는 주소로 접속합니다. 보통 아래 주소 중 하나입니다.

```text
http://localhost:5173/
http://127.0.0.1:5173/
```

## 빌드 확인

```bash
npm run build
```

빌드된 결과를 로컬에서 미리 보려면 아래 명령어를 사용합니다.

```bash
npm run preview
```

## 카메라 / MediaPipe 주의사항

- 카메라는 `localhost`, `127.0.0.1`, 또는 HTTPS 환경에서 정상 동작합니다.
- 브라우저에서 카메라 권한을 허용해야 합니다.
- `/live` 화면 진입 후 카메라 권한을 거부하면 자세 인식이 동작하지 않습니다.
- MediaPipe 모델은 Google Storage CDN에서 불러옵니다. 네트워크나 기관 보안 정책에 의해 CDN 접근이 차단되면 모델 로딩이 실패할 수 있습니다.
- 정확한 관절 인식을 위해 얼굴, 어깨, 골반, 팔꿈치, 손목, 무릎이 화면 안에 들어오도록 카메라 위치를 조정하는 것이 좋습니다.
- 복잡한 패턴의 옷, 어두운 조명, 팔이 몸통에 붙은 자세는 관절 인식 정확도를 낮출 수 있습니다.

## 주요 명령어

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 실행
npm run build    # 배포용 빌드
npm run preview  # 빌드 결과 미리보기
```

## Ground Truth Pose JSON 추출

YouTube 영상을 다운로드한 뒤 MediaPipe Pose로 프레임별 관절 좌표를 추출합니다. 기본 URL은 `https://www.youtube.com/watch?v=Lyhpfw_tP5c`입니다.

```bash
python3 -m venv .venv-pose
.venv-pose/bin/python -m pip install -r requirements-pose.txt
.venv-pose/bin/python scripts/extract_pose_gt.py
```

출력 위치:

```text
data/ground-truth/videos/       # 다운로드된 원본 영상
data/ground-truth/pose-json/    # 프레임별 MediaPipe 좌표 JSON
data/ground-truth/pose-csv/     # 프레임별 MediaPipe 좌표 CSV
data/ground-truth/metadata/     # 추출 조건과 영상 메타데이터
```

각 프레임의 landmark에는 MediaPipe 정규화 좌표 `x, y, z`, 픽셀 좌표 `x, y`, `visibility`가 함께 저장됩니다.

## 주요 폴더

```text
src/pages/LivePage.jsx  # 실시간 자세 교정 화면
src/pose-module/        # MediaPipe 카메라/포즈 추출 모듈
src/app-shell.css       # 앱 전체 UI 스타일
```
