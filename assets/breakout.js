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

  const W = canvas.width;
  const H = canvas.height;

  const PADDLE_W = 90;
  const PADDLE_H = 12;
  const PADDLE_Y = H - 26;
  const BALL_R = 7;
  const BASE_SPEED = 5;

  const ROWS = 5;
  const COLS = 8;
  const BRICK_H = 20;
  const GAP = 6;
  const SIDE = 20;
  const TOP = 50;
  const BRICK_W = (W - SIDE * 2 - GAP * (COLS - 1)) / COLS;
  const ROW_COLORS = ["#ff2e88", "#ffb020", "#a3ff12", "#00e5ff", "#8b5cf6"];

  let paddleX, ball, bricks, score, lives, launched;
  let keys = { left: false, right: false };
  let state = "idle"; // idle | running | paused | over
  let raf;

  bestEl.textContent = Arcade.getBest("breakout");

  function buildBricks() {
    bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({
          x: SIDE + c * (BRICK_W + GAP),
          y: TOP + r * (BRICK_H + GAP),
          row: r,
          alive: true,
        });
      }
    }
  }

  function resetBall() {
    paddleX = (W - PADDLE_W) / 2;
    ball = { x: W / 2, y: PADDLE_Y - BALL_R - 1, dx: 0, dy: 0 };
    launched = false;
  }

  function reset() {
    score = 0;
    lives = 3;
    buildBricks();
    resetBall();
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

  function launch() {
    if (launched || state !== "running") return;
    launched = true;
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // slightly off vertical
    ball.dx = BASE_SPEED * Math.sin(angle);
    ball.dy = -BASE_SPEED * Math.cos(angle);
  }

  function loop() {
    if (state !== "running") return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function update() {
    const paddleSpeed = 7;
    if (keys.left) paddleX -= paddleSpeed;
    if (keys.right) paddleX += paddleSpeed;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));

    if (!launched) {
      ball.x = paddleX + PADDLE_W / 2;
      ball.y = PADDLE_Y - BALL_R - 1;
      return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Walls
    if (ball.x < BALL_R) {
      ball.x = BALL_R;
      ball.dx = Math.abs(ball.dx);
    } else if (ball.x > W - BALL_R) {
      ball.x = W - BALL_R;
      ball.dx = -Math.abs(ball.dx);
    }
    if (ball.y < BALL_R) {
      ball.y = BALL_R;
      ball.dy = Math.abs(ball.dy);
    }

    // Paddle
    if (
      ball.dy > 0 &&
      ball.y + BALL_R >= PADDLE_Y &&
      ball.y + BALL_R <= PADDLE_Y + PADDLE_H + 8 &&
      ball.x >= paddleX - BALL_R &&
      ball.x <= paddleX + PADDLE_W + BALL_R
    ) {
      const hit = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      const speed = Math.min(9, Math.hypot(ball.dx, ball.dy) * 1.02);
      const angle = hit * (Math.PI / 3); // max 60° deflection
      ball.dx = speed * Math.sin(angle);
      ball.dy = -Math.abs(speed * Math.cos(angle));
      ball.y = PADDLE_Y - BALL_R;
    }

    // Bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ball.x + BALL_R > b.x &&
        ball.x - BALL_R < b.x + BRICK_W &&
        ball.y + BALL_R > b.y &&
        ball.y - BALL_R < b.y + BRICK_H
      ) {
        b.alive = false;
        score += (ROWS - b.row) * 10;
        updateHud();

        // Bounce off the nearest face
        const overlapX = Math.min(
          ball.x + BALL_R - b.x,
          b.x + BRICK_W - (ball.x - BALL_R)
        );
        const overlapY = Math.min(
          ball.y + BALL_R - b.y,
          b.y + BRICK_H - (ball.y - BALL_R)
        );
        if (overlapX < overlapY) ball.dx = -ball.dx;
        else ball.dy = -ball.dy;
        break;
      }
    }

    if (bricks.every((b) => !b.alive)) return win();

    // Missed the ball
    if (ball.y > H + BALL_R) {
      lives -= 1;
      updateHud();
      if (lives <= 0) return gameOver();
      resetBall();
    }
  }

  function endRound(title, msg) {
    state = "over";
    cancelAnimationFrame(raf);
    const isBest = Arcade.saveBest("breakout", score);
    bestEl.textContent = Arcade.getBest("breakout");
    overlayTitle.textContent = title;
    overlayMsg.innerHTML = msg + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function gameOver() {
    endRound("GAME OVER", "Score: " + score);
  }

  function win() {
    endRound("YOU WIN!", "Every brick smashed. Score: " + score);
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "The bricks aren't going anywhere.";
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

    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = ROW_COLORS[b.row];
      ctx.save();
      ctx.shadowColor = ROW_COLORS[b.row];
      ctx.shadowBlur = 6;
      roundRect(b.x, b.y, BRICK_W, BRICK_H, 4);
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#00e5ff";
    roundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 6);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") (keys.left = true), e.preventDefault();
    if (e.key === "ArrowRight") (keys.right = true), e.preventDefault();
    if (e.key === " ") {
      e.preventDefault();
      launch();
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

  function pointerMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    paddleX = Math.max(
      0,
      Math.min(W - PADDLE_W, (clientX - rect.left) * scale - PADDLE_W / 2)
    );
  }

  canvas.addEventListener("mousemove", (e) => {
    if (state === "running") pointerMove(e.clientX);
  });
  canvas.addEventListener("click", launch);
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (state === "running") {
        e.preventDefault();
        pointerMove(e.touches[0].clientX);
      }
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (state === "running") {
        pointerMove(e.touches[0].clientX);
        launch();
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
