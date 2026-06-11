export function getFrameIndexAtTime(elapsedMs, fps, frameCount, loop = true) {
  if (!frameCount || !fps) return 0;

  const rawIndex = Math.floor((elapsedMs / 1000) * fps);
  if (loop) return ((rawIndex % frameCount) + frameCount) % frameCount;
  return Math.max(0, Math.min(frameCount - 1, rawIndex));
}

export function getFrameAtTime({ frames, fps, elapsedMs, loop = true }) {
  if (!frames?.length) return null;
  const index = getFrameIndexAtTime(elapsedMs, fps, frames.length, loop);
  return {
    frame: frames[index],
    frameIndex: index,
  };
}
