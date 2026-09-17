/* Soundboard page. Ported from the loader of V9o9's Online Soundboard
   (https://github.com/v9o9/soundboard, Apache-2.0). Same behaviour as the
   original: the sound list comes from a JSON manifest, every sound gets a
   colored button and an <audio> element, "Provoke Chaos" plays all of them and
   "Stop Everything" pauses and rewinds all of them. Changes from the original:
   a second manifest adds Kenney's CC0 packs, sounds are grouped into packs you
   can switch between, a search box filters by name (Provoke Chaos then plays
   only the sounds shown), buttons show a playing state, Esc stops everything,
   and the page uses the arcade's own styles instead of the upstream CSS. */

(() => {
  // Each manifest is {sounds: [{name, color, mp3, pack?]}; mp3 paths resolve
  // relative to the manifest. The meme pack preloads like the original site;
  // the other packs only get their <audio> elements once you open the pack or
  // click a sound, so the page stays light.
  const SOURCES = [
    { url: "assets/sounds.json", pack: "memes", eager: true },
    { url: "assets/sounds-kenney.json", pack: null, eager: false },
  ];
  const PACKS = [
    ["all", "All"], ["memes", "Memes"], ["voice", "Voice"], ["fighter", "Fighter"],
    ["jingles", "Jingles"], ["scifi", "Sci-Fi"], ["impacts", "Impacts"],
    ["casino", "Casino"], ["rpg", "RPG"], ["retro", "Retro"],
  ];

  const grid = document.getElementById("sb-grid");
  const statusEl = document.getElementById("sb-status");
  const search = document.getElementById("sb-search");
  const emptyEl = document.getElementById("sb-empty");
  const catsEl = document.getElementById("sb-cats");
  const audioElements = {}; // name -> <audio>, same shape as upstream
  const items = []; // { el, name, pack, src, audio, ensure } in manifest order
  let activePack = "all";

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function addSound(sound, source, base) {
    const pack = sound.pack || source.pack || "memes";
    const item = document.createElement("div");
    item.className = "sb-sound";
    item.dataset.pack = pack;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sb-btn";
    button.style.setProperty("--sb-color", sound.color || "#888");
    button.title = sound.name;
    button.setAttribute("aria-label", "Play " + sound.name);

    const name = document.createElement("p");
    name.className = "sb-name";
    name.textContent = sound.name;

    const it = { el: item, name: sound.name.toLowerCase(), pack, src: new URL(sound.mp3, base).href, audio: null };
    it.ensure = () => {
      if (it.audio) return it.audio;
      const audio = document.createElement("audio");
      audio.src = it.src;
      audio.preload = "auto";
      const off = () => item.classList.remove("playing");
      audio.addEventListener("play", () => item.classList.add("playing"));
      audio.addEventListener("pause", off);
      audio.addEventListener("ended", off);
      item.appendChild(audio);
      it.audio = audio;
      audioElements[sound.name] = audio;
      return audio;
    };
    if (source.eager) it.ensure();

    button.addEventListener("click", () => {
      const audio = it.ensure();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    });

    item.append(button, name);
    grid.appendChild(item);
    items.push(it);
  }

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const it of items) {
      const hit = (activePack === "all" || it.pack === activePack) && (!q || it.name.includes(q));
      it.el.hidden = !hit;
      if (hit) shown++;
    }
    emptyEl.hidden = shown > 0 || items.length === 0;
    const scope = activePack === "all" ? items.length : items.filter((it) => it.pack === activePack).length;
    setStatus(q ? shown + " OF " + scope + " SOUNDS" : shown + " SOUNDS");
  }
  search.addEventListener("input", applyFilter);

  function buildChips() {
    catsEl.innerHTML = "";
    for (const [key, label] of PACKS) {
      const n = key === "all" ? items.length : items.filter((it) => it.pack === key).length;
      if (!n) continue;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sb-chip" + (key === activePack ? " active" : "");
      chip.dataset.pack = key;
      chip.innerHTML = label + '<span class="n">' + n + "</span>";
      chip.addEventListener("click", () => selectPack(key));
      catsEl.appendChild(chip);
    }
  }

  function selectPack(key) {
    activePack = key;
    catsEl.querySelectorAll(".sb-chip").forEach((c) => c.classList.toggle("active", c.dataset.pack === key));
    // Opening a pack creates and preloads its sounds so its buttons respond instantly
    if (key !== "all") {
      for (const it of items) if (it.pack === key) it.ensure();
    }
    applyFilter();
  }

  let hasLoaded = false;
  Promise.all(SOURCES.map((source) =>
    fetch(source.url + "?t=" + Date.now()) // cache-busting, as upstream does
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => ({ source, sounds: data.sounds }))
      .catch((err) => ({ source, sounds: [], error: err }))
  )).then((results) => {
    grid.innerHTML = "";
    const failed = [];
    for (const { source, sounds, error } of results) {
      if (error) { failed.push(source.url); continue; }
      const base = new URL(source.url, location.href);
      sounds.forEach((sound) => addSound(sound, source, base));
    }
    hasLoaded = true;
    buildChips();
    applyFilter();
    if (failed.length) setStatus((items.length ? items.length + " SOUNDS · " : "") + "COULD NOT LOAD " + failed.join(", "));
  });
  setTimeout(() => {
    if (!hasLoaded) setStatus("STILL LOADING… CHECK YOUR CONNECTION");
  }, 7000);

  // Plays every sound currently shown (all of them unless a pack or search is active)
  function playAll() {
    for (const it of items) {
      if (!it.el.hidden) it.ensure().play().catch(() => {});
    }
  }

  function stopAll() {
    for (const name in audioElements) {
      if (Object.hasOwnProperty.call(audioElements, name)) {
        const el = audioElements[name];
        if (!el.paused || el.currentTime > 0) {
          el.pause();
          el.currentTime = 0;
        }
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
