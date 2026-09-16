# Sounds

These MP3s and the manifest `../sounds.json` come from V9o9's Online Soundboard
(https://github.com/v9o9/soundboard), licensed under the Apache License 2.0; see
`LICENSE` in this folder. The soundboard page itself is `../../soundboard.html` with
its loader in `../soundboard.js`, a port of the upstream `loader.js`.

Changes from the original (Apache-2.0 asks that modifications be noted):

- The files moved from `sounds/` to `assets/sounds/` and the manifest to
  `assets/sounds.json`. Paths inside the manifest are unchanged; the loader resolves
  them relative to the manifest.
- The "Nope" entry's misspelled `colr` key was fixed to `color`.
- The "Za worldo timestop" entry was removed: its file (`zaworldo.mp3`) is not in the
  upstream repository, so the button was dead there too.
- The loader was rewritten to fit the arcade's styles, with a playing state on the
  buttons and Esc as a shortcut for Stop Everything.

The clips are short excerpts of games, shows, songs and memes collected by the upstream
project; they belong to their respective owners.
