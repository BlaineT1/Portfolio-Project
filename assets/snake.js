(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");

  const COLS = 20;
  const ROWS = 20;
  const CELL = canvas.width / COLS;

  let snake, dir, nextDir, food, score, delay, timer;
  let state = "idle"; // idle | running | paused | over

  bestEl.textContent = Arcade.getBest("snake");

  function reset() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    delay = 140;
    scoreEl.textContent = "0";
    placeFood();
  }

  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }

  function start() {
    clearTimeout(timer);
    reset();
    state = "running";
    overlay.classList.add("hidden");
    tick();
  }

  function tick() {
    if (state !== "running") return;
    step();
    draw();
    if (state === "running") timer = setTimeout(tick, delay);
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
    // The tail cell is about to vacate, so it's safe to move into.
    const body = snake.slice(0, -1);
    const hitSelf = body.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      Sound.eat();
      score += 10;
      scoreEl.textContent = String(score);
      delay = Math.max(60, delay - 3);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    state = "over";
    clearTimeout(timer);
    Sound.die();
    const isBest = Arcade.saveBest("snake", score);
    bestEl.textContent = Arcade.getBest("snake");
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML =
      "Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    clearTimeout(timer);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "Take a breath.";
    overlayBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  }

  function resume() {
    state = "running";
    overlay.classList.add("hidden");
    tick();
  }

  function draw() {
    ctx.fillStyle = "#0c0c1c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(canvas.width, i * CELL);
      ctx.stroke();
    }

    // Food
    ctx.save();
    ctx.shadowColor = "#ff2e88";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff2e88";
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL * 0.32,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Snake
    snake.forEach((seg, i) => {
      const t = i / snake.length;
      ctx.fillStyle = i === 0 ? "#d4ff5e" : `rgba(163, 255, 18, ${1 - t * 0.6})`;
      const pad = 1.5;
      roundRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        5
      );
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  const KEY_DIRS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (k === " " || k === "p") {
      e.preventDefault();
      if (state === "running") pause();
      else if (state === "paused") resume();
      return;
    }

    const d = KEY_DIRS[k];
    if (!d) return;
    e.preventDefault();
    if (state === "idle" || state === "over") return;
    if (d.x === -dir.x && d.y === -dir.y) return; // no 180° turns
    nextDir = d;
  });

  // Swipe controls
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
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const d =
        Math.abs(dx) > Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) };
      if (state === "running" && !(d.x === -dir.x && d.y === -dir.y)) {
        nextDir = d;
      }
    },
    { passive: true }
  );

  overlayBtn.addEventListener("click", () => {
    if (state === "paused") resume();
    else start();
  });

  reset();
  draw();
})();
