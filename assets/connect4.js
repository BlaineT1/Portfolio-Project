(() => {
  const boardEl = document.getElementById("board");
  const youEl = document.getElementById("you");
  const cpuEl = document.getElementById("cpu");
  const bestEl = document.getElementById("best");
  const statusEl = document.getElementById("status");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const ROWS = 6;
  const COLS = 7;
  const YOU = 1;
  const CPU = 2;

  let grid, cells, over, yourTurn;
  let youWins = 0;
  let cpuWins = 0;

  bestEl.textContent = Arcade.getBest("connect4");

  cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("button");
      cell.className = "c4-cell";
      cell.setAttribute("aria-label", "Column " + (c + 1));
      cell.addEventListener("click", () => humanDrop(c));
      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  function reset() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    over = false;
    yourTurn = true;
    overlay.classList.add("hidden");
    cells.forEach((c) => (c.className = "c4-cell"));
    statusEl.textContent = "You're cyan. Click any column to drop a disc.";
  }

  function lowestEmpty(g, c) {
    for (let r = ROWS - 1; r >= 0; r--) if (!g[r][c]) return r;
    return -1;
  }

  function wins(g, player) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (g[r][c] !== player) continue;
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
          let n = 1;
          while (
            r + dr * n >= 0 && r + dr * n < ROWS &&
            c + dc * n >= 0 && c + dc * n < COLS &&
            g[r + dr * n][c + dc * n] === player
          ) n += 1;
          if (n >= 4) return true;
        }
      }
    }
    return false;
  }

  function drop(c, player) {
    const r = lowestEmpty(grid, c);
    if (r < 0) return false;
    grid[r][c] = player;
    const cell = cells[r * COLS + c];
    cell.classList.add(player === YOU ? "p1" : "p2", "drop");
    Sound.click();
    return true;
  }

  function humanDrop(c) {
    if (over || !yourTurn || lowestEmpty(grid, c) < 0) return;
    drop(c, YOU);
    if (checkEnd()) return;
    yourTurn = false;
    statusEl.textContent = "CPU is thinking…";
    setTimeout(cpuDrop, 450);
  }

  // Try a move on a copy of the grid, report whether `player` wins with it
  function isWinningMove(c, player) {
    const r = lowestEmpty(grid, c);
    if (r < 0) return false;
    grid[r][c] = player;
    const won = wins(grid, player);
    grid[r][c] = 0;
    return won;
  }

  function cpuDrop() {
    if (over) return;
    const open = [];
    for (let c = 0; c < COLS; c++) if (lowestEmpty(grid, c) >= 0) open.push(c);

    let choice = open.find((c) => isWinningMove(c, CPU));
    if (choice === undefined) choice = open.find((c) => isWinningMove(c, YOU));
    if (choice === undefined) {
      // Center-weighted, avoiding moves that hand you a win on top
      const order = [3, 2, 4, 1, 5, 0, 6].filter((c) => open.includes(c));
      const safe = order.filter((c) => {
        const r = lowestEmpty(grid, c);
        grid[r][c] = CPU;
        const handsWin = lowestEmpty(grid, c) >= 0 && isWinningMove(c, YOU);
        grid[r][c] = 0;
        return !handsWin;
      });
      const pool = safe.length ? safe : order;
      // Mostly best-positioned, sometimes second choice, so it's beatable
      choice = pool[Math.random() < 0.75 || pool.length === 1 ? 0 : 1];
    }

    drop(choice, CPU);
    if (checkEnd()) return;
    yourTurn = true;
    statusEl.textContent = "Your move.";
  }

  function checkEnd() {
    if (wins(grid, YOU)) {
      over = true;
      youWins += 1;
      youEl.textContent = String(youWins);
      localStorage.setItem(Arcade.key("connect4"), String(Arcade.getBest("connect4") + 1));
      bestEl.textContent = Arcade.getBest("connect4");
      Sound.win();
      showEnd("YOU WIN! 🏆", "Four in a row, clean as that.");
      return true;
    }
    if (wins(grid, CPU)) {
      over = true;
      cpuWins += 1;
      cpuEl.textContent = String(cpuWins);
      Sound.die();
      showEnd("CPU WINS", "It lined them up while you weren't looking.");
      return true;
    }
    if (grid.every((row) => row.every((v) => v))) {
      over = true;
      Sound.point();
      showEnd("DRAW", "A full board and nothing to show for it.");
      return true;
    }
    return false;
  }

  function showEnd(title, msg) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", reset);
  reset();
})();
