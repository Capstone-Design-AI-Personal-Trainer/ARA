import React from "react";
import { useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";

function angle3(a, b, c) {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const abLen = Math.hypot(abx, aby);
  const cbLen = Math.hypot(cbx, cby);
  if (!abLen || !cbLen) return null;
  const cosine = Math.min(1, Math.max(-1, dot / (abLen * cbLen)));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

function gradeAngle(angle, target, tolerance) {
  if (angle === null) return { label: "--", score: 0, level: "danger" };
  const delta = Math.abs(target - angle);
  const score = Math.max(0, 100 - Math.round((delta / tolerance) * 40));
  if (delta < tolerance * 0.5) return { label: `${angle}°`, score, level: "good" };
  if (delta < tolerance) return { label: `${angle}°`, score, level: "warn" };
  return { label: `${angle}°`, score, level: "danger" };
}

function drawSkeleton(ctx, pose, w, h) {
  const links = [
    [11, 13], [13, 15], [12, 14], [14, 16], [11, 12],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28],
  ];
  ctx.lineWidth = 2;

  links.forEach(([aIdx, bIdx]) => {
    const a = pose[aIdx];
    const b = pose[bIdx];
    if (!a || !b || a.visibility < 0.4 || b.visibility < 0.4) return;
    ctx.strokeStyle = "rgba(31,181,178,0.92)";
    ctx.beginPath();
    ctx.moveTo((1 - a.x) * w, a.y * h);
    ctx.lineTo((1 - b.x) * w, b.y * h);
    ctx.stroke();
  });

  pose.forEach((p) => {
    if (!p || p.visibility < 0.4) return;
    ctx.fillStyle = "rgba(34,197,94,0.95)";
    ctx.beginPath();
    ctx.arc((1 - p.x) * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function badgeClass(level) {
  if (level === "good") return "badge-react good";
  if (level === "warn") return "badge-react warn";
  return "badge-react danger";
}

export default function LivePage() {
  const navigate = useNavigate();
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const poseRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const lastVideoTimeRef = React.useRef(-1);
  const scoreSamplesRef = React.useRef([]);

  const [status, setStatus] = React.useState("카메라 연결 준비 중...");
  const [feedback, setFeedback] = React.useState("자세를 인식 중입니다...");
  const [rep, setRep] = React.useState(0);
  const [knee, setKnee] = React.useState({ label: "무릎 --°", level: "danger" });
  const [hip, setHip] = React.useState({ label: "고관절 --°", level: "danger" });
  const [shoulder, setShoulder] = React.useState({ label: "어깨 --°", level: "danger" });

  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }, []);

  const stopSession = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const scoreFromSamples = React.useCallback(() => {
    const samples = scoreSamplesRef.current;
    if (!samples.length) return 80;
    const total = samples.reduce((sum, v) => sum + v, 0);
    return Math.max(50, Math.min(99, Math.round(total / samples.length)));
  }, []);

  const processFrame = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const pose = poseRef.current;
    if (!video || !canvas || !pose) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const result = pose.detectForVideo(video, now);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.landmarks && result.landmarks[0]) {
        const lm = result.landmarks[0];
        drawSkeleton(ctx, lm, canvas.width, canvas.height);
        setStatus("실시간 자세 분석 중");

        const leftKnee = angle3(lm[23], lm[25], lm[27]);
        const rightKnee = angle3(lm[24], lm[26], lm[28]);
        const kneeAvg = leftKnee && rightKnee ? Math.round((leftKnee + rightKnee) / 2) : leftKnee || rightKnee;

        const leftHip = angle3(lm[11], lm[23], lm[25]);
        const rightHip = angle3(lm[12], lm[24], lm[26]);
        const hipAvg = leftHip && rightHip ? Math.round((leftHip + rightHip) / 2) : leftHip || rightHip;

        const shoulderAngle = angle3(lm[13], lm[11], lm[23]);

        const kneeResult = gradeAngle(kneeAvg, 90, 15);
        const hipResult = gradeAngle(hipAvg, 80, 18);
        const shoulderResult = gradeAngle(shoulderAngle, 65, 15);

        setKnee({ label: `무릎 ${kneeResult.label}`, level: kneeResult.level });
        setHip({ label: `고관절 ${hipResult.label}`, level: hipResult.level });
        setShoulder({ label: `어깨 ${shoulderResult.label}`, level: shoulderResult.level });

        const avgScore = Math.round((kneeResult.score + hipResult.score + shoulderResult.score) / 3);
        scoreSamplesRef.current.push(avgScore);
        if (scoreSamplesRef.current.length > 160) scoreSamplesRef.current.shift();

        if (avgScore > 85) setFeedback("아주 좋아요. 현재 정렬을 유지하세요.");
        else if (avgScore > 65) setFeedback("좋아요. 허리와 어깨 정렬을 조금만 더 맞춰보세요.");
        else setFeedback("자세 보정이 필요해요. 천천히 범위를 줄여 수행해보세요.");

        setRep((prev) => {
          const next = prev + 1;
          return next;
        });
      } else {
        setStatus("신체를 화면 중앙에 맞춰주세요");
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function startSession() {
      try {
        scoreSamplesRef.current = [];
        setRep(0);
        setStatus("MediaPipe 모델 로딩 중...");

        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
        );

        poseRef.current = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!mounted) return;
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        resizeCanvas();

        setStatus("카메라 연결 완료");
        rafRef.current = requestAnimationFrame(processFrame);
      } catch (err) {
        setStatus("카메라/모델 연결 실패: HTTPS 환경과 권한을 확인해주세요.");
        setFeedback("권한 승인 후 다시 시도해주세요.");
        console.error(err);
      }
    }

    startSession();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      mounted = false;
      window.removeEventListener("resize", resizeCanvas);
      stopSession();
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, [processFrame, resizeCanvas, stopSession]);

  const repCount = Math.floor(rep / 12);

  return (
    <SequentialScreen className="screen-react">
      <h2>실시간 자세 교정</h2>
      <div className="camera-stage-react">
        <video ref={videoRef} className="camera-video-react" playsInline muted />
        <canvas ref={canvasRef} className="pose-canvas-react" />
        <div className="camera-status-react">{status}</div>
      </div>
      <div className="glass-react card-react">
        <p className="muted-react">{feedback}</p>
        <p className="muted-react">반복 {repCount}회</p>
        <div className="badge-row">
          <span className={badgeClass(knee.level)}>{knee.label}</span>
          <span className={badgeClass(hip.level)}>{hip.label}</span>
          <span className={badgeClass(shoulder.level)}>{shoulder.label}</span>
        </div>
        <button
          className="btn-react primary"
          onClick={() => {
            const score = scoreFromSamples();
            navigate("/result", { state: { score } });
          }}
        >
          세트 완료
        </button>
      </div>
    </SequentialScreen>
  );
}


