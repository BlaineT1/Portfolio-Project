(() => {
  const pads = [...document.querySelectorAll(".simon-pad")];
  const roundEl = document.getElementById("round");
  const bestEl = document.getElementById("best");
  const statusEl = document.getElementById("status");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const FREQS = [330, 392, 494, 587];

  let seq = [];
  let idx = 0;
  let phase = "idle"; // idle | showing | input | over
  let token = 0; // invalidates queued timeouts after a restart

  bestEl.textContent = Arcade.getBest("simon");

  function light(p, dur) {
    pads[p].classList.add("lit");
    Sound.tone(FREQS[p], dur / 1000, "sine", 0.09);
    setTimeout(() => pads[p].classList.remove("lit"), dur);
  }

  function stepGap() {
    return Math.max(260, 560 - seq.length * 20);
  }

  function start() {
    token += 1;
    seq = [];
    roundEl.textContent = "0";
    overlay.classList.add("hidden");
    nextRound();
  }

  function nextRound() {
    seq.push(Math.floor(Math.random() * 4));
    roundEl.textContent = String(seq.length);
    playSequence();
  }

  function playSequence() {
    phase = "showing";
    statusEl.textContent = "WATCH…";
    const myToken = token;
    const gap = stepGap();
    seq.forEach((p, i) => {
      setTimeout(() => {
        if (token !== myToken) return;
        light(p, gap * 0.55);
      }, 500 + i * gap);
    });
    setTimeout(() => {
      if (token !== myToken) return;
      phase = "input";
      idx = 0;
      statusEl.textContent = "YOUR TURN";
    }, 500 + seq.length * gap);
  }

  function padClick(p) {
    if (phase !== "input") return;
    light(p, 220);

    if (p !== seq[idx]) return fail();

    idx += 1;
    if (idx === seq.length) {
      phase = "showing"; // lock input while we wait for the next round
      statusEl.textContent = "NICE!";
      const myToken = token;
      setTimeout(() => {
        if (token !== myToken) return;
        nextRound();
      }, 900);
    }
  }

  function fail() {
    phase = "over";
    token += 1;
    Sound.die();
    const completed = seq.length - 1;
    const isBest = completed > 0 && Arcade.saveBest("simon", completed);
    bestEl.textContent = Arcade.getBest("simon");
    statusEl.textContent = "Each round adds one more step.";
    overlayTitle.textContent = "WRONG PAD";
    overlayMsg.innerHTML =
      "You completed " +
      completed +
      (completed === 1 ? " round" : " rounds") +
      (isBest ? "<br>🏆 New best!" : "");
    overlayBtn.textContent = "PLAY AGAIN";
    overlay.classList.remove("hidden");
  }

  pads.forEach((pad, i) => pad.addEventListener("click", () => padClick(i)));
  overlayBtn.addEventListener("click", start);
})();
