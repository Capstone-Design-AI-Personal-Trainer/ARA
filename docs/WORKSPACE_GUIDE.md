# ARA Workspace Guide

## 1) Single Source of Truth
- Use only this project path:
  - `C:\Users\GeontaeKim\OneDrive\바탕 화면\ARA`
- Do not run scripts from any duplicate folder.

## 2) Folder Policy
- `src/`: frontend app source
- `backend/`: Spring backend source
- `public/`: runtime static assets used by frontend
- `data/raw_video/`: source videos (input)
- `data/raw_pose/`: extracted raw pose CSV
- `data/clean_pose/`: cleaned CSV + JSON + JSONL
- `data/preview/`: extracted preview videos
- `docs/`: process and team conventions

## 3) Naming Convention
- Raw video:
  - `<exercise_slug>.mp4`
  - example: `shoulder_abduction_adduction.mp4`
- Raw pose CSV:
  - `gt_pose_raw_<exercise_slug>.csv`
- Clean pose CSV:
  - `gt_pose_clean_<exercise_slug>.csv`
- Clean pose JSON:
  - `gt_pose_clean_<exercise_slug>.json`
- Clean pose JSONL:
  - `gt_pose_clean_<exercise_slug>.jsonl`
- Preview video:
  - `preview_<exercise_slug>.mp4`

## 4) Standard Commands
Run from project root (`ARA`):

```powershell
.\.venv312\Scripts\python.exe scripts/pose/extract_gt.py `
  --video data/raw_video/shoulder_abduction_adduction.mp4 `
  --out-csv data/raw_pose/gt_pose_raw_shoulder_abduction_adduction.csv `
  --out-preview data/preview/preview_shoulder_abduction_adduction.mp4
```

```powershell
.\.venv312\Scripts\python.exe scripts/pose/clean_gt.py `
  --input data/raw_pose/gt_pose_raw_shoulder_abduction_adduction.csv `
  --out-csv data/clean_pose/gt_pose_clean_shoulder_abduction_adduction.csv `
  --out-json data/clean_pose/gt_pose_clean_shoulder_abduction_adduction.json `
  --out-jsonl data/clean_pose/gt_pose_clean_shoulder_abduction_adduction.jsonl
```

## 5) Runtime GT
- Live page reads:
  - `public/gt_pose_clean.json`
- If GT is updated, convert to app format and overwrite this file.
