import React from "react";
import { loadGtPose } from "./gtPoseLoader";
import { getFrameAtTime } from "./posePlayback";
import { projectPoseFrame } from "./poseProjector";
import { drawBodyOutline } from "./bodyOutlineRenderer";
import { DEFAULT_BODY_STYLE } from "./bodySilhouetteStyle";
import { applyCalibrationToGtFrame } from "../pose-calibration";

function drawFrame(ctx, frame, width, height, style, calibration) {
  ctx.clearRect(0, 0, width, height);
  if (!frame?.length) return;

  const calibratedFrame = applyCalibrationToGtFrame(frame, calibration);
  const projected = projectPoseFrame(calibratedFrame, width, height, {
    fit: "cover",
    aspectWidth: 16,
    aspectHeight: 9,
    mirrored: true,
    padding: 0,
  });
  drawBodyOutline(ctx, projected, style);
}

export default function PoseSilhouetteCanvas({
  source = "/gt_pose_clean.json",
  loop = true,
  autoPlay = true,
  width = 320,
  height = 480,
  style = DEFAULT_BODY_STYLE,
  transparent = false,
  showMeta = true,
  className = "",
  calibration = null,
  onFrame = null,
}) {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const startTimeRef = React.useRef(0);
  const dataRef = React.useRef(null);
  const [status, setStatus] = React.useState("loading");
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    loadGtPose(source)
      .then((data) => {
        if (cancelled) return;
        dataRef.current = data;
        startTimeRef.current = performance.now();
        setStatus("ready");
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  React.useEffect(() => {
    if (!autoPlay || status !== "ready") return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return undefined;

    function render(now) {
      const data = dataRef.current;
      if (!data) return;
      const result = getFrameAtTime({
        frames: data.frames,
        fps: data.fps,
        elapsedMs: now - startTimeRef.current,
        loop,
      });
      if (!result) return;

      drawFrame(ctx, result.frame, canvas.width, canvas.height, style, calibration);
      onFrame?.({
        frame: result.frame,
        frameIndex: result.frameIndex,
        fps: data.fps,
        frameCount: data.frames.length,
      });
      setFrameIndex((current) => (current === result.frameIndex ? current : result.frameIndex));
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoPlay, calibration, loop, onFrame, status, style]);

  return (
    <div
      className={className}
      style={{
        display: "grid",
        width: transparent ? "100%" : undefined,
        height: transparent ? "100%" : undefined,
        gap: showMeta ? 10 : 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: transparent ? "100%" : undefined,
          maxWidth: transparent ? "100%" : width,
          margin: "0 auto",
          borderRadius: transparent ? 0 : 18,
          overflow: "hidden",
          background: transparent ? "transparent" : "linear-gradient(180deg, #f8fbff 0%, #eaf2ff 100%)",
          border: transparent ? "none" : "1px solid rgba(129, 164, 217, 0.35)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
            width: "100%",
            height: transparent ? "100%" : "auto",
            aspectRatio: transparent ? undefined : `${width} / ${height}`,
          }}
        />
      </div>
      {showMeta ? (
        <div className="row-between">
          <span className="muted-react">
            {status === "loading" ? "GT pose loading..." : status === "error" ? "GT pose unavailable" : `Frame ${frameIndex + 1}`}
          </span>
          <span className="muted-react">Silhouette preview</span>
        </div>
      ) : null}
    </div>
  );
}
