(() => {
  const boardEl = document.getElementById("board");
  const minesEl = document.getElementById("mines");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");

  const N = 9;
  const MINES = 10;

  let mines, flags, revealed, cells;
  let started, over, seconds, timer;

  function showBest() {
    const best = Arcade.getBest("mines");
    bestEl.textContent = best > 0 ? formatTime(best) : "—";
  }

  function formatTime(s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function neighbors(i) {
    const r = Math.floor(i / N);
    const c = i % N;
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(nr * N + nc);
      }
    }
    return out;
  }

  function setup() {
    clearInterval(timer);
    mines = new Set();
    flags = new Set();
    revealed = new Set();
    started = false;
    over = false;
    seconds = 0;
    timeEl.textContent = "0:00";
    minesEl.textContent = String(MINES);
    overlay.classList.add("hidden");
    showBest();

    boardEl.innerHTML = "";
    cells = [];
    for (let i = 0; i < N * N; i++) {
      const cell = document.createElement("button");
      cell.className = "mine-cell";
      cell.setAttribute("aria-label", "Hidden cell");

      cell.addEventListener("click", () => {
        if (cell.dataset.longPressed) {
          delete cell.dataset.longPressed;
          return;
        }
        reveal(i);
      });
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(i);
      });

      let pressTimer = null;
      cell.addEventListener(
        "touchstart",
        () => {
          pressTimer = setTimeout(() => {
            cell.dataset.longPressed = "1";
            toggleFlag(i);
          }, 450);
        },
        { passive: true }
      );
      cell.addEventListener("touchend", () => clearTimeout(pressTimer), { passive: true });
      cell.addEventListener("touchmove", () => clearTimeout(pressTimer), { passive: true });

      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  function placeMines(safe) {
    const forbidden = new Set([safe, ...neighbors(safe)]);
    const pool = [];
    for (let i = 0; i < N * N; i++) if (!forbidden.has(i)) pool.push(i);
    for (let k = 0; k < MINES; k++) {
      const j = k + Math.floor(Math.random() * (pool.length - k));
      [pool[k], pool[j]] = [pool[j], pool[k]];
      mines.add(pool[k]);
    }
  }

  function startTimer() {
    timer = setInterval(() => {
      seconds += 1;
      timeEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function mineCount(i) {
    return neighbors(i).filter((n) => mines.has(n)).length;
  }

  function reveal(i) {
    if (over || flags.has(i) || revealed.has(i)) return;
    if (!started) {
      started = true;
      placeMines(i);
      startTimer();
    }
    if (mines.has(i)) return boom(i);
    Sound.click();

    const queue = [i];
    while (queue.length) {
      const cur = queue.pop();
      if (revealed.has(cur) || flags.has(cur)) continue;
      revealed.add(cur);
      const count = mineCount(cur);
      const cell = cells[cur];
      cell.classList.add("revealed");
      cell.setAttribute("aria-label", count ? count + " adjacent mines" : "Empty");
      if (count) {
        cell.textContent = String(count);
        cell.classList.add("n" + count);
      } else {
        neighbors(cur).forEach((n) => {
          if (!revealed.has(n)) queue.push(n);
        });
      }
    }
    checkWin();
  }

  function toggleFlag(i) {
    if (over || revealed.has(i)) return;
    if (!started) return; // no flagging before the board exists
    Sound.flag();
    const cell = cells[i];
    if (flags.has(i)) {
      flags.delete(i);
      cell.textContent = "";
    } else {
      flags.add(i);
      cell.textContent = "🚩";
    }
    minesEl.textContent = String(MINES - flags.size);
  }

  function boom(hit) {
    over = true;
    clearInterval(timer);
    Sound.boom();
    mines.forEach((m) => {
      cells[m].classList.add("revealed");
      cells[m].textContent = m === hit ? "💥" : "💣";
      if (m === hit) cells[m].classList.add("boom");
    });
    overlayTitle.textContent = "BOOM!";
    overlayMsg.textContent = "That one was a mine. New board?";
    overlay.classList.remove("hidden");
  }

  function checkWin() {
    if (revealed.size !== N * N - MINES) return;
    over = true;
    clearInterval(timer);
    Sound.win();
    mines.forEach((m) => {
      if (!flags.has(m)) cells[m].textContent = "🚩";
    });
    minesEl.textContent = "0";
    const isBest = Arcade.saveBest("mines", Math.max(1, seconds), true);
    showBest();
    overlayTitle.textContent = "CLEARED!";
    overlayMsg.innerHTML =
      "All safe cells found in " + formatTime(seconds) + (isBest ? "<br>🏆 New best time!" : "");
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", setup);
  newBtn.addEventListener("click", setup);

  setup();
})();
