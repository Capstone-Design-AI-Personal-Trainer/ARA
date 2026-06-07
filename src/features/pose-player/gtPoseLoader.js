export async function loadGtPose(source = "/gt_pose_clean.json") {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to load GT pose: ${response.status}`);
  }

  const data = await response.json();
  const fps = Number(data?.fps) || 30;
  const frames = Array.isArray(data?.frames) ? data.frames : [];

  if (!frames.length) {
    throw new Error("GT pose has no frames.");
  }

  return { fps, frames };
}
