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
  const GROUND = H - 48;

  const BIRD_X = 110;
  const R = 14;
  const GRAVITY = 0.45;
  const FLAP = -7.8;
  const SPEED = 2.6;
  const GAP = 150;
  const PIPE_W = 64;
  const SPAWN_EVERY = 100; // frames

  let bird, pipes, score, frames, raf;
  let state = "idle"; // idle | running | over

  bestEl.textContent = Arcade.getBest("flappy");

  function reset() {
    bird = { y: H / 2, vy: 0 };
    pipes = [];
    score = 0;
    frames = 0;
    scoreEl.textContent = "0";
  }

  function start() {
    cancelAnimationFrame(raf);
    reset();
    state = "running";
    overlay.classList.add("hidden");
    flap();
    loop();
  }

  function flap() {
    if (state !== "running") return;
    bird.vy = FLAP;
    Sound.flap();
  }

  function loop() {
    if (state !== "running") return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function update() {
    frames += 1;

    if (frames % SPAWN_EVERY === 1) {
      const top = 60 + Math.random() * (GROUND - GAP - 120);
      pipes.push({ x: W, top, scored: false });
    }

    bird.vy += GRAVITY;
    bird.y += bird.vy;
    if (bird.y < R) {
      bird.y = R;
      bird.vy = 0;
    }
    if (bird.y + R >= GROUND) return die();

    for (const p of pipes) {
      p.x -= SPEED;
      if (!p.scored && p.x + PIPE_W < BIRD_X - R) {
        p.scored = true;
        score += 1;
        scoreEl.textContent = String(score);
        Sound.point();
      }
      if (
        BIRD_X + R > p.x &&
        BIRD_X - R < p.x + PIPE_W &&
        (bird.y - R < p.top || bird.y + R > p.top + GAP)
      ) {
        return die();
      }
    }
    while (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
  }

  function die() {
    state = "over";
    cancelAnimationFrame(raf);
    Sound.die();
    const isBest = Arcade.saveBest("flappy", score);
    bestEl.textContent = Arcade.getBest("flappy");
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML = "Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0c0c1c");
    sky.addColorStop(1, "#141430");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Pipes
    for (const p of pipes) {
      ctx.save();
      ctx.shadowColor = "#a3ff12";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#6fbf0a";
      ctx.fillRect(p.x, 0, PIPE_W, p.top);
      ctx.fillRect(p.x, p.top + GAP, PIPE_W, GROUND - p.top - GAP);
      // Caps
      ctx.fillStyle = "#a3ff12";
      ctx.fillRect(p.x - 4, p.top - 16, PIPE_W + 8, 16);
      ctx.fillRect(p.x - 4, p.top + GAP, PIPE_W + 8, 16);
      ctx.restore();
    }

    // Ground with scrolling stripes
    ctx.fillStyle = "#1c1c38";
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.strokeStyle = "#2c2c52";
    ctx.lineWidth = 3;
    const offset = -((frames * SPEED) % 40);
    for (let x = offset; x < W + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 20, GROUND);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // Bird
    ctx.save();
    ctx.shadowColor = "#ffb020";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffb020";
    ctx.beginPath();
    ctx.arc(BIRD_X, bird.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Wing
    const wingLift = Math.sin(frames * 0.35) * 4;
    ctx.fillStyle = "#ff7a1a";
    ctx.beginPath();
    ctx.ellipse(BIRD_X - 5, bird.y + 3 + wingLift, 7, 4.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(BIRD_X + 6, bird.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a14";
    ctx.beginPath();
    ctx.arc(BIRD_X + 7, bird.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = "#ff7a1a";
    ctx.beginPath();
    ctx.moveTo(BIRD_X + R, bird.y - 2);
    ctx.lineTo(BIRD_X + R + 8, bird.y + 1);
    ctx.lineTo(BIRD_X + R, bird.y + 5);
    ctx.fill();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      flap();
    }
  });
  canvas.addEventListener("mousedown", flap);
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      flap();
    },
    { passive: false }
  );

  overlayBtn.addEventListener("click", start);

  reset();
  draw();
})();
