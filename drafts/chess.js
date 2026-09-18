/* Chess against a CPU. Full rules: castling, en passant, promotion (to a
   queen), check, checkmate, stalemate. The CPU is a negamax search with
   alpha-beta pruning over material plus piece-square tables; difficulty sets
   the search depth. You play white. */

(() => {
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const winsEl = document.getElementById("wins");
  const lossesEl = document.getElementById("losses");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");
  const undoBtn = document.getElementById("undo-btn");
  const diffBtns = [...document.querySelectorAll("[data-diff]")];

  const DEPTH = { easy: 1, normal: 2, hard: 3 };
  const GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" };
  const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
  // Piece-square tables from white's point of view (index 0 = a8)
  const PST = {
    P: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    N: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    B: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    R: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    Q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    K: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
  };

  // ── State ────────────────────────────────────────────────────
  // board: 64 entries, uppercase white / lowercase black / null. Index 0 = a8.
  let S; // { board, turn, castle: {K,Q,k,q}, ep, history: [] }
  let difficulty = localStorage.getItem("neon-arcade-chess-diff") || "normal";
  let selected = null;
  let legalFromSel = [];
  let lastMove = null;
  let gameOver = false;
  let thinking = false;
  let record = { wins: Number(localStorage.getItem("neon-arcade-chess-wins")) || 0, losses: Number(localStorage.getItem("neon-arcade-chess-losses")) || 0 };

  const isWhite = (p) => p && p === p.toUpperCase();
  const colorOf = (p) => (isWhite(p) ? "w" : "b");
  const rc = (i) => [Math.floor(i / 8), i % 8];
  const idx = (r, c) => r * 8 + c;
  const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  function startBoard() {
    const b = Array(64).fill(null);
    const back = "RNBQKBNR";
    for (let c = 0; c < 8; c++) {
      b[idx(0, c)] = back[c].toLowerCase();
      b[idx(1, c)] = "p";
      b[idx(6, c)] = "P";
      b[idx(7, c)] = back[c];
    }
    return b;
  }

  // ── Move generation ──────────────────────────────────────────
  function attacked(st, sq, by) {
    // Is square `sq` attacked by color `by`?
    const [r, c] = rc(sq);
    const pawnDir = by === "w" ? 1 : -1; // white pawns attack upward (toward row 0)
    for (const dc of [-1, 1]) {
      const rr = r + pawnDir, cc = c + dc;
      if (inside(rr, cc)) { const p = st.board[idx(rr, cc)]; if (p && colorOf(p) === by && p.toUpperCase() === "P") return true; }
    }
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const rr = r + dr, cc = c + dc;
      if (inside(rr, cc)) { const p = st.board[idx(rr, cc)]; if (p && colorOf(p) === by && p.toUpperCase() === "N") return true; }
    }
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const rr = r + dr, cc = c + dc;
      if (inside(rr, cc)) { const p = st.board[idx(rr, cc)]; if (p && colorOf(p) === by && p.toUpperCase() === "K") return true; }
    }
    const rays = [[[-1,0],[1,0],[0,-1],[0,1]], [[-1,-1],[-1,1],[1,-1],[1,1]]];
    for (let k = 0; k < 2; k++) {
      for (const [dr, dc] of rays[k]) {
        let rr = r + dr, cc = c + dc;
        while (inside(rr, cc)) {
          const p = st.board[idx(rr, cc)];
          if (p) {
            if (colorOf(p) === by) { const t = p.toUpperCase(); if (t === "Q" || (k === 0 && t === "R") || (k === 1 && t === "B")) return true; }
            break;
          }
          rr += dr; cc += dc;
        }
      }
    }
    return false;
  }

  function kingSquare(st, color) {
    const k = color === "w" ? "K" : "k";
    return st.board.indexOf(k);
  }

  function inCheck(st, color) {
    const k = kingSquare(st, color);
    return k >= 0 && attacked(st, k, color === "w" ? "b" : "w");
  }

  function pseudoMoves(st, color) {
    const moves = [];
    const b = st.board;
    const add = (from, to, extra) => moves.push(Object.assign({ from, to, piece: b[from], capture: b[to] }, extra));
    for (let from = 0; from < 64; from++) {
      const p = b[from];
      if (!p || colorOf(p) !== color) continue;
      const t = p.toUpperCase();
      const [r, c] = rc(from);
      if (t === "P") {
        const dir = color === "w" ? -1 : 1;
        const startRow = color === "w" ? 6 : 1;
        const promoRow = color === "w" ? 0 : 7;
        const r1 = r + dir;
        if (inside(r1, c) && !b[idx(r1, c)]) {
          add(from, idx(r1, c), r1 === promoRow ? { promo: color === "w" ? "Q" : "q" } : {});
          if (r === startRow && !b[idx(r + 2 * dir, c)]) add(from, idx(r + 2 * dir, c), { double: true });
        }
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (!inside(r1, cc)) continue;
          const to = idx(r1, cc);
          if (b[to] && colorOf(b[to]) !== color) add(from, to, r1 === promoRow ? { promo: color === "w" ? "Q" : "q" } : {});
          else if (to === st.ep) add(from, to, { ep: true, capture: b[idx(r, cc)] });
        }
      } else if (t === "N" || t === "K") {
        const deltas = t === "N" ? [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] : [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of deltas) {
          const rr = r + dr, cc = c + dc;
          if (!inside(rr, cc)) continue;
          const to = idx(rr, cc);
          if (!b[to] || colorOf(b[to]) !== color) add(from, to);
        }
        if (t === "K") {
          const home = color === "w" ? 7 : 0;
          const enemy = color === "w" ? "b" : "w";
          if (r === home && c === 4 && !inCheck(st, color)) {
            const kR = color === "w" ? "K" : "k", qR = color === "w" ? "Q" : "q";
            if (st.castle[kR] && !b[idx(home, 5)] && !b[idx(home, 6)] && b[idx(home, 7)] === (color === "w" ? "R" : "r") &&
                !attacked(st, idx(home, 5), enemy) && !attacked(st, idx(home, 6), enemy)) add(from, idx(home, 6), { castle: "K" });
            if (st.castle[qR] && !b[idx(home, 3)] && !b[idx(home, 2)] && !b[idx(home, 1)] && b[idx(home, 0)] === (color === "w" ? "R" : "r") &&
                !attacked(st, idx(home, 3), enemy) && !attacked(st, idx(home, 2), enemy)) add(from, idx(home, 2), { castle: "Q" });
          }
        }
      } else {
        const rays = t === "R" ? [[-1,0],[1,0],[0,-1],[0,1]] : t === "B" ? [[-1,-1],[-1,1],[1,-1],[1,1]] : [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of rays) {
          let rr = r + dr, cc = c + dc;
          while (inside(rr, cc)) {
            const to = idx(rr, cc);
            if (b[to]) { if (colorOf(b[to]) !== color) add(from, to); break; }
            add(from, to);
            rr += dr; cc += dc;
          }
        }
      }
    }
    return moves;
  }

  function apply(st, m) {
    // Returns a new state with the move made
    const b = st.board.slice();
    const castle = Object.assign({}, st.castle);
    const p = b[m.from];
    const color = colorOf(p);
    b[m.to] = m.promo || p;
    b[m.from] = null;
    if (m.ep) b[m.to + (color === "w" ? 8 : -8)] = null;
    if (m.castle === "K") { const home = color === "w" ? 7 : 0; b[idx(home, 5)] = b[idx(home, 7)]; b[idx(home, 7)] = null; }
    if (m.castle === "Q") { const home = color === "w" ? 7 : 0; b[idx(home, 3)] = b[idx(home, 0)]; b[idx(home, 0)] = null; }
    const t = p.toUpperCase();
    if (t === "K") { if (color === "w") { castle.K = castle.Q = false; } else { castle.k = castle.q = false; } }
    if (m.from === 63 || m.to === 63) castle.K = false;
    if (m.from === 56 || m.to === 56) castle.Q = false;
    if (m.from === 7 || m.to === 7) castle.k = false;
    if (m.from === 0 || m.to === 0) castle.q = false;
    const ep = m.double ? (m.from + m.to) / 2 : null;
    return { board: b, turn: color === "w" ? "b" : "w", castle, ep };
  }

  function legalMoves(st, color) {
    return pseudoMoves(st, color).filter((m) => !inCheck(apply(st, m), color));
  }

  // ── Search ───────────────────────────────────────────────────
  function evaluate(st) {
    // From white's point of view
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const p = st.board[i];
      if (!p) continue;
      const t = p.toUpperCase();
      if (isWhite(p)) score += VALUE[t] + PST[t][i];
      else score -= VALUE[t] + PST[t][63 - i];
    }
    return score;
  }

  function orderMoves(moves) {
    return moves.sort((a, b) => (b.capture ? VALUE[b.capture.toUpperCase()] : 0) - (a.capture ? VALUE[a.capture.toUpperCase()] : 0));
  }

  function negamax(st, depth, alpha, beta, color) {
    const moves = legalMoves(st, color);
    if (!moves.length) return inCheck(st, color) ? -100000 - depth : 0; // mate is worse the sooner it comes
    if (depth === 0) return color === "w" ? evaluate(st) : -evaluate(st);
    let best = -Infinity;
    for (const m of orderMoves(moves)) {
      const v = -negamax(apply(st, m), depth - 1, -beta, -alpha, color === "w" ? "b" : "w");
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  function cpuMove() {
    const depth = DEPTH[difficulty];
    const moves = orderMoves(legalMoves(S, "b"));
    if (!moves.length) return null;
    let bestV = -Infinity, bestMoves = [];
    for (const m of moves) {
      const v = -negamax(apply(S, m), depth - 1, -Infinity, Infinity, "w");
      if (v > bestV + 0.5) { bestV = v; bestMoves = [m]; }
      else if (Math.abs(v - bestV) <= 0.5) bestMoves.push(m);
    }
    if (difficulty === "easy" && Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)]; // rookie blunders
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // ── UI ───────────────────────────────────────────────────────
  const squares = [];
  for (let i = 0; i < 64; i++) {
    const [r, c] = rc(i);
    const sq = document.createElement("button");
    sq.type = "button";
    sq.className = "chess-sq " + ((r + c) % 2 ? "dark" : "light");
    sq.dataset.i = i;
    sq.setAttribute("aria-label", "abcdefgh"[c] + (8 - r));
    sq.addEventListener("click", () => onSquare(i));
    boardEl.appendChild(sq);
    squares.push(sq);
  }

  function render() {
    const check = !gameOver && inCheck(S, S.turn) ? kingSquare(S, S.turn) : -1;
    for (let i = 0; i < 64; i++) {
      const p = S.board[i];
      const sq = squares[i];
      sq.innerHTML = p ? '<span class="chess-piece ' + (isWhite(p) ? "white" : "black") + '">' + GLYPH[p.toUpperCase()] + "</span>" : "";
      sq.classList.toggle("sel", selected === i);
      const mv = legalFromSel.find((m) => m.to === i);
      sq.classList.toggle("move", !!mv && !mv.capture);
      sq.classList.toggle("capture", !!mv && !!mv.capture);
      sq.classList.toggle("last", !!lastMove && (lastMove.from === i || lastMove.to === i));
      sq.classList.toggle("check", i === check);
    }
    winsEl.textContent = record.wins;
    lossesEl.textContent = record.losses;
    undoBtn.disabled = S.history.length < 2 || thinking;
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function onSquare(i) {
    if (gameOver || thinking || S.turn !== "w") return;
    const p = S.board[i];
    const mv = legalFromSel.find((m) => m.to === i);
    if (mv) { playerMove(mv); return; }
    if (p && isWhite(p)) {
      selected = i;
      legalFromSel = legalMoves(S, "w").filter((m) => m.from === i);
      Sound.click();
    } else {
      selected = null;
      legalFromSel = [];
    }
    render();
  }

  function makeMove(m) {
    const snapshot = { board: S.board, turn: S.turn, castle: S.castle, ep: S.ep, lastMove };
    const next = apply(S, m);
    S = Object.assign(next, { history: S.history.concat([snapshot]) });
    lastMove = m;
    if (m.capture) Sound.whackHit(); else Sound.click();
  }

  function endCheck() {
    const moves = legalMoves(S, S.turn);
    if (moves.length) {
      if (inCheck(S, S.turn)) { Sound.flag(); setStatus(S.turn === "w" ? "Check! Your move" : "Check on black"); }
      else setStatus(S.turn === "w" ? "Your move" : "Thinking…");
      return false;
    }
    gameOver = true;
    if (inCheck(S, S.turn)) {
      if (S.turn === "b") {
        record.wins += 1; localStorage.setItem("neon-arcade-chess-wins", record.wins);
        const isBest = Arcade.saveBest("chess", record.wins);
        Sound.win();
        overlayTitle.textContent = "CHECKMATE!";
        overlayMsg.innerHTML = "You beat the CPU on " + difficulty + "." + (isBest ? "<br>🏆 Win #" + record.wins : "");
        setStatus("Checkmate. You win!");
      } else {
        record.losses += 1; localStorage.setItem("neon-arcade-chess-losses", record.losses);
        Sound.die();
        overlayTitle.textContent = "CHECKMATE";
        overlayMsg.textContent = "The CPU got you this time.";
        setStatus("Checkmate. CPU wins.");
      }
    } else {
      overlayTitle.textContent = "STALEMATE";
      overlayMsg.textContent = "No legal moves. It's a draw.";
      setStatus("Stalemate. Draw.");
    }
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
    return true;
  }

  function playerMove(m) {
    makeMove(m);
    selected = null;
    legalFromSel = [];
    render();
    if (endCheck()) return;
    thinking = true;
    render();
    setTimeout(() => {
      const reply = cpuMove();
      thinking = false;
      if (reply) makeMove(reply);
      render();
      endCheck();
      render();
    }, 200);
  }

  function undo() {
    if (thinking || S.history.length < 2) return;
    // Take back the CPU's reply and your move
    const back = S.history[S.history.length - 2];
    S = Object.assign({}, back, { history: S.history.slice(0, -2) });
    lastMove = back.lastMove;
    gameOver = false;
    selected = null;
    legalFromSel = [];
    overlay.classList.add("hidden");
    Sound.flip();
    render();
    setStatus("Your move");
  }

  function newGame() {
    S = { board: startBoard(), turn: "w", castle: { K: true, Q: true, k: true, q: true }, ep: null, history: [] };
    selected = null;
    legalFromSel = [];
    lastMove = null;
    gameOver = false;
    thinking = false;
    overlay.classList.add("hidden");
    setStatus("Your move");
    render();
  }

  diffBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.diff === difficulty);
    btn.addEventListener("click", () => {
      difficulty = btn.dataset.diff;
      localStorage.setItem("neon-arcade-chess-diff", difficulty);
      diffBtns.forEach((b) => b.classList.toggle("active", b === btn));
      Sound.click();
    });
  });
  overlayBtn.addEventListener("click", newGame);
  newBtn.addEventListener("click", newGame);
  undoBtn.addEventListener("click", undo);

  // Exposed for the arcade's browser tests
  window.__chess = { legalMoves: (color) => legalMoves(S, color || S.turn), state: () => S, move: (from, to) => { const m = legalMoves(S, "w").find((x) => x.from === from && x.to === to); if (m) playerMove(m); return !!m; } };

  newGame();
})();
