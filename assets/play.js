/* Wrapper page for the open-source games hosted under games/. Each entry
   credits the original author and license; the game itself runs in an
   iframe so its own styles and scripts stay isolated from the arcade. */
(() => {
  const GAMES = {
    "clumsy-bird": {
      name: "Clumsy Bird",
      title: "🐦 CLUMSY BIRD",
      color: "var(--amber)",
      src: "games/clumsy-bird/index.html",
      author: "Ellison Leão",
      authorUrl: "https://github.com/ellisonleao",
      source: "https://github.com/ellisonleao/clumsy-bird",
      license: "GPL-3.0",
      height: 640,
      hint: "Click, tap, or press Space to flap. Built with the melonJS engine.",
    },
    hextris: {
      name: "Hextris",
      title: "⬡ HEXTRIS",
      color: "var(--teal)",
      src: "games/hextris/index.html",
      author: "Logan Engstrom & Garrett Finucane",
      authorUrl: "https://github.com/Hextris",
      source: "https://github.com/Hextris/hextris",
      license: "GPL-3.0",
      height: 700,
      hint: "Rotate the hexagon with ◂ ▸ (or tap either side) to catch falling blocks. Match three or more of a color to clear them.",
    },
    pacman: {
      name: "Pac-Man",
      title: "🟡 PAC-MAN",
      color: "var(--lime)",
      src: "games/pacman/index.html",
      author: "Platzh1rsch",
      authorUrl: "https://github.com/platzhersh",
      source: "https://github.com/platzhersh/pacman-canvas",
      license: "CC0 1.0 (public domain)",
      height: 780,
      hint: "Arrow keys or swipe. Eat every dot, dodge the ghosts. The page scrolls inside the frame.",
    },
    astray: {
      name: "Astray",
      title: "🔮 ASTRAY",
      color: "var(--purple)",
      src: "games/astray/index.html",
      author: "Rye Terrell",
      authorUrl: "https://github.com/wwwtyro",
      source: "https://github.com/wwwtyro/Astray",
      license: "Unlicense (public domain)",
      height: 640,
      hint: "Arrow keys or WASD roll the ball through a 3D maze. Each level is bigger than the last.",
    },
  };

  const key = new URLSearchParams(location.search).get("game");
  const g = GAMES[key];
  if (!g) {
    location.replace("index.html");
    return;
  }

  const titleEl = document.getElementById("title");
  const creditEl = document.getElementById("credit");
  const frame = document.getElementById("frame");
  const hintEl = document.getElementById("hint");

  document.title = g.name + " · Neon Arcade";
  titleEl.textContent = g.title;
  titleEl.style.color = g.color;
  creditEl.innerHTML =
    'By <a href="' + g.authorUrl + '">' + g.author + "</a>" +
    ' · <a href="' + g.source + '">source code</a>' +
    " · " + g.license;
  hintEl.textContent = g.hint;
  frame.style.height = g.height + "px";
  frame.title = g.name;
  frame.src = g.src;

  // Same-origin frame: hand it keyboard focus once it loads so arrow keys work immediately.
  frame.addEventListener("load", () => {
    try { frame.contentWindow.focus(); } catch (e) { /* ignore */ }
  });
})();
