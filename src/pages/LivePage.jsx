import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SequentialScreen from "../components/SequentialScreen";
import "./LivePage.module.css";
import {
  buildPoseSignals,
  calcCoachMessage,
  calcPostureScore,
  drawSkeleton,
} from "../features/live/poseUtils";

const TARGET_REPS = 12;
const FORCE_SCAN_PASS = import.meta.env.VITE_FORCE_SCAN_PASS === "true";
const UI_UPDATE_MS = 120;

function ScanPanel({ countdown, checks }) {
  return (
    <div className="scan-stage-panel">
      <div className="live-count">{countdown}</div>
      <div className="scan-check-grid">
        <div className={`scan-chip ${checks.face ? "on" : ""}`}>얼굴 인식</div>
        <div className={`scan-chip ${checks.shoulder ? "on" : ""}`}>어깨 위치</div>
        <div className={`scan-chip ${checks.pelvis ? "on" : ""}`}>골반 정렬</div>
        <div className={`scan-chip ${checks.feet ? "on" : ""}`}>발 위치</div>
      </div>
    </div>
  );
}

function LivePanel({ coachMsg, rep, accuracy, paused, onTogglePause, onFinish }) {
  return (
    <div className="live-data-stack">
      <div className="glass-react card-react live-coach-row">
        <p className="diag-eyebrow">ARA COACH</p>
        <p>{coachMsg}</p>
      </div>
      <div className="live-kpi-grid">
        <div className="glass-react card-react live-kpi-card">
          <p className="diag-eyebrow">REPS</p>
          <strong>{rep}<small>/{TARGET_REPS}</small></strong>
        </div>
        <div className="glass-react card-react live-kpi-card">
          <p className="diag-eyebrow">ACCURACY</p>
          <strong>{accuracy}<small>%</small></strong>
        </div>
      </div>
      <div className="live-actions">
        <button className="btn-react" onClick={onTogglePause}>
          {paused ? "다시 시작" : "일시정지"}
        </button>
        <button className="btn-react primary" onClick={onFinish}>운동 종료 →</button>
      </div>
    </div>
  );
}

export default function LivePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const exerciseName = state?.exerciseName || "레그 레이즈";

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const poseRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const lastVideoTimeRef = React.useRef(-1);
  const sessionStartRef = React.useRef(Date.now());
  const holdStartRef = React.useRef(null);
  const repStateRef = React.useRef("closed");
  const scoreSamplesRef = React.useRef([]);
  const lastUiUpdateRef = React.useRef(0);

  const [status, setStatus] = React.useState("카메라 연결 준비 중...");
  const [stage, setStage] = React.useState("scan");
  const [countdown, setCountdown] = React.useState(3);
  const [checks, setChecks] = React.useState({
    face: false,
    shoulder: false,
    pelvis: false,
    feet: false,
  });
  const [rep, setRep] = React.useState(0);
  const [accuracy, setAccuracy] = React.useState(82);
  const [paused, setPaused] = React.useState(false);
  const [coachMsg, setCoachMsg] = React.useState("자세를 인식하고 있어요.");

  React.useEffect(() => {
    if (!FORCE_SCAN_PASS || stage !== "scan") return;
    setChecks({ face: true, shoulder: true, pelvis: true, feet: true });
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 700);
    const t2 = setTimeout(() => setCountdown(1), 1400);
    const t3 = setTimeout(() => {
      setStage("live");
      setCoachMsg("좋아요. 본 운동을 시작합니다.");
      sessionStartRef.current = Date.now();
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [stage]);

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

  const finishSession = React.useCallback((reason = "manual") => {
    const elapsedSec = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 1000));
    const avgAccuracy = scoreSamplesRef.current.length
      ? Math.round(scoreSamplesRef.current.reduce((a, b) => a + b, 0) / scoreSamplesRef.current.length)
      : accuracy;
    const calories = Math.max(12, Math.round(elapsedSec * 0.13 + rep * 0.8));
    stopSession();
    navigate("/result", {
      state: {
        score: avgAccuracy,
        reps: rep,
        targetReps: TARGET_REPS,
        durationSec: elapsedSec,
        calories,
        reason,
        exerciseName,
      },
    });
  }, [accuracy, exerciseName, navigate, rep, stopSession]);

  const processFrame = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const pose = poseRef.current;
    if (!video || !canvas || !pose || video.readyState < 2) {
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

        const {
          faceOk,
          shoulderOk,
          pelvisOk,
          feetOk,
          allGood,
          open,
          closed,
        } = buildPoseSignals(lm);
        const nextChecks = { face: faceOk, shoulder: shoulderOk, pelvis: pelvisOk, feet: feetOk };

        if (stage === "scan" && !FORCE_SCAN_PASS) {
          if (allGood) {
            if (!holdStartRef.current) holdStartRef.current = Date.now();
            const sec = (Date.now() - holdStartRef.current) / 1000;
            if (sec < 1) setCountdown((c) => (c === 3 ? c : 3));
            else if (sec < 2) setCountdown((c) => (c === 2 ? c : 2));
            else if (sec < 3) setCountdown((c) => (c === 1 ? c : 1));
            else {
              setStage("live");
              setCoachMsg("좋아요. 본 운동을 시작합니다.");
              sessionStartRef.current = Date.now();
            }
          } else {
            holdStartRef.current = null;
            setCountdown((c) => (c === 3 ? c : 3));
          }
        } else if (stage === "live") {
          if (!paused) {
            if (repStateRef.current === "closed" && open) repStateRef.current = "open";
            if (repStateRef.current === "open" && closed) {
              repStateRef.current = "closed";
              setRep((prev) => {
                const next = prev + 1;
                if (next >= TARGET_REPS) setTimeout(() => finishSession("completed"), 120);
                return next;
              });
            }
          }

          const postureScore = calcPostureScore({ faceOk, shoulderOk, pelvisOk, feetOk });
          scoreSamplesRef.current.push(postureScore);
          if (scoreSamplesRef.current.length > 240) scoreSamplesRef.current.shift();

          if (now - lastUiUpdateRef.current >= UI_UPDATE_MS) {
            lastUiUpdateRef.current = now;
            const rolling = Math.round(scoreSamplesRef.current.reduce((a, b) => a + b, 0) / scoreSamplesRef.current.length);
            setAccuracy((prev) => {
              const next = Math.max(55, Math.min(99, rolling));
              return prev === next ? prev : next;
            });

            const msg = calcCoachMessage({ allGood, open });
            setCoachMsg((prev) => (prev === msg ? prev : msg));
          }
        }

        setChecks((prev) => (
          prev.face === nextChecks.face
          && prev.shoulder === nextChecks.shoulder
          && prev.pelvis === nextChecks.pelvis
          && prev.feet === nextChecks.feet
            ? prev
            : nextChecks
        ));
        setStatus((prev) => (prev === "실시간 자세 분석 중" ? prev : "실시간 자세 분석 중"));
      } else {
        setStatus((prev) => (prev === "신체를 화면 중앙에 맞춰주세요" ? prev : "신체를 화면 중앙에 맞춰주세요"));
        if (stage === "scan" && !FORCE_SCAN_PASS) {
          setChecks((prev) => (
            !prev.face && !prev.shoulder && !prev.pelvis && !prev.feet
              ? prev
              : { face: false, shoulder: false, pelvis: false, feet: false }
          ));
          holdStartRef.current = null;
          setCountdown((c) => (c === 3 ? c : 3));
        }
      }
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [finishSession, paused, stage]);

  React.useEffect(() => {
    let mounted = true;
    async function startSession() {
      try {
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

  const isScan = stage === "scan";

  return (
    <SequentialScreen className={`screen-react live-screen ${isScan ? "scan-mode" : ""}`}>
      <div className="live-head">
        <h2 className="live-title">{isScan ? "2초간 자세를 유지" : `${exerciseName} - 런지`}</h2>
      </div>

      <div className={`live-camera-card ${isScan ? "scan-camera" : ""}`}>
        <video ref={videoRef} className="camera-video-react" playsInline muted />
        <canvas ref={canvasRef} className="pose-canvas-react" />
        <div className="camera-status-react">{status}</div>
      </div>

      {isScan ? (
        <ScanPanel countdown={countdown} checks={checks} />
      ) : (
        <LivePanel
          coachMsg={coachMsg}
          rep={rep}
          accuracy={accuracy}
          paused={paused}
          onTogglePause={() => setPaused((v) => !v)}
          onFinish={() => finishSession("manual")}
        />
      )}
    </SequentialScreen>
  );
}
