/* Shared helpers: per-game best scores kept in localStorage. */
const Arcade = {
  key(game) {
    return "neon-arcade-best-" + game;
  },

  getBest(game) {
    return Number(localStorage.getItem(this.key(game))) || 0;
  },

  /* Returns true when `score` beats the stored best (any score beats "unset").
     Pass lowerIsBetter=true for games where fewer is better (e.g. moves). */
  saveBest(game, score, lowerIsBetter = false) {
    const prev = this.getBest(game);
    const better =
      prev === 0 ? score > 0 : lowerIsBetter ? score < prev : score > prev;
    if (better) localStorage.setItem(this.key(game), String(score));
    return better;
  },
};
