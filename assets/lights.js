(() => {
  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const litEl = document.getElementById("lit");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");

  const N = 5;
  let on, moves, solved;
  const cells = [];

  for (let i = 0; i < N * N; i++) {
    const cell = document.createElement("button");
    cell.className = "light-cell";
    cell.setAttribute("aria-label", "Light " + (i + 1));
    cell.addEventListener("click", () => press(i));
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  function showBest() {
    const best = Arcade.getBest("lights");
    bestEl.textContent = best > 0 ? best + " moves" : "—";
  }

  function flipAt(i) {
    const r = Math.floor(i / N);
    const c = i % N;
    [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
        on[nr * N + nc] = !on[nr * N + nc];
      }
    });
  }

  function litCount() {
    return on.filter(Boolean).length;
  }

  function newPuzzle() {
    solved = false;
    moves = 0;
    movesEl.textContent = "0";
    overlay.classList.add("hidden");
    showBest();
    // Random presses from the solved state keep it always solvable
    do {
      on = Array(N * N).fill(false);
      for (let k = 0; k < 9; k++) flipAt(Math.floor(Math.random() * N * N));
    } while (litCount() === 0);
    render();
  }

  function render() {
    on.forEach((v, i) => cells[i].classList.toggle("on", v));
    litEl.textContent = String(litCount());
  }

  function press(i) {
    if (solved) return;
    flipAt(i);
    moves += 1;
    movesEl.textContent = String(moves);
    Sound.click();
    render();
    if (litCount() === 0) win();
  }

  function win() {
    solved = true;
    Sound.win();
    const isBest = Arcade.saveBest("lights", moves, true);
    showBest();
    overlayMsg.innerHTML =
      "Solved in " + moves + " moves" + (isBest ? "<br>🏆 New best!" : "");
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", newPuzzle);
  newBtn.addEventListener("click", newPuzzle);
  newPuzzle();
})();
