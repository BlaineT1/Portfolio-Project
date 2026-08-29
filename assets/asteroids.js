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
  const RADII = { 3: 38, 2: 22, 1: 12 };
  const POINTS = { 3: 20, 2: 50, 1: 100 };

  let ship, rocks, bullets, score, lives, wave, raf;
  let keys = { left: false, right: false, thrust: false, fire: false };
  let fireCooldown = 0;
  let state = "idle"; // idle | running | paused | over

  bestEl.textContent = Arcade.getBest("asteroids");

  function makeRock(x, y, size) {
    const speed = 0.6 + (3 - size) * 0.4 + Math.random() * 0.6;
    const heading = Math.random() * Math.PI * 2;
    const verts = [];
    for (let i = 0; i < 11; i++) verts.push(0.72 + Math.random() * 0.5);
    return {
      x, y, size,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      rot: 0,
      va: (Math.random() - 0.5) * 0.04,
      verts,
    };
  }

  function spawnWave() {
    rocks = [];
    for (let i = 0; i < 3 + wave; i++) {
      let x, y;
      do {
        x = Math.random() * W;
        y = Math.random() * H;
      } while (Math.hypot(x - ship.x, y - ship.y) < 150);
      rocks.push(makeRock(x, y, 3));
    }
  }

  function resetShip() {
    ship = { x: W / 2, y: H / 2, a: 0, vx: 0, vy: 0, inv: 120 };
  }

  function reset() {
    score = 0;
    lives = 3;
    wave = 1;
    bullets = [];
    resetShip();
    spawnWave();
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

  function wrap(o) {
    if (o.x < 0) o.x += W;
    if (o.x > W) o.x -= W;
    if (o.y < 0) o.y += H;
    if (o.y > H) o.y -= H;
  }

  function update() {
    if (keys.left) ship.a -= 0.075;
    if (keys.right) ship.a += 0.075;
    if (keys.thrust) {
      ship.vx += Math.sin(ship.a) * 0.14;
      ship.vy -= Math.cos(ship.a) * 0.14;
    }
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    wrap(ship);
    if (ship.inv > 0) ship.inv -= 1;

    if (fireCooldown > 0) fireCooldown -= 1;
    if (keys.fire && fireCooldown <= 0 && bullets.length < 4) {
      bullets.push({
        x: ship.x + Math.sin(ship.a) * 15,
        y: ship.y - Math.cos(ship.a) * 15,
        vx: ship.vx + Math.sin(ship.a) * 7,
        vy: ship.vy - Math.cos(ship.a) * 7,
        life: 55,
      });
      fireCooldown = 11;
      Sound.click();
    }

    for (const b of bullets) {
      b.x += b.vx;
      b.y += b.vy;
      b.life -= 1;
      wrap(b);
    }
    bullets = bullets.filter((b) => b.life > 0);

    for (const r of rocks) {
      r.x += r.vx;
      r.y += r.vy;
      r.rot += r.va;
      wrap(r);
    }

    // Bullet vs rock
    const newRocks = [];
    for (const r of rocks) {
      const hit = bullets.find((b) => Math.hypot(b.x - r.x, b.y - r.y) < RADII[r.size]);
      if (hit) {
        hit.life = 0;
        score += POINTS[r.size];
        Sound.brick();
        if (r.size > 1) {
          newRocks.push(makeRock(r.x, r.y, r.size - 1));
          newRocks.push(makeRock(r.x, r.y, r.size - 1));
        }
      } else {
        newRocks.push(r);
      }
    }
    rocks = newRocks;
    updateHud();

    // Ship vs rock
    if (ship.inv <= 0) {
      const crash = rocks.find((r) => Math.hypot(r.x - ship.x, r.y - ship.y) < RADII[r.size] + 10);
      if (crash) {
        lives -= 1;
        updateHud();
        Sound.die();
        if (lives <= 0) return gameOver();
        resetShip();
      }
    }

    if (!rocks.length) {
      wave += 1;
      updateHud();
      Sound.clearLine();
      resetShip();
      spawnWave();
    }
  }

  function gameOver() {
    state = "over";
    cancelAnimationFrame(raf);
    const isBest = Arcade.saveBest("asteroids", score);
    bestEl.textContent = Arcade.getBest("asteroids");
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML = "Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "PAUSED";
    overlayMsg.textContent = "Space is patient.";
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

    // Rocks
    ctx.strokeStyle = "#9494b8";
    ctx.lineWidth = 2;
    for (const r of rocks) {
      const rad = RADII[r.size];
      ctx.beginPath();
      r.verts.forEach((v, i) => {
        const ang = r.rot + (i / r.verts.length) * Math.PI * 2;
        const px = r.x + Math.cos(ang) * rad * v;
        const py = r.y + Math.sin(ang) * rad * v;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();
    }

    // Ship (blinks while invulnerable)
    if (state !== "over" && (ship.inv <= 0 || (ship.inv >> 3) % 2 === 0)) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.a);
      ctx.shadowColor = "#2dd4bf";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#2dd4bf";
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(-10, 12);
      ctx.lineTo(0, 7);
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.stroke();
      if (keys.thrust) {
        ctx.fillStyle = "#ff7a1a";
        ctx.beginPath();
        ctx.moveTo(-4, 11);
        ctx.lineTo(0, 20 + Math.random() * 5);
        ctx.lineTo(4, 11);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Bullets
    ctx.fillStyle = "#ffffff";
    for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") (keys.left = true), e.preventDefault();
    if (e.key === "ArrowRight") (keys.right = true), e.preventDefault();
    if (e.key === "ArrowUp") (keys.thrust = true), e.preventDefault();
    if (e.key === " ") (keys.fire = true), e.preventDefault();
    if (e.key.toLowerCase() === "p") {
      if (state === "running") pause();
      else if (state === "paused") resume();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp") keys.thrust = false;
    if (e.key === " ") keys.fire = false;
  });

  // Hold-to-act touch buttons
  function bindHold(id, flag) {
    const btn = document.getElementById(id);
    const on = (e) => {
      e.preventDefault();
      keys[flag] = true;
    };
    const off = () => (keys[flag] = false);
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("pointercancel", off);
  }
  bindHold("btn-left", "left");
  bindHold("btn-right", "right");
  bindHold("btn-thrust", "thrust");
  bindHold("btn-fire", "fire");

  overlayBtn.addEventListener("click", () => {
    if (state === "paused") resume();
    else start();
  });

  reset();
  draw();
})();
