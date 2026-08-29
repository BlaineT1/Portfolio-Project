(() => {
  const yourHandEl = document.getElementById("your-hand");
  const cpuHandEl = document.getElementById("cpu-hand");
  const resultEl = document.getElementById("result");
  const streakEl = document.getElementById("streak");
  const bestEl = document.getElementById("best");

  const HANDS = ["rock", "paper", "scissors"];
  const EMOJI = { rock: "✊", paper: "✋", scissors: "✌️" };
  const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

  let streak = 0;
  let busy = false;

  bestEl.textContent = Arcade.getBest("rps");

  function play(yours) {
    if (busy) return;
    busy = true;
    Sound.click();
    yourHandEl.textContent = EMOJI[yours];
    cpuHandEl.textContent = "❔";
    resultEl.textContent = "";

    // Quick shuffle animation on the CPU hand before the reveal
    let ticks = 0;
    const shuffle = setInterval(() => {
      cpuHandEl.textContent = EMOJI[HANDS[ticks % 3]];
      ticks += 1;
      if (ticks >= 6) {
        clearInterval(shuffle);
        reveal(yours);
      }
    }, 110);
  }

  function reveal(yours) {
    const cpu = HANDS[Math.floor(Math.random() * 3)];
    cpuHandEl.textContent = EMOJI[cpu];

    if (yours === cpu) {
      resultEl.textContent = "TIE — GO AGAIN";
      Sound.point();
    } else if (BEATS[yours] === cpu) {
      streak += 1;
      resultEl.textContent = "YOU WIN!";
      const isBest = Arcade.saveBest("rps", streak);
      bestEl.textContent = Arcade.getBest("rps");
      if (isBest) resultEl.textContent = "YOU WIN! 🏆 BEST STREAK";
      Sound.win();
    } else {
      streak = 0;
      resultEl.textContent = "CPU WINS — STREAK RESET";
      Sound.die();
    }
    streakEl.textContent = String(streak);
    busy = false;
  }

  document.getElementById("pick-rock").addEventListener("click", () => play("rock"));
  document.getElementById("pick-paper").addEventListener("click", () => play("paper"));
  document.getElementById("pick-scissors").addEventListener("click", () => play("scissors"));
})();
