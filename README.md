# I'm Still Not a Robot

A sequel-style browser game made of increasingly absurd CAPTCHA challenges.
150 levels in 5 acts (with dozens of arcade minigames and puzzles), 5 secret levels,
15 achievements and a twist ending.
Vanilla HTML/CSS/JS, no build step, no dependencies, no backend.

## Play
- **Just open `index.html`** in a browser, or
- `npm run dev` and visit http://localhost:5173/

Works with mouse, touch and keyboard. Progress is saved in `localStorage`.

## Features
- 150 levels across 5 acts: Normal-ish (25) → Rule-bending (35) → Meta (35) → Existential (30) → Finale (25), plus credits.
- 14 reusable challenge types in `/challenges`: checkbox, grid, text, slider, drag, timed, draw,
  audio, choice, hold, sensor (optional webcam, with an "I don't have a webcam" alternative), scripted,
  **arcade** and **puzzle**.
- Arcade minigames (canvas, mouse/touch/keyboard): *Checkbox Dash* (an auto-runner with gravity flips,
  flight, orbs, checkpoints and a two-lane co-op mode), snake, breakout, glider, dodge, pong (vs. and co-op),
  road crossing, stacker, no-touch maze, darts, mini golf, lander, 3-lane rhythm, spam shooter, whack-a-bot,
  balance beam and timing meters.
- Puzzles & gags: rotate, count, connect-the-dots, swap jigsaw, memory pairs, cup shuffle, colour mixer,
  clock, lights-out, pipes, code breaker, Tower of Hanoi, typing defence, robot programming, constellations,
  pop-up cascade, browser tabs, sneaky installer, nested CAPTCHAs, fake cursors and a volume knob.
- Robot Suspicion Meter: mistakes raise it and change the tone of the copy (and the colour of the page).
- 15 achievements, 5 secret levels behind easter eggs.
- Run timer, level select for cleared levels, share card (PNG + copyable text).
- Hint button unlocks after 3 failed attempts on a level.
- Synthesized sound effects with a mute toggle.

## Escape the Library
Level 46 embeds Mrs. C's Library from the DOORS mode of
[3devann-lab/random-game](https://github.com/3devann-lab/random-game) (copied to `assets/games/library/`).
It opens straight into the library with a single START GAME button (and full screen), on LOW graphics by default; the admin panel is
disabled and escaping through the library's exit door verifies you. It loads three.js from a CDN, so it
needs an internet connection.

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
assets/photos/  public-domain / CC0 photos (sources and licenses in CREDITS.md)
assets/art.js   photo helper + the few original SVGs (logo, mini widgets, robots, socks)
scripts/        zero-dependency dev server
```

## Adding a level
Add an object with a unique `key` to the `LEVELS` array in `levels.js`, then put its key in the
`ACTS` run order at the bottom of that file. Ids and acts are assigned from that order.
`?level=<key>` also works (e.g. `?level=dash1`).
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
