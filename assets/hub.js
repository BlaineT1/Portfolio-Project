/* Hub: favorites and search.
   - A star on every card pins it to a Favorites section at the top of the
     hub. Favorites are saved in localStorage, like the high scores.
   - The search box filters the cards by title, blurb, or author as you type.
     "/" focuses the box, Esc clears it. */

(() => {
  const hub = document.querySelector("main.hub");
  const search = document.getElementById("hub-search");
  const countEl = document.getElementById("hub-count");
  const emptyEl = document.getElementById("hub-empty");
  const FAV_KEY = "neon-arcade-favorites";

  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  let favs = loadFavs();
  const isFav = (key) => favs.includes(key);

  const cards = [...hub.querySelectorAll(".card")].map((el) => ({
    el,
    key: el.getAttribute("href"),
    text: el.textContent.replace(/\s+/g, " ").toLowerCase(),
  }));
  const original = [...hub.children]; // the authored order, restored for everything that isn't a favorite

  const favTitle = document.createElement("h2");
  favTitle.className = "section-title";
  favTitle.id = "fav-title";
  favTitle.textContent = "★ FAVORITES";

  for (const c of cards) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fav-btn";
    btn.addEventListener("click", (e) => {
      e.preventDefault(); // the card itself is a link
      e.stopPropagation();
      toggleFav(c.key);
    });
    c.el.appendChild(btn);
    c.btn = btn;
  }

  function toggleFav(key) {
    favs = isFav(key) ? favs.filter((k) => k !== key) : [...favs, key];
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    render();
  }

  function render() {
    const favCards = favs.map((k) => cards.find((c) => c.key === k)).filter(Boolean);
    for (const c of cards) {
      const on = isFav(c.key);
      c.el.classList.toggle("is-fav", on);
      c.btn.textContent = on ? "★" : "☆";
      c.btn.title = on ? "Remove from favorites" : "Add to favorites";
      c.btn.setAttribute("aria-label", c.btn.title);
      c.btn.setAttribute("aria-pressed", String(on));
    }
    // Favorites first (in the order they were starred), then everything else as authored
    if (favCards.length) {
      hub.prepend(favTitle);
      let after = favTitle;
      for (const c of favCards) { after.after(c.el); after = c.el; }
    } else {
      favTitle.remove();
    }
    for (const node of original) {
      if (node.classList && node.classList.contains("card") && isFav(node.getAttribute("href"))) continue;
      hub.appendChild(node);
    }
    applyFilter();
  }

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const c of cards) {
      const hit = !q || c.text.includes(q);
      c.el.hidden = !hit;
      if (hit) shown++;
    }
    // Section headings only make sense for the full, ordered list
    hub.querySelectorAll(".section-title").forEach((t) => { t.hidden = !!q; });
    hub.classList.toggle("filtering", !!q);
    emptyEl.hidden = shown > 0;
    countEl.textContent = q ? shown + " OF " + cards.length + " GAMES" : "";
  }

  search.addEventListener("input", applyFilter);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== search) {
      e.preventDefault();
      search.focus();
    } else if (e.key === "Escape" && document.activeElement === search && search.value) {
      search.value = "";
      applyFilter();
    }
  });

  render();
})();
