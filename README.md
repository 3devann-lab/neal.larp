# I'm Still Not a Robot

A sequel-style browser game made of increasingly absurd CAPTCHA challenges.
Vanilla HTML/CSS/JS, no build step, no dependencies, no backend.

## Play
- **Just open `index.html`** in a browser, or
- `npm run dev` and visit http://localhost:5173/

## Debug
- `?level=N` jumps straight to level N (e.g. `index.html?level=7`); secret levels use `?level=S1`.
- `?reset` wipes saved progress.
- `window.ISNAR` in the console exposes state and `startLevel(id)`.

## Layout
```
index.html      page shell + widget slot
style.css       all styles
main.js         engine: save/load, HUD, pass/fail, suspicion meter, achievements, hints, timer, menus
levels.js       level data: { id, act, type, prompt, config, validate, hint }
challenges/     one reusable challenge type per file (checkbox, grid, text, slider, audio, drag, …)
assets/art.js   original SVG illustrations
scripts/        zero-dependency dev server
```

## Adding a level
Add an object to the `LEVELS` array in `levels.js`. The main run follows array order.
`validate(answer, ctx)` returns `true`, `false`, or `{ ok, msg }`.
See `PLAN.md` for the full level list.
