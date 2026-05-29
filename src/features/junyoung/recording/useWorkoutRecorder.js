import { useCallback, useRef, useState } from "react";

const RECORDING_FPS = 30;

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function drawCover(ctx, source, canvasWidth, canvasHeight, sourceWidth, sourceHeight) {
  if (!sourceWidth || !sourceHeight) {
    ctx.drawImage(source, 0, 0, canvasWidth, canvasHeight);
    return;
  }

  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;
  ctx.drawImage(source, x, y, width, height);
}

function drawMirroredCover(ctx, source, canvasWidth, canvasHeight, sourceWidth, sourceHeight) {
  ctx.save();
  ctx.translate(canvasWidth, 0);
  ctx.scale(-1, 1);
  drawCover(ctx, source, canvasWidth, canvasHeight, sourceWidth, sourceHeight);
  ctx.restore();
}

function drawPerfectEffect(ctx, canvasWidth, canvasHeight, startedAt) {
  const elapsed = Math.max(0, performance.now() - startedAt);
  const progress = Math.min(elapsed / 1600, 1);
  const burstProgress = Math.min(elapsed / 900, 1);
  const burstOpacity = Math.max(0, 1 - burstProgress);
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight * 0.48;

  if (burstOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = burstOpacity;
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const distance = 16 + burstProgress * 120;
      const radius = i % 4 === 0 ? 8 : i % 3 === 0 ? 5 : 6;
      ctx.fillStyle = i % 3 === 0 ? "#8df1ed" : i % 4 === 0 ? "#ffffff" : "#ffe07a";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(0.92, progress < 0.12 ? progress / 0.12 : (1 - progress) / 0.16));
  if (progress < 0.84) ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(111, 207, 205, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(18, 18, Math.min(174, canvasWidth - 36), 48, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0f8d89";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.fillText("PERFECT", 34, 40);
  ctx.fillStyle = "#143836";
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillText("자세 좋아요!", 34, 58);
  ctx.restore();
}

export function useWorkoutRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawFrameRef = useRef(0);
  const perfectMarkerUntilRef = useRef(0);
  const perfectEffectStartRef = useRef(0);
  const stopPromiseRef = useRef(null);
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const isSupported = typeof window !== "undefined" && "MediaRecorder" in window;

  const stopDrawLoop = useCallback(() => {
    if (drawFrameRef.current) {
      cancelAnimationFrame(drawFrameRef.current);
      drawFrameRef.current = 0;
    }
  }, []);

  const startCompositeRecording = useCallback((videoEl, overlayCanvas) => {
    if (!isSupported || !videoEl || !overlayCanvas || isRecordingRef.current) return false;

    const width = overlayCanvas.width || 720;
    const height = overlayCanvas.height || 900;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    canvasRef.current = canvas;
    ctxRef.current = ctx;
    chunksRef.current = [];

    const stream = canvas.captureStream(RECORDING_FPS);
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordingUrl(url);
      isRecordingRef.current = false;
      setIsRecording(false);
      stopDrawLoop();
      stopPromiseRef.current?.resolve(blob);
      stopPromiseRef.current = null;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMirroredCover(ctx, videoEl, canvas.width, canvas.height, videoEl.videoWidth, videoEl.videoHeight);
      if (overlayCanvas.width && overlayCanvas.height) {
        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
      }
      if (performance.now() < perfectMarkerUntilRef.current) {
        drawPerfectEffect(ctx, canvas.width, canvas.height, perfectEffectStartRef.current);
      }
      drawFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    recorder.start(1000);
    isRecordingRef.current = true;
    setIsRecording(true);
    return true;
  }, [isSupported, stopDrawLoop]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      stopPromiseRef.current = { resolve, reject };
      try {
        recorder.stop();
      } catch (error) {
        stopPromiseRef.current = null;
        reject(error);
      }
    });
  }, []);

  const markPerfect = useCallback(() => {
    const now = performance.now();
    perfectEffectStartRef.current = now;
    perfectMarkerUntilRef.current = now + 1600;
  }, []);

  return {
    isSupported,
    isRecording,
    recordingUrl,
    startCompositeRecording,
    stopRecording,
    markPerfect,
  };
}
