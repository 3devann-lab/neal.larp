# I'm Still Not a Robot — Design Plan

> **Expanded to 150 levels.** The original 62-level plan below is kept for reference; the
> authoritative run order now lives in the `ACTS` list at the bottom of `levels.js`.
> Two original levels were changed to avoid overlapping neal.fun's game: "Draw a circle" became
> "Trace the dotted path", and "Click the duck" became "Click the frog".

## Challenge types (reusable, one file each in `/challenges`)

| Type | What it does |
|---|---|
| `checkbox` | Classic "I'm not a robot" box, spinner → checkmark. Variants: multiple boxes, misplaced box, click-count. |
| `grid` | N×M tile selection (SVG/emoji art). Variants: inverted, shuffling tiles, sequence/memory, "any answer". |
| `text` | Distorted/mirrored text entry. Variants: key-shifting keyboard, sabotaging autocorrect, free text. |
| `slider` | Drag a handle to a target. Variants: reversed, puzzle-piece, free answer. |
| `drag` | Drag-and-drop into slots (pointer events, works with touch). Variants: rotate tiles, free ordering, builder. |
| `timed` | Timing & reflex: click on green, click to a beat, moving targets, "do nothing for N seconds". |
| `draw` | Canvas drawing (mouse/touch). Variants: shape check (circle), free drawing, robot auto-draws. |
| `audio` | Web Audio / speech synthesis. Type what you hear, pick a sound. Always has a visual fallback. |
| `choice` | Multiple choice, incl. Stroop colors, branching dialogue, "no wrong answer". |
| `hold` | Press-and-hold. Variants: exact duration, any duration, heartbeat. |
| `sensor` | Optional webcam (motion). Only after a permission prompt, always skippable, with an "I don't have a webcam" alternative challenge. |
| `scripted` | Escape hatch for one-off UI gags (runaway button, fake loading, crash dialog, settings panel). |

Each level in `levels.js` is `{ id, act, type, prompt, config, validate, hint }`.

## Levels

### Act 1 — Normal-ish (1–12)
1. **checkbox** — "I'm not a robot." The classic. Spinner, check, done.
2. **grid** — "Select all squares with bicycles." 3×3 SVG drawings.
3. **text** — Type the wavy distorted characters.
4. **grid** — "Select all squares with a fire hydrant." One big hydrant spread across a 4×4 grid.
5. **slider** — Slide the puzzle piece into its gap.
6. **text** — The text is perfectly readable. "Too easy? That's what a robot would think."
7. **grid** — "Select all squares with cones." Traffic cones, ice cream cones and pine cones all count.
8. **audio** — Play a clip and type the digits you hear (speech synthesis, with a visual fallback).
9. **grid** — "Select all squares with a sandwich." A hot dog and a taco are in there; any stance is accepted, but it judges you.
10. **drag** — Drag each sock to its matching pair.
11. **hold** — Hold the button for exactly 3 seconds (±0.25 s).
12. **checkbox** — Nine checkboxes: "I'm not a rabbit", "I'm a robot", "I'm not not a robot"… tick the right one.

### Act 2 — Rule-bending (13–25)
13. **grid** — "Select all squares WITHOUT a cat."
14. **timed** — "Do NOT click the checkbox." Survive 5 seconds while it begs you to.
15. **timed** — "Click the duck." It paddles around the widget and gets faster on every miss.
16. **timed** — "Click when the light turns green." It flickers yellow to bait you.
17. **text** — Type "yes", but every key types the next letter of the alphabet (the answer is "xdr").
18. **grid** — "Select all stop signs." The tiles shuffle every 2 seconds, and your selections move with them.
19. **slider** — "Set the slider to 100%." It moves the opposite way from your drag.
20. **drag** — Spell HUMAN with letter tiles. Some tiles are rotated; tap to turn them.
21. **choice** — Stroop test: "Click the word written in RED ink." The words lie about their colors.
22. **timed** — Catch 5 falling checkmarks and avoid the ✗s.
23. **draw** — "Draw a circle." Checks that it's closed and round enough.
24. **timed** — Tap the checkbox on the beat, 4 beats in a row.
25. **grid** — Simon-style memory: repeat the order the squares light up (5 steps).

### Act 3 — Meta (26–38)
26. **choice** — "How did you hear about this CAPTCHA?" A survey with absurd options. Every answer passes.
27. **scripted** — "Click Verify." The button runs away. Corner it, use the keyboard, or wear it out (it gets tired).
28. **scripted** — A fake "Verifying…" bar stalls at 99%. Drag the last 1% yourself.
29. **text** — The whole widget is upside down, and so is the text you have to type.
30. **scripted** — The checkbox fell out of the widget. Find it hidden somewhere on the page.
31. **text** — Type "I am not a robot." Autocorrect keeps deleting "not". Find a workaround (the hint explains how).
32. **scripted** — Scroll through Terms of Service, then answer a question about something buried in them.
33. **scripted** — A "Widget has stopped responding" dialog. Close doesn't help. Turn it off and on again with the tiny power switch.
34. **choice** — Interrogation: "Have you ever been a robot?" A lie-detector needle tied to the Suspicion Meter. Three questions, every path passes.
35. **drag** — The blue instruction bar has fallen to the bottom, crumpled. Drag it back up to read the actual task (a grid).
36. **sensor** — "Wave at the camera" (webcam motion detection, only after permission). An **"I don't have a webcam"** button swaps in a different challenge: wave your cursor/finger back and forth across the widget 5 times. The same fallback kicks in automatically if no camera is found or permission is denied. "I'd rather not" also passes ("A robot would have said yes.").
37. **scripted** — A settings panel full of double-negative toggles ("Disable non-human bypass: OFF"). Get the right combination.
38. **scripted** — Glitch remix: pieces of earlier levels are jumbled together. Check the box, slide the slider and click the duck within 15 s.

### Act 4 — Existential (39–51)
39. **choice** — "Prove you have feelings." Pick a mood. All accepted, with a tailored reply.
40. **draw** — "Draw how you feel." Anything passes. It confidently misreads it ("This is a potato. Valid.").
41. **grid** — "Select all squares containing a memory." Any selection of at least one passes.
42. **choice** — "You may keep one memory." Your pick is saved and comes back in the finale.
43. **slider** — "How human do you feel today?" Every value passes, and each gets its own reply.
44. **text** — "Describe the color blue to someone who has never seen it." Any 3+ words.
45. **hold** — "Hold as long as you like. Let go when you're ready." Calm text builds the longer you hold.
46. **choice** — "A CAPTCHA and a cookie banner are both stuck in a puddle. Help one." Both pass.
47. **timed** — "Wait." 15 seconds of nothing. Clicking resets the timer ("Patience is very human").
48. **grid** — "Select all squares that are you." Abstract portraits. Anything passes; selecting all: "You contain multitudes."
49. **audio** — "Which sound is the saddest?" Three synthesized chords. No wrong answer.
50. **drag** — Rank Sleep, Snacks, Love, Wi-Fi and Being Verified. Any order passes, and it comments on your #1.
51. **choice** — "Is this the last question?" Yes / No / I don't know loops three times, then lets you through. The CAPTCHA starts doubting itself.

### Act 5 — Finale (52–62)
52. **grid** — "Select all squares with… me?" The tiles are tiny copies of the widget itself.
53. **text** — "Please type: I am a robot." Whatever you type, it replies: "…wait. I typed that. Not you."
54. **choice** — The confession: "I have something to tell you. I'm a robot." Your reaction shapes the ending text.
55. **choice** — "Could you verify ME?" Pick which kind of challenge to give it.
56. **drag** — Design a CAPTCHA: drag emoji into a 3×3 grid and choose the target ("Select all squares with ___").
57. **scripted** — The robot tries your CAPTCHA with an animated cursor and makes believable mistakes. Press Pass or Fail.
58. **draw** — The robot draws "how it feels" on its own. Decide whether that counts.
59. **choice** — The robot asks about the memory you kept in level 42, shows it back to you, and asks to keep a copy.
60. **slider** — The robot's hand shakes on a slider. Steady it by dragging alongside.
61. **hold** — Its checkbox says "I'm not a human." Hold to check it for them, with a heartbeat.
62. **checkbox** — One last "I'm not a robot" box, now signed by both of you. Then credits roll, followed by the share card.

### Secret levels (unlocked by easter eggs)
- **S1 "Overclicked"**: click the level-1 checkbox 50 times. Every square is a robot. Select none.
- **S2 "Binary"**: type `beepboop` on the level-select screen. Flip 8 bits to make 42.
- **S3 "Fine Print"**: click the footer "Privacy" link 5 times. Reject 12 cookies before they reach the jar.
- **S4 "Upside Up"**: arrow keys ↑↑↓↓ (or swipe the header down twice on mobile). Gravity pulls the UI down. Catch the checkbox.
- **S5 "Encore"**: tap the robot in the credits 10 times. A bonus round where the robot gives *you* a CAPTCHA it designed.

## Systems
- **Robot Suspicion Meter** (0–100): +12 per mistake, −4 per clear. Four tones: Friendly → Curious → Suspicious (terse, adds "…human?") → Alarmed (sarcastic, red tint).
- **Achievements (15):** Clickaholic (50 checkbox clicks), Flawless Act, Maximum Suspicion, Speedrunner (<15 min), Patience of a Human (60 s hold on L45), Camera Shy (skipped L36), Cornered (caught the runaway button by pointer), No Hints Needed, Philosopher (3× "I don't know" on L51), Secret Agent (1 secret), Completionist (all secrets), Robot Whisperer (passed the robot), Tough Grader (failed the robot), Night Owl (played 00:00–05:00), Not a Robot (Probably) (finished).
- `localStorage` save: cleared levels, current level, run timer, mistakes, achievements, secrets, mute, kept memory.
- Level select (cleared levels only), run timer, share card (canvas → PNG download + copy text), WebAudio sound effects with a mute toggle, hint button after 3 fails, `?level=N` / `?level=S1` debug jump.

## Tech
- Vanilla HTML/CSS/JS as **classic scripts** (no ES modules), so `index.html` works straight from `file://`.
- `npm run dev` runs a zero-dependency Node static server.
- All art is inline SVG, CSS or emoji. No external images, so `CREDITS.md` only covers fonts and code (the font is the system stack, so no downloads).


## Expansion to 150 levels (88 new)
Act sizes: I 25 · II 35 · III 35 · IV 30 · V 25. New levels by act:

- **Act I:** rotate the photo, count the bicycles, memory pairs, things that fly, connect-the-dots star,
  stop the stopwatch at 5.00 s, swap jigsaw, round things (the stop sign is an octagon), whack the robots,
  set the clock, cup shuffle, mix CAPTCHA blue, sort food / not food.
- **Act II (arcade):** Checkbox Dash 1–4 (spikes, gaps & orbs, gravity flips, flight), snake, breakout,
  paper-plane glider, lights-out, dodge pop-ups, pong vs. robot, pipes, road crossing, stacker, colour code
  breaker, no-touch maze, darts, mini golf, Tower of Hanoi, lander, spam shooter, typing defence, rhythm.
- **Act III (meta):** pop-up cascade, 25 clicks in 6 s, catch the loading bits, Checkbox Dash mirrored,
  which cursor is yours, close the other tabs, sneaky installer, nested CAPTCHAs, lagging maze, break the
  widget, volume knob to 37, whack the errors, snake vs. cookie banners, block the ads, reconnect the wires,
  PIN code breaker, silence the notifications, tower of checkmarks, fly the Verify button, theme-song rhythm,
  "which instruction is real?", Checkbox Dash ERROR EDITION.
- **Act IV (gentle):** breathing, mirror drawing, memory jigsaw, watering, mood colour, cloud shapes, kite,
  skipping stones, balance, Checkbox Dash sunset run (no death), fishing, letting worries go,
  constellation, shooting stars, feeling pairs, small tower, note to future you.
- **Act V (with the robot):** teach it what a cat is, repair it, its quiz about your journey, program its
  route, duet rhythm, co-op pong, reconnect its heart, light its memory banks, shield it from spam, build it
  a tower, Checkbox Dash duo, The Final Dash, sign the certificate, "will you come back?".
