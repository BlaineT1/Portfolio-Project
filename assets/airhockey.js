/* Air Hockey, local two players on one keyboard. Player 1 (cyan) uses WASD
   and stays on the left half; Player 2 (pink) uses the arrow keys and
   stays on the right half. First to 7 goals wins the match; the match
   score (best of however many you play) is tracked for the session only,
   since there's no single "you" to save a best score for. */

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const p1El = document.getElementById("p1-score");
  const p2El = document.getElementById("p2-score");
  const matchesEl = document.getElementById("matches");

  const W = canvas.width, H = canvas.height;
  const R_PADDLE = 22, R_PUCK = 11, GOAL_H = 120, WIN_SCORE = 7;
  const MID = W / 2;

  let p1, p2, puck, score1, score2, matches1, matches2, raf, serveTo;
  let keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };
  let state = "idle"; // idle | serving | running | over

  function resetPositions() {
    p1 = { x: W * 0.15, y: H / 2, vx: 0, vy: 0 };
    p2 = { x: W * 0.85, y: H / 2, vx: 0, vy: 0 };
    puck = { x: MID, y: H / 2, vx: 0, vy: 0 };
  }

  function newMatch() {
    score1 = 0; score2 = 0;
    resetPositions();
    serveTo = Math.random() < 0.5 ? 1 : 2;
    updateHud();
  }

  function serve() {
    resetPositions();
    const dir = serveTo === 1 ? -1 : 1;
    puck.vx = dir * 3.2;
    puck.vy = (Math.random() - 0.5) * 3;
    state = "running";
    overlay.classList.add("hidden");
  }

  function updateHud() {
    p1El.textContent = String(score1);
    p2El.textContent = String(score2);
    matchesEl.textContent = matches1 + " – " + matches2;
  }

  function start() {
    cancelAnimationFrame(raf);
    if (matches1 === undefined) { matches1 = 0; matches2 = 0; }
    newMatch();
    state = "serving";
    overlayTitle.textContent = "GET READY";
    overlayMsg.textContent = (serveTo === 1 ? "Cyan" : "Pink") + " serves first.";
    overlayBtn.textContent = "SERVE";
    overlay.classList.remove("hidden");
    loop();
  }

  function loop() {
    if (state !== "running") { raf = requestAnimationFrame(loop); return; }
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function movePaddle(p, left, right, up, down, minX, maxX) {
    const accel = 0.9, friction = 0.86, maxSpeed = 7;
    if (left) p.vx -= accel; if (right) p.vx += accel;
    if (up) p.vy -= accel; if (down) p.vy += accel;
    p.vx *= friction; p.vy *= friction;
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
    p.vy = Math.max(-maxSpeed, Math.min(maxSpeed, p.vy));
    p.x += p.vx; p.y += p.vy;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(R_PADDLE, Math.min(H - R_PADDLE, p.y));
  }

  function puckVsPaddle(p) {
    const dx = puck.x - p.x, dy = puck.y - p.y;
    const dist = Math.hypot(dx, dy);
    const minDist = R_PADDLE + R_PUCK;
    if (dist < minDist && dist > 0) {
      const nx = dx / dist, ny = dy / dist;
      puck.x = p.x + nx * minDist;
      puck.y = p.y + ny * minDist;
      const speed = Math.hypot(puck.vx, puck.vy);
      const paddleSpeed = Math.hypot(p.vx, p.vy);
      const power = Math.max(speed, 3) + paddleSpeed * 0.5;
      puck.vx = nx * power;
      puck.vy = ny * power;
      Sound.bounce();
    }
  }

  function update() {
    movePaddle(p1, keys.a, keys.d, keys.w, keys.s, R_PADDLE, MID - R_PADDLE);
    movePaddle(p2, keys.left, keys.right, keys.up, keys.down, MID + R_PADDLE, W - R_PADDLE);

    puck.x += puck.vx; puck.y += puck.vy;
    puck.vx *= 0.995; puck.vy *= 0.995;

    // Top/bottom walls
    if (puck.y - R_PUCK < 0) { puck.y = R_PUCK; puck.vy *= -1; Sound.bounce(); }
    if (puck.y + R_PUCK > H) { puck.y = H - R_PUCK; puck.vy *= -1; Sound.bounce(); }

    // Left/right walls, with a goal mouth centered vertically
    const goalTop = H / 2 - GOAL_H / 2, goalBottom = H / 2 + GOAL_H / 2;
    const inGoalMouth = puck.y > goalTop && puck.y < goalBottom;
    if (puck.x - R_PUCK < 0) {
      if (inGoalMouth && puck.x < -R_PUCK) { score(2); return; }
      if (!inGoalMouth) { puck.x = R_PUCK; puck.vx *= -1; Sound.bounce(); }
    }
    if (puck.x + R_PUCK > W) {
      if (inGoalMouth && puck.x > W + R_PUCK) { score(1); return; }
      if (!inGoalMouth) { puck.x = W - R_PUCK; puck.vx *= -1; Sound.bounce(); }
    }

    puckVsPaddle(p1);
    puckVsPaddle(p2);
  }

  function score(who) {
    if (who === 1) score1 += 1; else score2 += 1;
    updateHud();
    Sound.point();
    if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) return matchOver(who);
    serveTo = who === 1 ? 2 : 1;
    state = "serving";
    resetPositions();
    overlayTitle.textContent = (who === 1 ? "CYAN" : "PINK") + " SCORES";
    overlayMsg.textContent = (serveTo === 1 ? "Cyan" : "Pink") + " serves next.";
    overlayBtn.textContent = "SERVE";
    overlay.classList.remove("hidden");
  }

  function matchOver(who) {
    state = "over";
    if (who === 1) matches1 += 1; else matches2 += 1;
    updateHud();
    Sound.win();
    overlayTitle.textContent = (who === 1 ? "CYAN" : "PINK") + " WINS THE MATCH!";
    overlayMsg.textContent = score1 + " – " + score2 + " · Matches this session: " + matches1 + " – " + matches2;
    overlayBtn.textContent = "NEW MATCH";
    overlay.classList.remove("hidden");
  }

  function drawPaddle(p, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.arc(p.x, p.y, R_PADDLE, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function draw() {
    ctx.fillStyle = "#0c0c1c";
    ctx.fillRect(0, 0, W, H);

    // Center line and circle
    ctx.strokeStyle = "#2c2c52";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(MID, 0); ctx.lineTo(MID, H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(MID, H / 2, 46, 0, Math.PI * 2); ctx.stroke();

    // Goal mouths
    const goalTop = H / 2 - GOAL_H / 2, goalBottom = H / 2 + GOAL_H / 2;
    ctx.strokeStyle = "#ff2e88";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, goalTop); ctx.lineTo(0, goalBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W, goalTop); ctx.lineTo(W, goalBottom); ctx.stroke();

    drawPaddle(p1, "#00e5ff");
    drawPaddle(p2, "#ff2e88");

    ctx.beginPath();
    ctx.fillStyle = "#eaeaf8";
    ctx.shadowColor = "#eaeaf8";
    ctx.shadowBlur = 8;
    ctx.arc(puck.x, puck.y, R_PUCK, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) { keys[k] = true; e.preventDefault(); }
    if (k === "arrowup") { keys.up = true; e.preventDefault(); }
    if (k === "arrowdown") { keys.down = true; e.preventDefault(); }
    if (k === "arrowleft") { keys.left = true; e.preventDefault(); }
    if (k === "arrowright") { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) keys[k] = false;
    if (k === "arrowup") keys.up = false;
    if (k === "arrowdown") keys.down = false;
    if (k === "arrowleft") keys.left = false;
    if (k === "arrowright") keys.right = false;
  });

  overlayBtn.addEventListener("click", () => {
    if (state === "idle" || state === "over") start();
    else serve();
  });

  resetPositions();
  matches1 = 0; matches2 = 0;
  score1 = 0; score2 = 0;
  updateHud();
  draw();
  raf = requestAnimationFrame(loop);

  // Exposed for the arcade's browser tests
  window.__airhockey = {
    state: () => ({ state, score1, score2, matches1, matches2, puck, p1, p2 }),
    start, serve,
    forceScore: (who) => score(who),
  };
})();
