/* Game requests page: a password screen in front of the list of game-request issues.
   The password is stored as a SHA-256 hash, not as plain text. This keeps casual
   visitors out, but it is not real security: the requests are public GitHub issues. */

const REPO = "BlaineT1/Portfolio-Project";
const PASS_HASH = "8061233bd6d9cddaee576dea0ce5d886c9a6aaaffc7a2525156e96bf492b49a1";
const KEY = "neon-arcade-requests-unlocked";

const gate = document.getElementById("req-gate");
const passInput = document.getElementById("req-pass");
const errorEl = document.getElementById("req-error");
const wrap = document.getElementById("req-list-wrap");
const statusEl = document.getElementById("req-status");
const listEl = document.getElementById("req-list");
let loaded = false;

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function field(body, heading) {
  // Issue forms render as "### Heading\n\nanswer"
  const re = new RegExp("###\\s*" + heading + "\\s*\\n+([\\s\\S]*?)(?=\\n###|$)", "i");
  const m = (body || "").match(re);
  const value = m ? m[1].trim() : "";
  return value === "_No response_" ? "" : value;
}

async function load() {
  if (loaded) return;
  loaded = true;
  statusEl.textContent = "Loading…";
  try {
    const url = "https://api.github.com/repos/" + REPO + "/issues?labels=game-request&state=all&per_page=100";
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error("GitHub said " + res.status);
    const issues = (await res.json()).filter((i) => !i.pull_request);
    listEl.textContent = "";
    if (!issues.length) {
      statusEl.textContent = "No requests yet. Be the first!";
      return;
    }
    statusEl.textContent = issues.length + (issues.length === 1 ? " request" : " requests");
    for (const issue of issues) {
      const game = field(issue.body, "Game name") || issue.title.replace(/^\[Game request\]\s*/i, "");
      const why = field(issue.body, "What makes it fun\\?");
      const players = field(issue.body, "Players");
      const li = el("li", "req-item");
      const head = el("div", "req-head");
      head.appendChild(el("h2", "req-game", game));
      if (issue.state === "closed") head.appendChild(el("span", "req-badge", "ADDED / CLOSED"));
      li.appendChild(head);
      if (why) li.appendChild(el("p", "req-why", why));
      const meta = [players, "by " + issue.user.login, new Date(issue.created_at).toLocaleDateString()]
        .filter(Boolean).join(" · ");
      li.appendChild(el("p", "req-meta", meta));
      const link = el("a", "req-link", "Discuss on GitHub ▸");
      link.href = issue.html_url;
      link.target = "_blank";
      link.rel = "noopener";
      li.appendChild(link);
      listEl.appendChild(li);
    }
  } catch (err) {
    loaded = false;
    statusEl.textContent = "Couldn't load requests (" + err.message + "). Try again in a minute.";
  }
}

function unlock() {
  gate.hidden = true;
  wrap.hidden = false;
  load();
}

gate.addEventListener("submit", async (e) => {
  e.preventDefault();
  const hash = await sha256(passInput.value.trim());
  if (hash === PASS_HASH) {
    try { sessionStorage.setItem(KEY, "1"); } catch (_) { /* private mode */ }
    errorEl.hidden = true;
    unlock();
  } else {
    errorEl.hidden = false;
    passInput.value = "";
    passInput.focus();
  }
});

document.getElementById("req-lock").addEventListener("click", () => {
  try { sessionStorage.removeItem(KEY); } catch (_) { /* private mode */ }
  wrap.hidden = true;
  gate.hidden = false;
  passInput.value = "";
});

try { if (sessionStorage.getItem(KEY) === "1") unlock(); } catch (_) { /* private mode */ }
