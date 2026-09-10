(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const downEl = document.getElementById("down");
  const clockEl = document.getElementById("clock");
  const bestEl = document.getElementById("best");

  const W = canvas.width;
  const H = canvas.height;
  const FIELD_W = 53.3; // yards, sideline to sideline
  const S = H / FIELD_W; // px per yard
  const VIEW = W / S; // yards visible across the canvas
  const GAME_SECONDS = 60;
  const SPEED = { carrier: 0.25, receiver: 0.21, rusher: 0.19, cover: 0.18 };
  const POCKET_FRAMES = 50; // the line holds the rush this long after the snap
  const ORD = ["1st", "2nd", "3rd", "4th"];

  let score, down, seriesStart, los, clock, camX, spot;
  let phase, qb, carrier, receivers, defenders, ball, thrown, message, deadTimer;
  let snapTick, messageTimer, lastTime;
  let keys = { up: false, down: false, left: false, right: false };
  let state = "idle"; // idle | running | paused | over
  let raf;

  bestEl.textContent = Arcade.getBest("neonbowl");

  function firstDownLine() {
    return Math.min(seriesStart + 10, 100);
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    const toGo = Math.max(1, Math.round(firstDownLine() - los));
    downEl.textContent = ORD[down - 1] + " & " + (firstDownLine() >= 100 ? "Goal" : toGo);
    const c = Math.max(0, Math.ceil(clock));
    clockEl.textContent = Math.floor(c / 60) + ":" + String(c % 60).padStart(2, "0");
  }

  function clampCam(x) {
    return Math.max(-10, Math.min(110 - VIEW, x - VIEW * 0.4));
  }

  function setupPlay() {
    phase = "presnap";
    qb = { x: los - 4, y: FIELD_W / 2, vx: 0, vy: 0 };
    carrier = qb;
    receivers = [
      { x: los, y: 9, vx: SPEED.receiver, vy: 0.04 },
      { x: los, y: FIELD_W - 9, vx: SPEED.receiver, vy: -0.04 },
    ];
    defenders = [
      { x: los + 3, y: 9, cover: 0 },
      { x: los + 3, y: FIELD_W - 9, cover: 1 },
      { x: los + 6, y: 17, cover: -1 },
      { x: los + 5, y: FIELD_W / 2, cover: -1 },
      { x: los + 6, y: FIELD_W - 17, cover: -1 },
    ];
    ball = null;
    thrown = false;
    camX = clampCam(carrier.x);
    updateHud();
  }

  function newDrive(from) {
    los = from;
    seriesStart = from;
    down = 1;
    setupPlay();
  }

  function reset() {
    score = 0;
    clock = GAME_SECONDS;
    message = "";
    newDrive(25);
  }

  function start() {
    cancelAnimationFrame(raf);
    reset();
    state = "running";
    overlay.classList.add("hidden");
    lastTime = undefined;
    raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    if (state !== "running") return;
    const dt = lastTime === undefined ? 0 : Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function snap() {
    if (state !== "running" || phase !== "presnap") return;
    phase = "live";
    message = "";
    snapTick = 0;
    Sound.click();
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function moveToward(o, tx, ty, speed) {
    const dx = tx - o.x;
    const dy = ty - o.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = Math.min(speed, d);
    o.x += (dx / d) * step;
    o.y += (dy / d) * step;
  }

  function throwTo(r) {
    if (state !== "running" || phase !== "live" || carrier !== qb || thrown) return;
    thrown = true;
    const T = Math.round(Math.max(22, Math.min(55, dist(qb, r) * 1.6)));
    ball = { from: { x: qb.x, y: qb.y }, to: r, t: 0, T };
    Sound.flip();
  }

  function throwOpen() {
    if (carrier !== qb) return;
    const gap = (r) => Math.min(...defenders.map((d) => dist(d, r)));
    throwTo(receivers[0] && gap(receivers[0]) >= gap(receivers[1]) ? receivers[0] : receivers[1]);
  }

  function update(dt) {
    if (phase === "dead") {
      deadTimer -= 1;
      if (deadTimer <= 0) resolvePlay();
      return;
    }
    if (phase !== "live") return;

    clock = Math.max(0, clock - dt);
    snapTick += 1;
    if (messageTimer > 0 && --messageTimer === 0) message = "";

    // Carrier movement
    const mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (mx || my) {
      const m = Math.hypot(mx, my);
      carrier.x += (mx / m) * SPEED.carrier;
      carrier.y += (my / m) * SPEED.carrier;
    }
    carrier.x = Math.max(-9, carrier.x);

    // Receivers run their routes
    for (const r of receivers) {
      if (r === carrier) continue;
      r.x = Math.min(108, r.x + r.vx);
      r.y += r.vy;
      if (Math.abs(r.y - FIELD_W / 2) < 6) r.vy = 0; // level off near the hashes
    }

    // Ball in flight
    if (ball) {
      ball.t += 1;
      if (ball.t >= ball.T) {
        const r = ball.to;
        const nearest = Math.min(...defenders.map((d) => dist(d, r)));
        ball = null;
        if (nearest > 1.4) {
          carrier = r;
          message = "CAUGHT!";
          messageTimer = 60;
          Sound.match();
        } else {
          Sound.bounce();
          return endPlay(los, "INCOMPLETE");
        }
      }
    }

    // Defenders: cover men shadow their receiver until the ball moves, rushers hunt the carrier
    for (const d of defenders) {
      if (ball) moveToward(d, ball.to.x, ball.to.y, SPEED.cover + 0.06); // break on the ball
      else if (d.cover >= 0 && carrier === qb) moveToward(d, receivers[d.cover].x - 2, receivers[d.cover].y, SPEED.cover);
      else if (d.cover < 0 && carrier === qb && snapTick < POCKET_FRAMES) continue; // held at the line
      else moveToward(d, carrier.x, carrier.y, SPEED.rusher);
    }

    if (carrier.x >= 100) return endPlay(100, "TOUCHDOWN!");
    if (carrier.y < 0.4 || carrier.y > FIELD_W - 0.4) return endPlay(carrier.x, "OUT OF BOUNDS");
    if (!ball && defenders.some((d) => dist(d, carrier) < 1.1)) {
      return endPlay(carrier.x, carrier === qb && carrier.x < los ? "SACKED!" : "TACKLED");
    }

    camX = clampCam(carrier.x);
    updateHud();
  }

  function endPlay(at, msg) {
    phase = "dead";
    spot = Math.max(1, Math.min(100, at));
    message = msg;
    deadTimer = 55;
    if (msg === "TOUCHDOWN!") {
      score += 7;
      Sound.win();
    } else if (msg !== "INCOMPLETE") {
      Sound.lockPiece();
    }
    updateHud();
  }

  function resolvePlay() {
    if (clock <= 0) return gameOver();
    if (spot >= 100) {
      newDrive(25);
      message = "KICKOFF · YOUR BALL AT THE 25";
      return;
    }
    if (spot >= firstDownLine()) {
      seriesStart = spot;
      down = 1;
      los = spot;
      setupPlay();
      message = "FIRST DOWN!";
      Sound.point();
      return;
    }
    down += 1;
    if (down > 4) {
      newDrive(25);
      message = "TURNOVER ON DOWNS";
      Sound.die();
      return;
    }
    los = spot;
    setupPlay();
  }

  function gameOver() {
    state = "over";
    cancelAnimationFrame(raf);
    const isBest = Arcade.saveBest("neonbowl", score);
    bestEl.textContent = Arcade.getBest("neonbowl");
    overlayTitle.textContent = "FINAL WHISTLE";
    overlayMsg.innerHTML =
      "You scored " + score + " points" + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "TIMEOUT";
    overlayMsg.textContent = "The clock is stopped.";
    overlayBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  }

  function resume() {
    state = "running";
    overlay.classList.add("hidden");
    lastTime = undefined;
    raf = requestAnimationFrame(loop);
  }

  const px = (x) => (x - camX) * S;

  function vline(x, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(x), 0);
    ctx.lineTo(px(x), H);
    ctx.stroke();
  }

  function dot(o, r, color, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px(o.x), o.y * S, r * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    // Turf bands, end zones
    for (let yd = -10; yd < 110; yd += 5) {
      const light = ((yd + 10) / 5) % 2 === 0;
      ctx.fillStyle = yd < 0 ? "#3a1030" : yd >= 100 ? "#0f3340" : light ? "#123b22" : "#0f331d";
      ctx.fillRect(px(yd), 0, 5 * S + 1, H);
    }

    // Yard lines and numbers
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    for (let yd = 0; yd <= 100; yd += 5) {
      ctx.beginPath();
      ctx.moveTo(px(yd), 0);
      ctx.lineTo(px(yd), H);
      ctx.stroke();
      if (yd % 10 === 0 && yd > 0 && yd < 100) {
        const n = String(yd <= 50 ? yd : 100 - yd);
        ctx.fillText(n, px(yd), 22);
        ctx.fillText(n, px(yd), H - 12);
      }
    }
    ctx.save();
    ctx.translate(px(105), H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "rgba(0,229,255,0.5)";
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText("END ZONE", 0, 5);
    ctx.restore();

    vline(los, "#4a9eff");
    vline(firstDownLine(), "#ffe14a");

    // Players
    for (const d of defenders) dot(d, 0.9, "#ff2e88");
    for (const r of receivers) if (r !== carrier) dot(r, 0.9, "#a3ff12");
    if (carrier !== qb) dot(qb, 0.8, "#6a7a90");
    dot(carrier, 1.05, "#00e5ff", true);

    // Ball
    if (ball) {
      const p = ball.t / ball.T;
      const bx = ball.from.x + (ball.to.x - ball.from.x) * p;
      const by = ball.from.y + (ball.to.y - ball.from.y) * p;
      const lift = Math.sin(Math.PI * p);
      ctx.save();
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(px(bx), by * S - lift * 18, 3.5 + lift * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Messages
    if (message) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 12;
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText(message, W / 2, H / 2 - 40);
      ctx.restore();
    }
    if (phase === "presnap" && state === "running") {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText("SPACE / TAP TO SNAP", W / 2, H - 30);
    }
  }

  // Keyboard
  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "ArrowUp" || k === "w") (keys.up = true), e.preventDefault();
    if (k === "ArrowDown" || k === "s") (keys.down = true), e.preventDefault();
    if (k === "ArrowLeft" || k === "a") (keys.left = true), e.preventDefault();
    if (k === "ArrowRight" || k === "d") (keys.right = true), e.preventDefault();
    if (k === " ") {
      e.preventDefault();
      if (phase === "presnap") snap();
      else throwOpen();
    }
    if (k === "p") {
      if (state === "running") pause();
      else if (state === "paused") resume();
    }
  });
  document.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "ArrowUp" || k === "w") keys.up = false;
    if (k === "ArrowDown" || k === "s") keys.down = false;
    if (k === "ArrowLeft" || k === "a") keys.left = false;
    if (k === "ArrowRight" || k === "d") keys.right = false;
  });

  // Pointer: tap/click a receiver to throw; tap to snap
  function receiverAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = ((clientX - rect.left) * W) / rect.width;
    const sy = ((clientY - rect.top) * H) / rect.height;
    return receivers.find((r) => Math.hypot(px(r.x) - sx, r.y * S - sy) < 34);
  }

  canvas.addEventListener("click", (e) => {
    if (state !== "running") return;
    if (phase === "presnap") return snap();
    const r = receiverAt(e.clientX, e.clientY);
    if (r) throwTo(r);
  });

  // Touch: drag anywhere to steer the carrier
  let touchOrigin = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (state !== "running") return;
      const t = e.touches[0];
      touchOrigin = { x: t.clientX, y: t.clientY };
      if (phase === "presnap") return snap();
      const r = receiverAt(t.clientX, t.clientY);
      if (r) throwTo(r);
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!touchOrigin) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - touchOrigin.x;
      const dy = e.touches[0].clientY - touchOrigin.y;
      keys.left = dx < -8;
      keys.right = dx > 8;
      keys.up = dy < -8;
      keys.down = dy > 8;
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", () => {
    touchOrigin = null;
    keys.left = keys.right = keys.up = keys.down = false;
  }, { passive: true });

  overlayBtn.addEventListener("click", () => {
    if (state === "paused") resume();
    else start();
  });

  reset();
  draw();
})();
