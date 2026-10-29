You are building a recruiter-facing browser game in THIS folder.

## Identity and git
- git config user.name "Oscar Munoz"
- git config user.email "oscarxxi@gmail.com"
- Public GitHub under oscarmmi. Push `main`.
- Enable GitHub Pages from the Pages workflow that deploys `dist/` on every main push.
- Vite `base` must match the repo name: `/<repo>/`.
- After push, `gh repo edit --description` and `--add-topic` (include `game`, `vue`, `typescript`, plus the game name).
- The first commit must include the runnable Vite project: `package.json`, `package-lock.json`, `vite.config.ts`, tsconfigs, `src/main.ts`, `index.html`, `.gitignore`, and `.github/workflows/pages.yml`. Use `git add -A`.

## Stack
- Vite + Vue 3 + TypeScript. Do not add Laravel, PHP, Redis, or a backend.
- All source and README in English.
- Vitest for game-logic tests (not only UI).
- No Impeccable. No NewPortfolio edits.

## Quality bar
- Looks like a finished product, not a Vite starter: custom palette, typography, spacing, motion.
- Playable on desktop and a 390px phone.
- Keyboard and pointer/touch.
- README: how to play, how to run, mermaid of the game loop, GitHub Pages URL.
- Original rink art. No licensed logos.

When tests pass and Pages is configured, commit, create the public repo, push, print the URL, stop.
