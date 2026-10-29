Build air hockey in THIS folder: C:\xampp\htdocs\air-hockey

A recruiter-ready browser air hockey. Playable, polished, no backend.

## Game
- Call it "Neon Rink". Original paddles and puck, no licensed branding.
- Vertical table. Player paddle on the bottom half, CPU paddle on the top half. Puck bounces off walls and paddles. A puck crossing a goal line scores. First to 7 wins the match.
- Pointer/touch drag the player paddle (clamp to the bottom half). Keyboard: arrows / A D move horizontally. R restarts.
- CPU tracks the puck with a small lag so a human can score. Local wins in localStorage.

## UI
- Dark rink, neon center line, glowing puck. Not a default Vite page. No Vue logo.
- 390px phone and 1280px desktop.

## Tests
- Vitest (pure logic): a puck crossing the top goal increments player score; crossing the bottom increments CPU; a paddle is clamped to its half; first to 7 is a match win.
- `npm test` and `npm run build` must pass.

## GitHub
- Repo: https://github.com/oscarmmi/air-hockey
- Pages: https://oscarmmi.github.io/air-hockey/
- vite base `/air-hockey/`
- Commit: feat: add air hockey
- First commit must `git add -A` so package.json, vite.config.ts, tsconfigs, src/main.ts, index.html, .gitignore, and .github/workflows/pages.yml ship with the game.
- gh repo edit --description "Neon Rink air hockey in Vue 3 + TypeScript, playable on GitHub Pages." --add-topic vue --add-topic typescript --add-topic game --add-topic air-hockey --add-topic arcade
- Stop. Print the repo URL and Pages URL.
