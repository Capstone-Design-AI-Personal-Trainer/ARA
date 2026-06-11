#!/usr/bin/env python3
"""Extract MediaPipe Pose ground-truth data from a YouTube video."""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlretrieve
from urllib.parse import parse_qs, urlparse

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


DEFAULT_URL = "https://www.youtube.com/watch?v=Lyhpfw_tP5c"
ROOT_DIR = Path(__file__).resolve().parents[1]
GT_DIR = ROOT_DIR / "data" / "ground-truth"
VIDEOS_DIR = GT_DIR / "videos"
MODELS_DIR = GT_DIR / "models"
POSE_JSON_DIR = GT_DIR / "pose-json"
POSE_CSV_DIR = GT_DIR / "pose-csv"
METADATA_DIR = GT_DIR / "metadata"
POSE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_full/float16/latest/pose_landmarker_full.task"
)
POSE_MODEL_PATH = MODELS_DIR / "pose_landmarker_full.task"


POSE_LANDMARK_NAMES = [
    "nose",
    "left_eye_inner",
    "left_eye",
    "left_eye_outer",
    "right_eye_inner",
    "right_eye",
    "right_eye_outer",
    "left_ear",
    "right_ear",
    "mouth_left",
    "mouth_right",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_pinky",
    "right_pinky",
    "left_index",
    "right_index",
    "left_thumb",
    "right_thumb",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
    "left_heel",
    "right_heel",
    "left_foot_index",
    "right_foot_index",
]


def parse_video_id(url: str) -> str:
    parsed = urlparse(url)

    if parsed.hostname == "youtu.be":
        video_id = parsed.path.strip("/")
    else:
        video_id = parse_qs(parsed.query).get("v", [""])[0]

    if not video_id:
        raise ValueError(f"Could not find YouTube video id from URL: {url}")

    return video_id


def ensure_output_dirs() -> None:
    for directory in (VIDEOS_DIR, MODELS_DIR, POSE_JSON_DIR, POSE_CSV_DIR, METADATA_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def download_video(url: str, output_path: Path) -> None:
    if output_path.exists():
        print(f"Using existing video: {output_path}")
        return

    command = [
        sys.executable,
        "-m",
        "yt_dlp",
        "-f",
        "mp4/best[ext=mp4]/best",
        "-o",
        str(output_path),
        url,
    ]
    subprocess.run(command, check=True)


def download_pose_model() -> Path:
    if POSE_MODEL_PATH.exists():
        return POSE_MODEL_PATH

    print(f"Downloading MediaPipe pose model: {POSE_MODEL_PATH}")
    urlretrieve(POSE_MODEL_URL, POSE_MODEL_PATH)
    return POSE_MODEL_PATH


def landmark_to_json(index: int, landmark: Any, width: int, height: int) -> dict[str, Any]:
    return {
        "id": index,
        "name": POSE_LANDMARK_NAMES[index],
        "normalized": {
            "x": landmark.x,
            "y": landmark.y,
            "z": landmark.z,
        },
        "pixel": {
            "x": round(landmark.x * width, 2),
            "y": round(landmark.y * height, 2),
        },
        "visibility": landmark.visibility,
    }


def extract_pose_json(
    *,
    video_path: Path,
    source_url: str,
    video_id: str,
    output_json_path: Path,
    output_csv_path: Path,
    metadata_path: Path,
    frame_stride: int,
) -> None:
    model_path = download_pose_model()
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames: list[dict[str, Any]] = []

    options = vision.PoseLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=str(model_path)),
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    with vision.PoseLandmarker.create_from_options(options) as pose:
        frame_index = 0

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            if frame_index % frame_stride != 0:
                frame_index += 1
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int((frame_index / fps) * 1000) if fps else frame_index
            result = pose.detect_for_video(mp_image, timestamp_ms)

            frame_data: dict[str, Any] = {
                "frame_index": frame_index,
                "time_sec": frame_index / fps if fps else None,
                "landmarks": [],
            }

            if result.pose_landmarks:
                frame_data["landmarks"] = [
                    landmark_to_json(index, landmark, width, height)
                    for index, landmark in enumerate(result.pose_landmarks[0])
                ]

            frames.append(frame_data)
            frame_index += 1

    cap.release()

    payload = {
        "source": {
            "type": "youtube",
            "url": source_url,
            "video_id": video_id,
        },
        "extractor": {
            "name": "mediapipe",
            "task": "pose",
            "model": str(model_path.relative_to(ROOT_DIR)),
            "frame_stride": frame_stride,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "video": {
            "file": str(video_path.relative_to(ROOT_DIR)),
            "fps": fps,
            "width": width,
            "height": height,
            "total_frames": total_frames,
        },
        "frames": frames,
    }

    metadata = {
        "source": payload["source"],
        "extractor": payload["extractor"],
        "video": payload["video"],
        "output": {
            "pose_json": str(output_json_path.relative_to(ROOT_DIR)),
            "pose_csv": str(output_csv_path.relative_to(ROOT_DIR)),
            "extracted_frames": len(frames),
            "landmark_count": len(POSE_LANDMARK_NAMES),
        },
    }

    output_json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_pose_csv(frames, output_csv_path)
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def write_pose_csv(frames: list[dict[str, Any]], output_csv_path: Path) -> None:
    fieldnames = [
        "frame_index",
        "time_sec",
        "landmark_id",
        "landmark_name",
        "normalized_x",
        "normalized_y",
        "normalized_z",
        "pixel_x",
        "pixel_y",
        "visibility",
    ]

    with output_csv_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for frame in frames:
            for landmark in frame["landmarks"]:
                writer.writerow(
                    {
                        "frame_index": frame["frame_index"],
                        "time_sec": frame["time_sec"],
                        "landmark_id": landmark["id"],
                        "landmark_name": landmark["name"],
                        "normalized_x": landmark["normalized"]["x"],
                        "normalized_y": landmark["normalized"]["y"],
                        "normalized_z": landmark["normalized"]["z"],
                        "pixel_x": landmark["pixel"]["x"],
                        "pixel_y": landmark["pixel"]["y"],
                        "visibility": landmark["visibility"],
                    }
                )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download a YouTube video and extract frame-by-frame MediaPipe Pose GT JSON."
    )
    parser.add_argument(
        "url",
        nargs="?",
        default=DEFAULT_URL,
        help=f"YouTube URL. Defaults to {DEFAULT_URL}",
    )
    parser.add_argument(
        "--frame-stride",
        type=int,
        default=1,
        help="Extract every Nth frame. Use 1 for all frames.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.frame_stride < 1:
        raise ValueError("--frame-stride must be 1 or greater")

    ensure_output_dirs()

    video_id = parse_video_id(args.url)
    video_path = VIDEOS_DIR / f"{video_id}.mp4"
    output_json_path = POSE_JSON_DIR / f"{video_id}.pose.json"
    output_csv_path = POSE_CSV_DIR / f"{video_id}.pose.csv"
    metadata_path = METADATA_DIR / f"{video_id}.meta.json"

    download_video(args.url, video_path)
    extract_pose_json(
        video_path=video_path,
        source_url=args.url,
        video_id=video_id,
        output_json_path=output_json_path,
        output_csv_path=output_csv_path,
        metadata_path=metadata_path,
        frame_stride=args.frame_stride,
    )

    print(f"Saved pose JSON: {output_json_path}")
    print(f"Saved pose CSV: {output_csv_path}")
    print(f"Saved metadata: {metadata_path}")


if __name__ == "__main__":
    main()
