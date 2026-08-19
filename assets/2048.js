(() => {
  const board = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const SIZE = 4;
  let grid, score, won, over;
  let lastSpawn = null; // [row, col] of the most recent tile, for the pop animation

  const cells = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell-2048";
    board.appendChild(cell);
    cells.push(cell);
  }

  function init() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    won = false;
    over = false;
    lastSpawn = null;
    overlay.classList.add("hidden");
    addTile();
    addTile();
    updateHud();
    render();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(Math.max(score, Arcade.getBest("2048")));
  }

  function addTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    lastSpawn = [r, c];
  }

  function slideRow(row) {
    const arr = row.filter((v) => v !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        if (arr[i] === 2048 && !won) {
          won = true;
          celebrate();
        }
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < SIZE) arr.push(0);
    return arr;
  }

  function transpose(g) {
    return g[0].map((_, c) => g.map((row) => row[c]));
  }

  function reverseRows(g) {
    return g.map((row) => [...row].reverse());
  }

  function move(dirKey) {
    if (over) return;

    const scoreBefore = score;
    let g = grid;
    if (dirKey === "up") g = transpose(g);
    if (dirKey === "down") g = reverseRows(transpose(g));
    if (dirKey === "right") g = reverseRows(g);

    const before = JSON.stringify(g);
    g = g.map(slideRow);
    const changed = JSON.stringify(g) !== before;

    if (dirKey === "right") g = reverseRows(g);
    if (dirKey === "down") g = transpose(reverseRows(g));
    if (dirKey === "up") g = transpose(g);
    grid = g;

    if (!changed) return;

    if (score > scoreBefore) Sound.merge();
    else Sound.click();
    addTile();
    Arcade.saveBest("2048", score);
    updateHud();
    render();
    if (!movesAvailable()) gameOver();
  }

  function movesAvailable() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return true;
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  function render() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c];
        const cell = cells[r * SIZE + c];
        cell.textContent = v === 0 ? "" : String(v);
        cell.className =
          "cell-2048" + (v === 0 ? "" : v > 2048 ? " tsuper" : " t" + v);
        if (lastSpawn && lastSpawn[0] === r && lastSpawn[1] === c && v !== 0) {
          cell.classList.add("pop");
        }
      }
    }
  }

  function celebrate() {
    Sound.win();
    overlayTitle.textContent = "2048!";
    overlayMsg.textContent = "You built the tile. Keep going for a higher score?";
    overlayBtn.textContent = "KEEP GOING";
    overlay.classList.remove("hidden");
  }

  function gameOver() {
    over = true;
    Sound.die();
    const isBest = Arcade.saveBest("2048", score);
    updateHud();
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.innerHTML =
      "No moves left. Score: " + score + (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "NEW GAME";
    overlay.classList.remove("hidden");
  }

  const KEY_DIRS = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("hidden")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const dir = KEY_DIRS[k];
    if (!dir) return;
    e.preventDefault();
    move(dir);
  });

  let touchStart = null;
  board.addEventListener(
    "touchstart",
    (e) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true }
  );
  board.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart || !overlay.classList.contains("hidden")) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      move(
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up"
      );
    },
    { passive: true }
  );

  overlayBtn.addEventListener("click", () => {
    if (won && !over && overlayBtn.textContent === "KEEP GOING") {
      overlay.classList.add("hidden"); // resume the current game
    } else {
      init();
    }
  });

  bestEl.textContent = String(Arcade.getBest("2048"));
  init();
})();
