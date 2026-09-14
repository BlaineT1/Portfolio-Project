/* Wrapper page for the open-source games hosted under games/. Each entry
   credits the original author and license; the game itself runs in an
   iframe so its own styles and scripts stay isolated from the arcade. */
(() => {
  const GAMES = {
    "clumsy-bird": {
      name: "Clumsy Bird",
      title: "🐦 CLUMSY BIRD",
      color: "var(--amber)",
      src: "games/clumsy-bird/index.html",
      author: "Ellison Leão",
      authorUrl: "https://github.com/ellisonleao",
      source: "https://github.com/ellisonleao/clumsy-bird",
      license: "GPL-3.0",
      height: 640,
      hint: "Click, tap, or press Space to flap. Built with the melonJS engine.",
    },
    hextris: {
      name: "Hextris",
      title: "⬡ HEXTRIS",
      color: "var(--teal)",
      src: "games/hextris/index.html",
      author: "Logan Engstrom & Garrett Finucane",
      authorUrl: "https://github.com/Hextris",
      source: "https://github.com/Hextris/hextris",
      license: "GPL-3.0",
      height: 700,
      hint: "Rotate the hexagon with ◂ ▸ (or tap either side) to catch falling blocks. Match three or more of a color to clear them.",
    },
    pacman: {
      name: "Pac-Man",
      title: "🟡 PAC-MAN",
      color: "var(--lime)",
      src: "games/pacman/index.html",
      author: "Platzh1rsch",
      authorUrl: "https://github.com/platzhersh",
      source: "https://github.com/platzhersh/pacman-canvas",
      license: "CC0 1.0 (public domain)",
      height: 780,
      hint: "Arrow keys or swipe. Eat every dot, dodge the ghosts. The page scrolls inside the frame.",
    },
    trex: {
      name: "T-Rex Runner", title: "🦖 T-REX RUNNER", color: "var(--muted)",
      src: "games/trex/index.html", author: "Chromium project (extracted by wayou)",
      authorUrl: "https://github.com/wayou", source: "https://github.com/wayou/t-rex-runner",
      license: "BSD-3-Clause", height: 420,
      hint: "Chrome's offline dinosaur. Space or tap to jump, ▾ to duck. Click the game first.",
    },
    "radius-raid": {
      name: "Radius Raid", title: "🛸 RADIUS RAID", color: "var(--pink)",
      src: "games/radius-raid/index.html", author: "Jack Rugile",
      authorUrl: "https://github.com/jackrugile", source: "https://github.com/jackrugile/radius-raid",
      license: "MIT", height: 640,
      hint: "Twin-stick style: WASD to move, mouse to aim and fire. Survive the waves.",
    },
    racer: {
      name: "JavaScript Racer", title: "🏎️ JS RACER", color: "var(--cyan)",
      src: "games/racer/index.html", author: "Jake Gordon",
      authorUrl: "https://github.com/jakesgordon", source: "https://github.com/jakesgordon/javascript-racer",
      license: "MIT", height: 820,
      hint: "OutRun-style pseudo-3D racing. Arrows to steer and accelerate; the page scrolls inside the frame.",
    },
    hexgl: {
      name: "HexGL", title: "⬢ HEXGL", color: "var(--teal)",
      src: "games/hexgl/index.html", author: "Thibaut Despoulain",
      authorUrl: "https://github.com/BKcore", source: "https://github.com/BKcore/HexGL",
      license: "MIT", height: 640,
      hint: "Futuristic WebGL racer. Pick a quality, then arrows or WASD to fly. Needs a decent GPU.",
    },
    underrun: {
      name: "Underrun", title: "🕹️ UNDERRUN", color: "var(--purple)",
      src: "games/underrun/index.html", author: "Dominic Szablewski",
      authorUrl: "https://github.com/phoboslab", source: "https://github.com/phoboslab/underrun",
      license: "MIT", height: 640,
      hint: "A 13-kilobyte twin-stick shooter. WASD to move, mouse to aim and shoot. Find the terminals.",
    },
    "space-huggers": {
      name: "Space Huggers", title: "🚀 SPACE HUGGERS", color: "var(--pink)",
      src: "games/space-huggers/index.html", author: "Frank Force",
      authorUrl: "https://github.com/KilledByAPixel", source: "https://github.com/js13kGames/space-huggers",
      license: "MIT", height: 640,
      hint: "Run-and-gun platformer with destructible terrain. Arrows/WASD move, Z jumps, X or click shoots.",
    },
    "packabunchas": {
      name: "Packabunchas", title: "📦 PACKABUNCHAS", color: "var(--amber)",
      src: "games/packabunchas/index.html", author: "Mattia Fortunati",
      authorUrl: "https://github.com/MattiaFortunati", source: "https://github.com/js13kGames/packabunchas",
      license: "MIT", height: 640,
      hint: "Pack the cargo into the hold. A tight little spatial puzzle.",
    },
    "dante": {
      name: "Dante", title: "🔥 DANTE", color: "var(--pink)",
      src: "games/dante/index.html", author: "Salvatore Previti",
      authorUrl: "https://github.com/SalvatorePreviti", source: "https://github.com/js13kGames/dante",
      license: "MIT", height: 640,
      hint: "A 3D puzzle descent through the circles. WASD to move, mouse to look, E to interact.",
    },
    "tiny-yurts": {
      name: "Tiny Yurts", title: "⛺ TINY YURTS", color: "var(--lime)",
      src: "games/tiny-yurts/index.html", author: "burntcustard",
      authorUrl: "https://github.com/burntcustard", source: "https://github.com/js13kGames/tiny-yurts",
      license: "MIT", height: 700,
      hint: "Draw paths from yurts to pastures before the herds get restless. Click and drag.",
    },
    "black-hole-square": {
      name: "Black Hole Square", title: "🕳️ BLACK HOLE SQUARE", color: "var(--purple)",
      src: "games/black-hole-square/index.html", author: "Quinten Clause",
      authorUrl: "https://github.com/qclause", source: "https://github.com/js13kGames/black-hole-square",
      license: "MIT", height: 640,
      hint: "Slide the blocks into the black hole. Arrow keys or swipe.",
    },
    "soul-jumper": {
      name: "Soul Jumper", title: "👻 SOUL JUMPER", color: "var(--teal)",
      src: "games/soul-jumper/index.html", author: "Tyler",
      authorUrl: "https://github.com/tyler6699", source: "https://github.com/js13kGames/soul-jumper",
      license: "ISC", height: 640,
      hint: "Leap between bodies to escape. Arrows to move, Space to jump.",
    },
    "infernal-throne": {
      name: "Infernal Throne", title: "👿 INFERNAL THRONE", color: "var(--orange)",
      src: "games/infernal-throne/index.html", author: "Arik Wex",
      authorUrl: "https://github.com/arikwex", source: "https://github.com/js13kGames/infernal-throne",
      license: "ISC", height: 640,
      hint: "Fight your way to the throne of hell. Arrow keys or WASD, Space to attack.",
    },
    "pond": {
      name: "Pond", title: "🪷 POND", color: "var(--cyan)",
      src: "games/pond/index.html", author: "Zolmeister",
      authorUrl: "https://github.com/Zolmeister", source: "https://github.com/Zolmeister/pond",
      license: "MIT", height: 640,
      hint: "Tap or click to swim your fish through the pond. Relaxing, until it isn't.",
    },
    "adarkroom": {
      name: "A Dark Room", title: "🕯️ A DARK ROOM", color: "var(--muted)",
      src: "games/adarkroom/index.html", author: "Doublespeak Games",
      authorUrl: "https://github.com/doublespeakgames", source: "https://github.com/doublespeakgames/adarkroom",
      license: "MIT", height: 700,
      hint: "The fire is dead. The room is freezing. Light it, and see what grows. Saves automatically.",
    },
    "custom-tetris": {
      name: "Custom Tetris", title: "🟪 CUSTOM TETRIS", color: "var(--pink)",
      src: "games/custom-tetris/index.html", author: "Ondřej Žára",
      authorUrl: "https://github.com/ondras", source: "https://github.com/ondras/custom-tetris",
      license: "MIT", height: 700,
      hint: "Tetris where you pick the next piece — for yourself, or for a friend at the same keyboard.",
    },
    "particle-clicker": {
      name: "Particle Clicker", title: "⚛️ PARTICLE CLICKER", color: "var(--cyan)",
      src: "games/particle-clicker/index.html", author: "CERN Webfest team",
      authorUrl: "https://github.com/particle-clicker", source: "https://github.com/particle-clicker/particle-clicker",
      license: "MIT", height: 760,
      hint: "Click to collect data, hire researchers, upgrade the detector, discover particles.",
    },
    "choch": {
      name: "CHOCH", title: "🕷️ CHOCH", color: "var(--lime)",
      src: "games/choch/index.html", author: "Konstantin Guschin & lampy",
      authorUrl: "https://js13kgames.com/games/choch", source: "https://github.com/js13kGames/choch",
      license: "WTFPL", height: 640,
      hint: "You're a web crawler breaking through 18 intrusion-prevention systems. Arrows or WASD move, Enter selects, Esc opens the menu. Gamepad supported.",
    },
    "stolen-sword": {
      name: "Stolen Sword", title: "⚔️ STOLEN SWORD", color: "var(--orange)",
      src: "games/stolen-sword/index.html", author: "Ian Chiao",
      authorUrl: "https://js13kgames.com/games/stolen-sword", source: "https://github.com/js13kGames/stolen-sword",
      license: "MIT", height: 640,
      hint: "Drag to aim, release to leap and slash through the demons. Mouse or touch.",
    },
    "the-last-spartan": {
      name: "The Last Spartan", title: "🛡️ THE LAST SPARTAN", color: "var(--pink)",
      src: "games/the-last-spartan/index.html", author: "Michael Ferron",
      authorUrl: "https://js13kgames.com/games/the-last-spartan", source: "https://github.com/js13kGames/the-last-spartan",
      license: "MIT", height: 640,
      hint: "Hack-and-slash survival. WASD move, J or left-click attacks, K or right-click blocks, Space jumps, P pauses. Rest to recover.",
    },
    "fourfold": {
      name: "Fourfold", title: "🔷 FOURFOLD", color: "var(--cyan)",
      src: "games/fourfold/index.html", author: "Mohammed Saud",
      authorUrl: "https://js13kgames.com/games/fourfold", source: "https://github.com/js13kGames/fourfold",
      license: "MIT", height: 640,
      hint: "Abstract puzzle: it takes four steps to jump over a missing tile. Arrows or WASD; touch controls live in the pause menu.",
    },
    "i-want-to-google-the-game": {
      name: "I Want to Google the Game", title: "🔍 I WANT TO GOOGLE THE GAME", color: "var(--amber)",
      src: "games/i-want-to-google-the-game/index.html", author: "Mark Vasilkov",
      authorUrl: "https://github.com/mvasilkov", source: "https://github.com/js13kGames/i-want-to-google-the-game",
      license: "FAFOL (MIT-style)", height: 640,
      hint: "Pull back, then release to fling yourself past paywalls, dark patterns, and web standards. Mouse or touch.",
    },
    "highway-404": {
      name: "Highway 404", title: "🛣️ HIGHWAY 404", color: "var(--purple)",
      src: "games/highway-404/index.html", author: "Jerome Lecomte",
      authorUrl: "https://github.com/herebefrogs", source: "https://github.com/js13kGames/highway-404",
      license: "MIT", height: 640,
      hint: "Survive Canada's evilest motorway. Arrows or WASD steer; every HTTP status code on the road is a power-up or a hazard.",
    },
    "minipunk": {
      name: "Minipunk", title: "🤖 MINIPUNK", color: "var(--pink)",
      src: "games/minipunk/index.html", author: "Cody Ebberson",
      authorUrl: "https://github.com/codyebberson", source: "https://github.com/js13kGames/minipunk",
      license: "MIT", height: 640,
      hint: "3D action in a voxel city. WASD move, left-click attacks, right-click zooms, Space jumps. Try zoom + attack.",
    },
    "island-not-found": {
      name: "Island Not Found", title: "🏝️ ISLAND NOT FOUND", color: "var(--teal)",
      src: "games/island-not-found/index.html", author: "Ben Clark & Salvatore Previti",
      authorUrl: "https://github.com/SalvatorePreviti", source: "https://github.com/js13kGames/island-not-found",
      license: "MIT", height: 640,
      hint: "3D island escape. WASD move, mouse looks, Shift runs, E or Space interacts, F flashlight. Turn off High quality in the menu if it stutters.",
    },
    "404kph": {
      name: "404 KPH", title: "🏁 404 KPH", color: "var(--amber)",
      src: "games/404kph/index.html", author: "Jeremy Burns",
      authorUrl: "https://js13kgames.com/games/404kph", source: "https://github.com/js13kGames/404kph",
      license: "MIT", height: 640,
      hint: "Retro racing sim. Arrows drive, Space drifts, R restarts, G watches a replay. Export replays as text and race your friends' ghosts.",
    },
    "connection": {
      name: "Connection", title: "🔗 CONNECTION", color: "var(--cyan)",
      src: "games/connection/index.html", author: "Federico Tibaldo",
      authorUrl: "https://js13kgames.com/games/connection", source: "https://github.com/js13kGames/connection",
      license: "GPL-3.0", height: 640,
      hint: "Drag across the tiles to replicate the pattern shown, or press 'not found' when it can't be made. Mouse or touch.",
    },
    "sojuz-404": {
      name: "Soyuz 404", title: "🚀 SOYUZ 404", color: "var(--muted)",
      src: "games/sojuz-404/index.html", author: "Markus Fisch",
      authorUrl: "https://js13kgames.com/games/soyuz-404", source: "https://github.com/js13kGames/sojuz-404",
      license: "Unlicense (public domain)", height: 640,
      hint: "A point-and-click adventure aboard a secret space mission. Click to explore and click items to use them; touch works too.",
    },
    "symmetry-not-found": {
      name: "Symmetry Not Found", title: "🪞 SYMMETRY NOT FOUND", color: "var(--purple)",
      src: "games/symmetry-not-found/index.html", author: "Pim Schreurs",
      authorUrl: "https://js13kgames.com/games/symmetry-not-found", source: "https://github.com/js13kGames/symmetry-not-found",
      license: "ISC", height: 640,
      hint: "Rotate, flip, and slide the icons in the right order to build a symmetry. Casual mode removes the timer.",
    },
    "xx142-b2exe": {
      name: "xx142-b2.exe", title: "💾 XX142-B2.EXE", color: "var(--lime)",
      src: "games/xx142-b2exe/index.html", author: "Ben Clark & Salvatore Previti",
      authorUrl: "https://github.com/SalvatorePreviti", source: "https://github.com/js13kGames/xx142-b2exe",
      license: "MIT", height: 640,
      hint: "You have 13 seconds before the antivirus deletes you. WASD or arrows move; Backspace reboots. Your past runs replay as ghosts.",
    },
    "bounce-back": {
      name: "Bounce Back", title: "🪃 BOUNCE BACK", color: "var(--orange)",
      src: "games/bounce-back/index.html", author: "Frank Force",
      authorUrl: "https://github.com/KilledByAPixel", source: "https://github.com/js13kGames/bounce-back",
      license: "GPL-2.0", height: 640,
      hint: "Boomerang roguelite. WASD move, mouse aims, click throws, Space dashes. Ten levels, then speedrun mode unlocks.",
    },
    "push-back": {
      name: "Push Back", title: "🌊 PUSH BACK", color: "var(--cyan)",
      src: "games/push-back/index.html", author: "Erik Sombroek & Lomateron",
      authorUrl: "https://js13kgames.com/games/push-back", source: "https://github.com/js13kGames/push-back",
      license: "MIT", height: 640,
      hint: "Click and drag to create currents that carry the stranded boats home. Real fluid simulation.",
    },
    "the-wandering-wraith": {
      name: "The Wandering Wraith", title: "👻 THE WANDERING WRAITH", color: "var(--purple)",
      src: "games/the-wandering-wraith/index.html", author: "Mateusz Tomczyk",
      authorUrl: "https://js13kgames.com/games/the-wandering-wraith", source: "https://github.com/js13kGames/the-wandering-wraith",
      license: "MIT", height: 640,
      hint: "Side-scrolling platformer. ◂ ▸ move, Space jumps. Guide the wraith back to its grave.",
    },
    "dwarfs-there-and-back-again": {
      name: "Dwarfs: There and Back Again", title: "⛏️ DWARFS: THERE AND BACK AGAIN", color: "var(--amber)",
      src: "games/dwarfs-there-and-back-again/index.html", author: "Mark Vasilkov",
      authorUrl: "https://github.com/mvasilkov", source: "https://github.com/js13kGames/dwarfs-there-and-back-again",
      license: "MIT", height: 640,
      hint: "A tale of dwarfs, dragon gold, and ale. Follow the on-screen prompts; keyboard or mouse.",
    },
    "nano-wirebot": {
      name: "Nano Wirebot", title: "🔌 NANO WIREBOT", color: "var(--lime)",
      src: "games/nano-wirebot/index.html", author: "Mariano Lambir",
      authorUrl: "https://js13kgames.com/games/nano-wirebot", source: "https://github.com/js13kGames/nano-wirebot",
      license: "ISC", height: 640,
      hint: "Platformer: arrow keys move, and Backspace 'goes back'. Fix the wires.",
    },
    "play-back": {
      name: "Play Back", title: "📼 PLAY BACK", color: "var(--pink)",
      src: "games/play-back/index.html", author: "Chris Glover",
      authorUrl: "https://github.com/madmaw", source: "https://github.com/js13kGames/play-back",
      license: "ISC", height: 640,
      hint: "Puzzle-platformer with tapes. Arrows or A/D move, Space or J jumps, G grabs. Robots only respond to sounds from matching-color tapes.",
    },
    "onoff": {
      name: "ONOFF", title: "🔛 ONOFF", color: "var(--teal)",
      src: "games/onoff/index.html", author: "Daniel Marino & Brad Dunbar",
      authorUrl: "https://github.com/starzonmyarmz", source: "https://github.com/js13kGames/onoff",
      license: "MIT", height: 640,
      hint: "25 hand-crafted levels. Arrows move and jump; toggle between dimensions to pass spikes and pits. Gamepad supported.",
    },
    "the-matr13k": {
      name: "The Matr13k", title: "🕶️ THE MATR13K", color: "var(--lime)",
      src: "games/the-matr13k/index.html", author: "Giovanny Beltrán",
      authorUrl: "https://github.com/agar3s", source: "https://github.com/js13kGames/the-matr13k",
      license: "ISC", height: 640,
      hint: "Beat 'em up. Arrows move, S punches, D kicks, Space jumps. Watch out for Agent Smith.",
    },
    "1024-moves": {
      name: "1024 Moves", title: "🧊 1024 MOVES", color: "var(--cyan)",
      src: "games/1024-moves/index.html", author: "Brégeau",
      authorUrl: "https://js13kgames.com/games/1024-moves", source: "https://github.com/js13kGames/1024-moves",
      license: "GPL-3.0", height: 640,
      hint: "A single fiendish puzzle. The author thinks it can't be solved in fewer than 1024 moves. Keyboard or mouse.",
    },
    "spacecraft": {
      name: "Spacecraft", title: "🛰️ SPACECRAFT", color: "var(--purple)",
      src: "games/spacecraft/index.html", author: "Csaba Csecskedi",
      authorUrl: "https://js13kgames.com/games/spacecraft", source: "https://github.com/js13kGames/spacecraft",
      license: "MIT", height: 640,
      hint: "Slingshot around planets collecting data tokens. Dodge junk and asteroids or zap them with the booster. Keyboard or mouse.",
    },
    "off-the-line": {
      name: "Off the Line", title: "🪙 OFF THE LINE", color: "var(--amber)",
      src: "games/off-the-line/index.html", author: "Bryan Perfetto",
      authorUrl: "https://github.com/regularkid", source: "https://github.com/js13kGames/off-the-line",
      license: "ISC", height: 640,
      hint: "Twitchy arcade tapper. Press any key or tap to jump off the line, grab the coins, and don't hit the walls. 20 levels.",
    },
    "exo": {
      name: "Exo", title: "🪐 EXO", color: "var(--teal)",
      src: "games/exo/index.html", author: "Jack Oatley & Anton K.",
      authorUrl: "https://js13kgames.com/games/exo", source: "https://github.com/js13kGames/exo",
      license: "MIT", height: 640,
      hint: "Space tower defense. Click to build satellites and stations around orbiting planets, then survive the waves.",
    },
    "submersible-warship-2063": {
      name: "Submersible Warship 2063", title: "⚓ SUBMERSIBLE WARSHIP 2063", color: "var(--cyan)",
      src: "games/submersible-warship-2063/index.html", author: "Jerome Lecomte",
      authorUrl: "https://github.com/herebefrogs", source: "https://github.com/js13kGames/submersible-warship-2063",
      license: "MIT", height: 640,
      hint: "Arrows or WASD steer the sub, Space fires torpedoes, F toggles sonar (go dark to hide from homing torpedoes), P pauses.",
    },
    "evil-glitch": {
      name: "Evil Glitch", title: "👾 EVIL GLITCH", color: "var(--pink)",
      src: "games/evil-glitch/index.html", author: "Giovanny Beltrán",
      authorUrl: "https://github.com/agar3s", source: "https://github.com/js13kGames/evil-glitch",
      license: "ISC", height: 640,
      hint: "WebGL shoot 'em up. WASD move, mouse aims, left-click fires, right-click warps time.",
    },
    "13th-floor": {
      name: "13th Floor", title: "🚪 13TH FLOOR", color: "var(--muted)",
      src: "games/13th-floor/index.html", author: "Rob Louie",
      authorUrl: "https://github.com/roblouie", source: "https://github.com/js13kGames/13th-floor",
      license: "MIT", height: 640,
      hint: "Stealth horror. Find each room's hidden key to reach Room 1313. Mouse looks, WASD moves, F flashlight. Stay in the shadows.",
    },
    "casual-crusade": {
      name: "Casual Crusade", title: "🃏 CASUAL CRUSADE", color: "var(--amber)",
      src: "games/casual-crusade/index.html", author: "Antti Haavikko",
      authorUrl: "https://js13kgames.com/games/casual-crusade", source: "https://github.com/js13kGames/casual-crusade",
      license: "MIT", height: 640,
      hint: "Deck-building tile puzzle. Mouse or touch only: lay tiles to build a path covering every land.",
    },
    "escape-2021": {
      name: "Escape", title: "🦊 ESCAPE", color: "var(--orange)",
      src: "games/escape-2021/index.html", author: "Michał Budzyński & Stanisław Małolepszy",
      authorUrl: "https://github.com/piesku", source: "https://github.com/js13kGames/escape-2021",
      license: "ISC", height: 640,
      hint: "2.5D puzzle platformer. Arrows move, Space grabs objects. On mobile, hold to move and double-tap to grab.",
    },
    "q1k3": {
      name: "Q1K3", title: "🔫 Q1K3", color: "var(--pink)",
      src: "games/q1k3/index.html", author: "Dominic Szablewski",
      authorUrl: "https://github.com/phoboslab", source: "https://github.com/js13kGames/q1k3",
      license: "MIT", height: 640,
      hint: "A Quake homage in 13 kB. Click the game to lock the mouse; WASD move, mouse aims and fires, Space jumps, Q/E or wheel switch weapons.",
    },
    "super-castle-game": {
      name: "Super Castle Game", title: "🏰 SUPER CASTLE GAME", color: "var(--purple)",
      src: "games/super-castle-game/index.html", author: "Mark Vasilkov",
      authorUrl: "https://github.com/mvasilkov", source: "https://github.com/js13kGames/super-castle-game",
      license: "GPL-3.0", height: 640,
      hint: "Push-puzzle castle building. Arrows or WASD move, R restarts. Tap on touch screens; gamepad supported.",
    },
    "the-neatness": {
      name: "The Neatness", title: "🪦 THE NEATNESS", color: "var(--teal)",
      src: "games/the-neatness/index.html", author: "Mark Vasilkov",
      authorUrl: "https://github.com/mvasilkov", source: "https://github.com/js13kGames/the-neatness",
      license: "GPL-3.0", height: 640,
      hint: "A path-drawing puzzle. Click or tap to draw. Try the Coil levels from level select if the rest feel too easy.",
    },
    "littlejs-platformer": {
      name: "LittleJS Platformer", title: "🧗 LITTLEJS PLATFORMER", color: "var(--lime)",
      src: "games/littlejs/platformer/index.html", author: "Frank Force",
      authorUrl: "https://github.com/KilledByAPixel", source: "https://github.com/KilledByAPixel/LittleJS",
      license: "MIT", height: 640,
      hint: "Arrows or WASD move, Space or W jumps, mouse aims and clicks to shoot. Destructible terrain; gamepad and touch supported.",
    },
    "littlejs-breakout": {
      name: "LittleJS Breakout", title: "🧱 LITTLEJS BREAKOUT", color: "var(--cyan)",
      src: "games/littlejs/breakout/index.html", author: "Frank Force",
      authorUrl: "https://github.com/KilledByAPixel", source: "https://github.com/KilledByAPixel/LittleJS",
      license: "MIT", height: 640,
      hint: "Move the paddle with the mouse or touch; click to launch. A polished Breakout with particles and screen shake.",
    },
    "littlejs-puzzle": {
      name: "LittleJS Match-3", title: "🍬 LITTLEJS MATCH-3", color: "var(--pink)",
      src: "games/littlejs/puzzle/index.html", author: "Frank Force",
      authorUrl: "https://github.com/KilledByAPixel", source: "https://github.com/KilledByAPixel/LittleJS",
      license: "MIT", height: 640,
      hint: "Match-3: click a tile, then a neighbor to swap. Match three or more; R restarts. Mouse or touch.",
    },
    astray: {
      name: "Astray",
      title: "🔮 ASTRAY",
      color: "var(--purple)",
      src: "games/astray/index.html",
      author: "Rye Terrell",
      authorUrl: "https://github.com/wwwtyro",
      source: "https://github.com/wwwtyro/Astray",
      license: "Unlicense (public domain)",
      height: 640,
      hint: "Arrow keys or WASD roll the ball through a 3D maze. Each level is bigger than the last.",
    },
  };

  const key = new URLSearchParams(location.search).get("game");
  const g = GAMES[key];
  if (!g) {
    location.replace("index.html");
    return;
  }

  const titleEl = document.getElementById("title");
  const creditEl = document.getElementById("credit");
  const frame = document.getElementById("frame");
  const hintEl = document.getElementById("hint");

  document.title = g.name + " · Neon Arcade";
  titleEl.textContent = g.title;
  titleEl.style.color = g.color;
  creditEl.innerHTML =
    'By <a href="' + g.authorUrl + '">' + g.author + "</a>" +
    ' · <a href="' + g.source + '">source code</a>' +
    " · " + g.license;
  hintEl.textContent = g.hint;
  frame.style.height = g.height + "px";
  frame.title = g.name;
  frame.src = g.src;

  // Same-origin frame: hand it keyboard focus once it loads so arrow keys work immediately.
  frame.addEventListener("load", () => {
    try { frame.contentWindow.focus(); } catch (e) { /* ignore */ }
  });
})();
