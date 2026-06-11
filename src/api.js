export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8080" : "");

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("API server is not configured.");
  }

  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function toSessionView(session) {
  return {
    id: session.id,
    exerciseId: session.exerciseId,
    memo: session.memo || session.exerciseName,
    exerciseName: session.exerciseName,
    score: session.accuracyScore,
    reps: session.reps,
    targetReps: session.targetReps,
    durationSec: session.durationSec,
    calories: session.calories,
    reason: session.reason,
    recordingKey: session.recordingKey,
    hasRecording: Boolean(session.hasRecording),
    localRecordId: session.localRecordId,
    createdAt: session.completedAt || session.createdAt,
  };
}
