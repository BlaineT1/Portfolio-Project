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

  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const HUMAN = "X";
  const CPU = "O";
  const CPU_SLOPPINESS = 0.15; // chance the CPU plays a random move

  let board, cells, over, humanTurn, humanStarts = true;
  let youWins = 0;
  let cpuWins = 0;

  bestEl.textContent = Arcade.getBest("ttt");

  cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");
    cell.className = "ttt-cell";
    cell.setAttribute("aria-label", "Square " + (i + 1));
    cell.addEventListener("click", () => humanMove(i));
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  function winnerOf(b) {
    for (const [a, m, z] of LINES) {
      if (b[a] && b[a] === b[m] && b[a] === b[z]) return { player: b[a], line: [a, m, z] };
    }
    return b.every((v) => v) ? { player: "D", line: null } : null;
  }

  function minimax(b, player, depth) {
    const w = winnerOf(b);
    if (w) {
      if (w.player === CPU) return { score: 10 - depth };
      if (w.player === HUMAN) return { score: depth - 10 };
      return { score: 0 };
    }
    let best = null;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = player;
      const { score } = minimax(b, player === CPU ? HUMAN : CPU, depth + 1);
      b[i] = "";
      if (
        !best ||
        (player === CPU ? score > best.score : score < best.score)
      ) {
        best = { score, idx: i };
      }
    }
    return best;
  }

  function reset() {
    board = Array(9).fill("");
    over = false;
    overlay.classList.add("hidden");
    cells.forEach((c) => {
      c.textContent = "";
      c.className = "ttt-cell";
    });
    humanStarts = !humanStarts;
    humanTurn = humanStarts;
    statusEl.textContent = humanTurn ? "Your move." : "CPU starts…";
    if (!humanTurn) setTimeout(cpuMove, 500);
  }

  function humanMove(i) {
    if (over || !humanTurn || board[i]) return;
    place(i, HUMAN);
    if (checkEnd()) return;
    humanTurn = false;
    statusEl.textContent = "CPU is thinking…";
    setTimeout(cpuMove, 400);
  }

  function cpuMove() {
    if (over) return;
    const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    let idx;
    if (Math.random() < CPU_SLOPPINESS) {
      idx = empty[Math.floor(Math.random() * empty.length)];
    } else {
      idx = minimax([...board], CPU, 0).idx;
    }
    place(idx, CPU);
    if (checkEnd()) return;
    humanTurn = true;
    statusEl.textContent = "Your move.";
  }

  function place(i, player) {
    board[i] = player;
    cells[i].textContent = player;
    cells[i].classList.add(player === HUMAN ? "x" : "o");
    Sound.click();
  }

  function checkEnd() {
    const w = winnerOf(board);
    if (!w) return false;
    over = true;
    if (w.line) w.line.forEach((i) => cells[i].classList.add("winline"));

    if (w.player === HUMAN) {
      youWins += 1;
      youEl.textContent = String(youWins);
      localStorage.setItem(Arcade.key("ttt"), String(Arcade.getBest("ttt") + 1));
      bestEl.textContent = Arcade.getBest("ttt");
      Sound.win();
      showEnd("YOU WIN! 🏆", "The mostly-ruthless CPU slipped.");
    } else if (w.player === CPU) {
      cpuWins += 1;
      cpuEl.textContent = String(cpuWins);
      Sound.die();
      showEnd("CPU WINS", "It saw that coming.");
    } else {
      Sound.point();
      showEnd("DRAW", "Nobody blinked.");
    }
    return true;
  }

  function showEnd(title, msg) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", reset);

  humanStarts = false; // reset() flips it, so the human starts round one
  reset();
})();
