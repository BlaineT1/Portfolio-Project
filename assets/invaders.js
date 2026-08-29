(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const waveEl = document.getElementById("wave");
  const bestEl = document.getElementById("best");

  const W = canvas.width;
  const H = canvas.height;
  const ROWS = 5;
  const COLS = 10;
  const CELL_W = 42;
  const CELL_H = 34;
  const GRID_X = (W - (COLS - 1) * CELL_W) / 2;
  const ROW_EMOJI = ["🛸", "👾", "👾", "👽", "👽"];

  let player, aliens, bullets, enemyBullets, dir, score, lives, wave, killed, frame, raf;
  let keys = { left: false, right: false };
  let state = "idle"; // idle | running | paused | over

  bestEl.textContent = Arcade.getBest("invaders");

  function buildWave() {
    aliens = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        aliens.push({ x: GRID_X + c * CELL_W, y: 80 + r * CELL_H, row: r, alive: true });
      }
    }
    dir = 1;
    killed = 0;
    bullets = [];
    enemyBullets = [];
  }

  function reset() {
    player = { x: W / 2, y: H - 36, cooldown: 0, inv: 0 };
    score = 0;
    lives = 3;
    wave = 1;
    frame = 0;
    buildWave();
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    livesEl.textContent = "❤".repeat(lives) || "—";
    waveEl.textContent = String(wave);
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

  function shoot() {
    if (state !== "running" || player.cooldown > 0 || bullets.length >= 2) return;
    bullets.push({ x: player.x, y: player.y - 14 });
    player.cooldown = 14;
    Sound.click();
  }

  function update() {
    frame += 1;
    if (keys.left) player.x -= 5;
    if (keys.right) player.x += 5;
    player.x = Math.max(20, Math.min(W - 20, player.x));
    if (player.cooldown > 0) player.cooldown -= 1;
    if (player.inv > 0) player.inv -= 1;

    // March the fleet
    const alive = aliens.filter((a) => a.alive);
    const speed = (0.35 + killed * 0.022 + (wave - 1) * 0.18) * dir;
    let hitEdge = false;
    for (const a of alive) {
      a.x += speed;
      if (a.x < 22 || a.x > W - 22) hitEdge = true;
    }
    if (hitEdge) {
      dir *= -1;
      for (const a of alive) a.y += 16;
    }

    // Alien fire
    if (Math.random() < 0.018 + wave * 0.004 && enemyBullets.length < 4 && alive.length) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      enemyBullets.push({ x: shooter.x, y: shooter.y + 12, vy: 3 + wave * 0.35 });
    }

    // Player bullets
    for (const b of bullets) b.y -= 8;
    bullets = bullets.filter((b) => b.y > -10);
    for (const b of bullets) {
      const hit = alive.find(
        (a) => a.alive && Math.abs(b.x - a.x) < 16 && Math.abs(b.y - a.y) < 14
      );
      if (hit) {
        hit.alive = false;
        killed += 1;
        b.y = -100;
        score += (ROWS - hit.row) * 10;
        updateHud();
        Sound.brick();
      }
    }

    // Enemy bullets
    for (const b of enemyBullets) b.y += b.vy;
    enemyBullets = enemyBullets.filter((b) => b.y < H + 10);
    if (player.inv <= 0) {
      const hit = enemyBullets.find(
        (b) => Math.abs(b.x - player.x) < 16 && Math.abs(b.y - player.y) < 12
      );
      if (hit) {
        hit.y = H + 100;
        lives -= 1;
        updateHud();
        Sound.die();
        if (lives <= 0) return gameOver("They got you.");
        player.inv = 90;
      }
    }

    // Invasion line
    if (alive.some((a) => a.y > player.y - 30)) return gameOver("They landed.");

    // Wave cleared
    if (!alive.length) {
      wave += 1;
      updateHud();
      Sound.clearLine();
      buildWave();
    }
  }

  function gameOver(msg) {
    state = "over";
    cancelAnimationFrame(raf);
    const isBest = Arcade.saveBest("invaders", score);
    bestEl.textContent = Arcade.getBest("invaders");
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML = msg + " Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "The invasion is on hold.";
    overlayBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  }

  function resume() {
    state = "running";
    overlay.classList.add("hidden");
    loop();
  }

  function draw() {
    ctx.fillStyle = "#0c0c1c";
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 30; i++) {
      const sx = (i * 97) % W;
      const sy = (i * 61 + ((frame / 4) | 0)) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Aliens
    ctx.font = "24px serif";
    ctx.textAlign = "center";
    const wobble = (frame >> 4) % 2 ? 2 : -2;
    for (const a of aliens) {
      if (a.alive) ctx.fillText(ROW_EMOJI[a.row], a.x, a.y + wobble);
    }

    // Player ship (blinks while invulnerable)
    if (player.inv <= 0 || (player.inv >> 3) % 2 === 0) {
      ctx.save();
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 14);
      ctx.lineTo(player.x - 17, player.y + 10);
      ctx.lineTo(player.x + 17, player.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Bullets
    ctx.fillStyle = "#a3ff12";
    for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    ctx.fillStyle = "#ff2e88";
    for (const b of enemyBullets) ctx.fillRect(b.x - 2, b.y - 6, 4, 10);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") (keys.left = true), e.preventDefault();
    if (e.key === "ArrowRight") (keys.right = true), e.preventDefault();
    if (e.key === " ") {
      e.preventDefault();
      shoot();
    }
    if (e.key.toLowerCase() === "p") {
      if (state === "running") pause();
      else if (state === "paused") resume();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
  });

  canvas.addEventListener("click", shoot);
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (state !== "running") return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      player.x = ((e.touches[0].clientX - rect.left) * W) / rect.width;
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchstart",
    () => {
      if (state === "running") shoot();
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
