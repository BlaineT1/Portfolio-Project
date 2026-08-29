(() => {
  const arena = document.getElementById("arena");
  const hitsEl = document.getElementById("hits");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const DURATION = 30;
  const TARGET_LIFE = 1600; // ms before a target vanishes

  let hits, misses, timeLeft, running;
  let clockTimer, spawnTimer;

  bestEl.textContent = Arcade.getBest("aim");

  function start() {
    hits = 0;
    misses = 0;
    timeLeft = DURATION;
    running = true;
    hitsEl.textContent = "0";
    timeEl.textContent = String(DURATION);
    overlay.classList.add("hidden");
    arena.innerHTML = "";

    clockTimer = setInterval(() => {
      timeLeft -= 1;
      timeEl.textContent = String(timeLeft);
      if (timeLeft <= 0) end();
    }, 1000);
    scheduleSpawn();
  }

  function scheduleSpawn() {
    if (!running) return;
    const delay = 600 - 150 * (1 - timeLeft / DURATION);
    spawnTimer = setTimeout(() => {
      spawn();
      scheduleSpawn();
    }, delay);
  }

  function spawn() {
    const size = 40 + Math.random() * 26;
    const t = document.createElement("button");
    t.className = "target";
    t.style.width = size + "px";
    t.style.height = size + "px";
    t.style.left = Math.random() * (arena.clientWidth - size) + "px";
    t.style.top = Math.random() * (arena.clientHeight - size) + "px";
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!running) return;
      hits += 1;
      hitsEl.textContent = String(hits);
      Sound.whackHit();
      t.remove();
    });
    arena.appendChild(t);
    setTimeout(() => {
      if (t.isConnected) {
        t.remove();
        if (running) misses += 1;
      }
    }, TARGET_LIFE);
  }

  arena.addEventListener("click", () => {
    if (running) misses += 1; // clicked the arena, not a target
  });

  function end() {
    running = false;
    clearInterval(clockTimer);
    clearTimeout(spawnTimer);
    arena.innerHTML = "";
    const total = hits + misses;
    const accuracy = total ? Math.round((hits / total) * 100) : 0;
    const isBest = Arcade.saveBest("aim", hits);
    bestEl.textContent = Arcade.getBest("aim");
    if (isBest) Sound.win();
    else Sound.point();
    overlayTitle.textContent = "TIME'S UP!";
    overlayMsg.innerHTML =
      hits + " hits · " + accuracy + "% accuracy" + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", start);
})();
