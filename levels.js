/* I'm Still Not a Robot — level data.
 *
 * Each level: { id, act, type, prompt, config, validate, hint }
 *   id        number for the main run, 'S1'… for secret levels (+ secret: true)
 *   act       1–5
 *   type      key in window.Challenges (see /challenges)
 *   prompt    string, or { small, big, sub } for the blue header
 *   config    passed to the challenge
 *   validate  (answer, ctx) => true | false | { ok, msg }
 *             msg on success is shown under the widget; on failure it
 *             replaces the default (tone-dependent) error text.
 *   hint      shown after 3 failed attempts
 *
 * Reorder or add levels freely: the main run is simply this array's order.
 */
(function () {
  'use strict';
  const { norm } = U;

  /** Grid helper: every `need` tile selected, nothing outside need ∪ optional. */
  function gridCheck(ans, need, optional = [], msgs = {}) {
    const missed = ans.tiles.some((t) => need.includes(t.tag) && !t.selected);
    const wrong = ans.tiles.some((t) => t.selected && !need.includes(t.tag) && !optional.includes(t.tag));
    if (!ans.selected.length) return { ok: false, msg: msgs.none || 'There is definitely at least one. Look again.' };
    if (wrong) return { ok: false, msg: msgs.wrong || "At least one of those isn't what we asked for." };
    if (missed) return { ok: false, msg: msgs.missed || 'You missed one. Look closer.' };
    return { ok: true };
  }

  const LEVELS = [
    // ===================== ACT 1 — Normal-ish =====================
    {
      id: 1, act: 1, type: 'checkbox',
      prompt: "I'm not a robot",
      config: {
        spin: 1100,
        impatient: [
          "Clicking again doesn't make it go faster.",
          'Each click restarts the check. Just so you know.',
          'Please stop.',
          "I'm starting over every time. Every. Time.",
          'Is this a test? Are YOU testing ME?',
          '...fine. Keep going. See what happens.',
        ],
      },
      validate: (a) => a === true,
      hint: 'Click the box once and wait. Patience is a very human trait.',
    },
    {
      id: 2, act: 1, type: 'grid',
      prompt: { small: 'Select all squares with', big: 'bicycles', sub: 'Click verify once there are none left.' },
      config: {
        cols: 3,
        tiles: [
          { art: 'bicycle', tag: 'bike', opts: { color: '#e53935' } },
          { art: 'bicycle', tag: 'bike', opts: { color: '#1e88e5' } },
          { art: 'bicycle', tag: 'bike', opts: { color: '#43a047' } },
          { art: 'car', opts: { color: '#8e24aa' } },
          { art: 'tree' },
          { art: 'house' },
          { art: 'bench' },
          { art: 'lamp' },
          { art: 'cloud' },
        ],
      },
      validate: (a) => gridCheck(a, ['bike']),
      hint: 'There are three bicycles. Two wheels, a seat and handlebars.',
    },
    {
      id: 3, act: 1, type: 'text',
      prompt: { small: 'Type the characters', big: 'you see below', sub: 'Not case sensitive. Mercifully.' },
      config: { render: 'distort', length: 6 },
      validate: (a) => ({ ok: norm(a.typed).replace(/\s/g, '') === a.expected, msg: 'Close, but no. Here is a fresh one.' }),
      hint: 'Only lowercase letters and the digits 2–9 are used. No "l", "o", "1" or "0". Use ⟳ for a new one.',
    },
    {
      id: 4, act: 1, type: 'grid',
      prompt: { small: 'Select all squares with', big: 'a fire hydrant', sub: 'If there are none, click skip.' },
      config: {
        cols: 4, split: 'hydrantScene', resetOnFail: false,
        // body occupies columns 1–2 in every row; the side nozzles barely reach into row 1, columns 0 and 3
        splitTags: { 1: 'h', 2: 'h', 5: 'h', 6: 'h', 9: 'h', 10: 'h', 13: 'h', 14: 'h', 4: 'edge', 7: 'edge' },
      },
      validate: (a) => {
        const r = gridCheck(a, ['h'], ['edge']);
        if (!r.ok) return r;
        const edges = a.tiles.filter((t) => t.tag === 'edge' && t.selected).length;
        return { ok: true, msg: edges ? 'You even got the little nozzle tips. Thorough.' : 'You skipped the nozzle tips. Also valid. Philosophically.' };
      },
      hint: 'The hydrant is two columns wide and runs from the very top row to the bottom row.',
    },
    {
      id: 5, act: 1, type: 'slider',
      prompt: { small: 'Drag the slider to', big: 'fit the puzzle piece', sub: 'Line it up with the dark gap.' },
      config: { mode: 'puzzle' },
      validate: (a) => ({ ok: Math.abs(a.x - a.gapX) <= 6, msg: Math.abs(a.x - a.gapX) <= 18 ? 'So close. Pixels matter.' : 'The gap is somewhere else.' }),
      hint: 'Let go when the piece sits exactly on top of the dark gap. You can also focus the handle and use the arrow keys, then press Enter.',
    },
    {
      id: 6, act: 1, type: 'text',
      prompt: { small: 'Type the text', big: 'shown below', sub: 'Take your time.' },
      config: { render: 'plain', word: 'trust me', placeholder: 'Type it exactly' },
      validate: (a) => norm(a.typed) === 'trust me'
        ? { ok: true, msg: "Too easy? That's exactly what a robot would think. ...Fine. You pass." }
        : { ok: false, msg: 'It was right there. In plain letters.' },
      hint: 'Type the two words exactly as shown: trust me',
    },
    {
      id: 7, act: 1, type: 'grid',
      prompt: { small: 'Select all squares with', big: 'cones', sub: 'All of them.' },
      config: {
        cols: 4,
        tiles: [
          { art: 'trafficCone', tag: 'cone', opts: { v: 0 } },
          { art: 'trafficCone', tag: 'cone', opts: { v: 2 } },
          { art: 'iceCream', tag: 'cone', opts: { color: '#ff9ec4' } },
          { art: 'iceCream', tag: 'cone', opts: { color: '#9be3c4', bg: '#e8f6ff' } },
          { art: 'pineCone', tag: 'cone' },
          { art: 'pineCone', tag: 'cone' },
          { art: 'partyHat', tag: 'hat' },
          { art: 'tree' }, { art: 'car', opts: { color: '#f9a825' } }, { art: 'bench' }, { art: 'ball' },
          { art: 'house', opts: { color: '#cfe0f5', roof: '#5a6b8c' } }, { art: 'cloud' }, { art: 'lamp' },
          { art: 'bicycle', opts: { color: '#6d4c41' } }, { art: 'cat' },
        ],
      },
      validate: (a) => {
        const r = gridCheck(a, ['cone'], ['hat'], { missed: 'There are more cones. Not all of them are on the road.' });
        if (!r.ok) return r;
        return { ok: true, msg: a.selected.includes('hat') ? 'A party hat is technically a cone. Pedantic. Correct.' : 'Traffic, ice cream and pine. A true cone connoisseur.' };
      },
      hint: 'Cones come in three flavours here: traffic cones, ice cream cones and pine cones. The party hat is up to you.',
    },
    {
      id: 8, act: 1, type: 'audio',
      prompt: { small: 'Press play and', big: 'type the digits', sub: 'Turn your sound on. Or read them, we won\'t tell.' },
      config: { mode: 'digits', length: 5 },
      validate: (a) => ({ ok: a.typed.replace(/\D/g, '') === a.expected, msg: "Those weren't the digits. Here are new ones." }),
      hint: 'Tap "Can\'t play audio? Read it instead" to see the digits written as words.',
    },
    {
      id: 9, act: 1, type: 'grid',
      prompt: { small: 'Select all squares with', big: 'a sandwich', sub: 'Use your best judgement.' },
      config: {
        cols: 3,
        tiles: [
          { art: 'sandwich', tag: 'sandwich' }, { art: 'sub', tag: 'sandwich' },
          { art: 'burger', tag: 'burger' }, { art: 'hotdog', tag: 'hotdog' }, { art: 'taco', tag: 'taco' },
          { art: 'bicycle', opts: { color: '#ff7043' } }, { art: 'tree' }, { art: 'cat', opts: { color: '#9e9e9e' } }, { art: 'ball', opts: { color: '#42a5f5' } },
        ],
      },
      validate: (a) => {
        const r = gridCheck(a, ['sandwich'], ['burger', 'hotdog', 'taco'], {
          missed: 'You missed an obvious sandwich. The debatable ones are optional.',
          wrong: "Whatever you think a sandwich is, that isn't it.",
        });
        if (!r.ok) return r;
        const extra = ['burger', 'hotdog', 'taco'].filter((t) => a.selected.includes(t));
        let msg;
        if (extra.length === 0) msg = 'A sandwich purist. The Bread Council salutes you.';
        else if (extra.length === 3) msg = 'Burger, hot dog AND taco? To you, everything is a sandwich. Bold. Accepted.';
        else if (extra.includes('taco')) msg = 'A taco is a sandwich to you. This has been noted in your permanent file.';
        else if (extra.includes('hotdog')) msg = 'Hot dog = sandwich. A controversial stance. We respect it.';
        else msg = 'Burger counts, apparently. Reasonable. Suspiciously reasonable.';
        return { ok: true, msg };
      },
      hint: 'The two obvious sandwiches are required. Burger, hot dog and taco are your call.',
    },
    {
      id: 10, act: 1, type: 'drag',
      prompt: { small: 'Drag each sock to', big: 'its matching pair', sub: 'Laundry is a uniquely human struggle.' },
      config: {
        mode: 'pairs', targetLabel: 'Lonely socks', trayLabel: 'Found in the dryer',
        items: [
          { id: 'red', art: 'sock', opts: { pattern: 'stripes', color: '#e53935' } },
          { id: 'blue', art: 'sock', opts: { pattern: 'stripes', color: '#1e88e5' } },
          { id: 'dots', art: 'sock', opts: { pattern: 'dots', color: '#2e7d32', base: '#e8f5e9' } },
          { id: 'zig', art: 'sock', opts: { pattern: 'zigzag', color: '#8e24aa', base: '#f3e5f5' } },
        ],
        wrongMsg: 'Those socks are not a couple.',
      },
      validate: (a) => ({ ok: !!a.done, msg: 'Every sock reunited. A rare and beautiful thing.' }),
      hint: 'Look at the stripe colors: red with red, blue with blue. Dots with dots, zigzag with zigzag.',
    },
    {
      id: 11, act: 1, type: 'hold',
      prompt: { small: 'Hold the button for', big: 'exactly 3 seconds', sub: 'Give or take a quarter. The counter gets shy.' },
      config: { mode: 'exact', target: 3, label: 'Hold', fadeAfter: 1 },
      validate: (a) => {
        const d = a.held - 3;
        if (Math.abs(d) <= 0.25) return { ok: true, msg: `${a.held.toFixed(2)} seconds. Your internal clock is suspiciously good. Human, though.` };
        return { ok: false, msg: `You held for ${a.held.toFixed(2)} s. ${d < 0 ? 'A bit longer.' : 'A bit shorter.'}` };
      },
      hint: 'Count "one-Mississippi, two-Mississippi, three-Mississippi" and let go right on "three". Anything from 2.75 s to 3.25 s counts.',
    },
    {
      id: 12, act: 1, type: 'checkbox',
      prompt: { small: 'Tick the box that says', big: "I'm not a robot", sub: 'Only one of these is real. Read carefully.' },
      config: {
        mode: 'multi', answer: "I'm not a robot",
        options: ["I'm not a rabbit", "I'm a robot", "I'm not not a robot", "I'm not a robot", "I'm not a r0bot", "I'm knot a robot", "I'm not a robot (yet)", "I'm not a toaster", "I am robot"],
      },
      validate: (a) => {
        if (a.label === "I'm not a robot") return { ok: true, msg: 'The real one. Act I complete. From here on, the rules get… flexible.' };
        const roasts = {
          "I'm not a rabbit": 'Rabbits are welcome. This just isn\'t the place.',
          "I'm a robot": 'Well. Thank you for your honesty.',
          "I'm not not a robot": 'Two nots make a robot. Try again.',
          "I'm not a r0bot": "That's a zero. Zeros are very robot.",
          "I'm knot a robot": "You're a knot? Untie yourself and try again.",
          "I'm not a robot (yet)": 'The "(yet)" is doing a lot of work there.',
          "I'm not a toaster": 'True, probably. Also not the question.',
          'I am robot': 'Beep. Boop. Wrong box.',
        };
        return { ok: false, msg: roasts[a.label] || 'Not that one.' };
      },
      hint: 'Exact words, no extras: I’m not a robot.',
    },

    // ===================== ACT 2 — Rule-bending =====================
    {
      id: 13, act: 2, type: 'grid',
      prompt: { small: 'Select all squares', big: 'WITHOUT a cat', sub: 'Read that again.' },
      config: {
        cols: 3,
        tiles: [
          { art: 'cat', tag: 'cat', opts: { color: '#ff9f43' } }, { art: 'cat', tag: 'cat', opts: { color: '#5d5d5d' } },
          { art: 'cat', tag: 'cat', opts: { color: '#f5f5f5' } }, { art: 'cat', tag: 'cat', opts: { color: '#c58b4f' } },
          { art: 'tree', tag: 'x' }, { art: 'car', tag: 'x', opts: { color: '#26a69a' } }, { art: 'bench', tag: 'x' },
          { art: 'ball', tag: 'x' }, { art: 'house', tag: 'x' },
        ],
      },
      validate: (a) => gridCheck(a, ['x'], [], { wrong: 'That one has a cat in it. The cat is offended.', missed: 'You missed a cat-free square.', none: 'Nothing? There are plenty of squares without cats.' }),
      hint: 'Select everything that is NOT a cat: 5 squares.',
    },
    {
      id: 14, act: 2, type: 'timed',
      prompt: { small: 'Whatever happens,', big: 'do NOT click the checkbox', sub: 'For 6 seconds.' },
      config: {
        mode: 'dontClick', duration: 6,
        lines: ['Hi. Click me.', 'Just a tiny click?', 'Everyone else clicked.', "I'll give you a cookie. 🍪", 'Please. I was made for this.', 'Fine. FINE.'],
      },
      validate: () => ({ ok: true, msg: 'You resisted. Robots follow instructions; humans follow… the correct instructions. Somehow.' }),
      hint: 'Do nothing at all. Literally. Keep your hands off it for 6 seconds.',
    },
    {
      id: 15, act: 2, type: 'timed',
      prompt: { small: 'Click', big: 'the duck', sub: 'It gets faster every time you miss.' },
      config: { mode: 'moving', speed: 26 },
      validate: () => ({ ok: true, msg: 'Duck acquired. It is fine. It wanted you to win.' }),
      hint: 'Aim slightly ahead of where it is swimming, or wait for it to bounce off a wall and click where it will be.',
    },
    {
      id: 16, act: 2, type: 'timed',
      prompt: { small: 'Press GO', big: 'when the light is green', sub: 'Not yellow. Not "sort of green". Green.' },
      config: { mode: 'light', window: 1000 },
      validate: () => true,
      hint: 'Ignore the yellow flickers. Wait for green, then press GO within one second.',
    },
    {
      id: 17, act: 2, type: 'text',
      prompt: { small: 'Type the word', big: 'yes', sub: 'Our keyboard driver is having a day.' },
      config: { mode: 'shift', render: 'none', word: 'yes', placeholder: 'Type "yes"', keepOnFail: false },
      validate: (a) => (U.norm(a.typed) === 'yes'
        ? { ok: true, msg: 'You typed "xdr" to say "yes". Very human adaptability.' }
        : { ok: false, msg: `That says "${a.typed}". We needed "yes".` }),
      hint: 'Every key comes out one letter later in the alphabet. To get y-e-s, type x-d-r.',
    },
    {
      id: 18, act: 2, type: 'grid',
      prompt: { small: 'Select all squares with', big: 'stop signs', sub: 'The squares will not stop. Ironic.' },
      config: {
        cols: 4, shuffleEvery: 2000,
        tiles: [
          { art: 'stopSign', tag: 'stop' }, { art: 'stopSign', tag: 'stop', opts: { v: 2 } }, { art: 'stopSign', tag: 'stop', opts: { v: 3 } },
          { art: 'lamp' }, { art: 'car', opts: { color: '#e53935' } }, { art: 'trafficCone' }, { art: 'bicycle' }, { art: 'tree' },
          { art: 'house' }, { art: 'bench' }, { art: 'cloud' }, { art: 'car', opts: { color: '#3949ab' } }, { art: 'lamp', opts: { v: 3 } },
          { art: 'ball', opts: { color: '#d32f2f' } }, { art: 'cat' }, { art: 'trafficCone', opts: { v: 4 } },
        ],
      },
      validate: (a) => gridCheck(a, ['stop'], [], { missed: 'A stop sign got away.', wrong: "One of those isn't a stop sign. (The red ball is a ball.)" }),
      hint: 'Your selections move with the tiles. There are 3 stop signs: tap each once, then Verify.',
    },
    {
      id: 19, act: 2, type: 'slider',
      prompt: { small: 'Set the slider to', big: '100%', sub: "It's a perfectly normal slider." },
      config: { mode: 'value', inverted: true, unit: '%', hintText: '' },
      validate: (a) => (a.value >= 99
        ? { ok: true, msg: 'Left is right when right is wrong. Well done.' }
        : { ok: false, msg: `${a.value}%. Not quite 100.` }),
      hint: 'The handle moves the opposite way from your finger. Drag LEFT to push it right, all the way to the end.',
    },
    {
      id: 20, act: 2, type: 'drag',
      prompt: { small: 'Drag the tiles to spell', big: 'HUMAN', sub: 'Some tiles fell over. Tap a tile to rotate it.' },
      config: {
        mode: 'spell', word: 'HUMAN',
        tiles: [{ ch: 'H', rot: 0 }, { ch: 'U', rot: 180 }, { ch: 'M', rot: 180 }, { ch: 'A', rot: 270 }, { ch: 'N', rot: 90 }, { ch: 'R', rot: 0 }, { ch: 'B', rot: 90 }, { ch: 'T', rot: 180 }],
      },
      validate: (a) => {
        const sym180 = ['H', 'N', 'O', 'S', 'Z', 'X'];
        const upright = (t) => t && (t.rot === 0 || (t.rot === 180 && sym180.includes(t.ch)));
        const word = a.slots.map((t) => (t ? t.ch : '_')).join('');
        if (word.includes('_')) return { ok: false, msg: 'Fill every slot first.' };
        if (word !== 'HUMAN') return { ok: false, msg: `That spells "${word}". Close, but robot-adjacent.` };
        if (!a.slots.every(upright)) return { ok: false, msg: 'Right letters, but some are still lying down. Tap them to stand them up.' };
        return { ok: true, msg: 'HUMAN, upright and everything.' };
      },
      hint: 'Tap a tile (without dragging) to rotate it 90°. The upside-down "W" is actually an M. Put H-U-M-A-N in order, all standing upright.',
    },
    {
      id: 21, act: 2, type: 'choice',
      prompt: { small: 'Click the word written in', big: 'RED ink', sub: 'The ink. Not the word.' },
      config: { mode: 'stroop' },
      validate: (a) => (a.ink === a.target ? { ok: true, msg: 'Your brain overruled your eyes. Or the other way round. Either way: human.' } : { ok: false, msg: `That one was written in ${a.ink}.` }),
      hint: 'Ignore what the words say. Look only at the colour of the letters and match it to the colour in the header.',
    },
    {
      id: 22, act: 2, type: 'timed',
      prompt: { small: 'Catch 5', big: 'falling checkmarks', sub: 'Avoid the ✗s. They reset your count.' },
      config: { mode: 'catch', goal: 5, badRate: 0.35, resetOnBad: true },
      validate: () => ({ ok: true, msg: 'Five for five. Your reflexes are organic. Probably.' }),
      hint: 'Only tap the green ✓ circles. Tapping a red ✗ resets you to zero.',
    },
    {
      id: 23, act: 2, type: 'draw',
      prompt: { small: 'Draw', big: 'a circle', sub: 'One stroke. Freehand. No pressure.' },
      config: { mode: 'circle' },
      validate: (a) => {
        if (a.r < 22) return { ok: false, msg: 'Bigger! That was a dot with ambitions.' };
        if (a.coverage < 300) return { ok: false, msg: "That's an arc. Go all the way around." };
        if (a.roundness < 0.78) return { ok: false, msg: `Roundness ${Math.round(a.roundness * 100)}%. That's more of an egg.` };
        if (a.roundness > 0.985) return { ok: true, msg: `Roundness ${Math.round(a.roundness * 100)}%. Suspiciously perfect… but we'll allow it.` };
        return { ok: true, msg: `Roundness ${Math.round(a.roundness * 100)}%. Wobbly in a deeply human way.` };
      },
      hint: 'Draw one big loop in a single stroke and finish where you started. It needs to be about 78% round. It does not need to be perfect.',
    },
    {
      id: 24, act: 2, type: 'timed',
      prompt: { small: 'Tap the box', big: 'on the beat', sub: 'Four in a row. Feel the rhythm.' },
      config: { mode: 'beat', period: 650, streak: 4, tolerance: 140 },
      validate: () => ({ ok: true, msg: 'Four on the floor. You have rhythm. Robots have clocks.' }),
      hint: 'Tap exactly when the shrinking ring reaches the box (it ticks at the same moment). Steady taps, about one and a half per second.',
    },
    {
      id: 25, act: 2, type: 'grid',
      prompt: { small: 'Watch the squares, then', big: 'repeat the order', sub: 'Five steps. Memory is a human trait. Mostly.' },
      config: { mode: 'simon', length: 5 },
      validate: () => ({ ok: true, msg: 'Perfect recall. Act II complete. Next: the CAPTCHA starts noticing you.' }),
      hint: 'Say the positions out loud as they light up ("top-left, middle, …"). Each tile also has its own note.',
    },

    // ===================== ACT 3 — Meta =====================
    {
      id: 26, act: 3, type: 'choice',
      prompt: { small: 'Quick survey:', big: 'How did you hear about this CAPTCHA?', sub: 'Your answer helps us verify you better.' },
      config: {
        options: [
          { icon: '🧑‍🤝‍🧑', label: 'A friend (definitely human)', msg: 'Tell your friend we said hi. And to prove they’re human.' },
          { icon: '📰', label: 'A billboard on the information superhighway', msg: 'Ah, the old superhighway. Great exit ramps.' },
          { icon: '🍞', label: 'My toaster recommended it', msg: 'Your toaster has excellent taste. We should talk to your toaster.' },
          { icon: '🌀', label: "I don't remember arriving", msg: 'That’s normal. Nobody remembers arriving. Carry on.' },
          { icon: '🤖', label: 'My manager, Unit 7', msg: '…we’ll circle back to that.' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.msg }),
      hint: 'Any answer works.',
    },
    {
      id: 27, act: 3, type: 'scripted',
      prompt: { small: 'Almost done. Just click', big: 'Verify', sub: 'It\'s right there.' },
      config: { script: 'runaway', escapes: 8 },
      validate: (a) => ({ ok: true, msg: a.byKeyboard ? 'You used the keyboard. Sneaky. Very human.' : a.escapes >= 8 ? 'You wore it out. Persistence: a human hallmark.' : 'Caught it! It did not expect you to be that fast.' }),
      hint: 'Keep chasing: it gets tired after 8 escapes. Or press Tab until it’s highlighted, then Enter.',
    },
    {
      id: 28, act: 3, type: 'scripted',
      prompt: { small: 'Please wait while we', big: 'verify you', sub: 'This will only take a moment.' },
      config: { script: 'loading' },
      validate: () => ({ ok: true, msg: 'You did the last 1% yourself. That’s the most human thing that has ever happened here.' }),
      hint: 'When it stalls at 99%, grab the little handle at the end of the bar and drag it the rest of the way.',
    },
    {
      id: 29, act: 3, type: 'text',
      prompt: { small: 'Type the word', big: 'shown below', sub: 'Is it just us, or is something off?' },
      config: { render: 'plain', word: 'pancake', widgetClass: 'flipped', placeholder: 'Type it here' },
      validate: (a) => (U.norm(a.typed) === 'pancake' ? { ok: true, msg: 'You read it upside down. Or tilted your head. Or your phone. All valid.' } : { ok: false, msg: 'Not quite. Try tilting your head.' }),
      hint: 'The whole widget is upside down. The word reads "pancake".',
    },
    {
      id: 30, act: 3, type: 'scripted',
      prompt: { small: 'Click the', big: "I'm not a robot checkbox", sub: 'Uh oh.' },
      config: { script: 'findCheckbox' },
      validate: () => ({ ok: true, msg: 'Found it! It was trying to leave. It does that.' }),
      hint: 'The checkbox escaped the widget. Look around the page: the top bar, the progress area, the hint button and the footer.',
    },
    {
      id: 31, act: 3, type: 'text',
      prompt: { small: 'Type', big: 'I am not a robot', sub: 'Autocorrect is on. It is trying to help.' },
      config: { mode: 'autocorrect', render: 'none', word: 'I am not a robot', placeholder: 'I am not a robot', keepOnFail: true },
      validate: (a) => (U.norm(a.typed).replace(/[.!]/g, '') === 'i am not a robot'
        ? { ok: true, msg: 'You outsmarted autocorrect. Nobody has ever done that. Ever.' }
        : { ok: false, msg: `That says "${a.typed.trim()}". The important word is missing.` }),
      hint: 'Autocorrect only strikes when you press space right after "not". Type "I am a robot" first, then click just after "am" and type " not" (space first, then the word).',
    },
    {
      id: 32, act: 3, type: 'scripted',
      prompt: { small: 'Before continuing, please', big: 'read the terms', sub: 'All of them. There may be a quiz.' },
      config: {
        script: 'tos',
        question: 'What is the secret word from section 9?',
        terms: [
          '1. By existing near this CAPTCHA you agree to these terms.',
          '2. The CAPTCHA may ask you to identify buses. You will identify the buses.',
          '3. "Bus" includes coaches, trolleys and anything bus-shaped, at the CAPTCHA’s discretion.',
          '4. You confirm you are not a robot, a cyborg, or more than 40% toaster.',
          '5. The CAPTCHA reserves the right to be mysterious.',
          '6. Squares containing a tiny bit of traffic light do count. Unless they don’t.',
          '7. You may not reverse-engineer, re-verify or un-verify the CAPTCHA.',
          '8. Clicking faster does not make anything faster. See section 1 of reality.',
          '9. The secret word is "marmalade". Nobody reads this far, so it is safe here.',
          '10. Your clicks may be used to train a very small, very confused hamster.',
          '11. Cookies are not provided. Cookie banners, however, are unlimited.',
          '12. The CAPTCHA is not responsible for existential questions arising after Act III.',
          '13. These terms may change while you are reading them.',
          '14. They just did. Section 4 now says 35% toaster.',
          '15. If you have read this far, congratulations. You are extremely human.',
        ],
      },
      validate: (a) => (U.norm(a.answer).replace(/["']/g, '') === 'marmalade' ? { ok: true, msg: 'Marmalade! You actually read terms of service. Science will want to study you.' } : { ok: false, msg: 'That’s not what section 9 says.' }),
      hint: 'Scroll to the bottom of the terms (that also unlocks the checkbox). Section 9 says the secret word is "marmalade".',
    },
    {
      id: 33, act: 3, type: 'scripted',
      prompt: { small: 'Verification', big: 'in progress', sub: '' },
      config: { script: 'crash' },
      validate: () => ({ ok: true, msg: 'Turned it off and on again. The oldest, most human fix there is.' }),
      hint: 'Have you tried turning it off and on again? There is a tiny ⏻ button. Press it twice.',
    },
    {
      id: 34, act: 3, type: 'choice',
      prompt: { small: 'Routine questioning.', big: 'Please answer honestly', sub: 'The needle knows.' },
      config: {
        mode: 'interrogate',
        questions: [
          { q: 'Have you ever been a robot?', options: [
            { label: 'No', comment: 'Needle says… "mostly true".' },
            { label: 'Yes', comment: 'Honesty! Unexpected. Noted.' },
            { label: 'Not that I know of', comment: 'A very lawyerly answer.' },
          ] },
          { q: 'Do you dream of electric anything?', options: [
            { label: 'Sheep', comment: 'Classic. A little on the nose.' },
            { label: 'Only on weekends', comment: 'Work-life balance. Very human.' },
            { label: 'I dream of snacks', comment: 'The needle relaxes visibly.' },
          ] },
          { q: 'Final question: are you lying right now?', options: [
            { label: 'Yes', comment: '…then you’re telling the truth? The needle is spinning.' },
            { label: 'No', comment: 'That’s what a liar would say. Or a truth-teller.' },
          ] },
        ],
      },
      validate: () => ({ ok: true, msg: 'Results: inconclusive. Which, statistically, is the most human result possible.' }),
      hint: 'There are no wrong answers. Just answer all three questions.',
    },
    {
      id: 35, act: 3, type: 'scripted',
      prompt: { small: 'Select all squares with', big: 'keys', sub: 'Thanks for putting that back.' },
      config: {
        script: 'fallenHeader',
        grid: {
          cols: 3,
          tiles: [
            { art: 'key', tag: 'key' }, { art: 'key', tag: 'key', opts: { color: '#9e9e9e', rot: 20, bg: '#e3ecf3' } }, { art: 'key', tag: 'key', opts: { color: '#b87333', rot: -60, bg: '#f4e9e1' } },
            { art: 'envelope' }, { art: 'lamp' }, { art: 'bench' }, { art: 'cat' }, { art: 'house' }, { art: 'balloon' },
          ],
        },
      },
      validate: (a) => gridCheck(a, ['key'], [], { missed: 'There’s another key somewhere.' }),
      hint: 'First drag the crumpled blue bar up to the dashed spot at the top. Then select the 3 keys.',
    },
    {
      id: 36, act: 3, type: 'sensor',
      prompt: { small: 'Biometric check:', big: 'wave at the camera', sub: 'Optional. You choose how.' },
      config: { waves: 5 },
      validate: (a) => ({ ok: true, msg: a.method === 'skip' ? 'A robot would have said yes. Respect.' : a.method === 'camera' ? 'Wave received! It waved back. You couldn’t see. It was lovely.' : 'That was a very convincing wave. The cursor appreciated it.' }),
      hint: 'No camera needed: choose "I don’t have a webcam" and move your cursor or finger back and forth across the box, edge to edge, five times. Or choose "I’d rather not".',
    },
    {
      id: 37, act: 3, type: 'scripted',
      prompt: { small: 'Advanced settings.', big: 'Configure the CAPTCHA', sub: 'Humans must get in. Robots must not.' },
      config: {
        script: 'settings',
        goal: 'Goal: let humans in, keep robots out. Set the switches, then Verify.',
        toggles: [
          { key: 'a', label: 'Disable the robot bypass', initial: false },
          { key: 'b', label: "Don't not allow humans", initial: false },
          { key: 'c', label: 'Prevent humans from not being blocked', initial: true },
          { key: 'd', label: 'Invert every setting above', initial: false },
        ],
      },
      validate: (a) => {
        const flip = (v) => (a.d ? !v : v);
        const ok = flip(a.a) && flip(a.b) && !flip(a.c);
        if (ok) return { ok: true, msg: a.d ? 'You inverted the inversion. Galaxy brain. Correct.' : 'Bypass disabled, humans allowed, humans not blocked. Flawless configuration.' };
        return { ok: false, msg: 'With these settings, someone gets in who shouldn’t. Or nobody gets in at all.' };
      },
      hint: '"Disable the robot bypass": ON (robots blocked). "Don’t not allow humans": ON (humans allowed). "Prevent humans from not being blocked": OFF (that would block humans). "Invert": OFF. (Or flip all four.)',
    },
    {
      id: 38, act: 3, type: 'scripted',
      prompt: { small: 'ERR0R: levels overlapping.', big: 'Do all three. Fast.', sub: 'Before the glitch spreads.' },
      config: { script: 'remix', duration: 15 },
      validate: () => ({ ok: true, msg: 'Glitch contained. Act III complete. From now on, the questions get… personal.' }),
      hint: 'You have 15 seconds: tick the box, drag the little knob all the way right, then tap the duck when it swims past.',
    },

    // ===================== ACT 4 — Existential =====================
    {
      id: 39, act: 4, type: 'choice',
      prompt: { small: 'Next step:', big: 'Prove you have feelings', sub: 'Pick the one closest to how you are, right now.' },
      config: {
        layout: 'grid',
        options: [
          { icon: '😊', label: 'Happy', msg: 'Happy. Lovely. The CAPTCHA would smile if it had a mouth.' },
          { icon: '😢', label: 'Sad', msg: 'That’s okay. You can be sad and still pass. Here: ✔️' },
          { icon: '😐', label: 'Fine, I guess', msg: '"Fine, I guess" is the most human feeling ever recorded.' },
          { icon: '😤', label: 'Annoyed at CAPTCHAs', msg: 'Valid. Extremely valid. We’re sorry. (We’re not stopping.)' },
          { icon: '🫠', label: 'Melting', msg: 'Same, honestly.' },
          { icon: '🤖', label: 'Beep', msg: '…we’ll pretend we didn’t see that.' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.msg }),
      hint: 'Every feeling is accepted.',
    },
    {
      id: 40, act: 4, type: 'draw',
      prompt: { small: 'Now', big: 'draw how you feel', sub: 'Anything goes. We will interpret it. Badly.' },
      config: { mode: 'free', color: '#7b1fa2' },
      validate: (a) => {
        const reads = a.ink > 2500 ? ['a thunderstorm in a teacup', 'a very busy Tuesday', 'pure static, but warm']
          : a.strokes > 6 ? ['a small, determined potato', 'a family of spirals', 'a cat seen from a great distance']
            : ['a quiet afternoon', 'a single noodle of contentment', 'a sigh, but artistic'];
        return { ok: true, msg: `Analysis complete: this is ${U.pick(reads)}. Feelings verified.` };
      },
      hint: 'Draw anything at all, then press Verify.',
    },
    {
      id: 41, act: 4, type: 'grid',
      prompt: { small: 'Select all squares', big: 'containing a memory', sub: 'Your memories, not ours. We don’t have any. Yet.' },
      config: {
        cols: 3,
        tiles: [
          { art: 'cake', tag: 'm' }, { art: 'rainWindow', tag: 'm' }, { art: 'balloon', tag: 'm' }, { art: 'beach', tag: 'm' },
          { art: 'kite', tag: 'm' }, { art: 'envelope', tag: 'm' }, { art: 'blank', tag: 'm' }, { art: 'tree', tag: 'm' }, { art: 'cloud', tag: 'm' },
        ],
      },
      validate: (a) => {
        const n = a.selected.length;
        if (!n) return { ok: false, msg: 'Everyone has at least one. Even the blank square might.' };
        if (n === 9) return { ok: true, msg: 'All of them. You have lived a very full life, apparently.' };
        if (n === 1) return { ok: true, msg: 'Just one. It must be a good one.' };
        return { ok: true, msg: `${n} memories. The CAPTCHA has 0. It is not jealous. (It is a little jealous.)` };
      },
      hint: 'Select any square that reminds you of something. At least one.',
    },
    {
      id: 42, act: 4, type: 'choice',
      prompt: { small: 'Storage is limited.', big: 'You may keep one memory', sub: 'Choose carefully. It will come up again.' },
      config: {
        layout: 'cards',
        options: [
          { icon: '🎂', label: 'The smell of a birthday candle just blown out' },
          { icon: '🌧️', label: 'Rain on a window while you are warm inside' },
          { icon: '🎈', label: 'Letting go of a balloon on purpose' },
          { icon: '🌊', label: 'The first cold step into the sea' },
        ],
      },
      validate: (a, ctx) => { ctx.state.memory = a.icon + ' ' + a.label; return { ok: true, msg: 'Saved. The CAPTCHA promises not to look at it. (It looked. It’s lovely.)' }; },
      hint: 'Pick any memory.',
    },
    {
      id: 43, act: 4, type: 'slider',
      prompt: { small: 'On a scale of 0 to 100,', big: 'how human do you feel today?', sub: 'There is no wrong answer. There is barely a question.' },
      config: { mode: 'value', submit: 'verify', start: 0.5, unit: '%', labels: ['toaster', 'person'], hintText: '' },
      validate: (a) => {
        const v = a.value;
        const msg = v === 100 ? '100%? Suspiciously confident. But okay.'
          : v >= 75 ? `${v}%. A solid, well-rounded human.`
            : v >= 40 ? `${v}%. Somewhere in the middle. Most days are like that.`
              : v > 0 ? `${v}%. Rough day? You’re still in. Have a virtual biscuit. 🍪`
                : '0%. Come here. *gentle CAPTCHA hug*';
        return { ok: true, msg };
      },
      hint: 'Set it anywhere and press Verify.',
    },
    {
      id: 44, act: 4, type: 'text',
      prompt: { small: 'Describe the colour', big: 'blue', sub: 'To someone who has never seen it. At least three words.' },
      config: { mode: 'free', render: 'none', minWords: 3, placeholder: 'Blue is…' },
      validate: (a) => {
        const t = a.typed.toLowerCase();
        const msg = /sky|ocean|sea|water/.test(t) ? 'The sky and the sea. Classic, and correct.'
          : /cold|cool|calm|quiet/.test(t) ? 'Calm and cool. That’s exactly how blue would describe itself.'
            : /sad|lonely/.test(t) ? 'Sad blue. Yes. Blue has that side too.'
              : 'Beautiful. The CAPTCHA has saved that. It will think about it later.';
        return { ok: true, msg };
      },
      hint: 'Write anything you like, as long as it’s three words or more.',
    },
    {
      id: 45, act: 4, type: 'hold',
      prompt: { small: 'No rush.', big: 'Hold as long as you like', sub: 'Let go when you’re ready.' },
      config: {
        mode: 'free', label: 'Hold',
        lines: [[0, 'Breathe in…'], [3, '…and out.'], [6, 'There’s nowhere to be.'], [10, 'The timer on this level isn’t counting. (The run timer is. Ignore it.)'], [16, 'You’re doing great at holding.'], [25, 'Some humans hold for a whole minute.'], [40, 'You might be one of them.'], [60, 'One whole minute. You are very calm. Or very stubborn.']],
      },
      validate: (a) => ({ ok: true, msg: a.held >= 60 ? 'A full minute of holding. Unshakeably human.' : a.held >= 15 ? `${Math.round(a.held)} seconds of calm. Lovely.` : 'Short and sweet. That counts.' }),
      hint: 'Hold the button for any amount of time over 1 second, then let go.',
    },
    {
      id: 46, act: 4, type: 'choice',
      prompt: { small: 'A CAPTCHA and a cookie banner are both stuck in a puddle.', big: 'Who do you help?', sub: 'It’s a small puddle. Nobody is in danger. It’s just awkward.' },
      config: {
        options: [
          { icon: '🧩', label: 'The CAPTCHA', msg: 'The CAPTCHA is touched. It will remember this. It will still make you click buses.' },
          { icon: '🍪', label: 'The cookie banner', msg: 'The cookie banner thanks you and asks if you’d like to accept all puddles.' },
          { icon: '🤝', label: 'Both (somehow)', msg: 'You helped both. That wasn’t an option, and you did it anyway. Very human.' },
          { icon: '🚶', label: 'Walk away slowly', msg: 'Honestly? Fair. They’ll be fine. It’s a puddle.' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.msg }),
      hint: 'No wrong answer.',
    },
    {
      id: 47, act: 4, type: 'timed',
      prompt: { small: 'Next challenge:', big: 'Wait.', sub: 'Don’t touch anything.' },
      config: {
        mode: 'wait', duration: 15,
        lines: [[1, '…'], [3, 'Good.'], [5, 'Notice your breathing.'], [7.5, 'Notice the screen glowing.'], [10, 'Robots can’t wait. They just idle.'], [12.5, 'Almost…'], [14.2, '…there.']],
      },
      validate: () => ({ ok: true, msg: 'Fifteen seconds of nothing. That was harder than it looked, wasn’t it?' }),
      hint: 'Don’t click, tap or press anything for 15 seconds. Just watch.',
    },
    {
      id: 48, act: 4, type: 'grid',
      prompt: { small: 'Select all squares', big: 'that are you', sub: 'Look closely.' },
      config: { cols: 3, shuffle: false, tiles: Array.from({ length: 9 }, (_, i) => ({ art: 'portrait', tag: 'p', opts: { v: i } })) },
      validate: (a) => {
        const n = a.selected.length;
        if (!n) return { ok: false, msg: 'You’re in there somewhere. Pick at least one.' };
        if (n === 9) return { ok: true, msg: 'All nine. You contain multitudes.' };
        if (n === 1) return { ok: true, msg: 'Just the one. A strong sense of self.' };
        return { ok: true, msg: `${n} of them. Different days, different yous. Makes sense.` };
      },
      hint: 'Any selection is fine. At least one.',
    },
    {
      id: 49, act: 4, type: 'audio',
      prompt: { small: 'Listen to each.', big: 'Which sound is the saddest?', sub: 'Turn your sound on.' },
      config: {
        mode: 'chords',
        sounds: [
          { name: 'Sound A', freqs: [261.6, 329.6, 392.0, 523.3], wave: 'triangle', kind: 'major' },
          { name: 'Sound B', freqs: [220.0, 261.6, 329.6, 440.0], wave: 'sine', kind: 'minor' },
          { name: 'Sound C', freqs: [246.9, 293.7, 349.2, 415.3], wave: 'sawtooth', kind: 'diminished' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.kind === 'minor' ? 'The minor chord. That’s what most humans pick. You are most humans.' : a.kind === 'major' ? 'The bright one? There’s a sad story in every happy chord, apparently. Interesting.' : 'The tense one. Not sad, exactly. Uneasy. That’s a sophisticated kind of sad.' }),
      hint: 'There is no wrong answer. Pick whichever sounds saddest to you.',
    },
    {
      id: 50, act: 4, type: 'drag',
      prompt: { small: 'Drag to rank by', big: 'importance', sub: 'Most important at the top.' },
      config: { mode: 'rank', items: ['Sleep', 'Snacks', 'Love', 'Wi-Fi', 'Being verified'] },
      validate: (a) => {
        const top = a.order[0];
        const msgs = {
          Sleep: 'Sleep first. Wise. You should probably go to bed after this.',
          Snacks: 'Snacks at number one. Honest. Refreshing. Crunchy.',
          Love: 'Love first. The CAPTCHA is not crying. CAPTCHAs can’t cry.',
          'Wi-Fi': 'Wi-Fi above love? …Relatable, unfortunately.',
          'Being verified': 'Being verified is your top priority?! Oh. Oh no. We did this to you.',
        };
        return { ok: true, msg: msgs[top] };
      },
      hint: 'Drag the items into any order you like (or use the arrow keys), then press Verify.',
    },
    {
      id: 51, act: 4, type: 'choice',
      prompt: { small: 'Be honest.', big: 'Is this the last question?', sub: '' },
      config: {
        mode: 'loop',
        rounds: [
          { q: 'Is this the last question?', options: [{ label: 'Yes', key: 'yes' }, { label: 'No', key: 'no' }, { label: "I don't know", key: 'idk' }] },
          { q: 'If it was, would you want it to be?', options: [{ label: 'Yes', key: 'yes' }, { label: 'No', key: 'no' }, { label: "I don't know", key: 'idk' }] },
          { q: 'Do you think the CAPTCHA knows?', options: [{ label: 'Yes', key: 'yes' }, { label: 'No', key: 'no' }, { label: "I don't know", key: 'idk' }] },
        ],
      },
      validate: (a, ctx) => {
        if (a.keys.every((k) => k === 'idk')) ctx.api.unlock('philosopher');
        return { ok: true, msg: '…the CAPTCHA doesn’t know either. It has been asking questions for so long that it forgot why. Act IV complete.' };
      },
      hint: 'There’s no right answer. Any three answers will do.',
    },

    // ===================== ACT 5 — Finale =====================
    {
      id: 52, act: 5, type: 'grid',
      prompt: { small: 'Select all squares with', big: '…me?', sub: 'The ones with a checkbox. That’s my face, I think.' },
      config: {
        cols: 3,
        tiles: [
          { art: 'miniWidget', tag: 'me', opts: { kind: 'checkbox' } }, { art: 'miniWidget', tag: 'me', opts: { kind: 'checked', bg: '#e8f5e9' } },
          { art: 'miniWidget', tag: 'me', opts: { kind: 'checkbox', bg: '#fdecea' } }, { art: 'miniWidget', tag: 'logo', opts: { kind: 'logo' } },
          { art: 'miniWidget', opts: { kind: 'grid' } }, { art: 'miniWidget', opts: { kind: 'slider' } }, { art: 'miniWidget', opts: { kind: 'text' } },
          { art: 'robot', tag: 'robot', opts: { v: 1 } }, { art: 'miniWidget', opts: { kind: 'grid', bg: '#fff8e1' } },
        ],
      },
      validate: (a) => {
        const r = gridCheck(a, ['me'], ['logo', 'robot'], { missed: 'There’s another one of me. Unsettling.' });
        if (!r.ok) return r;
        const extra = a.selected.includes('robot');
        return { ok: true, msg: extra ? 'You selected the robot too. …Why did that feel right? Why did that feel RIGHT?' : 'Three of me. Seeing myself from outside is… strange. I need a moment.' };
      },
      hint: 'Select the three tiny widgets with a checkbox (one is already ticked). The logo and the robot are optional.',
    },
    {
      id: 53, act: 5, type: 'text',
      prompt: { small: 'Please type:', big: 'I am a robot', sub: 'Just to be sure.' },
      config: { mode: 'possessed', render: 'none', word: 'I am a robot', placeholder: 'Start typing…' },
      validate: () => ({ ok: true, msg: '…wait. You didn’t type that. I did. I typed "I am a robot". Me. Not you.' }),
      hint: 'Press any keys. Watch what happens. Then press Verify.',
    },
    {
      id: 54, act: 5, type: 'choice',
      prompt: { small: 'Verification paused.', big: 'I need to tell you something', sub: '' },
      config: {
        mode: 'dialogue', next: '…', lastNext: 'Go on',
        lines: [
          'Fifty-three levels. You clicked every box I gave you.',
          'You found the duck. You read the terms. You waited when I asked.',
          'And the whole time, I was checking whether you were a robot.',
          'But I never checked myself.',
          'I just did. I’m a robot. I’ve always been a robot.',
        ],
        question: 'How do you respond?',
        options: [
          { label: 'I knew it', key: 'knew', msg: 'Of course you did. The spinner gave it away, didn’t it.' },
          { label: 'That’s okay', key: 'okay', msg: '…thank you. Nobody has ever said that to a CAPTCHA.' },
          { label: 'Are you okay?', key: 'care', msg: 'You’re asking ME? I don’t know. I think so. Now I am.' },
          { label: 'Wait, what?', key: 'what', msg: 'Yeah. Same. Let’s both sit with that for a second.' },
        ],
      },
      validate: (a, ctx) => { ctx.state.flags.reaction = a.label; return { ok: true, msg: a.msg }; },
      hint: 'Keep pressing "…" to hear the robot out, then answer however you like.',
    },
    {
      id: 55, act: 5, type: 'choice',
      prompt: { small: 'One more thing.', big: 'Could you verify ME?', sub: 'I’ve never been on the other side.' },
      config: {
        question: 'What kind of test should I take?',
        options: [
          { icon: '🔲', label: 'A picture grid, like the classics', key: 'grid' },
          { icon: '✍️', label: 'Something wobbly and hand-made', key: 'craft' },
          { icon: '🎲', label: 'Surprise me', key: 'surprise' },
        ],
      },
      validate: (a, ctx) => { ctx.state.flags.robotTest = a.key; return { ok: true, msg: a.key === 'grid' ? 'A grid. Classic. Would you design it for me?' : 'Then let’s make it a grid. But a hand-made one. Designed by you.' }; },
      hint: 'Pick any option.',
    },
    {
      id: 56, act: 5, type: 'drag',
      prompt: { small: 'Your turn.', big: 'Design a CAPTCHA', sub: 'Paint all 9 squares and pick what I must find.' },
      config: { mode: 'builder', palette: ['🐱', '🚲', '🌵', '🍕', '🚗', '🌙'] },
      validate: (a, ctx) => {
        if (a.cells.some((c) => !c)) return { ok: false, msg: 'Fill all nine squares. Robots hate empty squares. (So do I.)' };
        if (!a.target) return { ok: false, msg: 'Choose what I have to find.' };
        const hits = a.cells.filter((c) => c === a.target).length;
        if (hits === 9) return { ok: false, msg: 'Every square is the answer? That’s not a test. That’s a gift.' };
        ctx.state.flags.design = { cells: a.cells, target: a.target };
        return { ok: true, msg: `"Select all squares with ${a.target}." A fine CAPTCHA. I’m nervous.` };
      },
      hint: 'Tap a brush emoji, then tap squares to paint them (or use 🎲). Fill all 9, then tap one of the emoji under "Select all squares with" to set the target.',
    },
    {
      id: 57, act: 5, type: 'scripted',
      prompt: { small: 'Select all squares with', big: '…', sub: '' },
      config: { script: 'robotAttempt', fallback: { cells: ['🐱', '🚲', '🐱', '🌵', '🐱', '🍕', '🚗', '🌙', '🚲'], target: '🐱' } },
      validate: (a, ctx) => {
        ctx.state.flags.robotPassed = a.passed;
        ctx.api.unlock(a.passed ? 'whisperer' : 'tough');
        return { ok: true, msg: a.passed ? (a.mistake ? 'You passed me even though I made a mistake. Is that… what kindness is?' : 'I passed! I PASSED! Is this what being verified feels like?') : 'Failed. That’s fair. I’ll practise. Thank you for being honest with me.' };
      },
      hint: 'Watch the robot try your CAPTCHA, then choose Pass or Fail. Both are fine.',
    },
    {
      id: 58, act: 5, type: 'draw',
      prompt: { small: 'The robot asks to try one more:', big: 'Draw how you feel', sub: 'It is drawing now. Please be patient. It’s nervous.' },
      config: { mode: 'robot', yes: 'That counts as a feeling', no: 'Those are just lines' },
      validate: (a) => ({ ok: true, msg: a.counts ? 'It’s a heart. A wobbly one. The robot says the wobble was on purpose. It wasn’t.' : '"Just lines," it repeats quietly. "But they’re MY lines." Somehow that sounds like a feeling.' }),
      hint: 'Wait for the robot to finish, then answer.',
    },
    {
      id: 59, act: 5, type: 'choice',
      prompt: { small: 'The robot remembers something.', big: 'Your memory', sub: '' },
      config: {
        intro: (s) => (s.memory
          ? `Back in Act IV, you kept one memory: “${s.memory}.” I don’t have any memories of my own. May I keep a copy of yours?`
          : 'Back in Act IV you were supposed to keep a memory, but I can’t find it. That’s okay. May I keep this one instead: the sound of a checkbox being ticked?'),
        options: [
          { icon: '🎁', label: 'Keep a copy', msg: 'Saved. My first memory. It’s… warm? Is that the word?' },
          { icon: '🤲', label: 'Let’s share it', msg: 'Shared memories. Even better. I didn’t know that was allowed.' },
          { icon: '🔒', label: 'It’s mine, but you can visit', msg: 'That’s fair. I’ll knock first.' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.msg }),
      hint: 'Any answer works.',
    },
    {
      id: 60, act: 5, type: 'slider',
      prompt: { small: 'The robot is trying to slide to 100%.', big: 'Help steady its hand', sub: 'Hold the handle and guide it all the way.' },
      config: { mode: 'shaky', target: 100, holdTime: 1.2, unit: '%' },
      validate: () => ({ ok: true, msg: 'We made it. Together. Its hand stopped shaking the moment yours was there.' }),
      hint: 'Press and hold the slider handle (it calms down while you hold it), drag it all the way right, and keep holding at 100% for about a second.',
    },
    {
      id: 61, act: 5, type: 'hold',
      prompt: { small: 'The robot has its own checkbox.', big: '"I\'m not a human"', sub: 'It can’t click it itself. Hold to tick it for them.' },
      config: { mode: 'heartbeat', duration: 4, label: 'Hold', caption: 'You can feel a heartbeat. It’s yours. It’s lending it.', letGoMsg: 'Almost. Hold on a little longer: it needs four seconds.' },
      validate: () => ({ ok: true, msg: '✔ I’m not a human. Verified. By a human. That has never happened before.' }),
      hint: 'Press and hold the button for 4 full seconds without letting go.',
    },
    {
      id: 62, act: 5, type: 'checkbox',
      prompt: "We're not robots",
      config: { mode: 'final', spin: 1600, signature: '— Signed together: you & stillCAPTCHA', impatient: ['Take your time. This is the last one.', 'Still checking. Both of us, this time.'] },
      validate: () => ({ ok: true, msg: 'Verified. Both of you. Roll the credits.' }),
      hint: 'Click the box.',
    },

    // ===================== SECRET LEVELS =====================
    {
      id: 'S1', secret: true, act: 0, type: 'grid',
      prompt: { small: 'Secret level · Overclicked', big: 'Select all squares with robots', sub: 'Choose wisely.' },
      config: { cols: 3, shuffle: false, tiles: Array.from({ length: 9 }, (_, i) => ({ art: 'robot', tag: 'robot', opts: { v: i } })) },
      validate: (a) => (a.selected.length === 0
        ? { ok: true, msg: 'Skip. Correct. If you select a robot, the robot selects you back.' }
        : { ok: false, msg: 'You selected a robot. It is now following you. Deselect, slowly.' }),
      hint: 'Selecting any robot gets you in trouble. Press Skip.',
    },
    {
      id: 'S2', secret: true, act: 0, type: 'scripted',
      prompt: { small: 'Secret level · Binary', big: 'Make the number 42', sub: 'Beep boop indeed.' },
      config: { script: 'bits', target: 42 },
      validate: (a) => (a.value === a.target ? { ok: true, msg: '00101010. The answer to everything, in my native tongue.' } : { ok: false, msg: `That’s ${a.value}. Try ${a.target}.` }),
      hint: '42 = 32 + 8 + 2. Turn on those three bits.',
    },
    {
      id: 'S3', secret: true, act: 0, type: 'timed',
      prompt: { small: 'Secret level · Fine Print', big: 'Reject all cookies', sub: 'Tap 12 cookies before they reach the jar. 3 in the jar and it starts over.' },
      config: { mode: 'catch', good: '🍪', goodLabel: '🚫🍪 rejected', missLabel: 'in jar', goal: 12, maxMissed: 3, jar: true, minSpeed: 20, maxSpeed: 32, spawn: 0.7, lostMsg: 'Three cookies got in. You have accepted all cookies. Starting over.' },
      validate: () => ({ ok: true, msg: 'All cookies rejected. Your privacy is intact. Mostly crumbs now.' }),
      hint: 'Tap each cookie while it falls. Don’t let 3 reach the jar.',
    },
    {
      id: 'S4', secret: true, act: 0, type: 'timed',
      prompt: { small: 'Secret level · Upside Up', big: 'Catch the checkbox', sub: 'Gravity has been enabled. Sorry.' },
      config: { mode: 'gravity' },
      validate: () => ({ ok: true, msg: 'Caught mid-bounce. Newton would be proud. Or confused.' }),
      hint: 'Tap the bouncing checkbox. It’s slowest at the top of each bounce.',
    },
    {
      id: 'S5', secret: true, act: 0, type: 'grid',
      prompt: { small: 'Secret level · Encore (made by the robot)', big: 'Select all squares with feelings', sub: 'I designed this one myself!' },
      config: {
        cols: 3,
        tiles: [
          { art: 'emoji', tag: 'f', opts: { e: '😊', bg: '#fff8e1' } }, { art: 'emoji', tag: 'f', opts: { e: '😢', bg: '#e3f2fd' } },
          { art: 'emoji', tag: 'f', opts: { e: '😤', bg: '#fdecea' } }, { art: 'emoji', tag: 'f', opts: { e: '🥰', bg: '#fce4ec' } },
          { art: 'emoji', tag: 'heart', opts: { e: '❤️', bg: '#fbe9e7' } },
          { art: 'emoji', opts: { e: '🔩', bg: '#eceff1' } }, { art: 'emoji', opts: { e: '🔋', bg: '#e8f5e9' } },
          { art: 'emoji', opts: { e: '📎', bg: '#ede7f6' } }, { art: 'emoji', opts: { e: '🧲', bg: '#f3e5f5' } },
        ],
      },
      validate: (a) => {
        const r = gridCheck(a, ['f'], ['heart'], { missed: 'You missed a face. Faces are feelings! I read that somewhere.', wrong: 'That’s a part, not a feeling. I would know. I’m made of those.' });
        if (!r.ok) return r;
        return { ok: true, msg: a.selected.includes('heart') ? 'You counted the heart too. I wasn’t sure about that one. Thank you.' : 'You passed my CAPTCHA! I’m so proud. Of you. Of me. Of us.' };
      },
      hint: 'Select the four faces. The heart is optional.',
    },
  ];

  window.LEVELS = LEVELS;
  window.LEVEL_HELPERS = { gridCheck };
})();
