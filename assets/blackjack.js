/* Blackjack, single hand vs. the dealer. A fresh 52-card deck is shuffled
   for every round. Dealer stands on all 17s; blackjack pays 3:2; a split
   deals one card to each new hand and aces split get exactly one card each.
   No insurance, to keep the rules a quick read. Bankroll is saved between
   visits; its all-time peak is the best score. */

(() => {
  const bankrollEl = document.getElementById("bankroll");
  const betEl = document.getElementById("bet");
  const bestEl = document.getElementById("best");
  const dealerRow = document.getElementById("dealer-hand");
  const dealerTotalEl = document.getElementById("dealer-total");
  const handsEl = document.getElementById("player-hands");
  const resultEl = document.getElementById("result");
  const chipsEl = document.getElementById("chips");
  const clearBetBtn = document.getElementById("clear-bet-btn");
  const dealBtn = document.getElementById("deal-btn");
  const hitBtn = document.getElementById("hit-btn");
  const standBtn = document.getElementById("stand-btn");
  const doubleBtn = document.getElementById("double-btn");
  const splitBtn = document.getElementById("split-btn");
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const isRed = (c) => c.s === 1 || c.s === 2;
  const BANKROLL_KEY = "neon-arcade-blackjack-bankroll";
  const START_BANKROLL = 500;

  const storedBankroll = localStorage.getItem(BANKROLL_KEY);
  let bankroll = storedBankroll === null ? START_BANKROLL : Number(storedBankroll);
  if (!Number.isFinite(bankroll) || bankroll < 0) bankroll = START_BANKROLL;
  let bet = 0;
  let deck, dealer, hands, active, phase; // phase: "bet" | "player" | "done"

  function showBest() {
    const best = Arcade.getBest("blackjack");
    bestEl.textContent = best > 0 ? "$" + best : "—";
  }

  function saveBankroll() {
    localStorage.setItem(BANKROLL_KEY, String(bankroll));
    bankrollEl.textContent = "$" + bankroll;
    const isBest = Arcade.saveBest("blackjack", bankroll);
    if (isBest) showBest();
  }

  function freshDeck() {
    const d = [];
    for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ s, r });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  }

  function draw() { return deck.pop(); }

  function value(hand) {
    let total = 0, aces = 0;
    for (const c of hand) {
      if (c.r === 0) { total += 11; aces += 1; } // ace, soft until it has to count as 1
      else total += Math.min(c.r + 1, 10);
    }
    while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
    return total;
  }

  function isBlackjack(hand) { return hand.length === 2 && value(hand) === 21; }

  function cardEl(card, faceDown) {
    const el = document.createElement("div");
    el.className = "bj-card" + (faceDown ? " down" : isRed(card) ? " red" : "");
    if (!faceDown) el.innerHTML = '<span>' + RANKS[card.r] + '</span><span class="bj-suit">' + SUITS[card.s] + "</span>";
    return el;
  }

  function buildChips() {
    chipsEl.innerHTML = "";
    for (const v of [10, 25, 50, 100]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bj-chip-btn";
      b.textContent = "$" + v;
      b.addEventListener("click", () => {
        if (phase !== "bet") return;
        if (bet + v > bankroll) return;
        bet += v;
        Sound.click();
        renderBetting();
      });
      chipsEl.appendChild(b);
    }
  }

  function renderBetting() {
    betEl.textContent = "$" + bet;
    dealBtn.disabled = bet <= 0 || bet > bankroll;
    clearBetBtn.disabled = bet <= 0;
  }

  function renderHand(el, hand, faceDownHole, total) {
    el.innerHTML = "";
    hand.forEach((c, i) => el.appendChild(cardEl(c, faceDownHole && i === 1)));
    return el;
  }

  function render() {
    renderHand(dealerRow, dealer, phase !== "done", null);
    dealerTotalEl.textContent = phase === "done" ? String(value(dealer)) : dealer.length ? "?" : "";
    handsEl.innerHTML = "";
    hands.forEach((h, i) => {
      const wrap = document.createElement("div");
      wrap.className = "bj-hand" + (i === active && phase === "player" ? " active" : "");
      const label = document.createElement("p");
      label.className = "bj-hand-label";
      label.textContent = (hands.length > 1 ? "HAND " + (i + 1) + " · " : "YOU · ") + "$" + h.bet + (h.done ? (h.bust ? " · BUST" : h.blackjack ? " · BLACKJACK" : "") : "");
      const row = document.createElement("div");
      row.className = "bj-row";
      h.cards.forEach((c) => row.appendChild(cardEl(c, false)));
      const total = document.createElement("p");
      total.className = "bj-total";
      total.textContent = String(value(h.cards));
      wrap.append(label, row, total);
      handsEl.appendChild(wrap);
    });
    hitBtn.disabled = standBtn.disabled = doubleBtn.disabled = splitBtn.disabled = phase !== "player";
    if (phase === "player") {
      const h = hands[active];
      doubleBtn.disabled = h.cards.length !== 2 || bankroll < h.bet;
      splitBtn.disabled = !(h.cards.length === 2 && h.cards[0].r === h.cards[1].r && hands.length === 1 && bankroll >= h.bet);
    }
    bankrollEl.textContent = "$" + bankroll;
  }

  function startRound(forcedDeck) {
    if (bet <= 0 || bet > bankroll) return;
    bankroll -= bet; // the stake leaves the bankroll now; win/push branches pay it back below
    deck = forcedDeck ? forcedDeck.slice() : freshDeck();
    dealer = [draw(), draw()];
    hands = [{ cards: [draw(), draw()], bet, done: false, bust: false, blackjack: false }];
    active = 0;
    phase = "player";
    resultEl.textContent = "";
    resultEl.className = "bj-result";
    render();

    const playerBJ = isBlackjack(hands[0].cards);
    const dealerBJ = isBlackjack(dealer);
    if (playerBJ || dealerBJ) {
      phase = "done";
      if (playerBJ && dealerBJ) { resolveMessage("PUSH — both blackjack", 0); bankroll += bet; Sound.flip(); }
      else if (playerBJ) { hands[0].blackjack = true; const win = Math.floor(bet * 1.5); resolveMessage("BLACKJACK! +$" + win, win); bankroll += bet + win; Sound.win(); }
      else { resolveMessage("Dealer has blackjack. -$" + bet, -bet); Sound.die(); }
      saveBankroll();
      render();
      afterRound();
      return;
    }
    render();
  }

  function resolveMessage(text, delta) {
    resultEl.textContent = text;
    resultEl.className = "bj-result " + (delta > 0 ? "win" : delta < 0 ? "lose" : "push");
  }

  function afterRound() {
    dealBtn.textContent = "DEAL AGAIN";
    dealBtn.disabled = false;
    if (bankroll < 10) {
      overlayMsg.textContent = "You're down to $" + bankroll + ".";
      overlay.classList.remove("hidden");
    }
  }

  function nextHandOrDealer() {
    if (active < hands.length - 1) {
      active += 1;
      render();
      return;
    }
    dealerTurn();
  }

  function hit() {
    if (phase !== "player") return;
    const h = hands[active];
    h.cards.push(draw());
    Sound.click();
    const v = value(h.cards);
    if (v > 21) { h.done = true; h.bust = true; nextHandOrDealer(); }
    render();
  }

  function stand() {
    if (phase !== "player") return;
    hands[active].done = true;
    Sound.flip();
    nextHandOrDealer();
  }

  function double() {
    if (phase !== "player") return;
    const h = hands[active];
    if (h.cards.length !== 2 || bankroll < h.bet) return;
    bankroll -= h.bet; // doubling stakes an equal extra amount
    h.doubled = true;
    h.bet *= 2;
    h.cards.push(draw());
    Sound.merge();
    h.done = true;
    if (value(h.cards) > 21) h.bust = true;
    nextHandOrDealer();
    render();
  }

  function split() {
    if (phase !== "player") return;
    const h = hands[active];
    if (!(h.cards.length === 2 && h.cards[0].r === h.cards[1].r) || hands.length > 1 || bankroll < h.bet) return;
    bankroll -= h.bet; // splitting stakes an equal extra amount on the new second hand
    const fromAces = h.cards[0].r === 0;
    const c2 = h.cards.pop();
    const hand1 = { cards: h.cards.concat([draw()]), bet: h.bet, done: fromAces, bust: false, blackjack: false, fromAces };
    const hand2 = { cards: [c2, draw()], bet: h.bet, done: fromAces, bust: false, blackjack: false, fromAces };
    hands = [hand1, hand2];
    active = 0;
    Sound.flip();
    render();
    if (fromAces) nextHandOrDealer();
  }

  function dealerTurn() {
    phase = "dealer";
    render();
    const allBust = hands.every((h) => h.bust);
    const step = () => {
      if (!allBust && value(dealer) < 17) {
        dealer.push(draw());
        render();
        setTimeout(step, 380);
        return;
      }
      finish();
    };
    setTimeout(step, 380);
  }

  function finish() {
    phase = "done";
    const dv = value(dealer);
    const dBust = dv > 21;
    let net = 0;
    const parts = [];
    hands.forEach((h, i) => {
      if (h.bust) { net -= h.bet; parts.push((hands.length > 1 ? "Hand " + (i + 1) + " " : "") + "bust"); return; }
      const pv = value(h.cards);
      if (dBust || pv > dv) { bankroll += h.bet * 2; net += h.bet; parts.push((hands.length > 1 ? "Hand " + (i + 1) + " " : "") + "win"); }
      else if (pv === dv) { bankroll += h.bet; parts.push((hands.length > 1 ? "Hand " + (i + 1) + " " : "") + "push"); }
      else { net -= h.bet; parts.push((hands.length > 1 ? "Hand " + (i + 1) + " " : "") + "lose"); }
    });
    if (net > 0) Sound.win(); else if (net < 0) Sound.die(); else Sound.flip();
    resolveMessage(parts.join(" · ") + " — " + (net >= 0 ? "+$" + net : "-$" + Math.abs(net)), net);
    saveBankroll();
    render();
    afterRound();
  }

  function newBankroll() {
    bankroll = START_BANKROLL;
    bet = 0;
    saveBankroll();
    renderBetting();
    overlay.classList.add("hidden");
  }

  buildChips();
  showBest();
  bankrollEl.textContent = "$" + bankroll;
  dealer = []; hands = []; active = 0; phase = "bet";
  render();
  renderBetting();

  dealBtn.addEventListener("click", () => {
    if (phase === "done" || phase === "bet") { if (phase === "done") { dealBtn.textContent = "DEAL"; phase = "bet"; } startRound(); }
  });
  clearBetBtn.addEventListener("click", () => { if (phase === "bet") { bet = 0; renderBetting(); Sound.click(); } });
  hitBtn.addEventListener("click", hit);
  standBtn.addEventListener("click", stand);
  doubleBtn.addEventListener("click", double);
  splitBtn.addEventListener("click", split);
  overlayBtn.addEventListener("click", newBankroll);

  document.addEventListener("keydown", (e) => {
    if (phase !== "player") return;
    if (e.key.toLowerCase() === "h") hit();
    else if (e.key.toLowerCase() === "s") stand();
  });

  // Exposed for the arcade's browser tests
  window.__blackjack = {
    state: () => ({ bankroll, bet, phase, hands: hands.map((h) => ({ total: value(h.cards), bust: h.bust, done: h.done })), dealerTotal: phase === "done" ? value(dealer) : null }),
    setBet: (v) => { bet = v; renderBetting(); },
    deal: startRound, hit, stand, double, split,
    forceBankroll: (v) => { bankroll = v; saveBankroll(); },
    // deck is drawn from the end via deck.pop(), so list cards in reverse deal order:
    // dealer-hole, dealer-up, player2, player1, then every hit in the order it'll be drawn.
    dealWithDeck: (cards) => startRound(cards),
  };
})();
