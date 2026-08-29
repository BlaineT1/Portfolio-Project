# 🕹️ Neon Arcade

A game website — 21 classic browser games built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies.

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

High scores are saved per game in your browser's localStorage — nothing leaves your machine.

Every page has two floating buttons in the top-right corner: a **dark/light theme toggle** (game screens stay dark in light mode, like proper arcade cabinets) and a **sound toggle**. All sound effects are synthesized live with the Web Audio API — no audio files. Both preferences persist across visits.

## Run it locally

No build step needed. Either open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Host it for free on GitHub Pages

1. Go to the repo's **Settings → Pages**
2. Under **Build and deployment**, choose **Deploy from a branch** and pick the default branch (root folder)
3. Your arcade goes live at `https://<username>.github.io/<repo-name>/`
