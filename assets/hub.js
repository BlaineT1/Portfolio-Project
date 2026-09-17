/* Hub search: filters the game cards by title, blurb, or author as you type.
   "/" focuses the box, Esc clears it. */

(() => {
  const search = document.getElementById("hub-search");
  const countEl = document.getElementById("hub-count");
  const emptyEl = document.getElementById("hub-empty");
  const cards = [...document.querySelectorAll("main.hub .card")].map((el) => ({
    el,
    text: el.textContent.replace(/\s+/g, " ").toLowerCase(),
  }));
  const sectionTitles = [...document.querySelectorAll("main.hub .section-title")];

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const c of cards) {
      const hit = !q || c.text.includes(q);
      c.el.hidden = !hit;
      if (hit) shown++;
    }
    // Section headings only make sense for the full, ordered list
    sectionTitles.forEach((t) => { t.hidden = !!q; });
    document.querySelector("main.hub").classList.toggle("filtering", !!q);
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
  if (search.value) applyFilter(); // browsers may restore the field on back navigation
})();
