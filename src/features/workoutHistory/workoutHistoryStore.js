const WORKOUT_HISTORY_KEY = "ara_workout_history";
const MAX_RECORDS = 100;

function getCachedUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return String(user?.email || "guest").trim().toLowerCase();
  } catch {
    return "guest";
  }
}

function getStorageKey() {
  return `${WORKOUT_HISTORY_KEY}:${encodeURIComponent(getCachedUserEmail())}`;
}

export function getCachedWorkoutHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(getStorageKey()) || "[]");
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

export function saveCachedWorkout(record) {
  const normalized = {
    ...record,
    id: String(record.id || `local-${Date.now()}`),
    localRecordId: String(record.localRecordId || record.id || `local-${Date.now()}`),
    createdAt: record.createdAt || new Date().toISOString(),
    cachedAt: new Date().toISOString(),
  };
  const history = getCachedWorkoutHistory()
    .filter((item) => String(item.id) !== normalized.id)
    .filter((item) => String(item.localRecordId) !== normalized.localRecordId);

  localStorage.setItem(
    getStorageKey(),
    JSON.stringify([normalized, ...history].slice(0, MAX_RECORDS)),
  );
  return normalized;
}

export function replaceCachedWorkoutId(localId, serverRecord) {
  const history = getCachedWorkoutHistory();
  const existing = history.find((item) => String(item.id) === String(localId));
  return saveCachedWorkout({
    ...existing,
    ...serverRecord,
    id: String(serverRecord.id),
    localRecordId: existing?.localRecordId || String(localId),
  });
}

export function getCachedWorkout(id) {
  return getCachedWorkoutHistory().find((item) => String(item.id) === String(id)) || null;
}

export function mergeWorkoutHistory(serverRecords = [], cachedRecords = []) {
  const merged = new Map();

  cachedRecords.forEach((record) => {
    merged.set(String(record.id), { ...record, source: "cache" });
  });
  serverRecords.forEach((record) => {
    const cached = cachedRecords.find((item) => (
      String(item.id) === String(record.id)
      || (item.localRecordId && item.localRecordId === record.localRecordId)
    ));
    merged.set(String(record.id), { ...cached, ...record, source: "server" });
    if (cached && String(cached.id) !== String(record.id)) {
      merged.delete(String(cached.id));
    }
  });

  return Array.from(merged.values()).sort((a, b) => (
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ));
}
