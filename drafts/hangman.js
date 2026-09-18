/* Hangman: guess the word one letter at a time, six wrong guesses and the
   figure is complete. Words come with a category hint. Win streaks are the
   score. */

(() => {
  const wordEl = document.getElementById("word");
  const catEl = document.getElementById("category");
  const kbEl = document.getElementById("keyboard");
  const streakEl = document.getElementById("streak");
  const wrongEl = document.getElementById("wrong");
  const bestEl = document.getElementById("best");
  const parts = [...document.querySelectorAll("#figure .part")];
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");
  const newBtn = document.getElementById("new-btn");

  const BANK = {
    Animals: ["elephant", "giraffe", "kangaroo", "penguin", "octopus", "dolphin", "cheetah", "flamingo", "hedgehog", "crocodile", "butterfly", "chameleon", "platypus", "porcupine", "armadillo", "jellyfish", "hamster", "walrus", "raccoon", "squirrel", "ostrich", "panther", "tortoise", "seahorse", "mongoose"],
    Food: ["pancakes", "spaghetti", "avocado", "burrito", "cheeseburger", "pineapple", "waffles", "lasagna", "pretzel", "popcorn", "guacamole", "milkshake", "quesadilla", "doughnut", "meatballs", "cinnamon", "strawberry", "watermelon", "mozzarella", "pepperoni", "brownie", "sandwich", "coleslaw", "nachos", "tacos"],
    Countries: ["canada", "brazil", "japan", "australia", "germany", "mexico", "egypt", "norway", "argentina", "thailand", "portugal", "iceland", "morocco", "vietnam", "switzerland", "kenya", "philippines", "ireland", "colombia", "greece", "new zealand", "south korea", "costa rica", "saudi arabia"],
    Sports: ["basketball", "football", "baseball", "hockey", "volleyball", "lacrosse", "skateboarding", "snowboarding", "wrestling", "gymnastics", "badminton", "archery", "surfing", "bowling", "cricket", "fencing", "rugby", "swimming", "tennis", "pickleball"],
    Tech: ["keyboard", "javascript", "algorithm", "bluetooth", "processor", "database", "firewall", "headphones", "microphone", "smartphone", "spreadsheet", "compiler", "gigabyte", "password", "wireless", "touchscreen", "motherboard", "emulator", "pixel", "browser"],
    Space: ["asteroid", "galaxy", "nebula", "satellite", "telescope", "jupiter", "meteor", "astronaut", "supernova", "black hole", "gravity", "eclipse", "orbit", "comet", "milky way", "saturn", "rover", "launchpad"],
    "Video games": ["minecraft", "fortnite", "tetris", "pokemon", "mario kart", "zelda", "roblox", "sonic", "pacman", "among us", "portal", "halo", "kirby", "donkey kong", "street fighter", "metroid", "animal crossing", "overwatch", "terraria", "stardew valley"],
  };
  const LETTERS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

  let word, category, guessed, wrong, over;
  let streak = Number(localStorage.getItem("neon-arcade-hangman-streak")) || 0;
  let lastWord = "";

  const keys = {};
  LETTERS.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    for (const ch of row) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kb-key";
      b.textContent = ch;
      b.addEventListener("click", () => guess(ch));
      rowEl.appendChild(b);
      keys[ch] = b;
    }
    kbEl.appendChild(rowEl);
  });

  function showBest() {
    const best = Arcade.getBest("hangman");
    bestEl.textContent = best > 0 ? best : "—";
    streakEl.textContent = streak;
  }

  function pick() {
    const cats = Object.keys(BANK);
    let w;
    do {
      category = cats[Math.floor(Math.random() * cats.length)];
      const list = BANK[category];
      w = list[Math.floor(Math.random() * list.length)];
    } while (w === lastWord);
    lastWord = w;
    return w;
  }

  function newWord() {
    word = pick();
    guessed = new Set();
    wrong = 0;
    over = false;
    overlay.classList.add("hidden");
    catEl.textContent = "Category: " + category;
    Object.values(keys).forEach((b) => { b.className = "kb-key"; b.disabled = false; });
    parts.forEach((p) => p.classList.remove("show"));
    showBest();
    render();
  }

  function render() {
    wordEl.innerHTML = "";
    for (const ch of word) {
      const span = document.createElement("span");
      if (ch === " ") { span.className = "hang-letter space"; }
      else {
        span.className = "hang-letter" + (over && !guessed.has(ch) ? " miss" : "");
        span.textContent = guessed.has(ch) || over ? ch : "";
      }
      wordEl.appendChild(span);
    }
    wrongEl.textContent = wrong + "/6";
  }

  function guess(ch) {
    if (over || guessed.has(ch) || !keys[ch]) return;
    guessed.add(ch);
    keys[ch].disabled = true;
    if (word.includes(ch)) {
      keys[ch].classList.add("green");
      Sound.flag();
      if ([...word].every((c) => c === " " || guessed.has(c))) return finish(true);
    } else {
      keys[ch].classList.add("miss");
      wrong += 1;
      parts[wrong - 1].classList.add("show");
      Sound.bounce();
      if (wrong >= 6) return finish(false);
    }
    render();
  }

  function finish(won) {
    over = true;
    render();
    if (won) {
      streak += 1;
      Sound.win();
      const isBest = Arcade.saveBest("hangman", streak);
      overlayTitle.textContent = "YOU GOT IT!";
      overlayMsg.innerHTML = "The word was <b>" + word + "</b>. Streak: " + streak + (isBest ? "<br>🏆 New best streak!" : "");
    } else {
      streak = 0;
      Sound.die();
      overlayTitle.textContent = "HANGED";
      overlayMsg.innerHTML = "It was <b>" + word + "</b>.";
    }
    localStorage.setItem("neon-arcade-hangman-streak", streak);
    showBest();
    overlay.classList.remove("hidden");
  }

  document.addEventListener("keydown", (e) => {
    if (e.key.length === 1 && /[a-z]/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) guess(e.key.toLowerCase());
    else if (e.key === "Enter" && over) newWord();
  });
  overlayBtn.addEventListener("click", newWord);
  newBtn.addEventListener("click", () => { if (!over) { streak = 0; localStorage.setItem("neon-arcade-hangman-streak", 0); } newWord(); });

  // Exposed for the arcade's browser tests
  window.__hangman = { word: () => word, guess, state: () => ({ wrong, over, streak }) };

  newWord();
})();
