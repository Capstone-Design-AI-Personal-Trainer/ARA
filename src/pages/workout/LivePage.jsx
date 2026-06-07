import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SequentialScreen from "../../components/SequentialScreen";
import PoseSilhouetteCanvas from "../../features/pose-player/PoseSilhouetteCanvas";
import {
  applyCalibrationToGtFrame,
  computeBodyMetrics as computeCalibrationMetrics,
  createCalibrationSession,
  finalizeCalibrationSession,
  pushCalibrationSample,
  setActiveCalibration,
} from "../../features/pose-calibration";
import Workout3DReaction from "../../features/junyoung/effects/Workout3DReaction";
import { useWorkoutRecorder } from "../../features/junyoung/recording/useWorkoutRecorder";
import { saveWorkoutRecording } from "../../features/junyoung/recording/workoutRecordingStore";
import "./LivePage.module.css";
import {
  buildPoseSignals,
  calcCoachMessage,
  calcPoseScore,
  drawSkeleton,
} from "../../features/live/poseUtils";

const TARGET_REPS = 10;
const FORCE_SCAN_PASS = import.meta.env.VITE_FORCE_SCAN_PASS === "true";
const UI_UPDATE_MS = 120;
const PERFECT_SCORE_THRESHOLD = 60;
const PERFECT_REACTION_COOLDOWN_MS = 2400;
const MIN_ACCURACY_SAMPLES = 8;
const GT_OPEN_RATIO = 2.4;
const GT_CLOSED_RATIO = 1.6;
const ACCURACY_SCORE_OPTIONS = {
  minVisibility: 0.45,
  distanceGood: 0.035,
  distanceBad: 0.16,
  weightedJoints: [
    [11, 1.0], [12, 1.0],
    [13, 2.0], [14, 2.0],
    [15, 3.0], [16, 3.0],
    [23, 0.8], [24, 0.8],
  ],
};

function mirrorLandmarksX(landmarks) {
  return landmarks.map((point) => (
    point ? { ...point, x: 1 - point.x } : point
  ));
}

function createLiveCalibration(landmarks) {
  const userMetrics = computeCalibrationMetrics(landmarks, 0.35);
  if (!userMetrics) return null;
  return {
    sampleCount: 1,
    userMetrics,
  };
}

function ScanPanel({ countdown, checks }) {
  return (
    <div className="scan-stage-panel">
      <div className="live-count">{countdown}</div>
      <div className="scan-check-grid">
        <div className={`scan-chip ${checks.face ? "on" : ""}`}>얼굴 인식</div>
        <div className={`scan-chip ${checks.shoulder ? "on" : ""}`}>어깨 위치</div>
        <div className={`scan-chip ${checks.pelvis ? "on" : ""}`}>골반 위치</div>
      </div>
    </div>
  );
}

function LivePanel({ coachMsg, rep, accuracy, paused, onTogglePause, onFinish }) {
  const accuracyLabel = accuracy == null ? "--" : accuracy;

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
          <strong>{accuracyLabel}{accuracy == null ? null : <small>%</small>}</strong>
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

function PerfectSparkBurst({ burst }) {
  if (!burst) return null;

  return (
    <div className="perfect-spark-burst" key={burst.id} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={index} style={{ "--i": index }} />
      ))}
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
  const gtRepPhaseRef = React.useRef("closed");
  const latestGtFrameRef = React.useRef(null);
  const scoreSamplesRef = React.useRef([]);
  const calibrationSessionRef = React.useRef(createCalibrationSession());
  const poseCalibrationRef = React.useRef(null);
  const lastUiUpdateRef = React.useRef(0);
  const lastPerfectReactionRef = React.useRef(0);
  const reactionIdRef = React.useRef(0);

  const [status, setStatus] = React.useState("카메라 연결 준비 중...");
  const [stage, setStage] = React.useState("scan");
  const [countdown, setCountdown] = React.useState(3);
  const [checks, setChecks] = React.useState({
    face: false,
    shoulder: false,
    pelvis: false,
  });
  const [rep, setRep] = React.useState(0);
  const [accuracy, setAccuracy] = React.useState(null);
  const [paused, setPaused] = React.useState(false);
  const [poseCalibration, setPoseCalibration] = React.useState(null);
  const [coachMsg, setCoachMsg] = React.useState("자세를 인식하고 있어요.");
  const [perfectReaction, setPerfectReaction] = React.useState(null);
  const {
    startCompositeRecording,
    stopRecording,
    markPerfect,
  } = useWorkoutRecorder();
  const stageRef = React.useRef(stage);
  const pausedRef = React.useRef(paused);
  const repRef = React.useRef(rep);
  const accuracyRef = React.useRef(accuracy);
  const exerciseNameRef = React.useRef(exerciseName);

  React.useEffect(() => {
    stageRef.current = stage;
    pausedRef.current = paused;
    repRef.current = rep;
    accuracyRef.current = accuracy;
    poseCalibrationRef.current = poseCalibration;
    exerciseNameRef.current = exerciseName;
  }, [accuracy, exerciseName, paused, poseCalibration, rep, stage]);

  React.useEffect(() => {
    if (!FORCE_SCAN_PASS || stage !== "scan") return;
    setChecks({ face: true, shoulder: true, pelvis: true });
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 700);
    const t2 = setTimeout(() => setCountdown(1), 1400);
    const t3 = setTimeout(() => {
      const calibration = finalizeCalibrationSession(calibrationSessionRef.current);
      poseCalibrationRef.current = calibration;
      setPoseCalibration(calibration);
      setActiveCalibration(calibration);
      gtRepPhaseRef.current = "closed";
      latestGtFrameRef.current = null;
      scoreSamplesRef.current = [];
      accuracyRef.current = null;
      setAccuracy(null);
      stageRef.current = "live";
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

  React.useEffect(() => {
    if (!perfectReaction) return undefined;
    const timeoutId = setTimeout(() => {
      setPerfectReaction(null);
    }, 1600);
    return () => clearTimeout(timeoutId);
  }, [perfectReaction]);

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

  const finishSession = React.useCallback(async (reason = "manual") => {
    const currentAccuracy = accuracyRef.current;
    const currentExerciseName = exerciseNameRef.current;
    const currentRep = repRef.current;
    const elapsedSec = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 1000));
    const avgAccuracy = scoreSamplesRef.current.length
      ? Math.round(scoreSamplesRef.current.reduce((a, b) => a + b, 0) / scoreSamplesRef.current.length)
      : currentAccuracy ?? 0;
    const calories = Math.max(12, Math.round(elapsedSec * 0.13 + currentRep * 0.8));
    const recordingBlob = await stopRecording().catch((error) => {
      console.error("Failed to stop recording:", error);
      return null;
    });
    const recordingId = recordingBlob ? `pending-${Date.now()}` : "";
    if (recordingBlob) {
      await saveWorkoutRecording({
        id: recordingId,
        blob: recordingBlob,
        exerciseName: currentExerciseName,
        score: avgAccuracy,
        reps: currentRep,
        durationSec: elapsedSec,
        calories,
      }).catch((error) => console.error("Failed to save local recording:", error));
    }
    stopSession();
    navigate("/result", {
      state: {
        score: avgAccuracy,
        reps: currentRep,
        targetReps: TARGET_REPS,
        durationSec: elapsedSec,
        calories,
        reason,
        exerciseName: currentExerciseName,
        recordingId,
      },
    });
  }, [navigate, stopRecording, stopSession]);

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
      const currentStage = stageRef.current;
      const isPaused = pausedRef.current;
      lastVideoTimeRef.current = video.currentTime;
      const result = pose.detectForVideo(video, now);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.landmarks && result.landmarks[0]) {
        const lm = result.landmarks[0];
        const {
          faceOk,
          shoulderOk,
          pelvisOk,
          open,
        } = buildPoseSignals(lm);
        const scanReady = faceOk && shoulderOk && pelvisOk;
        const nextChecks = {
          face: faceOk,
          shoulder: shoulderOk,
          pelvis: pelvisOk,
        };

        if (currentStage === "scan" && scanReady) {
          pushCalibrationSample(calibrationSessionRef.current, lm);
        }
        drawSkeleton(ctx, lm, canvas.width, canvas.height, video.videoWidth, video.videoHeight);

        if (currentStage === "scan") {
          if (scanReady) {
            if (!holdStartRef.current) holdStartRef.current = Date.now();
            const sec = (Date.now() - holdStartRef.current) / 1000;
            if (sec < 1) setCountdown((c) => (c === 3 ? c : 3));
            else if (sec < 2) setCountdown((c) => (c === 2 ? c : 2));
            else if (sec < 3) setCountdown((c) => (c === 1 ? c : 1));
            else {
              const calibration = finalizeCalibrationSession(calibrationSessionRef.current);
              poseCalibrationRef.current = calibration;
              setPoseCalibration(calibration);
              setActiveCalibration(calibration);
              gtRepPhaseRef.current = "closed";
              latestGtFrameRef.current = null;
              scoreSamplesRef.current = [];
              accuracyRef.current = null;
              setAccuracy(null);
              stageRef.current = "live";
              setStage("live");
              setCoachMsg("좋아요. 본 운동을 시작합니다.");
              sessionStartRef.current = Date.now();
            }
          } else {
            holdStartRef.current = null;
            setCountdown((c) => (c === 3 ? c : 3));
          }
        } else if (currentStage === "live") {
          const liveCalibration = createLiveCalibration(lm);
          if (liveCalibration) {
            poseCalibrationRef.current = liveCalibration;
          }

          const gtFrame = latestGtFrameRef.current;
          const calibration = poseCalibrationRef.current;
          const calibratedGtFrame = gtFrame && calibration
            ? applyCalibrationToGtFrame(gtFrame, calibration)
            : null;

          if (!isPaused && calibratedGtFrame) {
            const directScore = calcPoseScore(lm, calibratedGtFrame, ACCURACY_SCORE_OPTIONS);
            const mirroredScore = calcPoseScore(mirrorLandmarksX(lm), calibratedGtFrame, ACCURACY_SCORE_OPTIONS);
            const poseScore = Math.max(directScore, mirroredScore);
            scoreSamplesRef.current.push(poseScore);
          }
          if (scoreSamplesRef.current.length > 240) scoreSamplesRef.current.shift();

          if (now - lastUiUpdateRef.current >= UI_UPDATE_MS) {
            lastUiUpdateRef.current = now;
            const hasEnoughSamples = scoreSamplesRef.current.length >= MIN_ACCURACY_SAMPLES;
            const rolling = hasEnoughSamples
              ? Math.round(scoreSamplesRef.current.reduce((a, b) => a + b, 0) / scoreSamplesRef.current.length)
              : null;
            setAccuracy((prev) => {
              if (!hasEnoughSamples) {
                accuracyRef.current = null;
                return prev == null ? prev : null;
              }
              const next = Math.max(0, Math.min(100, rolling));
              accuracyRef.current = next;
              return prev === next ? prev : next;
            });
            if (liveCalibration) {
              setPoseCalibration(liveCalibration);
            }
            if (hasEnoughSamples && rolling >= PERFECT_SCORE_THRESHOLD && now - lastPerfectReactionRef.current >= PERFECT_REACTION_COOLDOWN_MS) {
              lastPerfectReactionRef.current = now;
              reactionIdRef.current += 1;
              setPerfectReaction({
                id: reactionIdRef.current,
                side: "left",
              });
              markPerfect();
            }

            const msg = calcCoachMessage({ allGood: scanReady, open });
            setCoachMsg((prev) => (prev === msg ? prev : msg));
          }
        }

        setChecks((prev) => (
          prev.face === nextChecks.face
            && prev.shoulder === nextChecks.shoulder
            && prev.pelvis === nextChecks.pelvis
            ? prev
            : nextChecks
        ));
        setStatus((prev) => (prev === "실시간 자세 분석 중" ? prev : "실시간 자세 분석 중"));
      } else {
        setStatus((prev) => (prev === "신체를 화면 중앙에 맞춰주세요" ? prev : "신체를 화면 중앙에 맞춰주세요"));
        if (stageRef.current === "scan") {
          setChecks((prev) => (
            !prev.face && !prev.shoulder && !prev.pelvis
              ? prev
              : {
                face: false,
                shoulder: false,
                pelvis: false,
              }
          ));
          holdStartRef.current = null;
          setCountdown((c) => (c === 3 ? c : 3));
        }
      }
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [finishSession, markPerfect]);

  const handleGtFrame = React.useCallback(({ frame }) => {
    if (!Array.isArray(frame)) return;
    latestGtFrameRef.current = frame;
    if (pausedRef.current || stageRef.current !== "live") return;

    const leftWrist = frame[15];
    const rightWrist = frame[16];
    const leftShoulder = frame[11];
    const rightShoulder = frame[12];
    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return;

    const wristSpread = Math.hypot(leftWrist.x - rightWrist.x, leftWrist.y - rightWrist.y);
    const shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    if (!shoulderWidth) return;

    const spreadRatio = wristSpread / shoulderWidth;
    if (gtRepPhaseRef.current === "closed" && spreadRatio >= GT_OPEN_RATIO) {
      gtRepPhaseRef.current = "open";
      return;
    }

    if (gtRepPhaseRef.current === "open" && spreadRatio <= GT_CLOSED_RATIO) {
      gtRepPhaseRef.current = "closed";
      setRep((prev) => {
        if (prev >= TARGET_REPS) return prev;
        const next = prev + 1;
        repRef.current = next;
        if (next >= TARGET_REPS) setTimeout(() => finishSession("completed"), 120);
        return next;
      });
    }
  }, [finishSession]);

  React.useEffect(() => {
    let mounted = true;
    calibrationSessionRef.current = createCalibrationSession();
    poseCalibrationRef.current = null;
    setPoseCalibration(null);
    async function startSession() {
      try {
        setStatus("MediaPipe 모델 로딩 중...");
        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm");
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        poseRef.current = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
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
        startCompositeRecording(video, canvasRef.current);
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
  }, [processFrame, resizeCanvas, startCompositeRecording, stopSession]);

  const isScan = stage === "scan";
  const visibleReaction = perfectReaction || { id: "coach-idle", side: "left" };
  const hasPerfectReaction = Boolean(perfectReaction);

  return (
    <SequentialScreen className={`screen-react live-screen ${isScan ? "scan-mode" : ""}`}>
      <div className="live-head">
        <h2 className="live-title">{isScan ? "2초간 자세를 유지" : `${exerciseName} - 런지`}</h2>
      </div>

      <div className={`live-camera-card ${isScan ? "scan-camera" : ""}`}>
        <video ref={videoRef} className="camera-video-react" playsInline muted />
        <canvas ref={canvasRef} className="pose-canvas-react" />
        {!isScan ? (
          <div className="live-gt-overlay" aria-hidden="true">
            <PoseSilhouetteCanvas
              width={720}
              height={800}
              transparent
              showMeta={false}
              className="live-gt-overlay-canvas"
              calibration={poseCalibration}
              onFrame={handleGtFrame}
            />
          </div>
        ) : null}
        {!isScan ? (
          <>
            <PerfectSparkBurst burst={perfectReaction} />
            <Workout3DReaction
              reaction={visibleReaction}
              motion={hasPerfectReaction ? "clap" : "jump"}
              label={hasPerfectReaction ? "PERFECT" : "COACH"}
              message={hasPerfectReaction ? "자세 좋아요!" : "잘 따라와요"}
              persistent={!hasPerfectReaction}
              showSpeech={hasPerfectReaction}
            />
          </>
        ) : null}
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
          onTogglePause={() => setPaused((v) => {
            const next = !v;
            pausedRef.current = next;
            return next;
          })}
          onFinish={() => finishSession("manual")}
        />
      )}
    </SequentialScreen>
  );
}
