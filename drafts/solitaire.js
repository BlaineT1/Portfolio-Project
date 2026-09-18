/* Klondike Solitaire, draw one. Click a card, then click where it goes;
   click a card twice to send it to a foundation; or drag stacks around.
   Undo takes back any move. Fewest moves to win is the best score. */

(() => {
  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const bestEl = document.getElementById("best");
  const stockEl = document.getElementById("stock");
  const wasteEl = document.getElementById("waste");
  const foundEls = [...document.querySelectorAll(".sol-found")];
  const colEls = [...document.querySelectorAll(".sol-col")];
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");
  const undoBtn = document.getElementById("undo-btn");
  const finishBtn = document.getElementById("finish-btn");

  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const isRed = (card) => card.s === 1 || card.s === 2;

  let G; // { stock, waste, found[4], cols[7], moves }
  let history = [];
  let sel = null; // { pile: "waste"|"found"|"col", index, n } n = how many cards from the top of that column
  let won = false;

  function showBest() {
    const best = Arcade.getBest("solitaire");
    bestEl.textContent = best > 0 ? best + " moves" : "—";
  }

  function deal() {
    const deck = [];
    for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) deck.push({ s, r, up: false });
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    G = { stock: [], waste: [], found: [[], [], [], []], cols: [[], [], [], [], [], [], []], moves: 0 };
    for (let c = 0; c < 7; c++) {
      for (let k = 0; k <= c; k++) { const card = deck.pop(); card.up = k === c; G.cols[c].push(card); }
    }
    G.stock = deck;
    history = [];
    sel = null;
    won = false;
    overlay.classList.add("hidden");
    showBest();
    render();
  }

  function snapshot() {
    history.push(JSON.stringify(G));
    if (history.length > 200) history.shift();
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
    if (!top) return card.r === 12; // only a king on an empty column
    return top.up && isRed(top) !== isRed(card) && top.r === card.r + 1;
  }

  function canPlaceOnFound(card, f) {
    const top = f[f.length - 1];
    return top ? top.s === card.s && top.r === card.r - 1 : card.r === 0;
  }

  function takeSelection() {
    // Returns the cards being moved (not yet removed)
    if (sel.pile === "waste") return G.waste.slice(-1);
    if (sel.pile === "found") return G.found[sel.index].slice(-1);
    return G.cols[sel.index].slice(-sel.n);
  }

  function removeSelection() {
    if (sel.pile === "waste") return [G.waste.pop()];
    if (sel.pile === "found") return [G.found[sel.index].pop()];
    const col = G.cols[sel.index];
    const cards = col.splice(col.length - sel.n, sel.n);
    if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true;
    return cards;
  }

  function countMove() {
    G.moves += 1;
    Sound.click();
  }

  function moveTo(target) {
    // target: { pile: "found"|"col", index }
    const cards = takeSelection();
    if (!cards.length) return false;
    if (target.pile === "found") {
      if (cards.length !== 1 || !canPlaceOnFound(cards[0], G.found[target.index])) return false;
      if (sel.pile === "found" && sel.index === target.index) return false;
      snapshot();
      G.found[target.index].push(removeSelection()[0]);
    } else {
      if (sel.pile === "col" && sel.index === target.index) return false;
      if (!canPlaceOnCol(cards[0], G.cols[target.index])) return false;
      snapshot();
      G.cols[target.index].push(...removeSelection());
    }
    countMove();
    sel = null;
    render();
    checkWin();
    return true;
  }

  function autoToFoundation() {
    // Send the selected single card to any foundation that takes it
    const cards = takeSelection();
    if (cards.length !== 1) return false;
    for (let f = 0; f < 4; f++) if (canPlaceOnFound(cards[0], G.found[f])) return moveTo({ pile: "found", index: f });
    return false;
  }

  function drawFromStock() {
    snapshot();
    if (G.stock.length) {
      const card = G.stock.pop();
      card.up = true;
      G.waste.push(card);
    } else if (G.waste.length) {
      while (G.waste.length) { const c = G.waste.pop(); c.up = false; G.stock.push(c); }
    } else { history.pop(); return; }
    countMove();
    sel = null;
    render();
  }

  function allFaceUp() {
    return !G.stock.length && !G.waste.length && G.cols.every((col) => col.every((c) => c.up));
  }

  function autoFinish() {
    if (!allFaceUp() || won) return;
    snapshot();
    let moved = true;
    while (moved) {
      moved = false;
      for (let c = 0; c < 7; c++) {
        const col = G.cols[c];
        const top = col[col.length - 1];
        if (!top) continue;
        for (let f = 0; f < 4; f++) {
          if (canPlaceOnFound(top, G.found[f])) { G.found[f].push(col.pop()); G.moves += 1; moved = true; break; }
        }
      }
    }
    Sound.match();
    sel = null;
    render();
    checkWin();
  }

  function checkWin() {
    if (G.found.every((f) => f.length === 13)) {
      won = true;
      Sound.win();
      const isBest = Arcade.saveBest("solitaire", G.moves, true);
      showBest();
      overlayMsg.innerHTML = "Cleared in " + G.moves + " moves" + (isBest ? "<br>🏆 New best!" : "");
      overlay.classList.remove("hidden");
    }
  }

  // ── Rendering ────────────────────────────────────────────────
  function cardEl(card, extra) {
    const el = document.createElement("div");
    el.className = "sol-card" + (card.up ? (isRed(card) ? " red" : " black") : " down") + (extra || "");
    if (card.up) {
      el.innerHTML = '<span class="sol-rank">' + RANKS[card.r] + '<small>' + SUITS[card.s] + '</small></span><span class="sol-suit">' + SUITS[card.s] + "</span>";
      el.setAttribute("aria-label", RANKS[card.r] + " of " + ["spades", "hearts", "diamonds", "clubs"][card.s]);
    } else {
      el.setAttribute("aria-label", "Face-down card");
    }
    return el;
  }

  function render() {
    movesEl.textContent = String(G.moves);
    stockEl.innerHTML = "";
    stockEl.classList.toggle("empty", !G.stock.length);
    if (G.stock.length) stockEl.appendChild(cardEl(G.stock[G.stock.length - 1]));
    else stockEl.innerHTML = '<span class="sol-recycle">' + (G.waste.length ? "↻" : "") + "</span>";
    wasteEl.innerHTML = "";
    if (G.waste.length) {
      const el = cardEl(G.waste[G.waste.length - 1], sel && sel.pile === "waste" ? " sel" : "");
      el.addEventListener("click", () => onCardClick("waste", 0, 1));
      attachDrag(el, "waste", 0, 1);
      wasteEl.appendChild(el);
    }
    G.found.forEach((f, i) => {
      const el = foundEls[i];
      el.innerHTML = "";
      if (f.length) {
        const c = cardEl(f[f.length - 1], sel && sel.pile === "found" && sel.index === i ? " sel" : "");
        c.addEventListener("click", (e) => { e.stopPropagation(); onCardClick("found", i, 1); });
        attachDrag(c, "found", i, 1);
        el.appendChild(c);
      } else {
        el.innerHTML = '<span class="sol-slot">A</span>';
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
        if (card.up) {
          c.addEventListener("click", (e) => { e.stopPropagation(); onCardClick("col", i, n); });
          attachDrag(c, "col", i, n);
        }
        el.appendChild(c);
      });
      el.style.setProperty("--n", Math.max(col.length, 1));
    });
    finishBtn.hidden = !allFaceUp() || won;
    undoBtn.disabled = !history.length || won;
  }

  // ── Clicks ───────────────────────────────────────────────────
  function onCardClick(pile, index, n) {
    if (won) return;
    if (sel && sel.pile === pile && sel.index === index && sel.n === n) {
      // Second click on the same card: try a foundation
      if (!autoToFoundation()) { sel = null; render(); }
      return;
    }
    if (sel) {
      // Clicking another pile with a selection: try to move there
      if (pile === "col" && moveTo({ pile: "col", index })) return;
      if (pile === "found" && moveTo({ pile: "found", index })) return;
    }
    sel = { pile, index, n };
    Sound.flip();
    render();
  }

  stockEl.addEventListener("click", () => { if (!won) drawFromStock(); });
  colEls.forEach((el, i) => el.addEventListener("click", () => { if (sel && !won) moveTo({ pile: "col", index: i }); }));
  foundEls.forEach((el, i) => el.addEventListener("click", () => { if (sel && !won) moveTo({ pile: "found", index: i }); }));

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
      if (!d.ghost) return; // it was a click; the click handler deals with it
      d.ghost.remove();
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const target = under && under.closest(".sol-col, .sol-found");
      let moved = false;
      if (target && target.classList.contains("sol-col")) moved = moveTo({ pile: "col", index: colEls.indexOf(target) });
      else if (target && target.classList.contains("sol-found")) moved = moveTo({ pile: "found", index: foundEls.indexOf(target) });
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
  window.__solitaire = { state: () => G, draw: drawFromStock, click: onCardClick, autoFinish, setState: (g) => { G = g; render(); } };

  deal();
})();
