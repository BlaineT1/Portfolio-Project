(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const bestEl = document.getElementById("best");

  const CELL = 32;
  const COLS = 13;
  const ROWS = 13;
  const W = canvas.width; // 416
  const H = canvas.height; // 416
  const START_ROW = 12;
  const GOAL_ROW = 0;

  // Row types: rows 1–5 river (logs), 6 median, 7–11 road (cars), 12 start
  const LANES = {
    1: { kind: "log", speed: 0.55, len: 3, n: 3 },
    2: { kind: "log", speed: -0.5, len: 2, n: 3 },
    3: { kind: "log", speed: 0.8, len: 4, n: 2 },
    4: { kind: "log", speed: -0.6, len: 2, n: 3 },
    5: { kind: "log", speed: 0.5, len: 3, n: 3 },
    7: { kind: "car", speed: -1.2, len: 2, n: 3, color: "#ff2e88" },
    8: { kind: "car", speed: 1.0, len: 1, n: 4, color: "#ffb020" },
    9: { kind: "car", speed: -1.7, len: 1, n: 3, color: "#00e5ff" },
    10: { kind: "car", speed: 1.3, len: 2, n: 3, color: "#ff7a1a" },
    11: { kind: "car", speed: -0.9, len: 1, n: 4, color: "#8b5cf6" },
  };

  let lanes, frog, score, lives, crossings, level, raf;
  let state = "idle"; // idle | running | over

  bestEl.textContent = Arcade.getBest("froggy");

  function buildLanes() {
    lanes = {};
    for (const [row, cfg] of Object.entries(LANES)) {
      const span = W + cfg.len * CELL + 40;
      const spacing = span / cfg.n;
      const items = [];
      for (let i = 0; i < cfg.n; i++) {
        items.push({ x: i * spacing + Math.random() * 30 - cfg.len * CELL });
      }
      lanes[row] = { ...cfg, span, items };
    }
  }

  function resetFrog() {
    frog = { px: 6 * CELL, row: START_ROW };
  }

  function reset() {
    score = 0;
    lives = 3;
    crossings = 0;
    level = 1;
    buildLanes();
    resetFrog();
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    livesEl.textContent = "❤".repeat(lives) || "—";
  }

  function start() {
    cancelAnimationFrame(raf);
    reset();
    state = "running";
    overlay.classList.add("hidden");
    loop();
  }

  function loop() {
    if (state !== "running") return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function speedMult() {
    return 1 + (level - 1) * 0.2;
  }

  function update() {
    for (const lane of Object.values(lanes)) {
      const v = lane.speed * speedMult();
      for (const item of lane.items) {
        item.x += v;
        if (v > 0 && item.x > lane.span - lane.len * CELL) item.x -= lane.span;
        if (v < 0 && item.x < -lane.len * CELL) item.x += lane.span;
      }
    }

    const lane = lanes[frog.row];
    if (lane) {
      const fx1 = frog.px + 6;
      const fx2 = frog.px + CELL - 6;
      if (lane.kind === "car") {
        for (const c of lane.items) {
          if (fx1 < c.x + lane.len * CELL && fx2 > c.x) return die();
        }
      } else {
        // River: must be standing on a log
        const center = frog.px + CELL / 2;
        const log = lane.items.find((l) => center >= l.x && center <= l.x + lane.len * CELL);
        if (!log) return die();
        frog.px += lane.speed * speedMult();
        if (frog.px < -12 || frog.px > W - CELL + 12) return die();
      }
    }
  }

  function hop(dx, dy) {
    if (state !== "running") return;
    const nr = frog.row + dy;
    if (nr < GOAL_ROW || nr > START_ROW) return;
    frog.row = nr;
    frog.px = Math.max(0, Math.min(W - CELL, frog.px + dx * CELL));
    if (dy !== 0) Sound.flip();
    else Sound.click();

    if (frog.row === GOAL_ROW) {
      score += 100 * level;
      crossings += 1;
      if (crossings % 5 === 0) level += 1;
      updateHud();
      Sound.point();
      resetFrog();
    }
  }

  function die() {
    lives -= 1;
    updateHud();
    Sound.die();
    resetFrog();
    if (lives <= 0) {
      state = "over";
      cancelAnimationFrame(raf);
      const isBest = Arcade.saveBest("froggy", score);
      bestEl.textContent = Arcade.getBest("froggy");
      overlayTitle.textContent = "GAME OVER";
      overlayMsg.innerHTML = "Score: " + score + (isBest ? "<br>🏆 New best!" : "");
      overlayBtn.textContent = "PLAY AGAIN";
      overlay.classList.remove("hidden");
      draw();
    }
  }

  function rowY(row) {
    return row * CELL;
  }

  function draw() {
    for (let r = 0; r < ROWS; r++) {
      const lane = LANES[r];
      if (r === GOAL_ROW) ctx.fillStyle = "#0f2c1a";
      else if (lane && lane.kind === "log") ctx.fillStyle = "#0e2038";
      else if (lane && lane.kind === "car") ctx.fillStyle = "#0c0c1c";
      else ctx.fillStyle = "#1c1c38";
      ctx.fillRect(0, rowY(r), W, CELL);
    }

    // Goal lily pads
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    for (let i = 0; i < 5; i++) {
      ctx.fillText("🪷", CELL * (1.5 + i * 2.5), rowY(GOAL_ROW) + 24);
    }

    // Lane objects
    for (const [rowStr, lane] of Object.entries(lanes)) {
      const y = rowY(Number(rowStr));
      for (const item of lane.items) {
        if (lane.kind === "log") {
          ctx.fillStyle = "#8a5a2b";
          ctx.beginPath();
          ctx.roundRect(item.x, y + 6, lane.len * CELL, CELL - 12, 10);
          ctx.fill();
        } else {
          ctx.save();
          ctx.shadowColor = lane.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = lane.color;
          ctx.beginPath();
          ctx.roundRect(item.x + 2, y + 5, lane.len * CELL - 4, CELL - 10, 7);
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = "#ffffff";
          const headX = lane.speed > 0 ? item.x + lane.len * CELL - 8 : item.x + 4;
          ctx.fillRect(headX, y + 10, 4, 4);
          ctx.fillRect(headX, y + CELL - 14, 4, 4);
        }
      }
    }

    // Road lane dashes
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.setLineDash([12, 14]);
    for (let r = 8; r <= 11; r++) {
      ctx.beginPath();
      ctx.moveTo(0, rowY(r));
      ctx.lineTo(W, rowY(r));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Frog
    ctx.font = "24px serif";
    ctx.fillText("🐸", frog.px + CELL / 2, rowY(frog.row) + 25);
  }

  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const map = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    };
    if (map[k]) {
      e.preventDefault();
      hop(...map[k]);
    }
  });

  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return hop(0, -1); // tap = hop forward
      if (Math.abs(dx) > Math.abs(dy)) hop(Math.sign(dx), 0);
      else hop(0, Math.sign(dy));
    },
    { passive: true }
  );

  overlayBtn.addEventListener("click", start);

  reset();
  draw();
})();
