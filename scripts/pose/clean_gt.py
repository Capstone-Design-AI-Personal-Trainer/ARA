from pathlib import Path
import argparse
import pandas as pd


VISIBILITY_THRESHOLD = 0.5
EMA_ALPHA = 0.35


def ema(series: pd.Series, alpha: float) -> pd.Series:
    return series.ewm(alpha=alpha, adjust=False).mean()


def clean_one_landmark(group: pd.DataFrame) -> pd.DataFrame:
    g = group.sort_values("frame_idx").copy()

    low_conf = g["visibility"] < VISIBILITY_THRESHOLD
    for col in ["x_norm", "y_norm", "z_norm", "x_px", "y_px"]:
        g.loc[low_conf, col] = pd.NA

    for col in ["x_norm", "y_norm", "z_norm", "x_px", "y_px"]:
        g[col] = (
            g[col]
            .astype("float64")
            .interpolate(method="linear", limit_direction="both")
            .ffill()
            .bfill()
        )

    for col in ["x_norm", "y_norm", "z_norm", "x_px", "y_px"]:
        g[col] = ema(g[col], EMA_ALPHA)

    return g


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="raw csv path")
    parser.add_argument("--out-csv", required=True, help="clean csv path")
    parser.add_argument("--out-json", required=True, help="clean json path")
    parser.add_argument("--out-jsonl", required=True, help="clean jsonl path")
    args = parser.parse_args()

    in_csv = Path(args.input)
    out_csv = Path(args.out_csv)
    out_json = Path(args.out_json)
    out_jsonl = Path(args.out_jsonl)

    if not in_csv.exists():
        raise FileNotFoundError(f"Raw CSV not found: {in_csv.resolve()}")

    df = pd.read_csv(in_csv)
    required = {
        "frame_idx",
        "time_sec",
        "landmark_id",
        "x_norm",
        "y_norm",
        "z_norm",
        "visibility",
        "x_px",
        "y_px",
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    cleaned_parts = []
    for landmark_id, group in df.groupby("landmark_id", sort=False):
        part = clean_one_landmark(group)
        part["landmark_id"] = landmark_id
        cleaned_parts.append(part)

    cleaned = pd.concat(cleaned_parts, ignore_index=True)
    cleaned = cleaned.sort_values(["frame_idx", "landmark_id"]).reset_index(drop=True)

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_jsonl.parent.mkdir(parents=True, exist_ok=True)

    cleaned.to_csv(out_csv, index=False)
    cleaned.to_json(out_json, orient="records", force_ascii=False, indent=2)
    cleaned.to_json(out_jsonl, orient="records", lines=True, force_ascii=False)

    print(f"Saved clean CSV: {out_csv.resolve()}")
    print(f"Saved clean JSON: {out_json.resolve()}")
    print(f"Saved clean JSONL: {out_jsonl.resolve()}")
    print(f"Rows: {len(cleaned)}")


if __name__ == "__main__":
    main()
