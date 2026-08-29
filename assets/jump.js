(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");

  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.35;
  const BOUNCE = -10.2;
  const PLAT_W = 60;
  const PLAT_H = 10;

  let player, platforms, cameraY, maxHeight, startY, raf;
  let keys = { left: false, right: false };
  let state = "idle"; // idle | running | over

  bestEl.textContent = Arcade.getBest("jump");

  function makePlatform(y) {
    return {
      x: Math.random() * (W - PLAT_W),
      y,
      moving: Math.random() < 0.16,
      dx: (Math.random() < 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.8),
    };
  }

  function reset() {
    startY = H - 60;
    player = { x: W / 2, y: startY, vx: 0, vy: BOUNCE, prevY: startY };
    cameraY = 0;
    maxHeight = 0;
    platforms = [{ x: W / 2 - PLAT_W / 2, y: H - 40, moving: false, dx: 0 }];
    let y = H - 100;
    while (y > -H) {
      platforms.push(makePlatform(y));
      y -= 48 + Math.random() * 26;
    }
    scoreEl.textContent = "0";
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
    if (keys.left) player.vx -= 0.55;
    if (keys.right) player.vx += 0.55;
    if (!keys.left && !keys.right) player.vx *= 0.92;
    player.vx = Math.max(-5.5, Math.min(5.5, player.vx));

    player.prevY = player.y;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Horizontal wrap
    if (player.x < -12) player.x = W + 12;
    if (player.x > W + 12) player.x = -12;

    // Bounce off platforms (only while falling)
    if (player.vy > 0) {
      for (const p of platforms) {
        const feetPrev = player.prevY + 14;
        const feetNow = player.y + 14;
        if (
          feetPrev <= p.y &&
          feetNow >= p.y &&
          player.x > p.x - 10 &&
          player.x < p.x + PLAT_W + 10
        ) {
          player.vy = BOUNCE;
          Sound.bounce();
          break;
        }
      }
    }

    // Moving platforms
    for (const p of platforms) {
      if (!p.moving) continue;
      p.x += p.dx;
      if (p.x < 0 || p.x > W - PLAT_W) p.dx *= -1;
    }

    // Camera follows upward only
    const targetCam = player.y - H * 0.38;
    if (targetCam < cameraY) cameraY = targetCam;

    // Score = highest point reached
    const height = Math.max(0, Math.floor(startY - player.y));
    if (height > maxHeight) {
      maxHeight = height;
      scoreEl.textContent = String(maxHeight);
    }

    // Recycle platforms that fell off the bottom of the view
    for (const p of platforms) {
      if (p.y > cameraY + H + 30) {
        const topmost = Math.min(...platforms.map((q) => q.y));
        p.y = topmost - (48 + Math.random() * 26);
        p.x = Math.random() * (W - PLAT_W);
        p.moving = Math.random() < 0.16;
      }
    }

    // Fell off the bottom
    if (player.y - cameraY > H + 40) gameOver();
  }

  function gameOver() {
    state = "over";
    cancelAnimationFrame(raf);
    Sound.die();
    const isBest = Arcade.saveBest("jump", maxHeight);
    bestEl.textContent = Arcade.getBest("jump");
    overlayTitle.textContent = "SPLAT";
    overlayMsg.innerHTML = "Height: " + maxHeight + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#141430");
    sky.addColorStop(1, "#0c0c1c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Parallax stars
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 24; i++) {
      const sx = (i * 89) % W;
      const sy = (((i * 53) % H) - cameraY * 0.3) % H;
      ctx.fillRect(sx, (sy + H) % H, 2, 2);
    }

    // Platforms
    for (const p of platforms) {
      const sy = p.y - cameraY;
      if (sy < -20 || sy > H + 20) continue;
      ctx.save();
      ctx.shadowColor = p.moving ? "#00e5ff" : "#a3ff12";
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.moving ? "#00e5ff" : "#a3ff12";
      ctx.beginPath();
      ctx.roundRect(p.x, sy, PLAT_W, PLAT_H, 5);
      ctx.fill();
      ctx.restore();
    }

    // Player
    ctx.font = "26px serif";
    ctx.textAlign = "center";
    ctx.fillText("🦘", player.x, player.y - cameraY + 6);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") (keys.left = true), e.preventDefault();
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") (keys.right = true), e.preventDefault();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = false;
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      keys.left = x < rect.width / 2;
      keys.right = !keys.left;
    },
    { passive: true }
  );
  canvas.addEventListener("touchend", () => {
    keys.left = false;
    keys.right = false;
  }, { passive: true });

  overlayBtn.addEventListener("click", start);

  reset();
  draw();
})();
