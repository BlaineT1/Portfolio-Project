/* Air Hockey, two players. Locally, Player 1 (cyan) uses WASD and stays on
   the left half; Player 2 (pink) uses the arrow keys and stays on the
   right half. Online, one player hosts (via PeerLink's share-a-code WebRTC
   connect) and is always cyan; the other joins and is always pink, moving
   their paddle with either key set since only one person is at that
   keyboard. The host runs the only physics simulation and streams state to
   the guest, who just renders it and sends its own key presses back — this
   keeps the two sides from ever disagreeing about where the puck is.
   First to 7 goals wins the match; the match score is tracked for the
   session only, since there's no single "you" to save a best score for. */

(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const onlineBtn = document.getElementById("online-btn");
  const p1El = document.getElementById("p1-score");
  const p2El = document.getElementById("p2-score");
  const matchesEl = document.getElementById("matches");

  const netPanel = document.getElementById("net-panel");
  const netChoice = document.getElementById("net-choice");
  const netHostStep = document.getElementById("net-host-step");
  const netJoinStep = document.getElementById("net-join-step");
  const netHostBtn = document.getElementById("net-host-btn");
  const netJoinBtn = document.getElementById("net-join-btn");
  const netHostCode = document.getElementById("net-host-code");
  const netHostCopy = document.getElementById("net-host-copy");
  const netHostAnswer = document.getElementById("net-host-answer");
  const netHostConnect = document.getElementById("net-host-connect");
  const netJoinOffer = document.getElementById("net-join-offer");
  const netJoinSubmit = document.getElementById("net-join-submit");
  const netJoinAnswerWrap = document.getElementById("net-join-answer-wrap");
  const netJoinCode = document.getElementById("net-join-code");
  const netJoinCopy = document.getElementById("net-join-copy");
  const netStatusEl = document.getElementById("net-status");
  const netCancel = document.getElementById("net-cancel");

  const W = canvas.width, H = canvas.height;
  const R_PADDLE = 22, R_PUCK = 11, GOAL_H = 120, WIN_SCORE = 7;
  const MID = W / 2;

  let p1, p2, puck, score1, score2, matches1, matches2, raf, serveTo;
  let keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };
  let state = "idle"; // idle | serving | running | over

  // ── Online play ─────────────────────────────────────────────
  let net = null; // PeerLink connection handle
  let netRole = null; // null | "host" | "guest"
  let netConnected = false;
  let remoteKeys = { up: false, down: false, left: false, right: false }; // guest's input, seen by the host
  let lastNetScores = null; // for the guest, to notice a goal/match win and play a sound

  function resetPositions() {
    p1 = { x: W * 0.15, y: H / 2, vx: 0, vy: 0 };
    p2 = { x: W * 0.85, y: H / 2, vx: 0, vy: 0 };
    puck = { x: MID, y: H / 2, vx: 0, vy: 0 };
  }

  function newMatch() {
    score1 = 0; score2 = 0;
    resetPositions();
    serveTo = Math.random() < 0.5 ? 1 : 2;
    updateHud();
  }

  function serve() {
    resetPositions();
    const dir = serveTo === 1 ? -1 : 1;
    puck.vx = dir * 3.2;
    puck.vy = (Math.random() - 0.5) * 3;
    state = "running";
    overlay.classList.add("hidden");
    broadcastState();
  }

  function updateHud() {
    p1El.textContent = String(score1);
    p2El.textContent = String(score2);
    matchesEl.textContent = matches1 + " – " + matches2;
  }

  function refreshOnlineBtn() {
    onlineBtn.hidden = netConnected || !(state === "idle" || state === "over") || !PeerLink.supported;
  }

  function start() {
    cancelAnimationFrame(raf);
    if (matches1 === undefined) { matches1 = 0; matches2 = 0; }
    newMatch();
    state = "serving";
    overlayTitle.textContent = "GET READY";
    overlayMsg.textContent = (serveTo === 1 ? "Cyan" : "Pink") + " serves first.";
    overlayBtn.textContent = "SERVE";
    overlay.classList.remove("hidden");
    refreshOnlineBtn();
    broadcastState();
    loop();
  }

  function loop() {
    if (netRole === "guest") { raf = requestAnimationFrame(loop); return; } // guest only renders incoming state
    if (state !== "running") { raf = requestAnimationFrame(loop); return; }
    update();
    draw();
    broadcastState();
    raf = requestAnimationFrame(loop);
  }

  function movePaddle(p, left, right, up, down, minX, maxX) {
    const accel = 0.9, friction = 0.86, maxSpeed = 7;
    if (left) p.vx -= accel; if (right) p.vx += accel;
    if (up) p.vy -= accel; if (down) p.vy += accel;
    p.vx *= friction; p.vy *= friction;
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
    p.vy = Math.max(-maxSpeed, Math.min(maxSpeed, p.vy));
    p.x += p.vx; p.y += p.vy;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(R_PADDLE, Math.min(H - R_PADDLE, p.y));
  }

  function puckVsPaddle(p) {
    const dx = puck.x - p.x, dy = puck.y - p.y;
    const dist = Math.hypot(dx, dy);
    const minDist = R_PADDLE + R_PUCK;
    if (dist < minDist && dist > 0) {
      const nx = dx / dist, ny = dy / dist;
      puck.x = p.x + nx * minDist;
      puck.y = p.y + ny * minDist;
      const speed = Math.hypot(puck.vx, puck.vy);
      const paddleSpeed = Math.hypot(p.vx, p.vy);
      const power = Math.max(speed, 3) + paddleSpeed * 0.5;
      puck.vx = nx * power;
      puck.vy = ny * power;
      Sound.bounce();
    }
  }

  function update() {
    movePaddle(p1, keys.a, keys.d, keys.w, keys.s, R_PADDLE, MID - R_PADDLE);
    const p2in = netRole === "host" ? remoteKeys : { left: keys.left, right: keys.right, up: keys.up, down: keys.down };
    movePaddle(p2, p2in.left, p2in.right, p2in.up, p2in.down, MID + R_PADDLE, W - R_PADDLE);

    puck.x += puck.vx; puck.y += puck.vy;
    puck.vx *= 0.995; puck.vy *= 0.995;

    // Top/bottom walls
    if (puck.y - R_PUCK < 0) { puck.y = R_PUCK; puck.vy *= -1; Sound.bounce(); }
    if (puck.y + R_PUCK > H) { puck.y = H - R_PUCK; puck.vy *= -1; Sound.bounce(); }

    // Left/right walls, with a goal mouth centered vertically
    const goalTop = H / 2 - GOAL_H / 2, goalBottom = H / 2 + GOAL_H / 2;
    const inGoalMouth = puck.y > goalTop && puck.y < goalBottom;
    if (puck.x - R_PUCK < 0) {
      if (inGoalMouth && puck.x < -R_PUCK) { score(2); return; }
      if (!inGoalMouth) { puck.x = R_PUCK; puck.vx *= -1; Sound.bounce(); }
    }
    if (puck.x + R_PUCK > W) {
      if (inGoalMouth && puck.x > W + R_PUCK) { score(1); return; }
      if (!inGoalMouth) { puck.x = W - R_PUCK; puck.vx *= -1; Sound.bounce(); }
    }

    puckVsPaddle(p1);
    puckVsPaddle(p2);
  }

  function score(who) {
    if (who === 1) score1 += 1; else score2 += 1;
    updateHud();
    Sound.point();
    if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) return matchOver(who);
    serveTo = who === 1 ? 2 : 1;
    state = "serving";
    resetPositions();
    overlayTitle.textContent = (who === 1 ? "CYAN" : "PINK") + " SCORES";
    overlayMsg.textContent = (serveTo === 1 ? "Cyan" : "Pink") + " serves next.";
    overlayBtn.textContent = "SERVE";
    overlay.classList.remove("hidden");
    refreshOnlineBtn();
    broadcastState();
  }

  function matchOver(who) {
    state = "over";
    if (who === 1) matches1 += 1; else matches2 += 1;
    updateHud();
    Sound.win();
    overlayTitle.textContent = (who === 1 ? "CYAN" : "PINK") + " WINS THE MATCH!";
    overlayMsg.textContent = score1 + " – " + score2 + " · Matches this session: " + matches1 + " – " + matches2;
    overlayBtn.textContent = "NEW MATCH";
    overlay.classList.remove("hidden");
    refreshOnlineBtn();
    broadcastState();
  }

  function drawPaddle(p, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.arc(p.x, p.y, R_PADDLE, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function draw() {
    ctx.fillStyle = "#0c0c1c";
    ctx.fillRect(0, 0, W, H);

    // Center line and circle
    ctx.strokeStyle = "#2c2c52";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(MID, 0); ctx.lineTo(MID, H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(MID, H / 2, 46, 0, Math.PI * 2); ctx.stroke();

    // Goal mouths
    const goalTop = H / 2 - GOAL_H / 2, goalBottom = H / 2 + GOAL_H / 2;
    ctx.strokeStyle = "#ff2e88";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, goalTop); ctx.lineTo(0, goalBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W, goalTop); ctx.lineTo(W, goalBottom); ctx.stroke();

    drawPaddle(p1, "#00e5ff");
    drawPaddle(p2, "#ff2e88");

    ctx.beginPath();
    ctx.fillStyle = "#eaeaf8";
    ctx.shadowColor = "#eaeaf8";
    ctx.shadowBlur = 8;
    ctx.arc(puck.x, puck.y, R_PUCK, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Online play: networking ─────────────────────────────────
  function broadcastState() {
    if (netRole !== "host" || !net) return;
    net.send({
      t: "state",
      state, p1, p2, puck, score1, score2, matches1, matches2,
      title: overlayTitle.textContent, msg: overlayMsg.textContent,
      overlayVisible: !overlay.classList.contains("hidden"),
    });
  }

  function sendGuestInput() {
    if (netRole !== "guest" || !net) return;
    net.send({
      t: "input",
      up: keys.w || keys.up, down: keys.s || keys.down,
      left: keys.a || keys.left, right: keys.d || keys.right,
    });
  }

  function applyNetState(msg) {
    const firstUpdate = lastNetScores === null;
    state = msg.state; p1 = msg.p1; p2 = msg.p2; puck = msg.puck;
    score1 = msg.score1; score2 = msg.score2; matches1 = msg.matches1; matches2 = msg.matches2;
    updateHud();
    draw();
    overlayTitle.textContent = msg.title;
    overlayMsg.textContent = msg.msg;
    if (msg.overlayVisible) overlay.classList.remove("hidden"); else overlay.classList.add("hidden");
    if (!firstUpdate) {
      if (score1 > lastNetScores.score1 || score2 > lastNetScores.score2) Sound.point();
      if (matches1 > lastNetScores.matches1 || matches2 > lastNetScores.matches2) Sound.win();
    }
    lastNetScores = { score1, score2, matches1, matches2 };
  }

  function handleNetMessage(msg) {
    if (netRole === "host" && msg.t === "input") {
      remoteKeys = { up: !!msg.up, down: !!msg.down, left: !!msg.left, right: !!msg.right };
    } else if (netRole === "guest" && msg.t === "state") {
      applyNetState(msg);
    }
  }

  function netStatus(text, isErr) {
    netStatusEl.textContent = text;
    netStatusEl.classList.toggle("err", !!isErr);
  }

  function showNetStep(which) {
    netChoice.hidden = which !== "choice";
    netHostStep.hidden = which !== "host";
    netJoinStep.hidden = which !== "join";
  }

  function openNetPanel() {
    netStatus("");
    showNetStep("choice");
    netHostCode.value = ""; netHostAnswer.value = "";
    netJoinOffer.value = ""; netJoinCode.value = "";
    netJoinAnswerWrap.hidden = true;
    overlay.classList.add("hidden");
    netPanel.classList.remove("hidden");
  }

  function closeNetPanel() {
    netPanel.classList.add("hidden");
    overlay.classList.remove("hidden");
  }

  function onNetConnected() {
    closeNetPanel();
    refreshOnlineBtn();
    if (netRole === "host") {
      start();
    } else {
      overlayBtn.hidden = true;
      overlayTitle.textContent = "CONNECTED";
      overlayMsg.textContent = "Waiting for the host to serve…";
      overlay.classList.remove("hidden");
    }
  }

  function onNetDisconnected() {
    const wasConnected = netConnected;
    netConnected = false;
    net = null;
    netRole = null;
    lastNetScores = null;
    if (wasConnected) {
      cancelAnimationFrame(raf);
      state = "idle";
      overlayBtn.hidden = false;
      overlayTitle.textContent = "CONNECTION LOST";
      overlayMsg.textContent = "Your friend disconnected. Play locally, or host or join a new online match.";
      overlayBtn.textContent = "START";
      overlay.classList.remove("hidden");
      refreshOnlineBtn();
      raf = requestAnimationFrame(loop);
    }
  }

  // A tab close, lost wifi, or crashed browser never sends a graceful
  // DataChannel close — only the RTCPeerConnection's own state eventually
  // notices, so that's the one that must trigger recovery too.
  function onNetStateChange(connectionState) {
    if (connectionState === "disconnected" || connectionState === "failed" || connectionState === "closed") {
      onNetDisconnected();
    }
  }

  function copyText(text) {
    if (!text || !navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  onlineBtn.addEventListener("click", openNetPanel);
  netCancel.addEventListener("click", () => {
    if (net && !netConnected) { net.close(); net = null; netRole = null; }
    closeNetPanel();
  });

  netHostBtn.addEventListener("click", async () => {
    showNetStep("host");
    netStatus("Generating your code…");
    netRole = "host";
    net = PeerLink.host({
      onOpen: () => { netConnected = true; netStatus("Connected!"); onNetConnected(); },
      onMessage: handleNetMessage,
      onClose: onNetDisconnected,
      onState: onNetStateChange,
    });
    try {
      netHostCode.value = await net.codePromise;
      netStatus("Send this code to your friend, then wait for theirs.");
    } catch (e) {
      netStatus("This browser couldn't start a connection.", true);
    }
  });

  netHostConnect.addEventListener("click", async () => {
    const answer = netHostAnswer.value.trim();
    if (!answer || !net) return;
    netStatus("Connecting…");
    try {
      await net.acceptAnswer(answer);
    } catch (e) {
      netStatus("That code didn't work. Double-check it and try again.", true);
    }
  });

  netJoinBtn.addEventListener("click", () => {
    showNetStep("join");
    netStatus("Paste the code your friend sent you.");
  });

  netJoinSubmit.addEventListener("click", async () => {
    const offer = netJoinOffer.value.trim();
    if (!offer) return;
    netRole = "guest";
    netStatus("Connecting…");
    net = PeerLink.join(offer, {
      onOpen: () => { netConnected = true; netStatus("Connected!"); onNetConnected(); },
      onMessage: handleNetMessage,
      onClose: onNetDisconnected,
      onState: onNetStateChange,
    });
    try {
      netJoinCode.value = await net.codePromise;
      netJoinAnswerWrap.hidden = false;
      netStatus("Send this code back to them to finish connecting.");
    } catch (e) {
      netStatus("That code looks invalid. Ask them to resend it.", true);
    }
  });

  netHostCopy.addEventListener("click", () => copyText(netHostCode.value));
  netJoinCopy.addEventListener("click", () => copyText(netJoinCode.value));

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) { keys[k] = true; e.preventDefault(); }
    if (k === "arrowup") { keys.up = true; e.preventDefault(); }
    if (k === "arrowdown") { keys.down = true; e.preventDefault(); }
    if (k === "arrowleft") { keys.left = true; e.preventDefault(); }
    if (k === "arrowright") { keys.right = true; e.preventDefault(); }
    sendGuestInput();
  });
  document.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) keys[k] = false;
    if (k === "arrowup") keys.up = false;
    if (k === "arrowdown") keys.down = false;
    if (k === "arrowleft") keys.left = false;
    if (k === "arrowright") keys.right = false;
    sendGuestInput();
  });

  overlayBtn.addEventListener("click", () => {
    if (state === "idle" || state === "over") start();
    else serve();
  });

  resetPositions();
  matches1 = 0; matches2 = 0;
  score1 = 0; score2 = 0;
  updateHud();
  refreshOnlineBtn();
  draw();
  raf = requestAnimationFrame(loop);

  // Exposed for the arcade's browser tests
  window.__airhockey = {
    state: () => ({ state, score1, score2, matches1, matches2, puck, p1, p2, netRole, netConnected }),
    start, serve,
    forceScore: (who) => score(who),
  };
})();
