# 🕹️ Neon Arcade

A game website — four classic browser games built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies.

## Games

| Game | Controls |
|------|----------|
| 🐍 **Snake** | Arrow keys / WASD, swipe on mobile. P or Space pauses. |
| 🧱 **Breakout** | Mouse, touch, or arrow keys. Click or Space launches the ball. |
| 🃏 **Memory Match** | Click or tap to flip cards. |
| 🔢 **2048** | Arrow keys / WASD, swipe on mobile. |

High scores are saved per game in your browser's localStorage — nothing leaves your machine.

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
