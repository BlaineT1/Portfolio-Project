/* Sokoban: push every crate onto a target. Arrow keys, WASD, the on-screen
   pad, or swipes move you. Z undoes a move, R restarts the level. Progress
   and per-level best move counts are saved in the browser. */

(() => {
  const boardEl = document.getElementById("board");
  const levelEl = document.getElementById("level");
  const movesEl = document.getElementById("moves");
  const pushesEl = document.getElementById("pushes");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const undoBtn = document.getElementById("undo-btn");
  const restartBtn = document.getElementById("restart-btn");
  const levelsEl = document.getElementById("levels");

  // # wall, space floor, . target, $ crate, * crate on target, @ you, + you on target
  const LEVELS = [
    ["#######", "#     #", "# .$@ #", "#     #", "#######"],
    ["#######", "#.    #", "# $   #", "#  $@ #", "#    .#", "#######"],
    ["########", "#      #", "# .##  #", "# $ $  #", "#  .@  #", "#      #", "########"],
    ["########", "#   .  #", "# $$   #", "#  #.  #", "# @ $. #", "#      #", "########"],
    [" ######", " #    #", "##  $.#", "# $.# #", "# @   #", "#  $ .#", "#######"],
    ["#########", "#   #   #", "# $ # . #", "#   $   #", "#@  #  .#", "#   #   #", "#########"],
    ["########", "#      #", "# #$#  #", "# . .  #", "# #$#  #", "#   @  #", "########"],
    ["#########", "#.  #   #", "#   $ $ #", "##  #   #", " #$ @ . #", " #  #  .#", " ########"],
    [" #######", "##     #", "# $ $  #", "# #.#. #", "#  $ . #", "#   @  #", "########"],
    ["##########", "#        #", "# $$  .. #", "# @#  #  #", "#  $  .  #", "#        #", "##########"],
    ["#########", "#   #   #", "#.$   $.#", "#   #   #", "##$ @ $##", "#.  #  .#", "#########"],
    [" ########", " #      #", "##.$ $. #", "#  ##   #", "# $ .  ##", "#  @ $. #", "#########"],
  ];

  let level = Math.min(Number(localStorage.getItem("neon-arcade-sokoban-level")) || 0, LEVELS.length - 1);
  let unlocked = Math.min(Number(localStorage.getItem("neon-arcade-sokoban-unlocked")) || 0, LEVELS.length - 1);
  let walls, goals, boxes, player, cols, rows, moves, pushes, history, done;

  const key = (r, c) => r * 100 + c;

  function load(n) {
    level = n;
    localStorage.setItem("neon-arcade-sokoban-level", level);
    const rowsSrc = LEVELS[n];
    rows = rowsSrc.length;
    cols = Math.max(...rowsSrc.map((r) => r.length));
    walls = new Set(); goals = new Set(); boxes = new Set();
    rowsSrc.forEach((row, r) => {
      for (let c = 0; c < cols; c++) {
        const ch = row[c] || " ";
        if (ch === "#") walls.add(key(r, c));
        if (ch === "." || ch === "*" || ch === "+") goals.add(key(r, c));
        if (ch === "$" || ch === "*") boxes.add(key(r, c));
        if (ch === "@" || ch === "+") player = [r, c];
      }
    });
    moves = 0; pushes = 0; history = []; done = false;
    overlay.classList.add("hidden");
    buildBoard();
    render();
    renderLevels();
  }

  const cells = new Map();
  function buildBoard() {
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--cols", cols);
    boardEl.style.setProperty("--rows", rows);
    cells.clear();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "soko-cell";
      boardEl.appendChild(cell);
      cells.set(key(r, c), cell);
    }
  }

  function render() {
    for (const [k, cell] of cells) {
      const isWall = walls.has(k), isGoal = goals.has(k), isBox = boxes.has(k), isPlayer = key(player[0], player[1]) === k;
      cell.className = "soko-cell" + (isWall ? " wall" : " floor") + (isGoal ? " goal" : "") + (isBox ? " box" + (isGoal ? " on" : "") : "") + (isPlayer ? " player" : "");
      cell.textContent = isBox ? "📦" : isPlayer ? "🙂" : "";
    }
    levelEl.textContent = level + 1;
    movesEl.textContent = moves;
    pushesEl.textContent = pushes;
    undoBtn.disabled = !history.length;
  }

  function renderLevels() {
    levelsEl.innerHTML = "";
    LEVELS.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "menu-btn" + (i === level ? " active" : "");
      b.textContent = i + 1;
      b.disabled = i > unlocked;
      b.title = i > unlocked ? "Locked" : "Level " + (i + 1) + (localStorage.getItem("neon-arcade-sokoban-best-" + i) ? " · best " + localStorage.getItem("neon-arcade-sokoban-best-" + i) + " moves" : "");
      b.addEventListener("click", () => { Sound.click(); load(i); });
      levelsEl.appendChild(b);
    });
  }

  function move(dr, dc) {
    if (done) return;
    const [r, c] = player;
    const nr = r + dr, nc = c + dc;
    const k1 = key(nr, nc);
    if (walls.has(k1)) return;
    let pushed = false;
    if (boxes.has(k1)) {
      const k2 = key(nr + dr, nc + dc);
      if (walls.has(k2) || boxes.has(k2)) return;
      history.push({ player, boxes: new Set(boxes), moves, pushes });
      boxes.delete(k1);
      boxes.add(k2);
      pushed = true;
      pushes += 1;
      Sound.lockPiece();
    } else {
      history.push({ player, boxes: new Set(boxes), moves, pushes });
      Sound.click();
    }
    if (history.length > 500) history.shift();
    player = [nr, nc];
    moves += 1;
    render();
    if (pushed && [...boxes].every((b) => goals.has(b))) win();
  }

  function undo() {
    if (!history.length || done) return;
    const h = history.pop();
    player = h.player; boxes = h.boxes; moves = h.moves; pushes = h.pushes;
    Sound.flip();
    render();
  }

  function win() {
    done = true;
    Sound.win();
    const bestKey = "neon-arcade-sokoban-best-" + level;
    const prev = Number(localStorage.getItem(bestKey)) || 0;
    const isBest = !prev || moves < prev;
    if (isBest) localStorage.setItem(bestKey, moves);
    if (level + 1 > unlocked) { unlocked = Math.min(level + 1, LEVELS.length - 1); localStorage.setItem("neon-arcade-sokoban-unlocked", unlocked); }
    Arcade.saveBest("sokoban", level + 1);
    const last = level === LEVELS.length - 1;
    overlayTitle.textContent = last ? "ALL CLEAR!" : "LEVEL CLEAR!";
    overlayMsg.innerHTML = moves + " moves, " + pushes + " pushes" + (isBest ? "<br>🏆 Best for this level" : "") + (last ? "<br>You've beaten every level." : "");
    overlayBtn.textContent = last ? "PLAY AGAIN" : "NEXT LEVEL";
    overlay.classList.remove("hidden");
    renderLevels();
  }

  overlayBtn.addEventListener("click", () => load(level === LEVELS.length - 1 ? 0 : level + 1));
  undoBtn.addEventListener("click", undo);
  restartBtn.addEventListener("click", () => { Sound.click(); load(level); });
  document.getElementById("btn-up").addEventListener("click", () => move(-1, 0));
  document.getElementById("btn-down").addEventListener("click", () => move(1, 0));
  document.getElementById("btn-left").addEventListener("click", () => move(0, -1));
  document.getElementById("btn-right").addEventListener("click", () => move(0, 1));

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const dir = { arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0], arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1] }[k];
    if (dir) { e.preventDefault(); move(dir[0], dir[1]); }
    else if (k === "z") undo();
    else if (k === "r") load(level);
  });

  // Swipe
  let touch = null;
  boardEl.addEventListener("touchstart", (e) => { touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  boardEl.addEventListener("touchend", (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch[0], dy = e.changedTouches[0].clientY - touch[1];
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1); else move(dy > 0 ? 1 : -1, 0);
  });

  // Exposed for the arcade's browser tests
  window.__sokoban = { LEVELS, move, load, state: () => ({ level, player, boxes: [...boxes], goals: [...goals], moves, done }) };

  load(level);
})();
