(() => {
  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");

  const N = 4;
  let order; // order[position] = tile number, 0 = blank
  let moves, seconds, timer, started, solved;
  const cells = [];

  for (let i = 0; i < N * N; i++) {
    const cell = document.createElement("button");
    cell.className = "slide-tile";
    cell.addEventListener("click", () => tryMove(i));
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  function showBest() {
    const best = Arcade.getBest("slide");
    bestEl.textContent = best > 0 ? best + " moves" : "—";
  }

  function formatTime(s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function blankIndex() {
    return order.indexOf(0);
  }

  function neighborsOf(i) {
    const r = Math.floor(i / N);
    const c = i % N;
    const out = [];
    if (r > 0) out.push(i - N);
    if (r < N - 1) out.push(i + N);
    if (c > 0) out.push(i - 1);
    if (c < N - 1) out.push(i + 1);
    return out;
  }

  function shuffle() {
    clearInterval(timer);
    order = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));
    // Random walk from the solved state guarantees a solvable board
    let prev = -1;
    for (let k = 0; k < 400; k++) {
      const b = blankIndex();
      const opts = neighborsOf(b).filter((n) => n !== prev);
      const pick = opts[Math.floor(Math.random() * opts.length)];
      [order[b], order[pick]] = [order[pick], order[b]];
      prev = b;
    }
    moves = 0;
    seconds = 0;
    started = false;
    solved = false;
    movesEl.textContent = "0";
    timeEl.textContent = "0:00";
    overlay.classList.add("hidden");
    showBest();
    render();
  }

  function render() {
    for (let i = 0; i < N * N; i++) {
      const v = order[i];
      cells[i].textContent = v === 0 ? "" : String(v);
      cells[i].className = "slide-tile" + (v === 0 ? " blank" : "");
    }
  }

  function tryMove(i) {
    if (solved) return;
    const b = blankIndex();
    if (!neighborsOf(b).includes(i) || order[i] === 0) return;
    if (!started) {
      started = true;
      timer = setInterval(() => {
        seconds += 1;
        timeEl.textContent = formatTime(seconds);
      }, 1000);
    }
    [order[b], order[i]] = [order[i], order[b]];
    moves += 1;
    movesEl.textContent = String(moves);
    Sound.click();
    render();
    checkSolved();
  }

  function checkSolved() {
    for (let i = 0; i < N * N - 1; i++) if (order[i] !== i + 1) return;
    solved = true;
    clearInterval(timer);
    Sound.win();
    const isBest = Arcade.saveBest("slide", moves, true);
    showBest();
    overlayMsg.innerHTML =
      moves + " moves in " + formatTime(seconds) + (isBest ? "<br>🏆 New best!" : "");
    overlay.classList.remove("hidden");
  }

  document.addEventListener("keydown", (e) => {
    const b = blankIndex();
    const r = Math.floor(b / N);
    const c = b % N;
    // Arrow moves the tile on that side of the gap into the gap
    let from = -1;
    if (e.key === "ArrowUp" && r < N - 1) from = b + N;
    if (e.key === "ArrowDown" && r > 0) from = b - N;
    if (e.key === "ArrowLeft" && c < N - 1) from = b + 1;
    if (e.key === "ArrowRight" && c > 0) from = b - 1;
    if (from >= 0) {
      e.preventDefault();
      tryMove(from);
    }
  });

  overlayBtn.addEventListener("click", shuffle);
  newBtn.addEventListener("click", shuffle);
  shuffle();
})();
