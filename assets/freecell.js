/* FreeCell. All 52 cards deal face up into 8 columns; 4 free cells hold one
   card each as scratch space. Build tableau runs descending, alternating
   color; foundations run each suit up from ace. Selecting a valid ordered
   run near the top of a column and moving it as a block (a "supermove") is
   allowed up to (empty free cells + 1) x 2^(empty columns) cards, the usual
   FreeCell limit. Auto Finish only appears once a plain send-everything
   pass is proven, by simulation, to clear the whole board. */

(() => {
  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const bestEl = document.getElementById("best");
  const freeEls = [...document.querySelectorAll(".fc-free")];
  const foundEls = [...document.querySelectorAll(".fc-found")];
  const colEls = [...document.querySelectorAll(".fc-col")];
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");
  const undoBtn = document.getElementById("undo-btn");
  const finishBtn = document.getElementById("finish-btn");

  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const isRed = (c) => c.s === 1 || c.s === 2;

  let G; // { free: [card|null x4], found: [[],[],[],[]], cols: [[] x8], moves }
  let history = [];
  let sel = null; // { pile: "free"|"col", index, n }
  let won = false;

  function showBest() {
    const best = Arcade.getBest("freecell");
    bestEl.textContent = best > 0 ? best + " moves" : "—";
  }

  function deal() {
    const deck = [];
    for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) deck.push({ s, r });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const cols = Array.from({ length: 8 }, () => []);
    deck.forEach((c, i) => cols[i % 8].push(c));
    G = { free: [null, null, null, null], found: [[], [], [], []], cols, moves: 0 };
    history = [];
    sel = null;
    won = false;
    overlay.classList.add("hidden");
    showBest();
    render();
  }

  function snapshot() {
    history.push(JSON.stringify(G));
    if (history.length > 300) history.shift();
  }

  function undo() {
    if (!history.length || won) return;
    G = JSON.parse(history.pop());
    sel = null;
    Sound.flip();
    render();
  }

  // ── Rules ────────────────────────────────────────────────────
  function canPlaceOnCol(card, col) {
    const top = col[col.length - 1];
    if (!top) return true;
    return isRed(top) !== isRed(card) && top.r === card.r + 1;
  }
  function canPlaceOnFound(card, f) {
    const top = f[f.length - 1];
    return top ? top.s === card.s && top.r === card.r - 1 : card.r === 0;
  }
  function emptyFreeCount(free) { return free.filter((c) => c === null).length; }
  function emptyColCount(cols) { return cols.filter((c) => c.length === 0).length; }
  function maxSupermove(destIsEmptyCol) {
    const freeN = emptyFreeCount(G.free);
    let colN = emptyColCount(G.cols);
    if (destIsEmptyCol) colN = Math.max(0, colN - 1);
    return (freeN + 1) * Math.pow(2, colN);
  }

  // Longest validly-ordered run ending at the top of `col`, capped at `col.length`
  function runLengthFromTop(col) {
    let n = 1;
    for (let i = col.length - 1; i > 0; i--) {
      const lower = col[i], upper = col[i - 1];
      if (isRed(lower) !== isRed(upper) && lower.r === upper.r - 1) n++;
      else break;
    }
    return n;
  }

  function selectableRun(col, clickedIndex) {
    // How many cards from clickedIndex to the top form a valid run?
    const fromTop = col.length - clickedIndex;
    const validRun = runLengthFromTop(col);
    return fromTop <= validRun ? fromTop : 1; // fall back to just the top card
  }

  function takeSelection() {
    if (sel.pile === "free") return [G.free[sel.index]];
    return G.cols[sel.index].slice(-sel.n);
  }
  function removeSelection() {
    if (sel.pile === "free") { const c = G.free[sel.index]; G.free[sel.index] = null; return [c]; }
    return G.cols[sel.index].splice(G.cols[sel.index].length - sel.n, sel.n);
  }

  function countMove() { G.moves += 1; Sound.click(); }

  function moveTo(target) {
    const cards = takeSelection();
    if (!cards.length) return false;
    if (target.pile === "free") {
      if (cards.length !== 1 || G.free[target.index] !== null) return false;
      if (sel.pile === "free" && sel.index === target.index) return false;
      snapshot();
      G.free[target.index] = removeSelection()[0];
    } else if (target.pile === "found") {
      if (cards.length !== 1 || !canPlaceOnFound(cards[0], G.found[target.index])) return false;
      snapshot();
      G.found[target.index].push(removeSelection()[0]);
    } else {
      const destCol = G.cols[target.index];
      if (sel.pile === "col" && sel.index === target.index) return false;
      if (!canPlaceOnCol(cards[0], destCol)) return false;
      if (cards.length > maxSupermove(destCol.length === 0)) return false;
      snapshot();
      destCol.push(...removeSelection());
    }
    countMove();
    sel = null;
    render();
    checkWin();
    return true;
  }

  function autoToFoundation() {
    const cards = takeSelection();
    if (cards.length !== 1) return false;
    for (let f = 0; f < 4; f++) if (canPlaceOnFound(cards[0], G.found[f])) return moveTo({ pile: "found", index: f });
    return false;
  }

  // Simulate a greedy "send anything that can go" loop; only offer Auto
  // Finish when it is proven to empty every free cell and every column.
  function simulateAutoFinish(state) {
    const s = JSON.parse(JSON.stringify(state));
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < 4; i++) {
        const c = s.free[i];
        if (c) for (let f = 0; f < 4; f++) if (canPlaceOnFound(c, s.found[f])) { s.found[f].push(c); s.free[i] = null; moved = true; break; }
      }
      for (const col of s.cols) {
        const c = col[col.length - 1];
        if (c) for (let f = 0; f < 4; f++) if (canPlaceOnFound(c, s.found[f])) { s.found[f].push(col.pop()); moved = true; break; }
      }
    }
    return s.free.every((c) => c === null) && s.cols.every((c) => c.length === 0) ? s : null;
  }

  function autoFinish() {
    const result = simulateAutoFinish(G);
    if (!result || won) return;
    snapshot();
    const added = 52 - G.found.reduce((n, f) => n + f.length, 0);
    G.free = result.free; G.cols = result.cols; G.found = result.found;
    G.moves += added;
    Sound.match();
    sel = null;
    render();
    checkWin();
  }

  function checkWin() {
    if (G.found.every((f) => f.length === 13)) {
      won = true;
      Sound.win();
      const isBest = Arcade.saveBest("freecell", G.moves, true);
      showBest();
      overlayMsg.innerHTML = "Cleared in " + G.moves + " moves" + (isBest ? "<br>🏆 New best!" : "");
      overlay.classList.remove("hidden");
    }
  }

  // ── Rendering ────────────────────────────────────────────────
  function cardEl(card, extra) {
    const el = document.createElement("div");
    el.className = "sol-card" + (isRed(card) ? " red" : "") + (extra || "");
    el.innerHTML = '<span class="sol-rank">' + RANKS[card.r] + "<small>" + SUITS[card.s] + '</small></span><span class="sol-suit">' + SUITS[card.s] + "</span>";
    el.setAttribute("aria-label", RANKS[card.r] + " of " + ["spades", "hearts", "diamonds", "clubs"][card.s]);
    return el;
  }

  function render() {
    movesEl.textContent = String(G.moves);
    G.free.forEach((c, i) => {
      const el = freeEls[i];
      el.innerHTML = "";
      if (c) {
        const cardE = cardEl(c, sel && sel.pile === "free" && sel.index === i ? " sel" : "");
        cardE.addEventListener("click", (e) => { e.stopPropagation(); onClick("free", i, 1); });
        attachDrag(cardE, "free", i, 1);
        el.appendChild(cardE);
      } else {
        el.innerHTML = '<span class="sol-slot"></span>';
      }
    });
    G.found.forEach((f, i) => {
      const el = foundEls[i];
      el.innerHTML = "";
      if (f.length) {
        const c = cardEl(f[f.length - 1]);
        el.appendChild(c);
      } else {
        el.innerHTML = '<span class="sol-slot">' + SUITS[i] + "</span>";
      }
    });
    G.cols.forEach((col, i) => {
      const el = colEls[i];
      el.innerHTML = "";
      col.forEach((card, k) => {
        const n = col.length - k;
        const selected = sel && sel.pile === "col" && sel.index === i && n <= sel.n;
        const c = cardEl(card, selected ? " sel" : "");
        c.style.setProperty("--k", k);
        c.addEventListener("click", (e) => { e.stopPropagation(); onClick("col", i, selectableRun(col, k)); });
        attachDrag(c, "col", i, selectableRun(col, k));
        el.appendChild(c);
      });
      el.style.setProperty("--n", Math.max(col.length, 1));
    });
    finishBtn.hidden = won || !simulateAutoFinish(G);
    undoBtn.disabled = !history.length || won;
  }

  function onClick(pile, index, n) {
    if (won) return;
    if (sel && sel.pile === pile && sel.index === index && sel.n === n) {
      if (!autoToFoundation()) { sel = null; render(); }
      return;
    }
    if (sel) {
      if (pile === "col" && moveTo({ pile: "col", index })) return;
      if (pile === "free" && moveTo({ pile: "free", index })) return;
    }
    sel = { pile, index, n };
    Sound.flip();
    render();
  }

  freeEls.forEach((el, i) => el.addEventListener("click", () => { if (sel && !won) moveTo({ pile: "free", index: i }); }));
  foundEls.forEach((el, i) => el.addEventListener("click", () => { if (sel && !won) moveTo({ pile: "found", index: i }); }));
  colEls.forEach((el, i) => el.addEventListener("click", () => { if (sel && !won) moveTo({ pile: "col", index: i }); }));

  // ── Drag and drop ────────────────────────────────────────────
  let drag = null;
  function attachDrag(el, pile, index, n) {
    el.addEventListener("pointerdown", (e) => {
      if (won || e.button !== 0) return;
      drag = { pile, index, n, x: e.clientX, y: e.clientY, ghost: null, el };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!drag || drag.el !== el) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.ghost) {
        if (Math.hypot(dx, dy) < 6) return;
        sel = { pile, index, n };
        render();
        drag.ghost = document.createElement("div");
        drag.ghost.className = "sol-drag";
        takeSelection().forEach((card, k) => { const c = cardEl(card); c.style.setProperty("--k", k); drag.ghost.appendChild(c); });
        const rect = el.getBoundingClientRect();
        drag.ghost.style.width = rect.width + "px";
        drag.ox = drag.x - rect.left; drag.oy = drag.y - rect.top;
        document.body.appendChild(drag.ghost);
      }
      drag.ghost.style.left = e.clientX - drag.ox + "px";
      drag.ghost.style.top = e.clientY - drag.oy + "px";
    });
    const finish = (e) => {
      if (!drag || drag.el !== el) return;
      const d = drag; drag = null;
      if (!d.ghost) return;
      d.ghost.remove();
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const target = under && under.closest(".fc-free, .fc-found, .fc-col");
      let moved = false;
      if (target) {
        if (target.classList.contains("fc-free")) moved = moveTo({ pile: "free", index: freeEls.indexOf(target) });
        else if (target.classList.contains("fc-found")) moved = moveTo({ pile: "found", index: foundEls.indexOf(target) });
        else moved = moveTo({ pile: "col", index: colEls.indexOf(target) });
      }
      if (!moved) { sel = null; render(); }
    };
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
  }

  overlayBtn.addEventListener("click", deal);
  newBtn.addEventListener("click", deal);
  undoBtn.addEventListener("click", undo);
  finishBtn.addEventListener("click", autoFinish);
  document.addEventListener("keydown", (e) => { if (e.key === "z" || e.key === "Z") undo(); });

  // Exposed for the arcade's browser tests
  window.__freecell = {
    state: () => G, click: onClick, autoFinish, maxSupermove,
    setState: (g) => { G = g; won = false; sel = null; overlay.classList.add("hidden"); render(); },
  };

  deal();
})();
