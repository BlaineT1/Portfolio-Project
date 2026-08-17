(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const linesEl = document.getElementById("lines");
  const levelEl = document.getElementById("level");
  const bestEl = document.getElementById("best");

  const COLS = 10;
  const ROWS = 20;
  const CELL = 24;
  const BOARD_W = COLS * CELL; // 240; the remaining 100px is the sidebar

  const SHAPES = [
    { color: "#00e5ff", m: [[1, 1, 1, 1]] },
    { color: "#ffb020", m: [[1, 1], [1, 1]] },
    { color: "#8b5cf6", m: [[1, 1, 1], [0, 1, 0]] },
    { color: "#a3ff12", m: [[0, 1, 1], [1, 1, 0]] },
    { color: "#ff2e88", m: [[1, 1, 0], [0, 1, 1]] },
    { color: "#4a9eff", m: [[1, 0, 0], [1, 1, 1]] },
    { color: "#ff7a1a", m: [[0, 0, 1], [1, 1, 1]] },
  ];

  let board, cur, next, score, lines, level, delay, timer;
  let state = "idle"; // idle | running | paused | over

  bestEl.textContent = Arcade.getBest("tetris");

  function randPiece() {
    const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return { m: s.m.map((r) => [...r]), color: s.color, x: 0, y: 0 };
  }

  function reset() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    level = 1;
    delay = 700;
    next = randPiece();
    spawn();
    updateHud();
  }

  function spawn() {
    cur = next;
    next = randPiece();
    cur.x = Math.floor((COLS - cur.m[0].length) / 2);
    cur.y = 0;
    if (collides(cur.m, cur.x, cur.y)) gameOver();
  }

  function collides(m, x, y) {
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    linesEl.textContent = String(lines);
    levelEl.textContent = String(level);
  }

  function start() {
    clearTimeout(timer);
    state = "running";
    reset();
    overlay.classList.add("hidden");
    draw();
    timer = setTimeout(tick, delay);
  }

  function tick() {
    if (state !== "running") return;
    if (!collides(cur.m, cur.x, cur.y + 1)) cur.y += 1;
    else lock();
    draw();
    if (state === "running") timer = setTimeout(tick, delay);
  }

  function lock() {
    for (let r = 0; r < cur.m.length; r++) {
      for (let c = 0; c < cur.m[r].length; c++) {
        if (cur.m[r][c]) board[cur.y + r][cur.x + c] = cur.color;
      }
    }
    clearLines();
    if (state === "running") spawn();
  }

  function clearLines() {
    const kept = board.filter((row) => row.some((v) => !v));
    const n = ROWS - kept.length;
    if (!n) return;
    while (kept.length < ROWS) kept.unshift(Array(COLS).fill(0));
    board = kept;
    score += [0, 100, 300, 500, 800][n] * level;
    lines += n;
    level = 1 + Math.floor(lines / 10);
    delay = Math.max(80, 700 - (level - 1) * 60);
    updateHud();
  }

  function move(dx) {
    if (state !== "running") return;
    if (!collides(cur.m, cur.x + dx, cur.y)) cur.x += dx;
    draw();
  }

  function rotate() {
    if (state !== "running") return;
    const nm = cur.m[0].map((_, i) => cur.m.map((row) => row[i]).reverse());
    for (const off of [0, -1, 1, -2, 2]) {
      if (!collides(nm, cur.x + off, cur.y)) {
        cur.m = nm;
        cur.x += off;
        break;
      }
    }
    draw();
  }

  function softDrop() {
    if (state !== "running") return;
    if (!collides(cur.m, cur.x, cur.y + 1)) {
      cur.y += 1;
      score += 1;
      updateHud();
    } else {
      lock();
    }
    draw();
  }

  function hardDrop() {
    if (state !== "running") return;
    while (!collides(cur.m, cur.x, cur.y + 1)) {
      cur.y += 1;
      score += 2;
    }
    updateHud();
    lock();
    draw();
  }

  function gameOver() {
    state = "over";
    clearTimeout(timer);
    const isBest = Arcade.saveBest("tetris", score);
    bestEl.textContent = Arcade.getBest("tetris");
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML =
      "Score: " + score + " · Lines: " + lines + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    clearTimeout(timer);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "The stack will wait.";
    overlayBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  }

  function resume() {
    state = "running";
    overlay.classList.add("hidden");
    draw();
    timer = setTimeout(tick, delay);
  }

  function drawCell(col, row, color, alpha = 1) {
    if (row < 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const pad = 1.5;
    const x = col * CELL + pad;
    const y = row * CELL + pad;
    const s = CELL - pad * 2;
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function draw() {
    // Board background
    ctx.fillStyle = "#0c0c1c";
    ctx.fillRect(0, 0, BOARD_W, canvas.height);
    // Sidebar
    ctx.fillStyle = "#12122a";
    ctx.fillRect(BOARD_W, 0, canvas.width - BOARD_W, canvas.height);
    ctx.strokeStyle = "#2c2c52";
    ctx.beginPath();
    ctx.moveTo(BOARD_W + 0.5, 0);
    ctx.lineTo(BOARD_W + 0.5, canvas.height);
    ctx.stroke();

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(BOARD_W, r * CELL);
      ctx.stroke();
    }

    // Settled cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(c, r, board[r][c]);
      }
    }

    if (state === "running" || state === "paused") {
      // Ghost piece
      let gy = cur.y;
      while (!collides(cur.m, cur.x, gy + 1)) gy += 1;
      for (let r = 0; r < cur.m.length; r++) {
        for (let c = 0; c < cur.m[r].length; c++) {
          if (cur.m[r][c]) drawCell(cur.x + c, gy + r, cur.color, 0.18);
        }
      }
      // Current piece
      for (let r = 0; r < cur.m.length; r++) {
        for (let c = 0; c < cur.m[r].length; c++) {
          if (cur.m[r][c]) drawCell(cur.x + c, cur.y + r, cur.color);
        }
      }
    }

    // Next piece preview
    ctx.fillStyle = "#9494b8";
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("NEXT", BOARD_W + 50, 30);
    if (next) {
      const s = 16;
      const w = next.m[0].length * s;
      const h = next.m.length * s;
      const ox = BOARD_W + 50 - w / 2;
      const oy = 70 - h / 2;
      ctx.fillStyle = next.color;
      for (let r = 0; r < next.m.length; r++) {
        for (let c = 0; c < next.m[r].length; c++) {
          if (!next.m[r][c]) continue;
          ctx.beginPath();
          ctx.roundRect(ox + c * s + 1, oy + r * s + 1, s - 2, s - 2, 3);
          ctx.fill();
        }
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "p") {
      if (state === "running") pause();
      else if (state === "paused") resume();
      return;
    }
    if (state !== "running") return;
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); move(-1); break;
      case "ArrowRight": e.preventDefault(); move(1); break;
      case "ArrowUp": e.preventDefault(); rotate(); break;
      case "ArrowDown": e.preventDefault(); softDrop(); break;
      case " ": e.preventDefault(); hardDrop(); break;
    }
  });

  function bindPad(id, fn) {
    const btn = document.getElementById(id);
    btn.addEventListener("click", () => {
      fn();
      btn.blur(); // keep Space from re-triggering the button
    });
  }
  bindPad("btn-left", () => move(-1));
  bindPad("btn-right", () => move(1));
  bindPad("btn-rot", rotate);
  bindPad("btn-down", softDrop);
  bindPad("btn-drop", hardDrop);

  overlayBtn.addEventListener("click", () => {
    if (state === "paused") resume();
    else start();
  });

  // Idle preview: empty board behind the start overlay
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  next = null;
  draw();
})();
