/* Shared helpers: best scores, synthesized sound effects, and the
   theme + sound toggle buttons injected on every page. */

const Arcade = {
  key(game) {
    return "neon-arcade-best-" + game;
  },

  getBest(game) {
    return Number(localStorage.getItem(this.key(game))) || 0;
  },

  /* Returns true when `score` beats the stored best (any score beats "unset").
     Pass lowerIsBetter=true for games where fewer is better (e.g. moves). */
  saveBest(game, score, lowerIsBetter = false) {
    const prev = this.getBest(game);
    const better =
      prev === 0 ? score > 0 : lowerIsBetter ? score < prev : score > prev;
    if (better) localStorage.setItem(this.key(game), String(score));
    return better;
  },
};

/* ── Sound: tiny WebAudio synth, no audio files ─────────────── */

const Sound = {
  ctx: null,

  isMuted() {
    return localStorage.getItem("neon-arcade-muted") === "1";
  },

  setMuted(m) {
    localStorage.setItem("neon-arcade-muted", m ? "1" : "0");
  },

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur = 0.08, type = "square", vol = 0.04, slideTo = null, delay = 0) {
    if (this.isMuted()) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  noise(dur = 0.3, vol = 0.08) {
    if (this.isMuted()) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  },

  // Named effects
  click() { this.tone(620, 0.045, "square", 0.03); },
  flag() { this.tone(950, 0.05, "sine", 0.05); },
  eat() { this.tone(880, 0.08, "square", 0.045, 1320); },
  flap() { this.tone(480, 0.09, "triangle", 0.06, 900); },
  bounce() { this.tone(310, 0.05, "square", 0.045); },
  brick() { this.tone(520 + Math.random() * 260, 0.05, "square", 0.04); },
  flip() { this.tone(700, 0.06, "sine", 0.05); },
  merge() { this.tone(440, 0.07, "triangle", 0.06, 660); },
  lockPiece() { this.tone(190, 0.07, "square", 0.05); },
  whackHit() { this.tone(170, 0.08, "square", 0.07, 85); },
  point() {
    this.tone(1046, 0.09, "square", 0.04);
    this.tone(1568, 0.12, "square", 0.04, null, 0.09);
  },
  match() {
    this.tone(784, 0.08, "sine", 0.05);
    this.tone(1175, 0.14, "sine", 0.05, null, 0.08);
  },
  clearLine() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.09, "square", 0.04, null, i * 0.06));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.12, "triangle", 0.06, null, i * 0.09));
  },
  die() { this.tone(400, 0.35, "sawtooth", 0.06, 70); },
  boom() {
    this.noise(0.45, 0.1);
    this.tone(150, 0.4, "sawtooth", 0.08, 40);
  },
};

/* ── Theme: dark by default, light on request ───────────────── */

const Theme = {
  key: "neon-arcade-theme",

  current() {
    return localStorage.getItem(this.key) || "dark";
  },

  apply(t) {
    document.documentElement.dataset.theme = t;
  },

  toggle() {
    const t = this.current() === "dark" ? "light" : "dark";
    localStorage.setItem(this.key, t);
    this.apply(t);
    return t;
  },
};

/* ── Floating theme + sound buttons on every page ───────────── */

(() => {
  const wrap = document.createElement("div");
  wrap.className = "quick-toggles";

  const themeBtn = document.createElement("button");
  themeBtn.className = "toggle-btn";
  themeBtn.id = "theme-toggle";
  const soundBtn = document.createElement("button");
  soundBtn.className = "toggle-btn";
  soundBtn.id = "sound-toggle";

  function paint() {
    const dark = Theme.current() === "dark";
    themeBtn.textContent = dark ? "☀️" : "🌙";
    themeBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    themeBtn.setAttribute("aria-label", themeBtn.title);
    const muted = Sound.isMuted();
    soundBtn.textContent = muted ? "🔇" : "🔊";
    soundBtn.title = muted ? "Unmute sounds" : "Mute sounds";
    soundBtn.setAttribute("aria-label", soundBtn.title);
  }

  themeBtn.addEventListener("click", () => {
    Theme.toggle();
    paint();
  });
  soundBtn.addEventListener("click", () => {
    Sound.setMuted(!Sound.isMuted());
    paint();
    Sound.click(); // audible confirmation when unmuting
  });

  paint();
  wrap.appendChild(themeBtn);
  wrap.appendChild(soundBtn);
  document.body.appendChild(wrap);
})();
