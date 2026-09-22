/* Missile Command. Click or tap anywhere to fire an interceptor from your
   nearest silo; it detonates where you aimed, and the blast destroys any
   enemy missile (or split warhead) it touches. Protect your six cities.
   Waves get faster and start splitting warheads (MIRVs) from wave 3 on. */

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const citiesEl = document.getElementById("cities");
  const waveEl = document.getElementById("wave");
  const bestEl = document.getElementById("best");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = H - 26;
  // 9 evenly spaced ground slots: silo, city, city, silo, city, city, silo, city, city
  const SLOTS = Array.from({ length: 9 }, (_, i) => (i + 0.5) * (W / 9));
  const SILO_IDX = [0, 3, 6];

  let cities, silos, incoming, interceptors, explosions, score, wave, raf, waveTimer, toSpawn, spawnDelay;
  let state = "idle"; // idle | running | paused | over
  let pointer = { x: W / 2, y: H / 2 };

  bestEl.textContent = Arcade.getBest("missilecommand");

  function reset() {
    cities = SLOTS.map((x, i) => ({ x, alive: !SILO_IDX.includes(i) })).filter((_, i) => !SILO_IDX.includes(i));
    silos = SILO_IDX.map((i) => ({ x: SLOTS[i], alive: true }));
    incoming = [];
    interceptors = [];
    explosions = [];
    score = 0;
    wave = 0;
    updateHud();
    nextWave();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    citiesEl.textContent = String(cities.filter((c) => c.alive).length);
    waveEl.textContent = String(wave);
  }

  function nextWave() {
    wave += 1;
    const count = 4 + wave * 2;
    toSpawn = count;
    spawnDelay = 0;
    updateHud();
  }

  function aliveTargets() {
    return [...cities.filter((c) => c.alive), ...silos.filter((s) => s.alive)];
  }

  function spawnMissile(targetOverride, fromX, fromY) {
    const targets = aliveTargets();
    if (!targets.length) return;
    const target = targetOverride || targets[Math.floor(Math.random() * targets.length)];
    const x0 = fromX != null ? fromX : Math.random() * W;
    const y0 = fromY != null ? fromY : 0;
    const speed = 0.55 + wave * 0.06;
    const dx = target.x - x0, dy = GROUND_Y - y0;
    const dist = Math.hypot(dx, dy) || 1;
    const canSplit = wave >= 3 && Math.random() < Math.min(0.12 + wave * 0.03, 0.55) && !targetOverride;
    incoming.push({
      x: x0, y: y0, x0, y0, target, vx: (dx / dist) * speed, vy: (dy / dist) * speed,
      splitAt: canSplit ? 0.35 + Math.random() * 0.25 : -1, split: false,
    });
  }

  function fireAt(tx, ty) {
    const alive = silos.filter((s) => s.alive);
    if (!alive.length || interceptors.length >= 6) return;
    alive.sort((a, b) => Math.abs(a.x - tx) - Math.abs(b.x - tx));
    const silo = alive[0];
    const x0 = silo.x, y0 = GROUND_Y;
    const dist = Math.hypot(tx - x0, ty - y0) || 1;
    const speed = 6.2;
    interceptors.push({ x: x0, y: y0, x0, y0, tx, ty, vx: ((tx - x0) / dist) * speed, vy: ((ty - y0) / dist) * speed, dist, traveled: 0 });
    Sound.click();
  }

  function explodeAt(x, y) {
    explosions.push({ x, y, r: 2, max: 34, growing: true });
    Sound.boom();
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

  function update() {
    // Spawn queue for the wave
    if (toSpawn > 0) {
      spawnDelay -= 1;
      if (spawnDelay <= 0) {
        spawnMissile();
        toSpawn -= 1;
        spawnDelay = 24 + Math.random() * 30;
      }
    }

    // Incoming enemy missiles
    for (const m of incoming) {
      m.x += m.vx; m.y += m.vy;
      if (!m.split && m.splitAt >= 0) {
        const t = Math.hypot(m.x - m.x0, m.y - m.y0) / Math.hypot(m.target.x - m.x0, GROUND_Y - m.y0);
        if (t >= m.splitAt) {
          m.split = true;
          const targets = aliveTargets();
          for (let k = 0; k < 2 && targets.length; k++) spawnMissile(targets[Math.floor(Math.random() * targets.length)], m.x, m.y);
        }
      }
    }
    for (const m of incoming) {
      if (m.y >= GROUND_Y) {
        m.dead = true;
        if (m.target.alive) { m.target.alive = false; Sound.die(); }
        explodeAt(m.x, GROUND_Y);
      }
    }
    incoming = incoming.filter((m) => !m.dead);

    // Player interceptors
    for (const p of interceptors) {
      p.x += p.vx; p.y += p.vy; p.traveled += Math.hypot(p.vx, p.vy);
      if (p.traveled >= p.dist) { p.dead = true; explodeAt(p.tx, p.ty); }
    }
    interceptors = interceptors.filter((p) => !p.dead);

    // Explosions grow, then shrink, and destroy anything they touch
    for (const e of explosions) {
      if (e.growing) { e.r += 2.6; if (e.r >= e.max) e.growing = false; }
      else e.r -= 1.6;
    }
    for (const e of explosions) {
      for (const m of incoming) {
        if (!m.dead && Math.hypot(m.x - e.x, m.y - e.y) < e.r) { m.dead = true; score += 25; Sound.point(); }
      }
    }
    incoming = incoming.filter((m) => !m.dead);
    explosions = explosions.filter((e) => e.r > 0);
    updateHud();

    if (cities.every((c) => !c.alive)) return gameOver();

    if (toSpawn === 0 && !incoming.length) {
      score += cities.filter((c) => c.alive).length * 100;
      Sound.clearLine();
      nextWave();
    }
  }

  function gameOver() {
    state = "over";
    cancelAnimationFrame(raf);
    const isBest = Arcade.saveBest("missilecommand", score);
    bestEl.textContent = Arcade.getBest("missilecommand");
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML = "Every city fell.<br>Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "The sky waits for no one, but it'll wait for you.";
    overlayBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  }

  function resume() {
    state = "running";
    overlay.classList.add("hidden");
    loop();
  }

  function drawBuilding(x, alive, w, h, color) {
    ctx.fillStyle = alive ? color : "#2c2c52";
    ctx.fillRect(x - w / 2, GROUND_Y - h, w, h);
    if (!alive) {
      ctx.strokeStyle = "#1c1c38";
      ctx.beginPath();
      ctx.moveTo(x - w / 2, GROUND_Y);
      ctx.lineTo(x + w / 2, GROUND_Y - h * 0.4);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.fillStyle = "#0c0c1c";
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = "#1c1c38";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Cities and silos
    for (const c of cities) drawBuilding(c.x, c.alive, 26, 16, "#2dd4bf");
    for (const s of silos) drawBuilding(s.x, s.alive, 30, 20, "#ffb020");

    // Incoming missiles with trails
    ctx.lineWidth = 2;
    for (const m of incoming) {
      ctx.strokeStyle = "rgba(255, 46, 136, 0.55)";
      ctx.beginPath(); ctx.moveTo(m.x0, m.y0); ctx.lineTo(m.x, m.y); ctx.stroke();
      ctx.fillStyle = "#ff2e88";
      ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Player interceptors with trails
    for (const p of interceptors) {
      ctx.strokeStyle = "rgba(0, 229, 255, 0.55)";
      ctx.beginPath(); ctx.moveTo(p.x0, p.y0); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Explosions
    for (const e of explosions) {
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(e.r, 1));
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#ffb020");
      grad.addColorStop(1, "rgba(255, 46, 136, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(e.r, 0), 0, Math.PI * 2); ctx.fill();
    }

    // Reticle
    if (state === "running") {
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pointer.x - 10, pointer.y); ctx.lineTo(pointer.x + 10, pointer.y);
      ctx.moveTo(pointer.x, pointer.y - 10); ctx.lineTo(pointer.x, pointer.y + 10);
      ctx.arc(pointer.x, pointer.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function toCanvasXY(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  canvas.addEventListener("pointermove", (e) => { pointer = toCanvasXY(e.clientX, e.clientY); if (state !== "running") draw(); });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const p = toCanvasXY(e.clientX, e.clientY);
    pointer = p;
    if (state === "running") fireAt(p.x, Math.min(p.y, GROUND_Y));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "p") {
      if (state === "running") pause();
      else if (state === "paused") resume();
    }
  });

  overlayBtn.addEventListener("click", () => {
    if (state === "paused") resume();
    else start();
  });

  reset();
  draw();

  // Exposed for the arcade's browser tests
  window.__missilecommand = {
    state: () => ({ state, score, wave, citiesAlive: cities.filter((c) => c.alive).length, silosAlive: silos.filter((s) => s.alive).length }),
    fireAt, start,
    forceWin: () => { cities.forEach((c) => { c.alive = false; }); update(); },
  };
})();
