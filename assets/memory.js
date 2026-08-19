(() => {
  const board = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const EMOJIS = ["🎮", "👾", "🚀", "🍒", "⭐", "🐍", "💎", "🔥"];

  let first = null;
  let lock = false;
  let matchedPairs = 0;
  let moves = 0;
  let seconds = 0;
  let timer = null;
  let started = false;

  function showBest() {
    const best = Arcade.getBest("memory");
    bestEl.textContent = best > 0 ? best + " moves" : "—";
  }

  function formatTime(s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function setup() {
    clearInterval(timer);
    first = null;
    lock = false;
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    started = false;
    movesEl.textContent = "0";
    timeEl.textContent = "0:00";
    overlay.classList.add("hidden");
    showBest();

    board.innerHTML = "";
    shuffle([...EMOJIS, ...EMOJIS]).forEach((emoji) => {
      const card = document.createElement("button");
      card.className = "mem-card";
      card.dataset.emoji = emoji;
      card.setAttribute("aria-label", "Hidden card");
      card.innerHTML =
        '<div class="mem-inner">' +
        '<div class="mem-face mem-front">?</div>' +
        '<div class="mem-face mem-back">' + emoji + "</div>" +
        "</div>";
      card.addEventListener("click", () => flip(card));
      board.appendChild(card);
    });
  }

  function startTimer() {
    started = true;
    timer = setInterval(() => {
      seconds += 1;
      timeEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function flip(card) {
    if (lock || card === first || card.classList.contains("matched")) return;
    if (!started) startTimer();

    Sound.flip();
    card.classList.add("flipped");

    if (!first) {
      first = card;
      return;
    }

    moves += 1;
    movesEl.textContent = String(moves);

    if (first.dataset.emoji === card.dataset.emoji) {
      Sound.match();
      first.classList.add("matched");
      card.classList.add("matched");
      first = null;
      matchedPairs += 1;
      if (matchedPairs === EMOJIS.length) win();
    } else {
      lock = true;
      const a = first;
      first = null;
      setTimeout(() => {
        a.classList.remove("flipped");
        card.classList.remove("flipped");
        lock = false;
      }, 700);
    }
  }

  function win() {
    clearInterval(timer);
    Sound.win();
    const isBest = Arcade.saveBest("memory", moves, true);
    showBest();
    overlayMsg.innerHTML =
      moves +
      " moves in " +
      formatTime(seconds) +
      (isBest ? "<br>🏆 New best!" : "");
    overlay.classList.remove("hidden");
  }

  overlayBtn.addEventListener("click", setup);

  setup();
})();
