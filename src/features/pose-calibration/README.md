# Pose Calibration

Scan-stage calibration for sizing GT pose playback to the current user.

## Purpose

`pose-player` renders GT motion.
`pose-calibration` measures the current user during the pre-workout scan stage and produces a
calibration payload that can be applied to GT frames before rendering.

This separation lets another teammate work on scan-time body fitting without changing the core
rendering logic.

## Current flow

1. `LivePage` stays in `scan` stage for posture recognition.
2. During that stage, user landmarks are sampled into a calibration session.
3. When scan completes, sampled landmarks are averaged into stable `userMetrics`.
4. `PoseSilhouetteCanvas` receives the finalized calibration payload.
5. GT frames are scaled and re-centered before the silhouette overlay is rendered in `live`.

## Files

- `bodyMetrics.js`
  - build body metrics from one landmark frame
  - average multiple samples into one stable metric set
- `calibrationSession.js`
  - accumulate scan samples
  - finalize a calibration payload
- `gtScaler.js`
  - scale and translate GT frames using calibration
- `calibrationStore.js`
  - optional shared storage helpers for future multi-page use
- `index.js`
  - feature exports

## Calibration payload shape

```js
{
  sampleCount: 24,
  userMetrics: {
    shoulderWidth: 0.18,
    hipWidth: 0.14,
    torsoLen: 0.29,
    center: { x: 0.5, y: 0.61 },
  },
}
```

## Handoff notes

- The current scaling is uniform and intentionally simple.
- Another teammate can replace it with segment-wise fitting later.
- Keep the contract `PoseSilhouetteCanvas({ calibration })` stable so the scan pipeline and the
  render pipeline stay decoupled.
