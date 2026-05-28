import csv
import argparse
from pathlib import Path
import time

import cv2
import mediapipe as mp


DEFAULT_VIDEO_PATH = Path("data/raw_video/shoulder_abduction_adduction.mp4")
DEFAULT_OUT_CSV = Path("data/raw_pose/gt_pose_raw_shoulder_abduction_adduction.csv")
DEFAULT_OUT_PREVIEW = Path("data/preview/preview_shoulder_abduction_adduction.mp4")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", default=str(DEFAULT_VIDEO_PATH))
    parser.add_argument("--out-csv", default=str(DEFAULT_OUT_CSV))
    parser.add_argument("--out-preview", default=str(DEFAULT_OUT_PREVIEW))
    args = parser.parse_args()

    video_path = Path(args.video)
    out_csv = Path(args.out_csv)
    out_preview = Path(args.out_preview)

    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path.resolve()}")

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    out_preview.parent.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video: {video_path.resolve()}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    preview_writer = cv2.VideoWriter(str(out_preview), fourcc, fps, (width, height))

    # Some mediapipe builds expose `solutions` at top-level, others under
    # `mediapipe.python.solutions`.
    try:
        mp_pose = mp.solutions.pose
        mp_drawing = mp.solutions.drawing_utils
    except AttributeError:
        from mediapipe.python import solutions as mp_solutions

        mp_pose = mp_solutions.pose
        mp_drawing = mp_solutions.drawing_utils

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "frame_idx",
                "time_sec",
                "landmark_id",
                "x_norm",
                "y_norm",
                "z_norm",
                "visibility",
                "x_px",
                "y_px",
            ]
        )

        with mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as pose:
            frame_idx = 0
            start_time = time.time()
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = pose.process(rgb)

                if result.pose_landmarks:
                    for landmark_id, lm in enumerate(result.pose_landmarks.landmark):
                        x_px = lm.x * width
                        y_px = lm.y * height
                        writer.writerow(
                            [
                                frame_idx,
                                frame_idx / fps,
                                landmark_id,
                                lm.x,
                                lm.y,
                                lm.z,
                                lm.visibility,
                                x_px,
                                y_px,
                            ]
                        )

                    mp_drawing.draw_landmarks(
                        frame,
                        result.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                    )

                preview_writer.write(frame)
                frame_idx += 1

                if frame_idx % 100 == 0:
                    elapsed = time.time() - start_time
                    if total_frames > 0:
                        progress = (frame_idx / total_frames) * 100
                        print(
                            f"[progress] {frame_idx}/{total_frames} frames "
                            f"({progress:.1f}%) elapsed={elapsed:.1f}s"
                        )
                    else:
                        print(f"[progress] {frame_idx} frames elapsed={elapsed:.1f}s")

    cap.release()
    preview_writer.release()

    print(f"Saved CSV: {out_csv.resolve()}")
    print(f"Saved Preview: {out_preview.resolve()}")


if __name__ == "__main__":
    main()
