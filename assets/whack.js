(() => {
  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const HOLES = 9;
  const DURATION = 30; // seconds
  const BOMB_CHANCE = 0.14;

  let score, timeLeft, running;
  let clockTimer, spawnTimer;
  const holes = [];

  bestEl.textContent = Arcade.getBest("whack");

  for (let i = 0; i < HOLES; i++) {
    const hole = document.createElement("button");
    hole.className = "hole";
    hole.setAttribute("aria-label", "Mole hole");
    const face = document.createElement("span");
    hole.appendChild(face);
    hole.addEventListener("click", () => whack(i));
    boardEl.appendChild(hole);
    holes.push({ el: hole, face, up: false, bomb: false, hideTimer: null });
  }

  // 0 at the start of the round → 1 at the end; drives the difficulty ramp
  function progress() {
    return 1 - timeLeft / DURATION;
  }

  function start() {
    score = 0;
    timeLeft = DURATION;
    running = true;
    scoreEl.textContent = "0";
    timeEl.textContent = String(DURATION);
    overlay.classList.add("hidden");

    clockTimer = setInterval(() => {
      timeLeft -= 1;
      timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) end();
    }, 1000);
    scheduleSpawn();
  }

  function scheduleSpawn() {
    if (!running) return;
    const p = progress();
    const min = 500 - 180 * p;
    const max = 900 - 340 * p;
    spawnTimer = setTimeout(() => {
      spawn();
      scheduleSpawn();
    }, min + Math.random() * (max - min));
  }

  function spawn() {
    const down = holes.filter((h) => !h.up);
    if (!down.length) return;
    const hole = down[Math.floor(Math.random() * down.length)];
    hole.up = true;
    hole.bomb = Math.random() < BOMB_CHANCE;
    hole.face.textContent = hole.bomb ? "💣" : "🐹";
    hole.el.classList.add("up");

    const upFor = 750 - 300 * progress();
    hole.hideTimer = setTimeout(() => hide(hole), upFor);
  }

  function hide(hole) {
    clearTimeout(hole.hideTimer);
    hole.up = false;
    hole.el.classList.remove("up");
  }

  function whack(i) {
    const hole = holes[i];
    if (!running || !hole.up) return;
    if (hole.bomb) {
      score = Math.max(0, score - 5);
      Sound.boom();
    } else {
      score += 1;
      Sound.whackHit();
    }
    scoreEl.textContent = String(score);
    hide(hole);
  }

  function end() {
    running = false;
    clearInterval(clockTimer);
    clearTimeout(spawnTimer);
    holes.forEach(hide);
    const isBest = Arcade.saveBest("whack", score);
    bestEl.textContent = Arcade.getBest("whack");
    if (isBest) Sound.win();
    else Sound.point();
    overlayTitle.textContent = "TIME'S UP!";
    overlayMsg.innerHTML = "Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", start);
})();
