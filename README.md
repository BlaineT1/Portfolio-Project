# 🕹️ Neon Arcade

A game website — 22 original browser games built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies.

## Games

| Game | Controls |
|------|----------|
| 🐍 **Snake** | Arrow keys / WASD, swipe on mobile. P or Space pauses. |
| 🧱 **Breakout** | Mouse, touch, or arrow keys. Click or Space launches the ball. |
| 🃏 **Memory Match** | Click or tap to flip cards. |
| 🔢 **2048** | Arrow keys / WASD, swipe on mobile. |
| 🧩 **Tetris** | Arrows move/rotate/soft-drop, Space hard-drops, on-screen pad on mobile. P pauses. |
| 🐤 **Flappy Bird** | Click, tap, or Space to flap. |
| 💣 **Minesweeper** | Click reveals, right-click or long-press flags. First click is always safe. |
| 🏓 **Pong** | Mouse, touch, or ↑ ↓ keys. First to 7 beats the CPU. |
| 🧠 **Simon** | Click the pads to repeat the growing sequence. |
| 🔨 **Whack-a-Mole** | Click or tap the hamsters, dodge the bombs. 30-second rounds. |
| 👾 **Invaders** | ◂ ▸ move, Space shoots. Drag + tap on mobile. |
| ☄️ **Asteroids** | Arrows turn/thrust, Space fires. On-screen pad on mobile. |
| 🐸 **Froggy Road** | Arrows or swipe to hop. Ride logs, dodge cars. |
| 🦘 **Sky Jump** | ◂ ▸ steer, automatic bouncing. Hold a screen half on mobile. |
| ❌ **Tic-Tac-Toe** | Click a square. The CPU plays minimax (with rare lapses). |
| 🔴 **Connect Four** | Click a column to drop. CPU blocks and counter-attacks. |
| 🔤 **Word Guess** | Type or tap 5-letter guesses; 6 tries; streaks tracked. |
| 🎯 **Aim Trainer** | Click shrinking targets for 30 seconds. |
| ✌️ **Rock Paper Scissors** | Pick a hand, ride the win streak. |
| 🧊 **Slide Puzzle** | Click tiles next to the gap (or arrow keys) to restore 1–15. |
| 💡 **Lights Out** | Each click flips a plus-shape. Turn every light off. |
| 🏈 **Neon Bowl** | Call plays with 1–5 (or the buttons), arrows/drag to run, Space or tap a receiver to throw, Space stops the kick meter. On defense you're the cyan linebacker. Two 90-second halves; an 8-game season with standings is saved between visits. The main menu sets CPU difficulty (Rookie / Pro / All-Pro). |

High scores are saved per game in your browser's localStorage — nothing leaves your machine.

Every page has two floating buttons in the top-right corner: a **dark/light theme toggle** (game screens stay dark in light mode, like proper arcade cabinets) and a **sound toggle**. All sound effects are synthesized live with the Web Audio API — no audio files. Both preferences persist across visits.

## Baseball card

The hub has a **Baseball** card reserved for Blaine's own baseball game. To point it at the game, open `index.html`, find the block marked `BLAINE'S BASEBALL GAME`, and replace the `#` in `href="#"` with the game's link. Until then the card is greyed out and does nothing.

## More games from around the web

The hub's last section hosts four open-source games under `games/`, each wrapped by `play.html` with credit to its author:

| Game | Author | License |
|------|--------|---------|
| 🐦 Clumsy Bird | [Ellison Leão](https://github.com/ellisonleao/clumsy-bird) | GPL-3.0 |
| ⬡ Hextris | [Logan Engstrom & Garrett Finucane](https://github.com/Hextris/hextris) | GPL-3.0 |
| 🟡 Pac-Man | [Platzh1rsch](https://github.com/platzhersh/pacman-canvas) | CC0 1.0 |
| 🔮 Astray | [Rye Terrell](https://github.com/wwwtyro/Astray) | Unlicense |

Each game's original license file ships alongside it. The copies here are unmodified apart from removing the authors' ad and analytics tags (this site runs none) and fixing paths so they work from a subfolder.

## Run it locally

No build step needed. Either open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Play it live

**https://blainet1.github.io/Portfolio-Project/**

Hosting is GitHub Pages, served from the `gh-pages` branch. The workflow in
`.github/workflows/pages.yml` republishes that branch on every push, so the
live site updates itself about a minute after each commit. Nothing to build,
nothing to configure.
