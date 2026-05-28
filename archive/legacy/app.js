const screens = {
  auth: document.getElementById("screen-auth"),
  home: document.getElementById("screen-home"),
  exercise: document.getElementById("screen-exercise"),
  live: document.getElementById("screen-live"),
  result: document.getElementById("screen-result"),
  records: document.getElementById("screen-records"),
};

const data = {
  recommendations: [
    { name: "무릎 안정화 스쿼트", time: "12분", level: "중급" },
    { name: "허리 코어 브릿지", time: "10분", level: "초급" },
    { name: "어깨 가동성 루틴", time: "14분", level: "중급" },
  ],
  exercises: {
    무릎: ["벽 스쿼트", "레그 레이즈", "슬로우 런지"],
    허리: ["버드독", "브릿지", "데드버그"],
    어깨: ["밴드 외회전", "스캐플라 리트랙션", "월 슬라이드"],
  },
  trend: [62, 68, 71, 74, 77, 83, 87],
};

const liveEls = {
  video: document.getElementById("camera-video"),
  canvas: document.getElementById("pose-canvas"),
  status: document.getElementById("camera-status"),
  feedback: document.getElementById("live-feedback"),
  rep: document.getElementById("rep-count"),
  knee: document.getElementById("knee-angle"),
  hip: document.getElementById("hip-angle"),
  shoulder: document.getElementById("shoulder-angle"),
};

const liveState = {
  repCount: 0,
  stream: null,
  poseLandmarker: null,
  rafId: 0,
  lastVideoTime: -1,
  initialized: false,
  scoreSamples: [],
};

function showScreen(key) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[key].classList.add("active");
  document.querySelectorAll(".bottom-nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === key);
  });
  if (key === "live") startLiveSession();
  else stopLiveSession();
}

function renderHome() {
  const list = document.getElementById("recommend-list");
  list.innerHTML = data.recommendations
    .map((item) => `<article class="recommend-item"><strong>${item.name}</strong><p class="muted">${item.time} · ${item.level}</p></article>`)
    .join("");

  const chart = document.getElementById("mini-chart");
  chart.innerHTML = data.trend
    .map((v) => `<div class="bar" style="height:${v}%;"></div>`)
    .join("");
}

function renderExercise(part = "무릎") {
  const wrap = document.getElementById("exercise-list");
  wrap.innerHTML = data.exercises[part]
    .map(
      (name) => `<article class="glass card exercise-item"><div><strong>${name}</strong><p class="muted">${part} 재활 · 8~12분</p></div><button class="btn primary" data-nav="live">시작</button></article>`
    )
    .join("");
}

function renderResults() {
  const joint = [
    ["무릎", 92],
    ["허리", 85],
    ["어깨", 73],
  ];
  document.getElementById("joint-bars").innerHTML = joint
    .map(
      ([label, val]) => `<div class="joint-row"><div class="top-row"><span>${label}</span><span>${val}%</span></div><div class="joint-track"><div class="joint-fill" style="width:${val}%"></div></div></div>`
    )
    .join("");
}

function renderRecords() {
  const calendar = document.getElementById("calendar-grid");
  const levels = ["", "l1", "l2", "l3"];
  calendar.innerHTML = Array.from({ length: 28 }, (_, i) => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    return `<div class="day ${level}">${i + 1}</div>`;
  }).join("");

  const trend = document.getElementById("trend-chart");
  trend.innerHTML = data.trend
    .map((v) => `<div class="bar" style="height:${v}%;"></div>`)
    .join("");
}

function angle3(a, b, c) {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const abLen = Math.hypot(abx, aby);
  const cbLen = Math.hypot(cbx, cby);
  if (!abLen || !cbLen) return null;
  const cosine = Math.min(1, Math.max(-1, dot / (abLen * cbLen)));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

function gradeAngle(angle, target, tolerance) {
  if (angle === null) return { label: "--", score: 0, level: "danger" };
  const delta = Math.abs(target - angle);
  const score = Math.max(0, 100 - Math.round((delta / tolerance) * 40));
  if (delta < tolerance * 0.5) return { label: `${angle}°`, score, level: "good" };
  if (delta < tolerance) return { label: `${angle}°`, score, level: "warn" };
  return { label: `${angle}°`, score, level: "danger" };
}

function setBadge(el, title, result) {
  el.className = `badge ${result.level}`;
  el.textContent = `${title} ${result.label}`;
}

function drawSkeleton(ctx, pose, w, h) {
  const links = [
    [11, 13], [13, 15], [12, 14], [14, 16], [11, 12],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
    [24, 26], [26, 28],
  ];
  ctx.lineWidth = 2;

  links.forEach(([aIdx, bIdx]) => {
    const a = pose[aIdx];
    const b = pose[bIdx];
    if (!a || !b || a.visibility < 0.4 || b.visibility < 0.4) return;
    ctx.strokeStyle = "rgba(31,181,178,0.9)";
    ctx.beginPath();
    ctx.moveTo((1 - a.x) * w, a.y * h);
    ctx.lineTo((1 - b.x) * w, b.y * h);
    ctx.stroke();
  });

  pose.forEach((p) => {
    if (!p || p.visibility < 0.4) return;
    ctx.fillStyle = "rgba(34,197,94,0.95)";
    ctx.beginPath();
    ctx.arc((1 - p.x) * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

async function initPoseModel() {
  if (liveState.initialized) return;
  liveEls.status.textContent = "MediaPipe 모델 로딩 중...";

  const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
  const fileset = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
  );

  liveState.poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });

  liveState.initialized = true;
}

async function startLiveSession() {
  try {
    liveState.repCount = 0;
    liveState.scoreSamples = [];
    liveEls.rep.textContent = "반복 0회";
    await initPoseModel();

    liveState.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    liveEls.video.srcObject = liveState.stream;
    await liveEls.video.play();
    liveEls.status.textContent = "카메라 연결 완료";

    resizeCanvas();
    processPoseFrame();
  } catch (err) {
    liveEls.status.textContent = "카메라/모델 연결 실패: HTTPS 환경과 권한을 확인해주세요.";
    liveEls.feedback.textContent = "권한 승인 후 다시 시도해주세요.";
    console.error(err);
  }
}

function stopLiveSession() {
  if (liveState.rafId) cancelAnimationFrame(liveState.rafId);
  liveState.rafId = 0;
  if (liveState.stream) {
    liveState.stream.getTracks().forEach((track) => track.stop());
    liveState.stream = null;
  }
}

function resizeCanvas() {
  const rect = liveEls.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  liveEls.canvas.width = w;
  liveEls.canvas.height = h;
}

function updateLiveFeedback(pose) {
  const leftKnee = angle3(pose[23], pose[25], pose[27]);
  const rightKnee = angle3(pose[24], pose[26], pose[28]);
  const kneeAvg = leftKnee && rightKnee ? Math.round((leftKnee + rightKnee) / 2) : leftKnee || rightKnee;

  const leftHip = angle3(pose[11], pose[23], pose[25]);
  const rightHip = angle3(pose[12], pose[24], pose[26]);
  const hipAvg = leftHip && rightHip ? Math.round((leftHip + rightHip) / 2) : leftHip || rightHip;

  const shoulder = angle3(pose[13], pose[11], pose[23]);

  const kneeResult = gradeAngle(kneeAvg, 90, 15);
  const hipResult = gradeAngle(hipAvg, 80, 18);
  const shoulderResult = gradeAngle(shoulder, 65, 15);

  setBadge(liveEls.knee, "무릎", kneeResult);
  setBadge(liveEls.hip, "고관절", hipResult);
  setBadge(liveEls.shoulder, "어깨", shoulderResult);

  const avgScore = Math.round((kneeResult.score + hipResult.score + shoulderResult.score) / 3);
  liveState.scoreSamples.push(avgScore);
  if (liveState.scoreSamples.length > 120) liveState.scoreSamples.shift();

  if (avgScore > 85) liveEls.feedback.textContent = "아주 좋아요. 현재 정렬을 유지하세요.";
  else if (avgScore > 65) liveEls.feedback.textContent = "좋아요. 허리와 어깨 정렬을 조금만 더 맞춰보세요.";
  else liveEls.feedback.textContent = "자세 보정이 필요해요. 천천히 범위를 줄여 수행해보세요.";

  liveState.repCount += 1;
  liveEls.rep.textContent = `반복 ${Math.floor(liveState.repCount / 12)}회`;
}

function processPoseFrame() {
  if (!liveState.poseLandmarker || liveEls.video.readyState < 2) {
    liveState.rafId = requestAnimationFrame(processPoseFrame);
    return;
  }

  const now = performance.now();
  if (liveEls.video.currentTime !== liveState.lastVideoTime) {
    liveState.lastVideoTime = liveEls.video.currentTime;
    const result = liveState.poseLandmarker.detectForVideo(liveEls.video, now);
    const ctx = liveEls.canvas.getContext("2d");
    ctx.clearRect(0, 0, liveEls.canvas.width, liveEls.canvas.height);

    if (result.landmarks && result.landmarks[0]) {
      drawSkeleton(ctx, result.landmarks[0], liveEls.canvas.width, liveEls.canvas.height);
      updateLiveFeedback(result.landmarks[0]);
      liveEls.status.textContent = "실시간 자세 분석 중";
    } else {
      liveEls.status.textContent = "신체를 화면 중앙에 맞춰주세요";
    }
  }

  liveState.rafId = requestAnimationFrame(processPoseFrame);
}

function scoreFromSamples() {
  if (!liveState.scoreSamples.length) return 80;
  const total = liveState.scoreSamples.reduce((sum, s) => sum + s, 0);
  return Math.max(50, Math.min(99, Math.round(total / liveState.scoreSamples.length)));
}

function setupEvents() {
  document.body.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) {
      showScreen(nav.dataset.nav);
      return;
    }

    const partBtn = e.target.closest("[data-part]");
    if (partBtn) {
      document.querySelectorAll("#part-tabs button").forEach((b) => b.classList.remove("active"));
      partBtn.classList.add("active");
      renderExercise(partBtn.dataset.part);
    }

    if (e.target.matches("[data-complete-session]")) {
      document.getElementById("overall-score").textContent = `${scoreFromSamples()}점`;
      showScreen("result");
    }

    const authTab = e.target.closest("[data-auth-tab]");
    if (authTab) {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      authTab.classList.add("active");
      document.querySelector(".signup-only").classList.toggle("hidden", authTab.dataset.authTab !== "signup");
    }
  });

  document.getElementById("auth-form").addEventListener("submit", (e) => {
    e.preventDefault();
    showScreen("home");
  });

  window.addEventListener("resize", resizeCanvas);
}

renderHome();
renderExercise();
renderResults();
renderRecords();
setupEvents();
