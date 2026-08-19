(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const scoreEl = document.getElementById("score");
  const cpuEl = document.getElementById("cpu");
  const bestEl = document.getElementById("best");

  const W = canvas.width;
  const H = canvas.height;
  const PADDLE_W = 12;
  const PADDLE_H = 80;
  const PLAYER_X = 18;
  const AI_X = W - 18 - PADDLE_W;
  const BALL_R = 8;
  const BASE_SPEED = 5;
  const AI_SPEED = 4.3;
  const WIN_SCORE = 7;

  let playerY, aiY, ball, playerScore, aiScore, serveDelay, raf;
  let keys = { up: false, down: false };
  let state = "idle"; // idle | running | paused | over

  bestEl.textContent = Arcade.getBest("pong");

  function resetMatch() {
    playerScore = 0;
    aiScore = 0;
    playerY = (H - PADDLE_H) / 2;
    aiY = (H - PADDLE_H) / 2;
    updateHud();
    serve(Math.random() < 0.5 ? -1 : 1);
  }

  function serve(dir) {
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
    ball = {
      x: W / 2,
      y: H / 2,
      dx: dir * BASE_SPEED * Math.cos(angle),
      dy: BASE_SPEED * Math.sin(angle),
    };
    serveDelay = 50; // ~0.8s freeze before the ball moves
  }

  function updateHud() {
    scoreEl.textContent = String(playerScore);
    cpuEl.textContent = String(aiScore);
  }

  function start() {
    cancelAnimationFrame(raf);
    resetMatch();
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
    const speed = 6.5;
    if (keys.up) playerY -= speed;
    if (keys.down) playerY += speed;
    playerY = Math.max(0, Math.min(H - PADDLE_H, playerY));

    // CPU follows the ball with a capped speed and a small deadzone
    const aiCenter = aiY + PADDLE_H / 2;
    if (aiCenter < ball.y - 8) aiY = Math.min(H - PADDLE_H, aiY + AI_SPEED);
    else if (aiCenter > ball.y + 8) aiY = Math.max(0, aiY - AI_SPEED);

    if (serveDelay > 0) {
      serveDelay -= 1;
      return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y < BALL_R) {
      ball.y = BALL_R;
      ball.dy = Math.abs(ball.dy);
      Sound.bounce();
    } else if (ball.y > H - BALL_R) {
      ball.y = H - BALL_R;
      ball.dy = -Math.abs(ball.dy);
      Sound.bounce();
    }

    // Player paddle
    if (
      ball.dx < 0 &&
      ball.x - BALL_R <= PLAYER_X + PADDLE_W &&
      ball.x - BALL_R >= PLAYER_X - 10 &&
      ball.y >= playerY - BALL_R &&
      ball.y <= playerY + PADDLE_H + BALL_R
    ) {
      deflect(playerY, 1);
      ball.x = PLAYER_X + PADDLE_W + BALL_R;
    }

    // CPU paddle
    if (
      ball.dx > 0 &&
      ball.x + BALL_R >= AI_X &&
      ball.x + BALL_R <= AI_X + PADDLE_W + 10 &&
      ball.y >= aiY - BALL_R &&
      ball.y <= aiY + PADDLE_H + BALL_R
    ) {
      deflect(aiY, -1);
      ball.x = AI_X - BALL_R;
    }

    if (ball.x < -BALL_R) return point("cpu");
    if (ball.x > W + BALL_R) return point("player");
  }

  function deflect(paddleY, dir) {
    const hit = (ball.y - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2);
    const speed = Math.min(11, Math.hypot(ball.dx, ball.dy) * 1.04);
    const angle = hit * (Math.PI / 3.2);
    ball.dx = dir * Math.abs(speed * Math.cos(angle));
    ball.dy = speed * Math.sin(angle);
    Sound.brick();
  }

  function point(who) {
    if (who === "player") playerScore += 1;
    else aiScore += 1;
    updateHud();
    Sound.point();

    if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) return endMatch();
    // Serve toward whoever just conceded
    serve(who === "player" ? -1 : 1);
  }

  function endMatch() {
    state = "over";
    cancelAnimationFrame(raf);
    const playerWon = playerScore > aiScore;
    if (playerWon) {
      Sound.win();
      localStorage.setItem(Arcade.key("pong"), String(Arcade.getBest("pong") + 1));
      bestEl.textContent = Arcade.getBest("pong");
    } else {
      Sound.die();
    }
    overlayTitle.textContent = playerWon ? "YOU WIN! 🏆" : "CPU WINS";
    overlayMsg.textContent = playerScore + " – " + aiScore;
    overlayBtn.textContent = "REMATCH";
    overlay.classList.remove("hidden");
    draw();
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "The CPU can wait forever. Can you?";
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

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([10, 14]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;

    // On-canvas score
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText(String(playerScore), W * 0.25, 52);
    ctx.fillText(String(aiScore), W * 0.75, 52);

    // Paddles
    ctx.save();
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.roundRect(PLAYER_X, playerY, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowColor = "#ff2e88";
    ctx.fillStyle = "#ff2e88";
    ctx.beginPath();
    ctx.roundRect(AI_X, aiY, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
    ctx.restore();

    // Ball
    ctx.save();
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") (keys.up = true), e.preventDefault();
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") (keys.down = true), e.preventDefault();
    if (e.key.toLowerCase() === "p") {
      if (state === "running") pause();
      else if (state === "paused") resume();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") keys.up = false;
    if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") keys.down = false;
  });

  function pointerMove(clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = H / rect.height;
    playerY = Math.max(
      0,
      Math.min(H - PADDLE_H, (clientY - rect.top) * scale - PADDLE_H / 2)
    );
  }

  canvas.addEventListener("mousemove", (e) => {
    if (state === "running") pointerMove(e.clientY);
  });
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (state === "running") {
        e.preventDefault();
        pointerMove(e.touches[0].clientY);
      }
    },
    { passive: false }
  );

  overlayBtn.addEventListener("click", () => {
    if (state === "paused") resume();
    else start();
  });

  resetMatch();
  draw();
})();
