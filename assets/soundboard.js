/* Soundboard page. Ported from the loader of V9o9's Online Soundboard
   (https://github.com/v9o9/soundboard, Apache-2.0). Same behaviour as the
   original: the sound list comes from a JSON manifest, every sound gets a
   colored button and a preloaded <audio> element, "Provoke Chaos" plays all of
   them and "Stop Everything" pauses and rewinds all of them. Changes from the
   original: sound paths resolve relative to the manifest (assets/sounds.json),
   buttons show a playing state, Esc stops everything, a search box filters the
   buttons by name (Provoke Chaos then plays only the sounds shown), and the
   page uses the arcade's own styles instead of the upstream CSS. */

(() => {
  const MANIFEST = "assets/sounds.json";
  const grid = document.getElementById("sb-grid");
  const statusEl = document.getElementById("sb-status");
  const search = document.getElementById("sb-search");
  const emptyEl = document.getElementById("sb-empty");
  const audioElements = {}; // name -> <audio>, same shape as upstream
  const items = []; // { el, name, audio } in manifest order

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function addSound(sound, base) {
    const item = document.createElement("div");
    item.className = "sb-sound";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sb-btn";
    button.style.setProperty("--sb-color", sound.color || "#888");
    button.title = sound.name;
    button.setAttribute("aria-label", "Play " + sound.name);

    const audio = document.createElement("audio");
    audio.src = new URL(sound.mp3, base).href;
    audio.preload = "auto";
    const off = () => item.classList.remove("playing");
    audio.addEventListener("play", () => item.classList.add("playing"));
    audio.addEventListener("pause", off);
    audio.addEventListener("ended", off);

    button.addEventListener("click", () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    const name = document.createElement("p");
    name.className = "sb-name";
    name.textContent = sound.name;

    item.append(button, name, audio);
    grid.appendChild(item);
    audioElements[sound.name] = audio;
    items.push({ el: item, name: sound.name.toLowerCase(), audio });
  }

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const it of items) {
      const hit = !q || it.name.includes(q);
      it.el.hidden = !hit;
      if (hit) shown++;
    }
    emptyEl.hidden = shown > 0 || items.length === 0;
    setStatus(q ? shown + " OF " + items.length + " SOUNDS" : items.length + " SOUNDS");
  }
  search.addEventListener("input", applyFilter);

  let hasLoaded = false;
  fetch(MANIFEST + "?t=" + Date.now()) // cache-busting, as upstream does
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((data) => {
      grid.innerHTML = "";
      const base = new URL(MANIFEST, location.href);
      data.sounds.forEach((sound) => addSound(sound, base));
      hasLoaded = true;
      applyFilter(); // the user may have typed while the manifest was loading
    })
    .catch((err) => {
      grid.innerHTML = "";
      setStatus("ERROR LOADING SOUNDBOARD: " + err.message);
    });
  setTimeout(() => {
    if (!hasLoaded) setStatus("STILL LOADING… CHECK YOUR CONNECTION");
  }, 7000);

  // Plays every sound currently shown (all of them unless a search is active)
  function playAll() {
    for (const it of items) {
      if (!it.el.hidden) it.audio.play().catch(() => {});
    }
  }

  function stopAll() {
    for (const name in audioElements) {
      if (Object.hasOwnProperty.call(audioElements, name)) {
        const el = audioElements[name];
        el.pause();
        el.currentTime = 0;
      }
    }
  }

  document.getElementById("sb-chaos").addEventListener("click", playAll);
  document.getElementById("sb-stop").addEventListener("click", stopAll);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // In a non-empty search box, Esc clears the search first; otherwise it stops playback
      if (document.activeElement === search && search.value) {
        search.value = "";
        applyFilter();
      } else {
        stopAll();
      }
    } else if (e.key === "/" && document.activeElement !== search) {
      e.preventDefault();
      search.focus();
    }
  });

  // Same globals the upstream page exposes
  window.playAll = playAll;
  window.stopAll = stopAll;
})();
