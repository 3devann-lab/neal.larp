# I'm Still Not a Robot

A sequel-style browser game made of increasingly absurd CAPTCHA challenges.
62 levels in 5 acts, 5 secret levels, 15 achievements and a twist ending.
Vanilla HTML/CSS/JS, no build step, no dependencies, no backend.

## Play
- **Just open `index.html`** in a browser, or
- `npm run dev` and visit http://localhost:5173/

Works with mouse, touch and keyboard. Progress is saved in `localStorage`.

## Features
- 62 levels across 5 acts: Normal-ish → Rule-bending → Meta → Existential → Finale, plus credits.
- 12 reusable challenge types in `/challenges`: checkbox, grid, text, slider, drag, timed, draw,
  audio, choice, hold, sensor (optional webcam, with an "I don't have a webcam" alternative) and scripted.
- Robot Suspicion Meter: mistakes raise it and change the tone of the copy (and the colour of the page).
- 15 achievements, 5 secret levels behind easter eggs.
- Run timer, level select for cleared levels, share card (PNG + copyable text).
- Hint button unlocks after 3 failed attempts on a level.
- Synthesized sound effects with a mute toggle.

## Debug
- `?level=N` jumps straight to level N (e.g. `index.html?level=31`); secret levels use `?level=S1`.
- `?reset` wipes saved progress.
- `window.ISNAR` in the console exposes `state`, `startLevel(id)`, `showCredits()`, `unlockSecret(id)`.

## Layout
```
index.html      page shell + widget slot
style.css       all styles
main.js         engine: save/load, HUD, pass/fail, suspicion meter, achievements,
                secrets, hints, timer, menus, credits, share card
levels.js       level data: { id, act, type, prompt, config, validate, hint }
challenges/     one reusable challenge type per file
assets/art.js   original SVG illustrations (drawn in code)
scripts/        zero-dependency dev server
```

## Adding a level
Add an object to the `LEVELS` array in `levels.js`; the main run follows array order.
`validate(answer, ctx)` returns `true`, `false`, or `{ ok, msg }` (`ctx` has `state` and `api`).
Each challenge file documents its `config` options and answer shape at the top.

## Secrets (spoilers)
<details><summary>How to unlock the secret levels</summary>

- **S1 Overclicked**: click checkboxes 50 times in total (spam the level-1 spinner).
- **S2 Binary**: type `beepboop` while the menu is open (or tap the "Secrets" heading 8 times).
- **S3 Fine Print**: click the "Privacy" link 5 times.
- **S4 Upside Up**: press ↑ ↑ ↓ ↓ (or swipe down twice near the top on mobile).
- **S5 Encore**: tap the robot 10 times on the credits screen.
</details>
