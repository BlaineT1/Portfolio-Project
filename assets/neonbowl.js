(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d");
  const overlay = $("overlay");
  const overlayTitle = $("overlay-title");
  const overlayMsg = $("overlay-msg");
  const overlayBtn = $("overlay-btn");
  const youEl = $("you");
  const cpuEl = $("cpu");
  const downEl = $("down");
  const clockEl = $("clock");
  const seasonEl = $("season-line");
  const statusEl = $("status");
  const pad = $("pad");

  const W = canvas.width;
  const H = canvas.height;
  const FIELD_W = 53.3; // yards, sideline to sideline
  const S = H / FIELD_W; // px per yard
  const VIEW = W / S; // yards visible across the canvas
  // ?half=N shortens the halves (used for testing)
  const HALF_SECONDS = Number(new URLSearchParams(location.search).get("half")) || 90;
  const SEASON_GAMES = 8;
  const SEASON_KEY = "neon-arcade-bowl-season";
  const POCKET = 50; // frames the line holds the rush after the snap
  const TACKLE = 1.1;
  const CATCH_GAP = 1.4;
  const PICK_GAP = 0.9;
  const SPEED = { carrier: 0.25, rb: 0.25, user: 0.26, receiver: 0.21, rusher: 0.2, cover: 0.185, cpuRb: 0.235, cpuWr: 0.225 };
  const ORD = ["1st", "2nd", "3rd", "4th"];
  const PLAYS = ["bomb", "slant", "run", "fg", "punt"];
  const TEAMS = [
    { name: "Neon Bolts", rating: 3 },
    { name: "Rockets", rating: 2 },
    { name: "Wolves", rating: 3 },
    { name: "Vipers", rating: 4 },
    { name: "Titans", rating: 5 },
    { name: "Comets", rating: 2 },
    { name: "Sharks", rating: 4 },
    { name: "Kings", rating: 5 },
  ];

  let season, match;
  let phase; // presnap | live | dead | kick | kickfly
  let state = "idle"; // idle | running | paused | between | over
  let off, def, ball, kick, pending;
  let keys = { up: false, down: false, left: false, right: false };
  let snapTick, snapCountdown, deadTimer, message, messageTimer, camX, lastTime, raf;
  let lastCall = "slant";

  /* ── Season ─────────────────────────────────────────────────── */

  function newSeason() {
    return { week: 1, done: false, teams: TEAMS.map((t) => ({ ...t, w: 0, l: 0, t: 0 })) };
  }

  function loadSeason() {
    try {
      const s = JSON.parse(localStorage.getItem(SEASON_KEY));
      if (s && Array.isArray(s.teams) && s.teams.length === TEAMS.length) return s;
    } catch (e) { /* fall through */ }
    return newSeason();
  }

  function saveSeason() {
    localStorage.setItem(SEASON_KEY, JSON.stringify(season));
  }

  function opponentIndex() {
    return ((season.week - 1) % (TEAMS.length - 1)) + 1;
  }

  function cpuBonus() {
    return (season.teams[match.opp].rating - 3) * 0.01; // speed edge for stronger teams
  }

  function record(t) {
    return t.w + "-" + t.l + "-" + t.t;
  }

  function standingsHtml() {
    const rows = season.teams
      .map((t, i) => ({ ...t, i }))
      .sort((a, b) => b.w - a.w || b.t - a.t || a.l - b.l);
    return (
      '<table class="standings">' +
      rows.map((t) => "<tr" + (t.i === 0 ? ' class="me"' : "") + "><td>" + t.name + "</td><td>" + record(t) + "</td></tr>").join("") +
      "</table>"
    );
  }

  function simulateOtherGames() {
    const others = season.teams.map((_, i) => i).filter((i) => i !== 0 && i !== match.opp);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    for (let i = 0; i + 1 < others.length; i += 2) {
      const a = season.teams[others[i]];
      const b = season.teams[others[i + 1]];
      if (Math.random() < a.rating / (a.rating + b.rating)) { a.w += 1; b.l += 1; }
      else { b.w += 1; a.l += 1; }
    }
  }

  function finishSeasonGame() {
    const me = season.teams[0];
    const opp = season.teams[match.opp];
    if (match.you > match.cpu) { me.w += 1; opp.l += 1; }
    else if (match.you < match.cpu) { me.l += 1; opp.w += 1; }
    else { me.t += 1; opp.t += 1; }
    simulateOtherGames();
    season.week += 1;
    if (season.week > SEASON_GAMES) {
      season.done = true;
      Arcade.saveBest("neonbowl", me.w);
    }
    saveSeason();
  }

  /* ── Match + play setup ─────────────────────────────────────── */

  function newMatch() {
    match = { half: 1, clock: HALF_SECONDS, you: 0, cpu: 0, poss: "you", los: 25, seriesStart: 25, down: 1, opp: opponentIndex() };
    message = "";
    setupPlay();
  }

  function other(team) {
    return team === "you" ? "cpu" : "you";
  }

  function firstDownLine() {
    return Math.min(match.seriesStart + 10, 100);
  }

  function kickoffTo(team) {
    match.poss = team;
    match.los = 25;
    match.seriesStart = 25;
    match.down = 1;
  }

  function flipPossession(newLos) {
    match.poss = other(match.poss);
    match.los = Math.max(1, Math.min(99, Math.round(newLos)));
    match.seriesStart = match.los;
    match.down = 1;
  }

  function clampCam(x) {
    return Math.max(-10, Math.min(110 - VIEW, x - VIEW * 0.4));
  }

  function setupPlay() {
    phase = "presnap";
    ball = null;
    kick = null;
    snapTick = 0;
    const los = match.los;
    const you = match.poss === "you";
    off = {
      qb: { x: los - 4, y: FIELD_W / 2 },
      rb: { x: los - 7, y: FIELD_W / 2 + 3 },
      wrs: [{ x: los, y: 9 }, { x: los, y: FIELD_W - 9 }],
      carrier: null,
      play: null,
      thrown: false,
      cpuThrowAt: 0,
    };
    off.carrier = off.qb;
    def = [
      { x: los + 3, y: 9, cover: 0 },
      { x: los + 3, y: FIELD_W - 9, cover: 1 },
      { x: los + 6, y: 17, cover: -1 },
      { x: los + 5, y: FIELD_W / 2, cover: -1, user: !you },
      { x: los + 6, y: FIELD_W - 17, cover: -1 },
    ].map((d) => ({ ...d, vx: 0, vy: 0 }));
    camX = clampCam(off.qb.x);
    updateHud();

    if (you) {
      pad.hidden = false;
      statusEl.textContent = "YOUR BALL · pick a play, or Space to run " + lastCall.toUpperCase() + " again";
      return;
    }
    pad.hidden = true;
    const decision = cpuDecide();
    if (decision === "fg" || decision === "punt") return startKick(decision, true);
    off.play = decision;
    off.cpuThrowAt = 45 + Math.floor(Math.random() * 40);
    snapCountdown = 75;
    statusEl.textContent = "CPU BALL · you're the cyan linebacker — arrows to move";
  }

  function cpuDecide() {
    if (match.down === 4) {
      const dist = 100 - match.los + 17;
      const toGo = firstDownLine() - match.los;
      if (dist <= 50) return "fg";
      if (toGo <= 2 && match.los >= 50) return Math.random() < 0.5 ? "run" : "slant";
      return "punt";
    }
    const r = Math.random();
    return r < 0.4 ? "run" : r < 0.7 ? "slant" : "bomb";
  }

  function updateHud() {
    youEl.textContent = String(match.you);
    cpuEl.textContent = String(match.cpu);
    const toGo = Math.max(1, Math.round(firstDownLine() - match.los));
    downEl.textContent =
      (match.poss === "cpu" ? "CPU · " : "") + ORD[match.down - 1] + " & " + (firstDownLine() >= 100 ? "Goal" : toGo);
    const c = Math.max(0, Math.ceil(match.clock));
    clockEl.textContent = "H" + match.half + " " + Math.floor(c / 60) + ":" + String(c % 60).padStart(2, "0");
    const me = season.teams[0];
    const opp = season.teams[match.opp];
    seasonEl.textContent =
      "WEEK " + Math.min(season.week, SEASON_GAMES) + " OF " + SEASON_GAMES + " · vs " + opp.name.toUpperCase() + " · RECORD " + record(me);
  }

  /* ── Flow: start, loop, overlays ────────────────────────────── */

  function showIntro() {
    state = "idle";
    if (season.done) {
      const me = season.teams[0];
      overlayTitle.textContent = "SEASON OVER";
      overlayMsg.innerHTML =
        "Final record " + record(me) + " · best season " + Arcade.getBest("neonbowl") + " wins" + standingsHtml();
      overlayBtn.textContent = "NEW SEASON";
    } else {
      const me = season.teams[0];
      overlayTitle.textContent = "NEON BOWL";
      overlayMsg.innerHTML =
        "Week " + season.week + " of " + SEASON_GAMES + " · vs " + season.teams[opponentIndex()].name +
        "<br>Your record: " + record(me) +
        "<br><br>Two halves, four downs, seven for a touchdown, three for a field goal.";
      overlayBtn.textContent = "KICKOFF";
    }
    overlay.classList.remove("hidden");
  }

  function startGame() {
    cancelAnimationFrame(raf);
    if (season.done) {
      season = newSeason();
      saveSeason();
    }
    newMatch();
    run();
  }

  function run() {
    state = "running";
    overlay.classList.add("hidden");
    lastTime = undefined;
    raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    if (state !== "running") return;
    const dt = lastTime === undefined ? 0 : Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function showBetween(title, html, btn) {
    state = "between";
    cancelAnimationFrame(raf);
    pad.hidden = true;
    overlayTitle.textContent = title;
    overlayMsg.innerHTML = html;
    overlayBtn.textContent = btn;
    overlay.classList.remove("hidden");
    draw();
  }

  function pause() {
    if (state !== "running") return;
    state = "paused";
    cancelAnimationFrame(raf);
    overlayTitle.textContent = "TIMEOUT";
    overlayMsg.textContent = "The clock is stopped.";
    overlayBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  }

  function endHalf() {
    if (match.half === 1) {
      match.half = 2;
      match.clock = HALF_SECONDS;
      kickoffTo("cpu");
      setupPlay();
      Sound.point();
      showBetween("HALFTIME", "YOU " + match.you + " · CPU " + match.cpu + "<br>Second half: the CPU receives.", "CONTINUE");
      return;
    }
    finishMatch();
  }

  function finishMatch() {
    finishSeasonGame();
    const won = match.you > match.cpu;
    const tied = match.you === match.cpu;
    state = "over";
    cancelAnimationFrame(raf);
    pad.hidden = true;
    if (won) Sound.win();
    else if (tied) Sound.point();
    else Sound.die();
    overlayTitle.textContent = won ? "YOU WIN! 🏆" : tied ? "TIE GAME" : "YOU LOSE";
    overlayMsg.innerHTML =
      "YOU " + match.you + " · CPU " + match.cpu +
      (season.done ? "<br>Season over · record " + record(season.teams[0]) : "") +
      standingsHtml();
    overlayBtn.textContent = season.done ? "NEW SEASON" : "NEXT GAME";
    overlay.classList.remove("hidden");
    draw();
  }

  /* ── Plays ──────────────────────────────────────────────────── */

  function callPlay(type) {
    if (state !== "running" || phase !== "presnap" || match.poss !== "you") return;
    if (type === "fg" || type === "punt") return startKick(type, false);
    lastCall = type;
    off.play = type;
    snap();
  }

  function snap() {
    phase = "live";
    snapTick = 0;
    message = "";
    pad.hidden = true;
    if (off.play === "run") off.carrier = off.rb;
    Sound.click();
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function nearestDefender(o) {
    let best = null;
    let bd = Infinity;
    for (const d of def) {
      const dd = dist(d, o);
      if (dd < bd) { bd = dd; best = d; }
    }
    return { d: best, dist: bd };
  }

  function throwTo(r) {
    if (phase !== "live" || off.carrier !== off.qb || off.thrown || off.play === "run") return;
    off.thrown = true;
    const T = Math.round(Math.max(22, Math.min(55, dist(off.qb, r) * 1.6)));
    ball = { from: { x: off.qb.x, y: off.qb.y }, to: r, t: 0, T };
    Sound.flip();
  }

  function openest() {
    return off.wrs
      .map((r) => ({ r, gap: nearestDefender(r).dist }))
      .sort((a, b) => b.gap - a.gap)[0];
  }

  function throwOpen() {
    if (match.poss !== "you") return;
    throwTo(openest().r);
  }

  /* ── Kicks ──────────────────────────────────────────────────── */

  function startKick(type, auto) {
    pad.hidden = true;
    kick = { type, auto, pos: 0, dir: 1, dist: Math.round(100 - match.los + 17), t: 0, T: 50, acc: 0 };
    message = "";
    if (auto) {
      kick.acc = Math.max(0, Math.min(1, 0.4 + Math.random() * 0.6 + cpuBonus() * 6));
      phase = "kickfly";
      statusEl.textContent = "CPU is " + (type === "fg" ? "trying a " + kick.dist + "-yard field goal…" : "punting…");
    } else {
      phase = "kick";
      statusEl.textContent = (type === "fg" ? kick.dist + "-yard attempt · " : "PUNT · ") + "Space / tap to stop the meter in the green";
    }
  }

  function stopMeter() {
    if (phase !== "kick") return;
    kick.acc = 1 - Math.abs(kick.pos - 0.5) * 2;
    kick.t = 0;
    phase = "kickfly";
    Sound.flip();
  }

  function resolveKick() {
    const me = match.poss;
    let msg;
    if (kick.type === "fg") {
      const need = Math.max(0.1, Math.min(0.92, (kick.dist - 18) / 40));
      if (kick.acc >= need) {
        match[me] += 3;
        msg = "FIELD GOAL! " + kick.dist + " YDS";
        if (me === "you") Sound.win(); else Sound.die();
        kickoffTo(other(me));
      } else {
        msg = "NO GOOD";
        if (me === "you") Sound.die(); else Sound.point();
        flipPossession(Math.max(20, 100 - match.los));
      }
    } else {
      const d = 32 + kick.acc * 24 + Math.random() * 4;
      const land = match.los + d;
      msg = "PUNT · " + Math.round(d) + " YDS" + (land >= 100 ? " · TOUCHBACK" : "");
      Sound.bounce();
      flipPossession(land >= 100 ? 20 : 100 - land);
    }
    kick = null;
    if (match.clock <= 0) return endHalf();
    setupPlay();
    message = msg;
  }

  /* ── Frame update ───────────────────────────────────────────── */

  function update(dt) {
    if (phase === "dead") {
      deadTimer -= 1;
      if (deadTimer <= 0) resolvePlay();
      return;
    }
    if (phase === "kick") {
      kick.pos += 0.024 * kick.dir;
      if (kick.pos >= 1 || kick.pos <= 0) {
        kick.pos = Math.max(0, Math.min(1, kick.pos));
        kick.dir *= -1;
      }
      return;
    }
    if (phase === "kickfly") {
      kick.t += 1;
      if (kick.t >= kick.T) resolveKick();
      return;
    }
    if (phase === "presnap") {
      if (match.poss === "cpu") {
        snapCountdown -= 1;
        if (snapCountdown <= 0) snap();
      }
      return;
    }
    if (phase !== "live") return;

    match.clock = Math.max(0, match.clock - dt);
    snapTick += 1;
    if (messageTimer > 0 && --messageTimer === 0) message = "";

    if (match.poss === "you") moveByKeys(off.carrier, off.carrier === off.rb ? SPEED.rb : SPEED.carrier);
    else updateCpuOffense();
    off.carrier.x = Math.max(-9, off.carrier.x);

    updateReceivers();
    updateBall();
    if (phase !== "live") return; // an incomplete pass ends the play inside updateBall
    updateDefense();
    checkDead();
    if (phase === "live") {
      camX = clampCam(off.carrier.x);
      updateHud();
    }
  }

  function moveByKeys(o, speed) {
    const mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (!mx && !my) return;
    const m = Math.hypot(mx, my);
    o.x += (mx / m) * speed;
    o.y += (my / m) * speed;
  }

  function runAi(c, speed) {
    const near = nearestDefender(c);
    let lat = 0;
    if (near.dist < 8) lat = Math.sign(c.y - near.d.y) || 1;
    if (c.y < 5) lat = 1;
    if (c.y > FIELD_W - 5) lat = -1;
    const vy = lat * 0.7;
    const m = Math.hypot(1, vy);
    c.x += (1 / m) * speed;
    c.y += (vy / m) * speed;
  }

  function updateCpuOffense() {
    const c = off.carrier;
    const mul = 1 + cpuBonus() * 4;
    if (c === off.qb) {
      if (off.thrown) return;
      if (snapTick >= off.cpuThrowAt) {
        const best = openest();
        if (best.gap > 1.8 || snapTick > off.cpuThrowAt + 45) throwTo(best.r);
      }
      return;
    }
    runAi(c, (c === off.rb ? SPEED.cpuRb : SPEED.cpuWr) * mul);
  }

  function updateReceivers() {
    for (const r of off.wrs) {
      if (r === off.carrier) continue;
      const toMid = FIELD_W / 2 > r.y ? 1 : -1;
      if (off.play === "slant" && r.x > match.los + 3 && Math.abs(r.y - FIELD_W / 2) > 2.5) {
        r.x += 0.15;
        r.y += toMid * 0.15;
      } else {
        r.x += SPEED.receiver;
        if (off.play !== "slant" && Math.abs(r.y - FIELD_W / 2) > 8) r.y += toMid * 0.03;
      }
      r.x = Math.min(108, r.x);
    }
  }

  function updateBall() {
    if (!ball) return;
    ball.t += 1;
    if (ball.t < ball.T) return;
    const r = ball.to;
    const near = nearestDefender(r).dist;
    ball = null;
    if (near < PICK_GAP) return endPlay(r.x, "INTERCEPTION!", "int");
    if (near < CATCH_GAP) return endPlay(match.los, "INCOMPLETE", "inc");
    off.carrier = r;
    message = "CAUGHT!";
    messageTimer = 60;
    Sound.match();
  }

  function steer(d, tx, ty, speed) {
    const dx = tx - d.x;
    const dy = ty - d.y;
    const m = Math.hypot(dx, dy) || 1;
    d.vx = d.vx * 0.8 + (dx / m) * speed * 0.2;
    d.vy = d.vy * 0.8 + (dy / m) * speed * 0.2;
    d.x += d.vx;
    d.y += d.vy;
  }

  function updateDefense() {
    const c = off.carrier;
    const carrierIsWr = off.wrs.includes(c);
    const rbPastLine = c === off.rb && c.x > match.los;
    // Your AI teammates (CPU ball) are a step quicker than the CPU's defenders (your ball)
    const onD = match.poss === "cpu";
    const rush = onD ? 0.225 : SPEED.rusher + cpuBonus();
    const cover = onD ? 0.2 : SPEED.cover + cpuBonus();
    for (const d of def) {
      if (d.user && onD) {
        moveByKeys(d, SPEED.user);
        d.y = Math.max(0.5, Math.min(FIELD_W - 0.5, d.y));
        continue;
      }
      if (ball) steer(d, ball.to.x, ball.to.y, cover + 0.06); // break on the ball
      else if (d.cover >= 0 && !carrierIsWr && !rbPastLine) steer(d, off.wrs[d.cover].x - 2, off.wrs[d.cover].y, cover);
      else if (d.cover < 0 && snapTick < POCKET && !rbPastLine) { d.vx = 0; d.vy = 0; } // held at the line
      else steer(d, c.x + (d.x < c.x ? 3 : 0), c.y, rush); // pursue with a cut-off angle when trailing
    }
  }

  function checkDead() {
    const c = off.carrier;
    if (c.x >= 100) return endPlay(100, "TOUCHDOWN!", "td");
    if (c.y < 0.4 || c.y > FIELD_W - 0.4) return endPlay(c.x, "OUT OF BOUNDS", "down");
    if (!ball && def.some((d) => dist(d, c) < TACKLE)) {
      return endPlay(c.x, c === off.qb && c.x < match.los ? "SACKED!" : "TACKLED", "down");
    }
  }

  function endPlay(at, msg, kind) {
    phase = "dead";
    pending = { spot: Math.max(1, Math.min(100, at)), kind };
    message = msg;
    deadTimer = 55;
    const you = match.poss === "you";
    if (kind === "td") { match[match.poss] += 7; if (you) Sound.win(); else Sound.die(); }
    else if (kind === "int") { if (you) Sound.die(); else Sound.win(); }
    else if (kind === "inc") Sound.bounce();
    else Sound.lockPiece();
    updateHud();
  }

  function resolvePlay() {
    const { spot, kind } = pending;
    const me = match.poss;
    let msg = "";
    if (kind === "td") {
      kickoffTo(other(me));
      msg = (me === "you" ? "CPU" : "YOU") + " RECEIVE AT THE 25";
    } else if (kind === "int") {
      flipPossession(100 - spot);
      msg = (me === "you" ? "CPU" : "YOUR") + " BALL";
    } else if (spot >= firstDownLine()) {
      match.seriesStart = spot;
      match.los = spot;
      match.down = 1;
      msg = "FIRST DOWN!";
      if (me === "you") Sound.point();
    } else {
      match.down += 1;
      if (match.down > 4) {
        flipPossession(100 - spot);
        msg = "TURNOVER ON DOWNS";
        if (me === "you") Sound.die();
      } else {
        match.los = spot;
      }
    }
    if (match.clock <= 0) return endHalf();
    setupPlay();
    message = msg;
  }

  /* ── Drawing ────────────────────────────────────────────────── */

  const px = (x) => (x - camX) * S;

  function vline(x, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(x), 0);
    ctx.lineTo(px(x), H);
    ctx.stroke();
  }

  function dot(o, r, color, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px(o.x), o.y * S, r * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawField() {
    for (let yd = -10; yd < 110; yd += 5) {
      const light = ((yd + 10) / 5) % 2 === 0;
      ctx.fillStyle = yd < 0 ? "#3a1030" : yd >= 100 ? "#0f3340" : light ? "#123b22" : "#0f331d";
      ctx.fillRect(px(yd), 0, 5 * S + 1, H);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    for (let yd = 0; yd <= 100; yd += 5) {
      ctx.beginPath();
      ctx.moveTo(px(yd), 0);
      ctx.lineTo(px(yd), H);
      ctx.stroke();
      if (yd % 10 === 0 && yd > 0 && yd < 100) {
        const n = String(yd <= 50 ? yd : 100 - yd);
        ctx.fillText(n, px(yd), 22);
        ctx.fillText(n, px(yd), H - 12);
      }
    }
    // Goal posts
    ctx.strokeStyle = "#ffe14a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px(100), H / 2 - 9 * S);
    ctx.lineTo(px(100), H / 2 + 9 * S);
    ctx.moveTo(px(100), H / 2);
    ctx.lineTo(px(102), H / 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.save();
    ctx.translate(px(105), H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "rgba(0,229,255,0.5)";
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillText("END ZONE", 0, 5);
    ctx.restore();
    vline(match.los, "#4a9eff");
    vline(firstDownLine(), "#ffe14a");
  }

  function drawPlayers() {
    const you = match.poss === "you";
    const offColor = you ? "#00e5ff" : "#ff2e88";
    const wrColor = you ? "#a3ff12" : "#ff8ac0";
    const defColor = you ? "#ff2e88" : "#00e5ff";
    for (const d of def) dot(d, d.user && !you ? 1.05 : 0.9, defColor, d.user && !you);
    for (const r of off.wrs) if (r !== off.carrier) dot(r, 0.9, wrColor);
    if (off.carrier !== off.qb) dot(off.qb, 0.8, you ? "#6a7a90" : "#8a4a66");
    if (off.carrier !== off.rb) dot(off.rb, 0.8, you ? "#6a7a90" : "#8a4a66");
    dot(off.carrier, 1.05, offColor, true);
  }

  function drawBall() {
    let bx, by, lift;
    if (ball) {
      const p = ball.t / ball.T;
      bx = ball.from.x + (ball.to.x - ball.from.x) * p;
      by = ball.from.y + (ball.to.y - ball.from.y) * p;
      lift = Math.sin(Math.PI * p);
    } else if (phase === "kickfly") {
      const p = kick.t / kick.T;
      const endX = kick.type === "fg" ? 101 : Math.min(108, match.los + 32 + kick.acc * 24);
      bx = off.qb.x + (endX - off.qb.x) * p;
      by = FIELD_W / 2;
      lift = Math.sin(Math.PI * p) * 1.6;
    } else {
      return;
    }
    ctx.save();
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(px(bx), by * S - lift * 18, 3.5 + lift * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMeter() {
    if (phase !== "kick") return;
    const bw = 260;
    const bx = (W - bw) / 2;
    const by = H - 46;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx - 8, by - 8, bw + 16, 32);
    ctx.fillStyle = "#3a3a5c";
    ctx.fillRect(bx, by, bw, 16);
    ctx.fillStyle = "#a3ff12";
    ctx.fillRect(bx + bw * 0.4, by, bw * 0.2, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx + kick.pos * bw - 2, by - 4, 4, 24);
  }

  function drawText() {
    ctx.textAlign = "center";
    if (message) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 12;
      ctx.font = '15px "Press Start 2P", monospace';
      ctx.fillText(message, W / 2, H / 2 - 40);
      ctx.restore();
    }
    if (state === "running" && phase === "presnap") {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText(match.poss === "you" ? "CALL A PLAY" : "CPU BALL · GET SET", W / 2, H - 30);
    }
  }

  function draw() {
    drawField();
    drawPlayers();
    drawBall();
    drawMeter();
    drawText();
  }

  /* ── Input ──────────────────────────────────────────────────── */

  document.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "ArrowUp" || k === "w") (keys.up = true), e.preventDefault();
    if (k === "ArrowDown" || k === "s") (keys.down = true), e.preventDefault();
    if (k === "ArrowLeft" || k === "a") (keys.left = true), e.preventDefault();
    if (k === "ArrowRight" || k === "d") (keys.right = true), e.preventDefault();
    if (k >= "1" && k <= "5") callPlay(PLAYS[Number(k) - 1]);
    if (k === " ") {
      e.preventDefault();
      if (phase === "kick") stopMeter();
      else if (phase === "presnap") callPlay(lastCall);
      else if (phase === "live") throwOpen();
    }
    if (k === "p") {
      if (state === "running") pause();
      else if (state === "paused") run();
    }
  });
  document.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "ArrowUp" || k === "w") keys.up = false;
    if (k === "ArrowDown" || k === "s") keys.down = false;
    if (k === "ArrowLeft" || k === "a") keys.left = false;
    if (k === "ArrowRight" || k === "d") keys.right = false;
  });

  pad.querySelectorAll("[data-play]").forEach((btn) => {
    btn.addEventListener("click", () => {
      callPlay(btn.dataset.play);
      btn.blur();
    });
  });

  function receiverAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = ((clientX - rect.left) * W) / rect.width;
    const sy = ((clientY - rect.top) * H) / rect.height;
    return off.wrs.find((r) => Math.hypot(px(r.x) - sx, r.y * S - sy) < 34);
  }

  function pointerAction(clientX, clientY) {
    if (state !== "running") return false;
    if (phase === "kick") { stopMeter(); return true; }
    if (phase === "presnap" && match.poss === "you") { callPlay(lastCall); return true; }
    if (phase === "live" && match.poss === "you") {
      const r = receiverAt(clientX, clientY);
      if (r) { throwTo(r); return true; }
    }
    return false;
  }

  canvas.addEventListener("click", (e) => pointerAction(e.clientX, e.clientY));

  let touchOrigin = null;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchOrigin = { x: t.clientX, y: t.clientY };
    pointerAction(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchOrigin) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - touchOrigin.x;
    const dy = e.touches[0].clientY - touchOrigin.y;
    keys.left = dx < -8;
    keys.right = dx > 8;
    keys.up = dy < -8;
    keys.down = dy > 8;
  }, { passive: false });
  canvas.addEventListener("touchend", () => {
    touchOrigin = null;
    keys.left = keys.right = keys.up = keys.down = false;
  }, { passive: true });

  overlayBtn.addEventListener("click", () => {
    if (state === "paused" || state === "between") return run();
    startGame();
  });

  /* ── Boot ───────────────────────────────────────────────────── */

  season = loadSeason();
  newMatch();
  draw();
  showIntro();
})();
