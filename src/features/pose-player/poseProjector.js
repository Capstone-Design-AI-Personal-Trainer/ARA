function getContainRect(width, height, aspectWidth = 1, aspectHeight = 1) {
  const scale = Math.min(width / aspectWidth, height / aspectHeight);
  const renderWidth = aspectWidth * scale;
  const renderHeight = aspectHeight * scale;

  return {
    x: (width - renderWidth) / 2,
    y: (height - renderHeight) / 2,
    width: renderWidth,
    height: renderHeight,
  };
}

function getCoverRect(width, height, aspectWidth = 1, aspectHeight = 1) {
  const scale = Math.max(width / aspectWidth, height / aspectHeight);
  const renderWidth = aspectWidth * scale;
  const renderHeight = aspectHeight * scale;

  return {
    x: (width - renderWidth) / 2,
    y: (height - renderHeight) / 2,
    width: renderWidth,
    height: renderHeight,
  };
}

export function projectPoseFrame(frame, canvasWidth, canvasHeight, options = {}) {
  if (!Array.isArray(frame)) return [];

  const {
    fit = "contain",
    aspectWidth = 1,
    aspectHeight = 1,
    mirrored = false,
    padding = 0.08,
  } = options;

  const rect = fit === "cover"
    ? getCoverRect(canvasWidth, canvasHeight, aspectWidth, aspectHeight)
    : getContainRect(
      canvasWidth,
      canvasHeight,
      1 + padding * 2,
      1 + padding * 2
    );

  return frame.map((point) => {
    if (!point) return point;
    const x = mirrored ? 1 - point.x : point.x;
    if (fit === "cover") {
      return {
        ...point,
        x: rect.x + x * rect.width,
        y: rect.y + point.y * rect.height,
      };
    }

    return {
      ...point,
      x: rect.x + (x + padding) * (rect.width / (1 + padding * 2)),
      y: rect.y + (point.y + padding) * (rect.height / (1 + padding * 2)),
    };
  });
}
