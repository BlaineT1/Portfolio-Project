# 🕹️ Neon Arcade

A game website — 31 original browser games built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies.

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
| ♟️ **Chess** | Click a piece, then a square. Easy / Normal / Hard CPU; Undo takes back a full turn. |
| ♠️ **Solitaire** | Klondike, draw one. Click a card then its destination, click twice for a foundation, or drag. Z undoes. |
| 🧮 **Sudoku** | Type or tap numbers, N for notes, arrows to move. Every puzzle has one solution. Best time is saved. |
| 📦 **Sokoban** | Arrows / WASD / swipe to push crates onto targets. Z undoes, R restarts. 12 levels. |
| ✏️ **Hangman** | Type or tap letters. Six misses and it's over; win streaks are the score. |
| 💥 **Missile Command** | Click or tap to fire. Interceptors detonate where you aim. P pauses. |
| 🃏 **Blackjack** | Pick chips, hit Deal. H hits, S stands. Dealer stands on 17; blackjack pays 3:2. |
| ♣️ **FreeCell** | Click a card then its destination, or drag. Every card deals face up. Z undoes. |
| 🏒 **Air Hockey** | Two players, one keyboard (Cyan: WASD, Pink: arrows), or "Play Online" to host or join a match with a friend on another computer — peer-to-peer, no accounts. First to 7. |

High scores are saved per game in your browser's localStorage — nothing leaves your machine.

The hub has a search box (press `/` to jump to it) that filters the cards by title, description, or author as you type. The star on each card pins the game to a **Favorites** section at the top of the hub; favorites are saved in your browser.

Every page has two floating buttons in the top-right corner: a **theme toggle** that cycles dark, light, and CRT (scanlines and a vignette; game screens stay dark in light mode, like proper arcade cabinets) and a **sound toggle**. All sound effects are synthesized live with the Web Audio API — no audio files. Both preferences persist across visits.

## Footer name link and credits page

The footer on every page says "Made by Blaine" and links to `credits.html`. To make the name itself open a link, open `assets/arcade.js`, find the block marked `BLAINE'S LINK` at the top of the footer section, and replace the `#` in `MADE_BY_URL` with the address. Until then, clicking the name does nothing.

## Baseball card

The hub's **Baseball** card links to Google's Fourth of July 2019 baseball Doodle (opens on doodles.google). To point it somewhere else, open `index.html`, find the block marked `BASEBALL CARD`, and change the `href`. Setting it to `#` greys the card out and makes it inert.

## Soundboard

`soundboard.html` (reachable as `/soundboard` on GitHub Pages) is a port of [V9o9's Online Soundboard](https://github.com/v9o9/soundboard), Apache-2.0. The 211 meme clips live in `assets/sounds/` with their manifest in `assets/sounds.json`, and eight more packs from [Kenney](https://kenney.nl) (CC0, converted to MP3) live in `assets/sounds-kenney/` with `assets/sounds-kenney.json`. The page builds a colored button per sound, pack chips switch between them, a search box filters by name, and **Provoke Chaos** plays everything shown at once while **Stop Everything** (or Esc) silences it. Starring a sound pins it to the **Favorites** pack, and keys 1–9 play your first nine favorites. To add a sound, drop an MP3 into `assets/sounds/` and add a `{ "name": …, "color": …, "mp3": "sounds/<file>.mp3" }` entry to the manifest. The upstream license is at `assets/sounds/LICENSE`; the meme clips themselves are third-party excerpts that belong to their owners.

## More games from around the web

The hub's last section hosts 94 open-source games under `games/`, each wrapped by `play.html` with credit to its author:

| Game | Author | License |
|------|--------|---------|
| 🐦 Clumsy Bird | [Ellison Leão](https://github.com/ellisonleao/clumsy-bird) | GPL-3.0 |
| ⬡ Hextris | [Logan Engstrom & Garrett Finucane](https://github.com/Hextris/hextris) | GPL-3.0 |
| 🟡 Pac-Man | [Platzh1rsch](https://github.com/platzhersh/pacman-canvas) | CC0 1.0 |
| 🔮 Astray | [Rye Terrell](https://github.com/wwwtyro/Astray) | Unlicense |
| 🦖 T-Rex Runner | [Chromium, extracted by wayou](https://github.com/wayou/t-rex-runner) | BSD-3-Clause |
| 🛸 Radius Raid | [Jack Rugile](https://github.com/jackrugile/radius-raid) | MIT |
| 🏎️ JS Racer | [Jake Gordon](https://github.com/jakesgordon/javascript-racer) | MIT |
| ⬢ HexGL | [Thibaut Despoulain](https://github.com/BKcore/HexGL) | MIT |
| 🕹️ Underrun | [Dominic Szablewski](https://github.com/phoboslab/underrun) | MIT |
| 🚀 Space Huggers | [Frank Force](https://github.com/js13kGames/space-huggers) | MIT |
| 📦 Packabunchas | [Mattia Fortunati](https://github.com/js13kGames/packabunchas) | MIT |
| 🔥 Dante | [Salvatore Previti](https://github.com/js13kGames/dante) | MIT |
| ⛺ Tiny Yurts | [burntcustard](https://github.com/js13kGames/tiny-yurts) | MIT |
| 🕳️ Black Hole Square | [Quinten Clause](https://github.com/js13kGames/black-hole-square) | MIT |
| 👻 Soul Jumper | [Tyler](https://github.com/js13kGames/soul-jumper) | ISC |
| 👿 Infernal Throne | [Arik Wex](https://github.com/js13kGames/infernal-throne) | ISC |
| 🪷 Pond | [Zolmeister](https://github.com/Zolmeister/pond) | MIT |
| 🕯️ A Dark Room | [Doublespeak Games](https://github.com/doublespeakgames/adarkroom) | MIT |
| 🟪 Custom Tetris | [Ondřej Žára](https://github.com/ondras/custom-tetris) | MIT |
| ⚛️ Particle Clicker | [CERN Webfest team](https://github.com/particle-clicker/particle-clicker) | MIT |
| 🕷️ CHOCH | [Konstantin Guschin & lampy](https://github.com/js13kGames/choch) | WTFPL |
| ⚔️ Stolen Sword | [Ian Chiao](https://github.com/js13kGames/stolen-sword) | MIT |
| 🛡️ The Last Spartan | [Michael Ferron](https://github.com/js13kGames/the-last-spartan) | MIT |
| 🔷 Fourfold | [Mohammed Saud](https://github.com/js13kGames/fourfold) | MIT |
| 🔍 I Want to Google the Game | [Mark Vasilkov](https://github.com/js13kGames/i-want-to-google-the-game) | FAFOL |
| 🛣️ Highway 404 | [Jerome Lecomte](https://github.com/js13kGames/highway-404) | MIT |
| 🤖 Minipunk | [Cody Ebberson](https://github.com/js13kGames/minipunk) | MIT |
| 🏝️ Island Not Found | [Ben Clark & Salvatore Previti](https://github.com/js13kGames/island-not-found) | MIT |
| 🏁 404 KPH | [Jeremy Burns](https://github.com/js13kGames/404kph) | MIT |
| 🔗 Connection | [Federico Tibaldo](https://github.com/js13kGames/connection) | GPL-3.0 |
| 🚀 Soyuz 404 | [Markus Fisch](https://github.com/js13kGames/sojuz-404) | Unlicense |
| 🪞 Symmetry Not Found | [Pim Schreurs](https://github.com/js13kGames/symmetry-not-found) | ISC |
| 💾 xx142-b2.exe | [Ben Clark & Salvatore Previti](https://github.com/js13kGames/xx142-b2exe) | MIT |
| 🪃 Bounce Back | [Frank Force](https://github.com/js13kGames/bounce-back) | GPL-2.0 |
| 🌊 Push Back | [Erik Sombroek & Lomateron](https://github.com/js13kGames/push-back) | MIT |
| 👻 The Wandering Wraith | [Mateusz Tomczyk](https://github.com/js13kGames/the-wandering-wraith) | MIT |
| ⛏️ Dwarfs: There and Back Again | [Mark Vasilkov](https://github.com/js13kGames/dwarfs-there-and-back-again) | MIT |
| 🔌 Nano Wirebot | [Mariano Lambir](https://github.com/js13kGames/nano-wirebot) | ISC |
| 📼 Play Back | [Chris Glover](https://github.com/js13kGames/play-back) | ISC |
| 🔛 ONOFF | [Daniel Marino & Brad Dunbar](https://github.com/js13kGames/onoff) | MIT |
| 🕶️ The Matr13k | [Giovanny Beltrán](https://github.com/js13kGames/the-matr13k) | ISC |
| 🧊 1024 Moves | [Brégeau](https://github.com/js13kGames/1024-moves) | GPL-3.0 |
| 🛰️ Spacecraft | [Csaba Csecskedi](https://github.com/js13kGames/spacecraft) | MIT |
| 🪙 Off the Line | [Bryan Perfetto](https://github.com/js13kGames/off-the-line) | ISC |
| 🪐 Exo | [Jack Oatley & Anton K.](https://github.com/js13kGames/exo) | MIT |
| ⚓ Submersible Warship 2063 | [Jerome Lecomte](https://github.com/js13kGames/submersible-warship-2063) | MIT |
| 👾 Evil Glitch | [Giovanny Beltrán](https://github.com/js13kGames/evil-glitch) | ISC |
| 🚪 13th Floor | [Rob Louie](https://github.com/js13kGames/13th-floor) | MIT |
| 🃏 Casual Crusade | [Antti Haavikko](https://github.com/js13kGames/casual-crusade) | MIT |
| 🦊 Escape | [Michał Budzyński & Stanisław Małolepszy](https://github.com/js13kGames/escape-2021) | ISC |
| 🔫 Q1K3 | [Dominic Szablewski](https://github.com/js13kGames/q1k3) | MIT |
| 🏰 Super Castle Game | [Mark Vasilkov](https://github.com/js13kGames/super-castle-game) | GPL-3.0 |
| 🪦 The Neatness | [Mark Vasilkov](https://github.com/js13kGames/the-neatness) | GPL-3.0 |
| 🧗 LittleJS Platformer | [Frank Force](https://github.com/KilledByAPixel/LittleJS) | MIT |
| 🧱 LittleJS Breakout | [Frank Force](https://github.com/KilledByAPixel/LittleJS) | MIT |
| 🍬 LittleJS Match-3 | [Frank Force](https://github.com/KilledByAPixel/LittleJS) | MIT |
| 🐈‍⬛ Witchcat | [Jonathan Vallet & Lylouf](https://github.com/js13kGames/witchcat) | MIT |
| 🧮 Catculus | [Antti Haavikko](https://github.com/js13kGames/catculus) | MIT |
| 🐱 Non-Mewtonian Cat | [Mohammed Saud](https://github.com/js13kGames/non-mewtonian-cat) | GPL-3.0 |
| 🧙 Whiskers Witch Adventure | [Rob Louie](https://github.com/js13kGames/whiskers-witch-adventure) | MIT |
| 🐟 Kuro Neko Market | [Federico Tibaldo](https://github.com/js13kGames/kuro-neko-market) | GPL-3.0 |
| 🌙 Echoes of Nyx | [Corentin Pillet](https://github.com/js13kGames/echoes-of-nyx) | MIT |
| 🏴‍☠️ Coup Ahoo | [Antti Haavikko](https://github.com/js13kGames/coup-ahoo) | MIT |
| 🚩 13 Steps to Escape | [Jonathan Vallet](https://github.com/js13kGames/13-steps-to-escape) | MIT |
| 🧪 Brewing Disaster | [Adrien Guéret](https://github.com/js13kGames/brewing-disaster) | Apache-2.0 |
| 👻 Phantomicus | [Cody Ebberson](https://github.com/js13kGames/phantomicus) | MIT |
| 🚀 Aargh! Triskaideka Attacks! | [Christoph Schansky](https://github.com/js13kGames/aargh-triskaideka-attacks) | MIT |
| 🤖 Greeble | [Ryan Malm](https://github.com/js13kGames/greeble) | MIT |
| 🏝️ Forgotten Island | [Wrong Way Wonders](https://github.com/js13kGames/forgotten-island) | MIT |
| ⛏️ Forsaken | [David Brad](https://github.com/js13kGames/forsaken) | MIT |
| 🐜 Anthority | [Bruno Croci](https://github.com/js13kGames/anthority) | ISC |
| 🐚 Vendredi | [Jean Simard](https://github.com/js13kGames/vendredi) | GPL-3.0 |
| 🧟 Pandemia | [Wil Alvarez](https://github.com/js13kGames/pandemia) | MIT |
| 🕹️ Behind Asteroids | [Gaëtan Renaudeau](https://github.com/js13kGames/behind-asteroids-the-dark-side) | ISC |
| ⛳ Gravity Golf | [Katherine Stark](https://github.com/js13kGames/gravity-golf) | MIT |
| 🛣️ Road Blocks | [Ash Kyd](https://github.com/js13kGames/road-blocks) | BSD |
| 📦 Sobanko | [fatfisz](https://github.com/js13kGames/sobanko) | MIT |
| ⏪ Anti-Paradox Run | [fatfisz](https://github.com/js13kGames/anti-paradox-run) | MIT |
| 🔺 Triangle: Back To Home | [Viktor Uhryn](https://github.com/js13kGames/triangle-back-to-home) | ISC |
| 🪝 Wander | [razh](https://github.com/js13kGames/wander) | MIT |
| 🌈 Offline Paradise | [Pim Schreurs](https://github.com/js13kGames/offline-paradise) | ISC |
| 🧙 VIER: Wizard Wars | [Giovanny Beltrán](https://github.com/js13kGames/vier-wizard-wars) | MIT |
| 🐱 Planet Figadore Has Gone Offline | [Jasper Renow-Clarke](https://github.com/js13kGames/planet-figadore-has-gone-offline) | MIT |
| 🕸️ Enmeshed | [Mark Barr](https://github.com/js13kGames/enmeshed) | MIT |
| 🐦‍⬛ Raven | [Elliot Nelson](https://github.com/js13kGames/raven) | ISC |
| 🤠 Backcountry | [Michał Budzyński & Stanisław Małolepszy](https://github.com/js13kGames/backcountry) | ISC |
| 🌊 Elematter | [Jack Rugile](https://github.com/js13kGames/elematter) | MIT |
| 🤖 Lost Robot | [Dennis Meckel](https://github.com/js13kGames/lost-robot) | MIT |
| 🛰️ SpacePi | [Jack Rugile](https://github.com/js13kGames/spacepi) | MIT |
| 🚀 Captain Callisto | [Cody Ebberson](https://github.com/js13kGames/the-adventures-of-captain-callisto) | MIT |
| 🛸 SYNTHBLAST | [Brian Risk](https://github.com/brianrisk/SYNTHBLAST-threejs-game) | Apache-2.0 |
| ⌨️ Word Pluck | [Kailash Nadh](https://github.com/knadh/wordpluck) | MIT |
| 🍺 Drunken Viking | [Cong Xu](https://github.com/cxong/DrunkenViking) | MIT |
| ⚔️ Dungeon Crawler RPG | [Red Pangilinan](https://github.com/redpangilinan/dungeon-crawler-rpg-od) | GPL-3.0 |

Each game's original license file ships alongside it. The copies here are unmodified apart from removing the authors' ad and analytics tags (this site runs none) and fixing paths so they work from a subfolder.

## Offline, installable, shareable

- **Works offline.** `sw.js` is a service worker that caches the hub, the original games, and the shared scripts on first visit. Open-source games and sound clips are cached the first time you use them. Pages and scripts refresh in the background, so changes show up on the next load. Bump `VERSION` in `sw.js` after big changes to make every visitor's browser start from a clean cache.
- **Installable.** `manifest.webmanifest` plus the icons in `assets/` let phones and desktops add the arcade to the home screen as an app (Share → Add to Home Screen on iPhone, the install prompt in Chrome).
- **Link previews.** Every page carries Open Graph and Twitter tags pointing at `assets/og-image.png`, so links pasted into Discord, iMessage, or Snapchat show a card. Replace that PNG (1200×630) to change the picture.
- **404 page.** `404.html` is what GitHub Pages shows for a missing address, with a random-game button.

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
