const DB_NAME = "ara-workout-recordings";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runStore(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function saveWorkoutRecording(recording) {
  if (!recording?.id || !recording.blob) return null;
  const saved = {
    ...recording,
    savedAt: new Date().toISOString(),
  };
  await runStore("readwrite", (store) => store.put(saved));
  return saved;
}

export async function getWorkoutRecording(id) {
  if (!id) return null;
  return runStore("readonly", (store) => store.get(String(id)));
}

export async function getWorkoutRecordings(ids = []) {
  const entries = await Promise.all(ids.map((id) => getWorkoutRecording(id)));
  return entries.filter(Boolean);
}

export async function deleteWorkoutRecording(id) {
  if (!id) return;
  await runStore("readwrite", (store) => store.delete(String(id)));
}
