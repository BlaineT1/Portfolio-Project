/* Sudoku with a built-in generator. Every puzzle has exactly one solution;
   difficulty sets how many clues you get. Notes mode pencils in candidates,
   conflicts light up in red, and a hint fills the selected cell. Fastest
   solve is the best score. */

(() => {
  const boardEl = document.getElementById("board");
  const timeEl = document.getElementById("time");
  const cluesEl = document.getElementById("clues");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");
  const hintBtn = document.getElementById("hint-btn");
  const notesBtn = document.getElementById("notes-btn");
  const padEl = document.getElementById("pad");
  const diffBtns = [...document.querySelectorAll("[data-diff]")];

  const CLUES = { easy: 40, medium: 32, hard: 26 };
  let difficulty = localStorage.getItem("neon-arcade-sudoku-diff") || "easy";
  let solution, given, grid, notes, selected = 4 * 9 + 4, notesMode = false, solved = false;
  let startTime, timer, hintsUsed;

  // ── Generator ────────────────────────────────────────────────
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const peersOK = (g, i, v) => {
    const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
    for (let k = 0; k < 9; k++) {
      if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
      if (g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === v) return false;
    }
    return true;
  };

  function fill(g, i) {
    if (i === 81) return true;
    if (g[i]) return fill(g, i + 1);
    for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (peersOK(g, i, v)) { g[i] = v; if (fill(g, i + 1)) return true; g[i] = 0; }
    }
    return false;
  }

  function countSolutions(g, limit) {
    // Backtracking on the most constrained empty cell
    let best = -1, bestOpts = null;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const opts = [];
      for (let v = 1; v <= 9; v++) if (peersOK(g, i, v)) opts.push(v);
      if (!opts.length) return 0;
      if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; }
    }
    if (best === -1) return 1;
    let n = 0;
    for (const v of bestOpts) {
      g[best] = v;
      n += countSolutions(g, limit - n);
      g[best] = 0;
      if (n >= limit) break;
    }
    return n;
  }

  function generate(clues) {
    const g = Array(81).fill(0);
    fill(g, 0);
    const sol = g.slice();
    const puzzle = g.slice();
    let remaining = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (remaining <= clues) break;
      const keep = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle.slice(), 2) !== 1) puzzle[i] = keep; else remaining--;
    }
    return { sol, puzzle };
  }

  // ── Board ────────────────────────────────────────────────────
  const cells = [];
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "su-cell";
    cell.addEventListener("click", () => { selected = i; Sound.click(); render(); });
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  function conflicts(i) {
    const v = grid[i];
    if (!v) return false;
    const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
    for (let k = 0; k < 9; k++) {
      const a = r * 9 + k, b = k * 9 + c, d = (br + Math.floor(k / 3)) * 9 + bc + (k % 3);
      if ((a !== i && grid[a] === v) || (b !== i && grid[b] === v) || (d !== i && grid[d] === v)) return true;
    }
    return false;
  }

  function render() {
    const sr = Math.floor(selected / 9), sc = selected % 9;
    const sv = grid[selected];
    for (let i = 0; i < 81; i++) {
      const cell = cells[i], r = Math.floor(i / 9), c = i % 9;
      const v = grid[i];
      cell.className = "su-cell" +
        (given[i] ? " given" : "") +
        (i === selected ? " sel" : "") +
        (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)) ? " peer" : "") +
        (sv && v === sv && i !== selected ? " same" : "") +
        (conflicts(i) ? " bad" : "");
      if (v) cell.textContent = v;
      else if (notes[i].size) cell.innerHTML = '<span class="su-notes">' + [1,2,3,4,5,6,7,8,9].map((n) => "<i>" + (notes[i].has(n) ? n : "") + "</i>").join("") + "</span>";
      else cell.textContent = "";
    }
    cluesEl.textContent = grid.filter(Boolean).length + "/81";
    notesBtn.classList.toggle("active", notesMode);
    notesBtn.textContent = notesMode ? "✎ NOTES ON" : "✎ NOTES";
  }

  function fmt(sec) { return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function tick() { timeEl.textContent = fmt(Math.floor((Date.now() - startTime) / 1000)); }

  function showBest() {
    const best = Arcade.getBest("sudoku");
    bestEl.textContent = best > 0 ? fmt(best) : "—";
  }

  function enter(v) {
    if (solved || given[selected]) return;
    if (v === 0) { grid[selected] = 0; notes[selected].clear(); }
    else if (notesMode) { grid[selected] = 0; if (notes[selected].has(v)) notes[selected].delete(v); else notes[selected].add(v); }
    else {
      grid[selected] = v;
      notes[selected].clear();
      // Clear that number from the notes of peers
      const r = Math.floor(selected / 9), c = selected % 9, br = r - (r % 3), bc = c - (c % 3);
      for (let k = 0; k < 9; k++) { notes[r * 9 + k].delete(v); notes[k * 9 + c].delete(v); notes[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)].delete(v); }
    }
    Sound.click();
    render();
    checkWin();
  }

  function hint() {
    if (solved) return;
    let i = selected;
    if (given[i] || grid[i] === solution[i]) { // pick the first wrong or empty cell instead
      i = grid.findIndex((v, k) => !given[k] && v !== solution[k]);
      if (i < 0) return;
      selected = i;
    }
    grid[i] = solution[i];
    notes[i].clear();
    hintsUsed += 1;
    Sound.flag();
    render();
    checkWin();
  }

  function checkWin() {
    if (grid.some((v, i) => v !== solution[i])) return;
    solved = true;
    clearInterval(timer);
    const secs = Math.floor((Date.now() - startTime) / 1000);
    Sound.win();
    const isBest = hintsUsed === 0 && Arcade.saveBest("sudoku", secs, true);
    showBest();
    overlayMsg.innerHTML = "Solved in " + fmt(secs) + (hintsUsed ? " with " + hintsUsed + " hint" + (hintsUsed > 1 ? "s" : "") : "") + (isBest ? "<br>🏆 New best time!" : "");
    overlay.classList.remove("hidden");
  }

  function newPuzzle() {
    const { sol, puzzle } = generate(CLUES[difficulty]);
    solution = sol;
    grid = puzzle.slice();
    given = puzzle.map((v) => v !== 0);
    notes = Array.from({ length: 81 }, () => new Set());
    solved = false;
    hintsUsed = 0;
    notesMode = false;
    selected = grid.findIndex((v) => !v);
    overlay.classList.add("hidden");
    showBest();
    clearInterval(timer);
    startTime = Date.now();
    timer = setInterval(tick, 500);
    tick();
    render();
  }

  // Number pad
  for (let v = 1; v <= 9; v++) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "su-key"; b.textContent = v;
    b.addEventListener("click", () => enter(v));
    padEl.appendChild(b);
  }
  const erase = document.createElement("button");
  erase.type = "button"; erase.className = "su-key su-erase"; erase.textContent = "⌫"; erase.setAttribute("aria-label", "Erase");
  erase.addEventListener("click", () => enter(0));
  padEl.appendChild(erase);

  document.addEventListener("keydown", (e) => {
    if (e.key >= "1" && e.key <= "9") { enter(Number(e.key)); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { enter(0); e.preventDefault(); }
    else if (e.key === "n" || e.key === "N") { notesMode = !notesMode; render(); }
    else if (e.key.startsWith("Arrow")) {
      const r = Math.floor(selected / 9), c = selected % 9;
      const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      const nr = (r + d[0] + 9) % 9, nc = (c + d[1] + 9) % 9;
      selected = nr * 9 + nc;
      e.preventDefault();
      render();
    }
  });

  diffBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.diff === difficulty);
    btn.addEventListener("click", () => {
      difficulty = btn.dataset.diff;
      localStorage.setItem("neon-arcade-sudoku-diff", difficulty);
      diffBtns.forEach((b) => b.classList.toggle("active", b === btn));
      newPuzzle();
    });
  });
  notesBtn.addEventListener("click", () => { notesMode = !notesMode; Sound.click(); render(); });
  hintBtn.addEventListener("click", hint);
  overlayBtn.addEventListener("click", newPuzzle);
  newBtn.addEventListener("click", newPuzzle);

  // Exposed for the arcade's browser tests
  window.__sudoku = { solution: () => solution, grid: () => grid, given: () => given, enter, select: (i) => { selected = i; render(); }, countSolutions: (g) => countSolutions(g.slice(), 2) };

  newPuzzle();
})();
