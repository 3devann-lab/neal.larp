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
  /** Photo tile helper: P('cat-1', 'cat') → { art: 'photo', opts: { src }, tag } */
  const P = (src, tag) => ({ art: 'photo', tag, opts: { src } });
  /** Checkbox Dash course helpers. course('..^..', '..#..') joins segments.
   *  lanes([[floorSeg, ceilSeg], …]) builds aligned floor + ceiling strings. */
  const course = (...segs) => segs.join('');
  const lanes = (segs) => ({
    floor: segs.map(([f]) => f).join(''),
    ceil: segs.map(([f, c]) => (c || '').padEnd(f.length, '.').slice(0, f.length)).join(''),
  });

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
      key: 'checkbox', type: 'checkbox',
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
      key: 'bicycles', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'bicycles', sub: 'Click verify once there are none left.' },
      config: {
        cols: 3,
        tiles: [
          P('bicycle-1', 'bike'), P('bicycle-2', 'bike'), P('bicycle-3', 'bike'),
          P('car-1'), P('tree-1'), P('house-1'), P('bench-1'), P('lamp-1'), P('cloud-1'),
        ],
      },
      validate: (a) => gridCheck(a, ['bike']),
      hint: 'There are three bicycles. Two wheels, a seat and handlebars.',
    },
    {
      key: 'distort', type: 'text',
      prompt: { small: 'Type the characters', big: 'you see below', sub: 'Not case sensitive. Mercifully.' },
      config: { render: 'distort', length: 6 },
      validate: (a) => (norm(a.typed).replace(/\s/g, '') === a.expected ? true : { ok: false, msg: 'Close, but no. Here is a fresh one.' }),
      hint: 'Only lowercase letters and the digits 2–9 are used. No "l", "o", "1" or "0". Use ⟳ for a new one.',
    },
    {
      key: 'hydrant', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'a fire hydrant', sub: 'If there are none, click skip.' },
      config: {
        cols: 4, split: 'hydrantPhoto', resetOnFail: false,
        // photo: the hydrant fills columns 1–2 in every row; its right nozzle tip pokes into row 1, column 3
        splitTags: { 1: 'h', 2: 'h', 5: 'h', 6: 'h', 9: 'h', 10: 'h', 13: 'h', 14: 'h', 7: 'edge' },
      },
      validate: (a) => {
        const r = gridCheck(a, ['h'], ['edge']);
        if (!r.ok) return r;
        const edges = a.tiles.filter((t) => t.tag === 'edge' && t.selected).length;
        return { ok: true, msg: edges ? 'You even got the tip of the nozzle. Thorough.' : 'You skipped the nozzle tip. Also valid. Philosophically.' };
      },
      hint: 'The hydrant fills the two middle columns, from the top row to the bottom row. The tiny nozzle tip on the right is optional.',
    },
    {
      key: 'puzzle', type: 'slider',
      prompt: { small: 'Drag the slider to', big: 'fit the puzzle piece', sub: 'Line it up with the dark gap.' },
      config: { mode: 'puzzle' },
      validate: (a) => (Math.abs(a.x - a.gapX) <= 6 ? true : { ok: false, msg: Math.abs(a.x - a.gapX) <= 18 ? 'So close. Pixels matter.' : 'The gap is somewhere else.' }),
      hint: 'Let go when the piece sits exactly on top of the dark gap. You can also focus the handle and use the arrow keys, then press Enter.',
    },
    {
      key: 'trustme', type: 'text',
      prompt: { small: 'Type the text', big: 'shown below', sub: 'Take your time.' },
      config: { render: 'plain', word: 'trust me', placeholder: 'Type it exactly' },
      validate: (a) => norm(a.typed) === 'trust me'
        ? { ok: true, msg: "Too easy? That's exactly what a robot would think. ...Fine. You pass." }
        : { ok: false, msg: 'It was right there. In plain letters.' },
      hint: 'Type the two words exactly as shown: trust me',
    },
    {
      key: 'cones', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'cones', sub: 'All of them.' },
      config: {
        cols: 4,
        tiles: [
          P('cone-1', 'cone'), P('cone-2', 'cone'), P('icecream-1', 'cone'), P('icecream-2', 'cone'),
          P('pinecone-1', 'cone'), P('pinecone-2', 'cone'), P('partyhat-1', 'hat'),
          P('tree-1'), P('car-3'), P('bench-2'), P('ball-1'), P('house-2'), P('cloud-2'), P('lamp-2'), P('bicycle-4'), P('cat-2'),
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
      key: 'digits', type: 'audio',
      prompt: { small: 'Press play and', big: 'type the digits', sub: 'Turn your sound on. Or read them, we won\'t tell.' },
      config: { mode: 'digits', length: 5 },
      validate: (a) => (a.typed.replace(/\D/g, '') === a.expected ? true : { ok: false, msg: "Those weren't the digits. Here are new ones." }),
      hint: 'Tap "Can\'t play audio? Read it instead" to see the digits written as words.',
    },
    {
      key: 'sandwich', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'a sandwich', sub: 'Use your best judgement.' },
      config: {
        cols: 3,
        tiles: [
          P('sandwich-1', 'sandwich'), P('sub-1', 'sandwich'),
          P('burger-1', 'burger'), P('hotdog-1', 'hotdog'), P('taco-1', 'taco'),
          P('bicycle-2'), P('tree-1'), P('cat-3'), P('ball-2'),
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
      key: 'socks', type: 'drag',
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
      key: 'hold3', type: 'hold',
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
      key: 'multicheck', type: 'checkbox',
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
      key: 'nocat', type: 'grid',
      prompt: { small: 'Select all squares', big: 'WITHOUT a cat', sub: 'Read that again.' },
      config: {
        cols: 3,
        tiles: [
          P('cat-1', 'cat'), P('cat-2', 'cat'), P('cat-3', 'cat'), P('cat-4', 'cat'),
          P('tree-1', 'x'), P('car-2', 'x'), P('bench-1', 'x'), P('ball-1', 'x'), P('house-1', 'x'),
        ],
      },
      validate: (a) => gridCheck(a, ['x'], [], { wrong: 'That one has a cat in it. The cat is offended.', missed: 'You missed a cat-free square.', none: 'Nothing? There are plenty of squares without cats.' }),
      hint: 'Select everything that is NOT a cat: 5 squares.',
    },
    {
      key: 'dontclick', type: 'timed',
      prompt: { small: 'Whatever happens,', big: 'do NOT click the checkbox', sub: 'For 6 seconds.' },
      config: {
        mode: 'dontClick', duration: 6,
        lines: ['Hi. Click me.', 'Just a tiny click?', 'Everyone else clicked.', "I'll give you a cookie. 🍪", 'Please. I was made for this.', 'Fine. FINE.'],
      },
      validate: () => ({ ok: true, msg: 'You resisted. Robots follow instructions; humans follow… the correct instructions. Somehow.' }),
      hint: 'Do nothing at all. Literally. Keep your hands off it for 6 seconds.',
    },
    {
      key: 'frog', type: 'timed',
      prompt: { small: 'Click', big: 'the frog', sub: 'It hops faster every time you miss.' },
      config: { mode: 'moving', speed: 26 },
      validate: () => ({ ok: true, msg: 'Frog acquired. It is fine. It wanted you to win.' }),
      hint: 'Aim slightly ahead of where it is going, or wait for it to bounce off a wall and click where it will be.',
    },
    {
      key: 'light', type: 'timed',
      prompt: { small: 'Press GO', big: 'when the light is green', sub: 'Not yellow. Not "sort of green". Green.' },
      config: { mode: 'light', window: 1000 },
      validate: () => true,
      hint: 'Ignore the yellow flickers. Wait for green, then press GO within one second.',
    },
    {
      key: 'shift', type: 'text',
      prompt: { small: 'Type the word', big: 'yes', sub: 'Our keyboard driver is having a day.' },
      config: { mode: 'shift', render: 'none', word: 'yes', placeholder: 'Type "yes"', keepOnFail: false },
      validate: (a) => (U.norm(a.typed) === 'yes'
        ? { ok: true, msg: 'You typed "xdr" to say "yes". Very human adaptability.' }
        : { ok: false, msg: `That says "${a.typed}". We needed "yes".` }),
      hint: 'Every key comes out one letter later in the alphabet. To get y-e-s, type x-d-r.',
    },
    {
      key: 'stopsigns', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'stop signs', sub: 'The squares will not stop. Ironic.' },
      config: {
        cols: 4, shuffleEvery: 2000,
        tiles: [
          P('stop-1', 'stop'), P('stop-2', 'stop'), P('stop-3', 'stop'),
          P('lamp-1'), P('car-1'), P('cone-1'), P('bicycle-1'), P('tree-1'), P('house-2'), P('bench-2'),
          P('cloud-1'), P('car-3'), P('lamp-2'), P('ball-2'), P('cat-4'), P('cone-2'),
        ],
      },
      validate: (a) => gridCheck(a, ['stop'], [], { missed: 'A stop sign got away.', wrong: "One of those isn't a stop sign. Red is not enough." }),
      hint: 'Your selections move with the tiles. There are 3 stop signs: tap each once, then Verify.',
    },
    {
      key: 'reverse', type: 'slider',
      prompt: { small: 'Set the slider to', big: '100%', sub: "It's a perfectly normal slider." },
      config: { mode: 'value', inverted: true, unit: '%', hintText: '' },
      validate: (a) => (a.value >= 99
        ? { ok: true, msg: 'Left is right when right is wrong. Well done.' }
        : { ok: false, msg: `${a.value}%. Not quite 100.` }),
      hint: 'The handle moves the opposite way from your finger. Drag LEFT to push it right, all the way to the end.',
    },
    {
      key: 'human', type: 'drag',
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
      key: 'stroop', type: 'choice',
      prompt: { small: 'Click the word written in', big: 'RED ink', sub: 'The ink. Not the word.' },
      config: { mode: 'stroop' },
      validate: (a) => (a.ink === a.target ? { ok: true, msg: 'Your brain overruled your eyes. Or the other way round. Either way: human.' } : { ok: false, msg: `That one was written in ${a.ink}.` }),
      hint: 'Ignore what the words say. Look only at the colour of the letters and match it to the colour in the header.',
    },
    {
      key: 'catch', type: 'timed',
      prompt: { small: 'Catch 5', big: 'falling checkmarks', sub: 'Avoid the ✗s. They reset your count.' },
      config: { mode: 'catch', goal: 5, badRate: 0.35, resetOnBad: true },
      validate: () => ({ ok: true, msg: 'Five for five. Your reflexes are organic. Probably.' }),
      hint: 'Only tap the green ✓ circles. Tapping a red ✗ resets you to zero.',
    },
    {
      key: 'trace', type: 'draw',
      prompt: { small: 'Trace', big: 'the dotted path', sub: 'From the green dot to the red one. Steady hands.' },
      config: { mode: 'trace' },
      validate: (a) => {
        if (a.coverage < 0.85) return { ok: false, msg: `You covered ${Math.round(a.coverage * 100)}% of the path. Go all the way to the red dot.` };
        if (a.accuracy < 0.8) return { ok: false, msg: `Only ${Math.round(a.accuracy * 100)}% of your line stayed on the path. Wobbly!` };
        return { ok: true, msg: `${Math.round(a.accuracy * 100)}% on the path. Wobbly in a deeply human way.` };
      },
      hint: 'Draw one line along the dotted path from the green dot to the red dot. Slow is fine. You can press Clear and retry.',
    },
    {
      key: 'beat', type: 'timed',
      prompt: { small: 'Tap the box', big: 'on the beat', sub: 'Four in a row. Feel the rhythm.' },
      config: { mode: 'beat', period: 650, streak: 4, tolerance: 140 },
      validate: () => ({ ok: true, msg: 'Four on the floor. You have rhythm. Robots have clocks.' }),
      hint: 'Tap exactly when the shrinking ring reaches the box (it ticks at the same moment). Steady taps, about one and a half per second.',
    },
    {
      key: 'simon', type: 'grid',
      prompt: { small: 'Watch the squares, then', big: 'repeat the order', sub: 'Five steps. Memory is a human trait. Mostly.' },
      config: { mode: 'simon', length: 5 },
      validate: () => ({ ok: true, msg: 'Perfect recall. Act II complete. Next: the CAPTCHA starts noticing you.' }),
      hint: 'Say the positions out loud as they light up ("top-left, middle, …"). Each tile also has its own note.',
    },

    // ===================== ACT 3 — Meta =====================
    {
      key: 'survey', type: 'choice',
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
      key: 'runaway', type: 'scripted',
      prompt: { small: 'Almost done. Just click', big: 'Verify', sub: 'It\'s right there.' },
      config: { script: 'runaway', escapes: 8 },
      validate: (a) => ({ ok: true, msg: a.byKeyboard ? 'You used the keyboard. Sneaky. Very human.' : a.escapes >= 8 ? 'You wore it out. Persistence: a human hallmark.' : 'Caught it! It did not expect you to be that fast.' }),
      hint: 'Keep chasing: it gets tired after 8 escapes. Or press Tab until it’s highlighted, then Enter.',
    },
    {
      key: 'loading', type: 'scripted',
      prompt: { small: 'Please wait while we', big: 'verify you', sub: 'This will only take a moment.' },
      config: { script: 'loading' },
      validate: () => ({ ok: true, msg: 'You did the last 1% yourself. That’s the most human thing that has ever happened here.' }),
      hint: 'When it stalls at 99%, grab the little handle at the end of the bar and drag it the rest of the way.',
    },
    {
      key: 'flipped', type: 'text',
      prompt: { small: 'Type the word', big: 'shown below', sub: 'Is it just us, or is something off?' },
      config: { render: 'plain', word: 'pancake', widgetClass: 'flipped', placeholder: 'Type it here' },
      validate: (a) => (U.norm(a.typed) === 'pancake' ? { ok: true, msg: 'You read it upside down. Or tilted your head. Or your phone. All valid.' } : { ok: false, msg: 'Not quite. Try tilting your head.' }),
      hint: 'The whole widget is upside down. The word reads "pancake".',
    },
    {
      key: 'findbox', type: 'scripted',
      prompt: { small: 'Click the', big: "I'm not a robot checkbox", sub: 'Uh oh.' },
      config: { script: 'findCheckbox' },
      validate: () => ({ ok: true, msg: 'Found it! It was trying to leave. It does that.' }),
      hint: 'The checkbox escaped the widget. Look around the page: the top bar, the progress area, the hint button and the footer.',
    },
    {
      key: 'autocorrect', type: 'text',
      prompt: { small: 'Type', big: 'I am not a robot', sub: 'Autocorrect is on. It is trying to help.' },
      config: { mode: 'autocorrect', render: 'none', word: 'I am not a robot', placeholder: 'I am not a robot', keepOnFail: true },
      validate: (a) => (U.norm(a.typed).replace(/[.!]/g, '') === 'i am not a robot'
        ? { ok: true, msg: 'You outsmarted autocorrect. Nobody has ever done that. Ever.' }
        : { ok: false, msg: `That says "${a.typed.trim()}". The important word is missing.` }),
      hint: 'Autocorrect only strikes when you press space right after "not". Type "I am a robot" first, then click just after "am" and type " not" (space first, then the word).',
    },
    {
      key: 'tos', type: 'scripted',
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
      key: 'crash', type: 'scripted',
      prompt: { small: 'Verification', big: 'in progress', sub: '' },
      config: { script: 'crash' },
      validate: () => ({ ok: true, msg: 'Turned it off and on again. The oldest, most human fix there is.' }),
      hint: 'Have you tried turning it off and on again? There is a tiny ⏻ button. Press it twice.',
    },
    {
      key: 'interrogate', type: 'choice',
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
      key: 'fallen', type: 'scripted',
      prompt: { small: 'Select all squares with', big: 'keys', sub: 'Thanks for putting that back.' },
      config: {
        script: 'fallenHeader',
        grid: {
          cols: 3,
          tiles: [
            P('key-1', 'key'), P('key-2', 'key'), P('key-3', 'key'),
            P('envelope-1'), P('lamp-1'), P('bench-1'), P('cat-1'), P('house-1'), P('balloon-1'),
          ],
        },
      },
      validate: (a) => gridCheck(a, ['key'], [], { missed: 'There’s another key somewhere.' }),
      hint: 'First drag the crumpled blue bar up to the dashed spot at the top. Then select the 3 keys.',
    },
    {
      key: 'wave', type: 'sensor',
      prompt: { small: 'Biometric check:', big: 'wave at the camera', sub: 'Optional. You choose how.' },
      config: { waves: 5 },
      validate: (a) => ({ ok: true, msg: a.method === 'skip' ? 'A robot would have said yes. Respect.' : a.method === 'camera' ? 'Wave received! It waved back. You couldn’t see. It was lovely.' : 'That was a very convincing wave. The cursor appreciated it.' }),
      hint: 'No camera needed: choose "I don’t have a webcam" and move your cursor or finger back and forth across the box, edge to edge, five times. Or choose "I’d rather not".',
    },
    {
      key: 'settings', type: 'scripted',
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
      key: 'remix', type: 'scripted',
      prompt: { small: 'ERR0R: levels overlapping.', big: 'Do all three. Fast.', sub: 'Before the glitch spreads.' },
      config: { script: 'remix', duration: 15 },
      validate: () => ({ ok: true, msg: 'Glitch contained. Act III complete. From now on, the questions get… personal.' }),
      hint: 'You have 15 seconds: tick the box, drag the little knob all the way right, then tap the frog when it hops past.',
    },

    // ===================== ACT 4 — Existential =====================
    {
      key: 'feelings', type: 'choice',
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
      key: 'drawfeel', type: 'draw',
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
      key: 'memories', type: 'grid',
      prompt: { small: 'Select all squares', big: 'containing a memory', sub: 'Your memories, not ours. We don’t have any. Yet.' },
      config: {
        cols: 3,
        tiles: [
          P('cake-1', 'm'), P('rain-1', 'm'), P('balloon-1', 'm'), P('beach-1', 'm'),
          P('kite-1', 'm'), P('envelope-2', 'm'), { art: 'blank', tag: 'm' }, P('tree-1', 'm'), P('cloud-2', 'm'),
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
      key: 'keepmemory', type: 'choice',
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
      key: 'humanslider', type: 'slider',
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
      key: 'blue', type: 'text',
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
      key: 'holdfree', type: 'hold',
      prompt: { small: 'No rush.', big: 'Hold as long as you like', sub: 'Let go when you’re ready.' },
      config: {
        mode: 'free', label: 'Hold',
        lines: [[0, 'Breathe in…'], [3, '…and out.'], [6, 'There’s nowhere to be.'], [10, 'The timer on this level isn’t counting. (The run timer is. Ignore it.)'], [16, 'You’re doing great at holding.'], [25, 'Some humans hold for a whole minute.'], [40, 'You might be one of them.'], [60, 'One whole minute. You are very calm. Or very stubborn.']],
      },
      validate: (a) => ({ ok: true, msg: a.held >= 60 ? 'A full minute of holding. Unshakeably human.' : a.held >= 15 ? `${Math.round(a.held)} seconds of calm. Lovely.` : 'Short and sweet. That counts.' }),
      hint: 'Hold the button for any amount of time over 1 second, then let go.',
    },
    {
      key: 'puddle', type: 'choice',
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
      key: 'wait', type: 'timed',
      prompt: { small: 'Next challenge:', big: 'Wait.', sub: 'Don’t touch anything.' },
      config: {
        mode: 'wait', duration: 15,
        lines: [[1, '…'], [3, 'Good.'], [5, 'Notice your breathing.'], [7.5, 'Notice the screen glowing.'], [10, 'Robots can’t wait. They just idle.'], [12.5, 'Almost…'], [14.2, '…there.']],
      },
      validate: () => ({ ok: true, msg: 'Fifteen seconds of nothing. That was harder than it looked, wasn’t it?' }),
      hint: 'Don’t click, tap or press anything for 15 seconds. Just watch.',
    },
    {
      key: 'traces', type: 'grid',
      prompt: { small: 'Select all squares', big: 'that are you', sub: 'Footprints, shoes, a favourite mug… which ones feel like you?' },
      config: { cols: 3, tiles: Array.from({ length: 9 }, (_, i) => P('trace-' + (i + 1), 'p')) },
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
      key: 'chords', type: 'audio',
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
      key: 'rank', type: 'drag',
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
      key: 'loop', type: 'choice',
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
      key: 'me', type: 'grid',
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
      key: 'possessed', type: 'text',
      prompt: { small: 'Please type:', big: 'I am a robot', sub: 'Just to be sure.' },
      config: { mode: 'possessed', render: 'none', word: 'I am a robot', placeholder: 'Start typing…' },
      validate: () => ({ ok: true, msg: '…wait. You didn’t type that. I did. I typed "I am a robot". Me. Not you.' }),
      hint: 'Press any keys. Watch what happens. Then press Verify.',
    },
    {
      key: 'confession', type: 'choice',
      prompt: { small: 'Verification paused.', big: 'I need to tell you something', sub: '' },
      config: {
        mode: 'dialogue', next: '…', lastNext: 'Go on',
        lines: [
          'A hundred and twenty-eight levels. You clicked every box I gave you.',
          'You caught the frog. You read the terms. You waited when I asked.',
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
      key: 'verifyme', type: 'choice',
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
      key: 'design', type: 'drag',
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
      key: 'attempt', type: 'scripted',
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
      key: 'robotdraw', type: 'draw',
      prompt: { small: 'The robot asks to try one more:', big: 'Draw how you feel', sub: 'It is drawing now. Please be patient. It’s nervous.' },
      config: { mode: 'robot', yes: 'That counts as a feeling', no: 'Those are just lines' },
      validate: (a) => ({ ok: true, msg: a.counts ? 'It’s a heart. A wobbly one. The robot says the wobble was on purpose. It wasn’t.' : '"Just lines," it repeats quietly. "But they’re MY lines." Somehow that sounds like a feeling.' }),
      hint: 'Wait for the robot to finish, then answer.',
    },
    {
      key: 'memoryask', type: 'choice',
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
      key: 'shaky', type: 'slider',
      prompt: { small: 'The robot is trying to slide to 100%.', big: 'Help steady its hand', sub: 'Hold the handle and guide it all the way.' },
      config: { mode: 'shaky', target: 100, holdTime: 1.2, unit: '%' },
      validate: () => ({ ok: true, msg: 'We made it. Together. Its hand stopped shaking the moment yours was there.' }),
      hint: 'Press and hold the slider handle (it calms down while you hold it), drag it all the way right, and keep holding at 100% for about a second.',
    },
    {
      key: 'heartbeat', type: 'hold',
      prompt: { small: 'The robot has its own checkbox.', big: '"I\'m not a human"', sub: 'It can’t click it itself. Hold to tick it for them.' },
      config: { mode: 'heartbeat', duration: 4, label: 'Hold', caption: 'You can feel a heartbeat. It’s yours. It’s lending it.', letGoMsg: 'Almost. Hold on a little longer: it needs four seconds.' },
      validate: () => ({ ok: true, msg: '✔ I’m not a human. Verified. By a human. That has never happened before.' }),
      hint: 'Press and hold the button for 4 full seconds without letting go.',
    },
    {
      key: 'final', type: 'checkbox',
      prompt: "We're not robots",
      config: { mode: 'final', spin: 1600, signature: '— Signed together: you & stillCAPTCHA', impatient: ['Take your time. This is the last one.', 'Still checking. Both of us, this time.'] },
      validate: () => ({ ok: true, msg: 'Verified. Both of you. Roll the credits.' }),
      hint: 'Click the box.',
    },


    // ===================================================================================
    // EXPANSION: minigames and new challenges (placed into acts by ORDER below)
    // ===================================================================================

    // ----- Act I additions
    {
      key: 'rotate', type: 'puzzle',
      prompt: { small: 'Rotate the picture', big: 'until it’s upright', sub: 'Classic CAPTCHA. Totally normal.' },
      config: { game: 'rotate', src: 'cat-1' },
      validate: (a) => (a.angle === 0 ? { ok: true, msg: 'Upright. The cat thanks you for its dignity.' } : { ok: false, msg: 'Still tilted. The cat is getting dizzy.' }),
      hint: 'Use ↺ / ↻ until the cat is the right way up (ears at the top), then Verify.',
    },
    {
      key: 'count', type: 'puzzle',
      prompt: { small: 'Count them:', big: 'how many bicycles?', sub: 'Only the bicycles. Scooters are not bicycles.' },
      config: { game: 'count', target: '🚲', others: ['🚗', '🌳', '🏠', '🛴', '🚌', '🐈', '🚦'], min: 5, max: 9, noise: 16 },
      validate: (a) => (a.pick === a.n ? { ok: true, msg: `${a.n} bicycles. Counted like a human.` } : { ok: false, msg: 'Recount. Scooters (🛴) don’t count.' }),
      hint: 'Count only 🚲. Not 🛴 or 🚗. Pointing at each one helps.',
    },
    {
      key: 'pairs', type: 'puzzle',
      prompt: { small: 'Memory test:', big: 'match the pairs', sub: 'Flip two at a time.' },
      config: { game: 'pairs', kind: 'photo', items: ['cat-1', 'cone-2', 'balloon-1', 'frog-1', 'kite-1', 'burger-1'] },
      validate: (a) => ({ ok: true, msg: a.moves <= 9 ? `${a.moves} moves. Suspiciously good memory.` : `${a.moves} moves. Wonderfully forgetful. Very human.` }),
      hint: 'Remember where each picture was when it flips back. Work through the grid in order.',
    },
    {
      key: 'flies', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'something that flies', sub: 'Under its own power, ideally.' },
      config: { cols: 3, tiles: [P('balloon-1', 'fly'), P('kite-1', 'fly'), P('duck-1', 'fly'), P('cloud-2', 'maybe'), P('bench-1'), P('car-2'), P('cat-4'), P('house-2'), P('taco-1')] },
      validate: (a) => {
        const r = gridCheck(a, ['fly'], ['maybe'], { missed: 'Something else up there flies too.', wrong: 'That one is firmly on the ground.' });
        if (!r.ok) return r;
        return { ok: true, msg: a.selected.includes('maybe') ? 'Clouds “fly”? Floating counts, apparently. Accepted.' : 'Balloon, kite, duck. Airborne and verified.' };
      },
      hint: 'The balloon, the kite and the duck fly. The cloud is optional.',
    },
    {
      key: 'dots', type: 'puzzle',
      prompt: { small: 'Connect the dots', big: 'in order', sub: '1, 2, 3… you know how numbers work.' },
      config: { game: 'dots', points: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 17 : 40; return [Math.round(50 + Math.cos(a) * r), Math.round(52 + Math.sin(a) * r)]; }) },
      validate: () => ({ ok: true, msg: 'It’s a star. And so are you. (The CAPTCHA was told to say that.)' }),
      hint: 'Tap the dots in number order, starting at 1 at the top.',
    },
    {
      key: 'stopwatch', type: 'timed',
      prompt: { small: 'Stop the timer at', big: 'exactly 5.00 seconds', sub: 'Within 0.15 s. The numbers will hide.' },
      config: { mode: 'stopwatch', target: 5, tol: 0.15, hideAfter: 2 },
      validate: (a) => (Math.abs(a.t - a.target) <= a.tol ? { ok: true, msg: `${a.t.toFixed(2)} s. Your inner clock ticks true.` } : { ok: false, msg: `${a.t.toFixed(2)} s. ${a.t < a.target ? 'Too early.' : 'Too late.'} Try again.` }),
      hint: 'Count “one-Mississippi” up to five after pressing START, then press STOP. Anything from 4.85 to 5.15 s counts.',
    },
    {
      key: 'jigsaw', type: 'puzzle',
      prompt: { small: 'The picture got scrambled.', big: 'Put it back together', sub: 'Tap two pieces to swap them.' },
      config: { game: 'swap', src: 'bench-1', n: 3 },
      validate: () => ({ ok: true, msg: 'Restored. A very nice bench, now in one piece.' }),
      hint: 'Tap a piece, then tap where it belongs to swap them. Fix one piece at a time, left to right.',
    },
    {
      key: 'round', type: 'grid',
      prompt: { small: 'Select all squares with', big: 'something round', sub: 'Geometry, but make it CAPTCHA.' },
      config: { cols: 3, tiles: [P('ball-1', 'round'), P('ball-2', 'round'), P('balloon-1', 'round'), P('cake-1', 'maybe'), P('stop-1', 'oct'), P('house-1'), P('car-1'), P('bench-2'), P('lamp-2', 'maybe')] },
      validate: (a) => {
        if (a.selected.includes('oct')) return { ok: false, msg: 'A stop sign is an octagon. Very close to round. Not round.' };
        const r = gridCheck(a, ['round'], ['maybe'], { missed: 'There’s another round thing.' });
        if (!r.ok) return r;
        return { ok: true, msg: 'Round things located. Spherically sound.' };
      },
      hint: 'Two balls and the balloon are round. The cake and lamp globes are optional. The stop sign is an octagon!',
    },
    {
      key: 'whack', type: 'arcade',
      prompt: { small: 'Bot infestation!', big: 'Whack the robots', sub: 'Leave the humans alone.' },
      config: { game: 'whack', goal: 10, good: '🤖', bad: '🙂' },
      validate: () => ({ ok: true, msg: 'Ten robots bonked. (Gently. They’re fine. Mostly.)' }),
      hint: 'Only tap 🤖. Tapping a 🙂 costs you 3 points. Watch the hole before you tap.',
    },
    {
      key: 'clock', type: 'puzzle',
      prompt: { small: 'Set the clock to', big: '3:45', sub: 'Analog. Like your ancestors.' },
      config: { game: 'clock', time: '3:45' },
      validate: (a) => (a.mins === a.target ? { ok: true, msg: 'Quarter to four. Perfectly human time-telling.' } : { ok: false, msg: 'Not 3:45 yet. Long hand on 9, short hand just before 4.' }),
      hint: 'The long (minute) hand points at 9, the short (hour) hand sits just before 4. The buttons step by 5 minutes or 1 hour.',
    },
    {
      key: 'cups', type: 'puzzle',
      prompt: { small: 'Keep your eye on', big: 'the checkmark', sub: 'It’s hidden under a cup. The cups will move.' },
      config: { game: 'cups', swaps: 6, speed: 450 },
      validate: () => ({ ok: true, msg: 'Found it. Your eyes are sharp and organic.' }),
      hint: 'Ignore the other two cups. Follow only the one with the ✓, all the way through the shuffle.',
    },
    {
      key: 'mixer', type: 'puzzle',
      prompt: { small: 'Mix this exact shade of', big: 'CAPTCHA blue', sub: 'Use the three sliders.' },
      config: { game: 'mixer', target: [63, 127, 224] },
      validate: (a) => (a.dist < 45 ? { ok: true, msg: 'That’s the one. Corporate blue achieved.' } : { ok: false, msg: a.dist < 90 ? 'Close! A little more fine-tuning.' : 'Not quite that blue yet.' }),
      hint: 'Low red (about a quarter), medium green (about half), lots of blue (nearly all the way).',
    },
    {
      key: 'sortfood', type: 'drag',
      prompt: { small: 'Sort the pictures:', big: 'food or not food', sub: 'Do not eat the bench.' },
      config: {
        mode: 'sort',
        bins: [{ id: 'food', label: '🍽️ Food' }, { id: 'no', label: '🚫 Not food' }],
        items: [P('sandwich-1'), P('burger-1'), P('taco-1'), P('icecream-1'), P('cat-2'), P('bench-1'), P('key-3'), P('car-3')].map((t, i) => Object.assign(t, { bin: i < 4 ? 'food' : 'no' })),
      },
      validate: () => ({ ok: true, msg: 'Perfectly sorted. Nobody ate the bench.' }),
      hint: 'Sandwich, burger, taco and ice cream are food. Cat, bench, key and car are not (please).',
    },

    // ----- Act II additions (arcade time)
    {
      key: 'dash1', type: 'arcade',
      prompt: { small: 'New verification method:', big: 'Checkbox Dash', sub: 'Jump over the spikes. To the beat, if you like.' },
      config: { game: 'runner', speed: 8, floor: course('........', '...^.......', '....^......', '...^^......', '...#.......', '..^.....^..', '...##......', '..^^^......', '...=.......', '..#^#......', '...^....^..', '..C........', '..^^.......', '..##^......', '...=^......', '.^.....^.....^', '..........') },
      validate: (a) => ({ ok: true, msg: a.attempts === 1 ? 'First try?! Either very human or very robot.' : `Cleared in ${a.attempts} attempts. Respectably human.` }),
      hint: 'Press when you are just in front of a spike. You can hold the button to keep bouncing. After a death you restart from the last green flag.',
    },
    {
      key: 'snake', type: 'arcade',
      prompt: { small: 'Feed the CAPTCHA', big: '8 checkmarks', sub: 'It is very hungry. It is also a snake.' },
      config: { game: 'snake', goal: 8, speed: 0.14 },
      validate: () => ({ ok: true, msg: 'Fed. The CAPTCHA snake is satisfied and slightly longer.' }),
      hint: 'Plan turns early, and don’t turn back into yourself. Use the arrow keys, swipe, or the on-screen buttons.',
    },
    {
      key: 'alex', type: 'embed',
      prompt: { small: 'Something is coming.', big: 'Survive the Alex chase', sub: 'Outrun Alex (Seek) through every room until the door slams. Full screen recommended.' },
      config: {
        src: 'assets/games/library/index.html?captcha=alex', source: 'isnar-alex', title: 'Survive Alex', widgetClass: 'wide',
        goodLuck: 'Run. Don’t look back. (Okay, look back a little.)', retryTip: 'You know the route now.',
        deathLines: ['Alex caught you. He says hi. Run again!', 'Slimed! Follow the blue orbs this time.', 'Too slow! Hold Space to sprint.'],
      },
      validate: (a) => ({ ok: true, msg: a.deaths ? `Outran Alex after ${a.deaths} slimy encounter${a.deaths === 1 ? '' : 's'}. Verified, and slightly sticky.` : 'Outran Alex on the first try. He’s writing a strongly worded review. Verified.' }),
      hint: 'Walk forward until the chase starts, then hold Space to sprint. Follow the blue Guiding Light orbs, take the lane without slime, and duck (Shift) under beams. Don’t stop until the door slams behind you.',
    },
    {
      key: 'flap', type: 'arcade',
      prompt: { small: 'Deliver this paper plane', big: 'through 6 gaps', sub: 'Tap to flap. Planes don’t flap. Don’t think about it.' },
      config: { game: 'flap', goal: 6, gap: 82 },
      validate: () => ({ ok: true, msg: 'Delivered. Airmail of the highest quality.' }),
      hint: 'Small, regular taps are better than big panicky ones. Aim for the lower half of each gap.',
    },
    {
      key: 'lights', type: 'puzzle',
      prompt: { small: 'Save electricity:', big: 'turn every light off', sub: 'Each switch is wired to its neighbours.' },
      config: { game: 'lights', n: 3, presses: 3, goal: 'off', icon: '💡' },
      validate: () => ({ ok: true, msg: 'All dark. The planet thanks you.' }),
      hint: 'Pressing a light twice undoes it. Try pressing the lights that are on in the top row, then fix the next row by pressing the squares directly below any light that is still on.',
    },
    {
      key: 'dodge', type: 'arcade',
      prompt: { small: 'Survive', big: '15 seconds of pop-ups', sub: 'The internet, distilled.' },
      config: { game: 'dodge', duration: 15 },
      validate: () => ({ ok: true, msg: 'Untouched by a single pop-up. A digital miracle.' }),
      hint: 'Stay near the middle so you can escape either way, and move early rather than late.',
    },
    {
      key: 'dash2', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'Level 2: Mind the gap', sub: 'Yellow orbs give you a mid-air jump.' },
      config: { game: 'runner', speed: 8, floor: course('........', '...__.......', '...___......', '..#__#......', '..^__.......', '...__O__.......', '...=.=.=......', '...#=#.......', '..C.........', '...___O___......', '..#.#.#......', '..^.^.......', '...#__#......', '..=...=.......', '...___O___O___......', '..........') },
      validate: (a) => ({ ok: true, msg: `Gaps minded. ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}.` }),
      hint: 'Over a long gap, jump, then tap again when you touch a yellow orb to jump in mid-air.',
    },
    {
      key: 'pong', type: 'arcade',
      prompt: { small: 'A robot challenges you to', big: 'Pong', sub: 'First to 3. The robot is overconfident.' },
      config: { game: 'pong', mode: 'vs', to: 3, robotSpeed: 140 },
      validate: (a) => ({ ok: true, msg: `${a.you}–${a.robot}. The robot demands a rematch. Denied.` }),
      hint: 'Hit the ball with the end of your paddle to send it at a steep angle: the robot is slow to react to those.',
    },
    {
      key: 'pipes', type: 'puzzle',
      prompt: { small: 'Plumbing CAPTCHA:', big: 'connect the pipes', sub: 'Tap a piece to rotate it.' },
      config: { game: 'pipes', cols: 5, rows: 4, theme: 'pipe' },
      validate: () => ({ ok: true, msg: 'Water flows. You are now a verified plumber.' }),
      hint: 'Start at the tap on the left and follow the lit (blue) pipes. Rotate the next piece until it lights up too.',
    },
    {
      key: 'library', type: 'embed',
      prompt: { small: 'Special verification:', big: 'Escape the Library', sub: 'Beat Mrs. C’s Library to prove you’re human. Full screen recommended.' },
      config: { src: 'assets/games/library/index.html?captcha=library', source: 'isnar-library', title: 'Escape the Library', widgetClass: 'wide', goodLuck: 'Good luck. Stay quiet.', retryTip: 'You know where the books are now.', deathLines: ['Mrs. C caught you. Shhh… and try again.', 'Too loud! The library claims another visitor.', 'Caught! Crouch next time.'] },
      validate: (a) => ({ ok: true, msg: a.deaths ? `Escaped after ${a.deaths} encounter${a.deaths === 1 ? '' : 's'} with Mrs. C. Shhh… you’re verified.` : 'Escaped without a single encounter. Mrs. C never even heard you. Verified.' }),
      hint: 'Crouch (Shift) to stay quiet. Read the note on the desk for the symbol order, find the 5 glowing books for the digits, then enter the code on the padlocked exit door and RUN. Throw books (F) to distract her.',
    },
    {
      key: 'stack', type: 'arcade',
      prompt: { small: 'Build a tower', big: '8 blocks high', sub: 'Overhangs get trimmed off.' },
      config: { game: 'stack', goal: 8 },
      validate: () => ({ ok: true, msg: 'A fine tower. It leans a little. Like Pisa. Like people.' }),
      hint: 'Drop each block when it lines up with the one below. The tower gets narrower when you miss.',
    },
    {
      key: 'mastermind', type: 'puzzle',
      prompt: { small: 'Crack the', big: '4-colour code', sub: 'Eight guesses. Feedback after each one.' },
      config: { game: 'mastermind', kind: 'color', length: 4, guesses: 8 },
      validate: (a) => ({ ok: true, msg: `Cracked in ${a.guesses} guess${a.guesses === 1 ? '' : 'es'}. The vault is impressed.` }),
      hint: 'Start with guesses like 🔴🔴🟠🟠 to learn which colours are in the code, then use ✅ (right place) to pin them down.',
    },
    {
      key: 'maze', type: 'arcade',
      prompt: { small: 'Steady hands:', big: 'guide the dot to ✓', sub: 'Touch a wall and you start over.' },
      config: { game: 'maze', cols: 9, rows: 7 },
      validate: () => ({ ok: true, msg: 'Not a single wall touched. Surgeon-level.' }),
      hint: 'Drag slowly and keep the dot in the middle of the corridors. Arrow keys work too.',
    },
    {
      key: 'darts', type: 'arcade',
      prompt: { small: 'Hit the bullseye', big: '2 times out of 3', sub: 'The crosshair has had too much coffee.' },
      config: { game: 'darts', hits: 2, throws: 3, sway: 70 },
      validate: () => ({ ok: true, msg: 'Bullseye! Twice! Pub legend status.' }),
      hint: 'Don’t chase it. Wait for the crosshair to drift through the red centre and tap just before it gets there.',
    },
    {
      key: 'golf', type: 'arcade',
      prompt: { small: 'Mini golf:', big: 'sink the ball', sub: 'Par 3. There is a wall in the way. Obviously.' },
      config: { game: 'golf', ball: { x: 50, y: 170 }, hole: { x: 250, y: 55 }, walls: [[140, 30, 16, 130], [200, 120, 70, 14]], par: 3 },
      validate: (a) => ({ ok: true, msg: a.strokes === 1 ? 'Hole in one?! The CAPTCHA is calling the newspapers.' : `In ${a.strokes}. Under par counts as human.` }),
      hint: 'Drag backwards from the ball (like a slingshot) and let go. Bank it off the top edge to get around the wall.',
    },
    {
      key: 'hanoi', type: 'puzzle',
      prompt: { small: 'Move the stack to', big: 'the right-hand peg', sub: 'Big disks never sit on small ones.' },
      config: { game: 'hanoi', disks: 3 },
      validate: (a) => ({ ok: true, msg: a.moves === 7 ? '7 moves: the perfect solution. Hm. Suspicious.' : `${a.moves} moves. Wonderfully inefficient. Very human.` }),
      hint: 'Small disk to the right peg, medium to the middle, small onto medium. Then big to the right, and undo the first three moves onto it.',
    },
    {
      key: 'dash3', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'Level 3: Upside down', sub: 'Purple portals flip gravity.' },
      config: { game: 'runner', speed: 8, ...lanes([['........', ''], ['...^....^^....', ''], ['G', ''], ['.........................', '.......v.....vv....__....'], ['G', ''], ['.........^....^....', ''], ['C', ''], ['...^^.....', ''], ['G', ''], ['........................', '......v.....#.....vv....'], ['G', ''], ['......^^......', '']]) },
      validate: (a) => ({ ok: true, msg: `Gravity: defeated. ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}.` }),
      hint: 'After a purple portal you run on the ceiling and your jump goes downward. The spikes there point down at you.',
    },
    {
      key: 'lander', type: 'arcade',
      prompt: { small: 'Land the checkbox', big: 'gently on the pad', sub: 'Under 45 speed. The moon is watching.' },
      config: { game: 'lander', gravity: 70, fuel: 100 },
      validate: (a) => ({ ok: true, msg: `Touchdown at ${Math.round(a.vy)}. The eagle has landed. (It’s a checkbox.)` }),
      hint: 'Let it fall for a moment, then hold the thruster in short bursts so the speed stays under 45 as you get close.',
    },
    {
      key: 'shooter', type: 'arcade',
      prompt: { small: 'Spam incoming:', big: 'filter 15 emails', sub: 'Three get through and your inbox explodes.' },
      config: { game: 'shooter', goal: 15, maxMissed: 3, enemy: '📧' },
      validate: () => ({ ok: true, msg: 'Inbox zero. A rare, beautiful, human achievement.' }),
      hint: 'You fire automatically. Just slide under the lowest email each time.',
    },
    {
      key: 'typing', type: 'puzzle',
      prompt: { small: 'Words are falling.', big: 'Type them to catch them', sub: 'Ten words. Three may land.' },
      config: { game: 'typing', goal: 10, maxMissed: 3, words: ['human', 'pixel', 'robot', 'click', 'cookie', 'verify', 'banana', 'socks', 'kitten', 'cloud', 'pancake', 'marble', 'tulip', 'bus', 'frog', 'waffle'] },
      validate: () => ({ ok: true, msg: 'Ten words caught. Your fingers are definitely organic.' }),
      hint: 'Type the lowest word first. A word disappears as soon as it’s spelled correctly, with no Enter needed.',
    },
    {
      key: 'rhythm', type: 'arcade',
      prompt: { small: 'Prove you have rhythm:', big: 'hit 80% of the notes', sub: 'Tap a lane as each note crosses the line.' },
      config: { game: 'rhythm', bpm: 100, need: 0.8 },
      validate: (a) => ({ ok: true, msg: `${Math.round(a.acc * 100)}% accuracy. You could start a band.` }),
      hint: 'Tap when a note is ON the white line, not when you first see it. Keyboard: A S D (or J K L, or ← ↓ →).',
    },
    {
      key: 'dash4', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'Level 4: Flight mode', sub: 'Green portal: hold to rise, let go to fall.' },
      config: { game: 'runner', speed: 8, ...lanes([['........', ''], ['...^.....^^......', ''], ['F', ''], ['....A....A.....A......A....A......', '..........V......V.....V......V...'], ['C', ''], ['..A...A...A...A.......', '....V...V...V...V.....'], ['R', ''], ['.......^......^^.....', '']]) },
      validate: (a) => ({ ok: true, msg: `Flight logged. ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}.` }),
      hint: 'In flight mode, hold to go up and let go to drift down. Gentle taps keep you level. Stay in the middle of the corridor.',
    },

    // ----- Act III additions (meta)
    {
      key: 'popups', type: 'puzzle',
      prompt: { small: 'Before we continue…', big: 'a few quick pop-ups', sub: 'Close them all. Carefully.' },
      config: {
        game: 'popups',
        popups: [
          { title: 'Newsletter!', body: 'Get 0% off your next verification!', yes: 'Subscribe!!', close: 'link', closeText: 'No thanks, I hate saving 0%' },
          { title: 'Rate us ⭐⭐⭐⭐⭐', body: 'How would you rate this CAPTCHA so far?', yes: '5 stars!', close: 'x' },
          { title: 'Cookies?', body: 'This CAPTCHA uses cookies to remember that you are suspicious.', yes: 'Accept all', close: 'button', closeText: 'Reject all', fake: true },
          { title: 'Wait! Before you go…', body: 'Are you sure you want to stop seeing pop-ups?', yes: 'Show me more', close: 'link', closeText: 'Yes, I am sure' },
          { title: 'Survey (1 of 40)', body: 'How did you feel about the previous pop-up?', yes: 'Start survey', close: 'x' },
        ],
      },
      validate: () => ({ ok: true, msg: 'All closed. You have survived the modern web.' }),
      hint: 'Never press the big friendly button. Look for the small “No thanks” link, a plain close button, or the × in the title bar (one × is fake).',
    },
    {
      key: 'cps', type: 'puzzle',
      prompt: { small: 'Speed check:', big: '25 clicks in 6 seconds', sub: 'Robots are fast. Humans are… enthusiastic.' },
      config: { game: 'cps', need: 25, time: 6 },
      validate: (a) => ({ ok: true, msg: `${a.n} clicks in ${a.t.toFixed(1)} s. Your finger needs a little rest.` }),
      hint: 'Use two fingers alternately on a touchscreen, or tap the trackpad lightly. About 4 taps per second does it.',
    },
    {
      key: 'loadbits', type: 'timed',
      prompt: { small: 'Loading is slow today.', big: 'Catch the bits to help', sub: '12 blue bits. Avoid the bugs.' },
      config: { mode: 'catch', good: '🟦', bad: '🐛', goodLabel: '🟦 bits', goal: 12, badRate: 0.25, resetOnBad: false, badMsg: 'You caught a bug. It’s in the code now. (−0, but ew.)', spawn: 0.6 },
      validate: () => ({ ok: true, msg: 'Loaded 100%. You are now a download.' }),
      hint: 'Tap the blue squares as they fall. Tapping a bug doesn’t reset anything, but counts as a mistake.',
    },
    {
      key: 'dashmirror', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'loaded backwards', sub: 'Same rules. Opposite direction.' },
      config: { game: 'runner', speed: 8, mirror: true, floor: course('........', '...^.......', '..^^.......', '...#^......', '..^....^...', '...=.......', '..C........', '..^^^......', '...#.#.....', '..^...^....', '...__O__......', '..........') },
      validate: (a) => ({ ok: true, msg: `Forwards, backwards: all the same to you. ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}.` }),
      hint: 'Everything runs right-to-left now, so spikes come from the left. The timing is exactly the same.',
    },
    {
      key: 'cursor', type: 'puzzle',
      prompt: { small: 'Six cursors. One is you.', big: 'Tick the checkbox', sub: 'Your cursor has been… duplicated.' },
      config: { game: 'cursor' },
      validate: () => ({ ok: true, msg: 'You found yourself. That’s the most human thing of all.' }),
      hint: 'Move slowly and watch which arrow moves exactly with your hand when you stop. Clicks count where YOUR pointer really is.',
    },
    {
      key: 'tabs', type: 'puzzle',
      prompt: { small: 'Too many tabs open.', big: 'Close all but the CAPTCHA', sub: 'You know the ones.' },
      config: { game: 'tabs' },
      validate: () => ({ ok: true, msg: 'One tab. Peak focus. Your computer breathes a sigh of relief.' }),
      hint: 'Close every tab except “stillCAPTCHA” using its ×. Some sneaky tabs come back once: close them again.',
    },
    {
      key: 'installer', type: 'puzzle',
      prompt: { small: 'stillCAPTCHA needs an update.', big: 'Install it (carefully)', sub: 'Read every screen.' },
      config: { game: 'installer' },
      validate: (a) => (a.toolbar || a.homepage
        ? { ok: false, msg: a.toolbar ? 'You installed the Robot Toolbar. It now lives in your browser. Uninstalled. Try again, and read the options.' : 'Your homepage is now robots.example. Reverted. Read the options this time.' }
        : { ok: true, msg: 'Clean install. No toolbars. You are a pop-up survivor.' }),
      hint: 'Accept the licence, then UNTICK the toolbar and homepage options. On that page, Next and Back swap places.',
    },
    {
      key: 'nested', type: 'puzzle',
      prompt: { small: 'To verify this CAPTCHA,', big: 'verify the CAPTCHAs inside it', sub: 'It’s CAPTCHAs all the way down.' },
      config: { game: 'nested' },
      validate: () => ({ ok: true, msg: 'Three CAPTCHAs deep and back. Inception-level verification.' }),
      hint: 'Work from the inside out: tick the innermost box, type OK and verify the middle one, then verify everything.',
    },
    {
      key: 'lagmaze', type: 'arcade',
      prompt: { small: 'Your connection is', big: 'lagging', sub: 'Everything you do arrives half a second late.' },
      config: { game: 'maze', cols: 7, rows: 5, lag: 0.45 },
      validate: () => ({ ok: true, msg: 'Navigated with lag. You have the patience of a dial-up modem.' }),
      hint: 'Move a little, then stop and wait for the dot to catch up. Never drag faster than the dot.',
    },
    {
      key: 'breakwidget', type: 'arcade',
      prompt: { small: 'This one’s personal:', big: 'break the widget', sub: 'Yes, this one. Go on.' },
      config: { game: 'breakout', title: 'BREAK THE WIDGET', bricks: [['Header', 'Prompt', 'Prompt', 'Header'], ['Tile', 'Tile', 'Tile', 'Tile', 'Tile'], ['Tile', 'Tile', 'Tile', 'Tile', 'Tile'], ['Reload', 'Audio', 'Info', 'VERIFY']], lives: 3 },
      validate: () => ({ ok: true, msg: 'Widget destroyed. It rebuilt itself immediately. It does that.' }),
      hint: 'Same as before: angle the ball with the edges of the paddle. The VERIFY brick is the most satisfying one.',
    },
    {
      key: 'volume', type: 'puzzle',
      prompt: { small: 'Set the volume to', big: 'exactly 37', sub: 'Our designer was “experimental”.' },
      config: { game: 'volume', target: 37 },
      validate: (a) => (a.v === a.target ? { ok: true, msg: '37. Perfectly mediocre volume.' } : { ok: false, msg: `That’s ${a.v}. We need 37.` }),
      hint: 'Turn the knob 3.7 times (one turn = 10), or click: +7 six times = 42, then −3 … wait, that’s 39. Try +7 ×4 = 28, then +7 = 35… or just use the arrow keys on the knob.',
    },
    {
      key: 'whackerrors', type: 'arcade',
      prompt: { small: 'The CAPTCHA is throwing errors.', big: 'Whack the errors', sub: 'Not the success messages.' },
      config: { game: 'whack', goal: 10, good: '⚠️', bad: '✅', badMsg: 'That was a success message! Those are rare. (−3)' },
      validate: () => ({ ok: true, msg: 'Errors squashed. If only real debugging were this fun.' }),
      hint: 'Tap only ⚠️. Tapping ✅ costs 3 points.',
    },
    {
      key: 'snakebanners', type: 'arcade',
      prompt: { small: 'Snake, but the walls are', big: 'cookie banners', sub: 'Eat 8. Avoid the 🍪.' },
      config: { game: 'snake', goal: 8, speed: 0.14, walls: 'banners' },
      validate: () => ({ ok: true, msg: 'Fed without accepting a single cookie. Privacy champion.' }),
      hint: 'Treat the 🍪 strips like walls. Go around them early, not at the last second.',
    },
    {
      key: 'shootads', type: 'arcade',
      prompt: { small: 'Ad blocker offline.', big: 'Block 15 ads manually', sub: 'Three get through and you buy something.' },
      config: { game: 'shooter', goal: 15, maxMissed: 3, enemy: '📢' },
      validate: () => ({ ok: true, msg: 'Ads blocked. Nothing was purchased. Your wallet salutes you.' }),
      hint: 'Slide under the lowest ad. Your blocker fires on its own.',
    },
    {
      key: 'wires', type: 'puzzle',
      prompt: { small: 'The internet is unplugged.', big: 'Reconnect the wires', sub: 'Tap to rotate.' },
      config: { game: 'pipes', cols: 5, rows: 4, theme: 'wire' },
      validate: () => ({ ok: true, msg: 'Online again. The CAPTCHA can continue questioning you. Yay.' }),
      hint: 'Start from the plug on the left and rotate pieces until the yellow current flows all the way to the globe.',
    },
    {
      key: 'codedigits', type: 'puzzle',
      prompt: { small: 'Guess the CAPTCHA’s', big: '4-digit PIN', sub: 'It changed it from 1234. Probably.' },
      config: { game: 'mastermind', kind: 'digit', length: 4, guesses: 10 },
      validate: (a) => ({ ok: true, msg: `Cracked in ${a.guesses}. The CAPTCHA is changing its PIN to 1235.` }),
      hint: 'Try 0000, 1111, 2222… first to find out which digits are in it (✅ tells you how many). Then work out the order.',
    },
    {
      key: 'bells', type: 'puzzle',
      prompt: { small: 'Too many notifications.', big: 'Silence them all', sub: 'Each one is linked to its neighbours.' },
      config: { game: 'lights', n: 4, presses: 4, goal: 'off', icon: '🔔' },
      validate: () => ({ ok: true, msg: 'Silence. Blissful, notification-free silence.' }),
      hint: 'Clear the top row by tapping squares in the row below any lit bell, then repeat row by row. If the bottom row is left, use the board’s symmetry, or just experiment: pressing twice undoes.',
    },
    {
      key: 'stackwidgets', type: 'arcade',
      prompt: { small: 'Verified humans get', big: 'a tower of checkmarks', sub: 'Stack 7 verified blocks.' },
      config: { game: 'stack', goal: 7, label: 'widget' },
      validate: () => ({ ok: true, msg: 'Seven verifications high. You can see your house from up here.' }),
      hint: 'Drop when the moving block lines up with the top of the tower.',
    },
    {
      key: 'flapverify', type: 'arcade',
      prompt: { small: 'The Verify button escaped.', big: 'Fly it home', sub: '5 gaps. It’s not built for this.' },
      config: { game: 'flap', goal: 5, gap: 86, sprite: 'verify' },
      validate: () => ({ ok: true, msg: 'The Verify button is home. It will never leave again. (It will.)' }),
      hint: 'Gentle, regular taps. The button is wide, so give the gap walls a bit of room.',
    },
    {
      key: 'rhythm2', type: 'arcade',
      prompt: { small: 'The CAPTCHA hums its', big: 'theme song', sub: 'Play along. 80% or better.' },
      config: { game: 'rhythm', bpm: 112, need: 0.8, pattern: [[0, 1], [1, 1], [2, 0], [3, 2], [4, 1], [4.5, 1], [5, 0], [6, 2], [7, 2], [8, 1], [9, 0], [10, 1], [11, 2], [12, 0], [12.5, 1], [13, 2], [14, 1], [15, 1], [16, 0], [17, 2], [18, 1]] },
      validate: (a) => ({ ok: true, msg: `${Math.round(a.acc * 100)}%. The CAPTCHA has never felt so seen.` }),
      hint: 'Listen to the ticks: notes land on them (some land halfway between). Keyboard A S D is easiest.',
    },
    {
      key: 'quizreal', type: 'choice',
      prompt: { small: 'Quick check:', big: 'Which is a real CAPTCHA instruction?', sub: 'Only one of these exists in the wild.' },
      config: {
        shuffle: true,
        options: [
          { label: 'Select all squares with traffic lights', correct: true },
          { label: 'Select all squares that are judging you' },
          { label: 'Select all squares with feelings' },
          { label: 'Select all squares. All of them. Now.' },
        ],
      },
      validate: (a) => (a.correct ? { ok: true, msg: 'Traffic lights. The eternal classic. (The others are in this game though.)' } : { ok: false, msg: 'That one only exists in this game. And maybe in your dreams.' }),
      hint: 'Real CAPTCHAs are boring. Pick the boring one.',
    },
    {
      key: 'dash5', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'Level 5: ERROR EDITION', sub: 'Faster. Everything at once.' },
      config: { game: 'runner', speed: 9, ...lanes([['........', ''], ['..^^......', ''], ['..#^.......', ''], ['..__O__.......', ''], ['C', ''], ['G', ''], ['........................', '.....vv.....v.v.....__...'], ['G', ''], ['.......', ''], ['C', ''], ['F', ''], ['...A.....A....A.....', '......V....V.....V..'], ['R', ''], ['......^^^.......#^.......', '']]) },
      validate: (a) => ({ ok: true, msg: `ERROR: player too human. ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}.` }),
      hint: 'It’s every trick so far at a higher speed: orbs, gravity flips and flight. Green flags save your progress.',
    },

    // ----- Act IV additions (existential, gentler)
    {
      key: 'breathe', type: 'hold',
      prompt: { small: 'Let’s slow down.', big: 'Breathe with the circle', sub: 'Hold while it grows. Let go while it shrinks.' },
      config: { mode: 'breathe', inhale: 4, exhale: 4, cycles: 3 },
      validate: (a) => (a.sync >= 0.7 ? { ok: true, msg: `${Math.round(a.sync * 100)}% in sync. Calmer? The CAPTCHA is.` } : { ok: false, msg: 'A little out of sync. No rush, let’s breathe again.' }),
      hint: 'Press and hold as the circle grows (4 seconds), release as it shrinks (4 seconds). Three times.',
    },
    {
      key: 'mirrordraw', type: 'draw',
      prompt: { small: 'Draw anything.', big: 'It will be mirrored', sub: 'Symmetry is soothing.' },
      config: { mode: 'mirror', color: '#8e44ad' },
      validate: () => ({ ok: true, msg: U.pick(['A butterfly. Definitely a butterfly.', 'A face! Or a vase. Or two faces. Art.', 'Perfectly symmetrical. Unlike Tuesdays.']) }),
      hint: 'Draw anything on either side. When there’s enough ink, press Verify.',
    },
    {
      key: 'jigsawbeach', type: 'puzzle',
      prompt: { small: 'A memory got scrambled.', big: 'Piece it back together', sub: 'Tap two pieces to swap.' },
      config: { game: 'swap', src: 'beach-1', n: 3 },
      validate: () => ({ ok: true, msg: 'A beach. You can almost hear it.' }),
      hint: 'Fix the corners first: look for sky (top) and sand (bottom).',
    },
    {
      key: 'garden', type: 'arcade',
      prompt: { small: 'A small plant needs you.', big: 'Water it just right', sub: 'Not too much. Not too little.' },
      config: { game: 'meter', theme: 'water', need: 3 },
      validate: () => ({ ok: true, msg: 'The plant grew a tiny new leaf. It’s named after you.' }),
      hint: 'Tap when the black marker is inside the green zone. Three in a row; the zone shrinks each time.',
    },
    {
      key: 'moodcolor', type: 'puzzle',
      prompt: { small: 'Mix the colour of', big: 'your mood', sub: 'There is no wrong colour.' },
      config: { game: 'mixer', any: true },
      validate: (a) => {
        const [r, g, b] = a.rgb;
        const msg = r > g + 40 && r > b + 40 ? 'Warm and fiery. Big feelings today.' : b > r + 40 && b > g + 20 ? 'A blue mood. Calm, or a little sad. Both are allowed.' : g > r + 30 && g > b + 30 ? 'Green: growing, maybe. Or hungry for salad.' : r + g + b > 600 ? 'Bright, nearly white. Light as air.' : r + g + b < 150 ? 'Dark. Thank you for being honest. Here’s a virtual blanket.' : 'A complicated in-between colour. The most human kind.';
        return { ok: true, msg };
      },
      hint: 'Move the sliders until it feels right, then Verify. Every colour is accepted.',
    },
    {
      key: 'cloudshape', type: 'choice',
      prompt: { small: 'Look up.', big: 'What does this cloud look like?', sub: 'Squint if you need to.' },
      config: {
        image: 'cloud-1',
        options: [
          { icon: '🐑', label: 'A sheep', msg: 'A sheep. Everyone sees the sheep. It’s always a sheep.' },
          { icon: '🐉', label: 'A dragon', msg: 'A dragon! The CAPTCHA sees it now too. It’s breathing fire. Small fire.' },
          { icon: '☁️', label: 'A cloud', msg: 'Technically correct. The most robotic answer, delivered with human sass.' },
          { icon: '🧩', label: 'A CAPTCHA', msg: 'Oh no. You’re seeing CAPTCHAs in the sky now. That’s on us.' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.msg }),
      hint: 'Any answer works.',
    },
    {
      key: 'kite', type: 'arcade',
      prompt: { small: 'A windy afternoon.', big: 'Keep the kite flying', sub: '12 seconds. The wind has opinions.' },
      config: { game: 'flap', kite: true, duration: 12 },
      validate: () => ({ ok: true, msg: 'Twelve seconds of kite. Best afternoon in ages.' }),
      hint: 'Tap gently to lift it when it sinks. Don’t let it touch the grass or the top of the sky.',
    },
    {
      key: 'skipstones', type: 'arcade',
      prompt: { small: 'At the lake:', big: 'skip a stone three times', sub: 'It’s all in the wrist.' },
      config: { game: 'meter', theme: 'stone', need: 3 },
      validate: () => ({ ok: true, msg: 'Skip, skip, skip. The lake is impressed.' }),
      hint: 'Tap when the marker is in the green, three times in a row.',
    },
    {
      key: 'balance', type: 'arcade',
      prompt: { small: 'Find your balance', big: 'for 12 seconds', sub: 'Small movements.' },
      config: { game: 'balance', duration: 12 },
      validate: () => ({ ok: true, msg: 'Balanced. Like a well-rested human with a snack.' }),
      hint: 'Tilt gently toward the side the ball is rolling away from. Small corrections beat big ones.',
    },
    {
      key: 'dashcalm', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'Sunset run', sub: 'No spikes this time. Just stars, if you want them.' },
      config: { game: 'runner', speed: 7, calm: true, hintText: 'Nothing can hurt you here', floor: course('..........', '....*......', '.....*.....', '...*...*...', '...........', '....*......', '.....*..*..', '...........', '...*.......', '.....*.....', '....*...*..', '...........') },
      validate: (a) => ({ ok: true, msg: a.stars ? `You collected ${a.stars} star${a.stars === 1 ? '' : 's'}. All of them count.` : 'You just ran. Sometimes that’s enough.' }),
      hint: 'There’s nothing to fail here. Jump for stars if you like, or just enjoy the view.',
    },
    {
      key: 'fishing', type: 'arcade',
      prompt: { small: 'Gone fishing.', big: 'Reel in three fish', sub: 'Patience, then timing.' },
      config: { game: 'meter', theme: 'fish', need: 3 },
      validate: () => ({ ok: true, msg: 'Three fish caught… and gently released. They were verified too.' }),
      hint: 'Tap when the marker is in the green zone, three times in a row.',
    },
    {
      key: 'worries', type: 'puzzle',
      prompt: { small: 'Write down three small worries', big: 'and let them go', sub: 'They float away. Nothing is saved.' },
      config: { game: 'worries', need: 3 },
      validate: () => ({ ok: true, msg: 'Three lanterns, drifting away. Nothing was saved. Promise.' }),
      hint: 'Type anything (even one word) and press “Let it go”, three times.',
    },
    {
      key: 'stars', type: 'puzzle',
      prompt: { small: 'Make your own', big: 'constellation', sub: 'Tap at least 4 stars to connect them.' },
      config: { game: 'stars', need: 4 },
      validate: (a) => ({ ok: true, msg: a.name ? `“${a.name}” is now in the sky. Astronomers have been notified (they haven’t).` : 'An unnamed constellation. Mysterious. Very you.' }),
      hint: 'Tap 4 or more stars in any order, name it if you like, then Verify.',
    },
    {
      key: 'shootingstars', type: 'timed',
      prompt: { small: 'Make a wish:', big: 'catch 4 shooting stars', sub: 'They’re quick. Wishes usually are.' },
      config: { mode: 'catch', good: '🌠', goodLabel: '🌠 wishes', goal: 4, badRate: 0, spawn: 1.0, minSpeed: 30, maxSpeed: 44 },
      validate: () => ({ ok: true, msg: 'Four wishes. The CAPTCHA wished for you to pass. Granted.' }),
      hint: 'Tap each 🌠 as it falls. There is nothing to avoid.',
    },
    {
      key: 'pairsfeelings', type: 'puzzle',
      prompt: { small: 'Every feeling has', big: 'a match', sub: 'Pair them up.' },
      config: { game: 'pairs', kind: 'emoji', items: ['😊', '😢', '😤', '🥰', '😴', '🤔'] },
      validate: () => ({ ok: true, msg: 'All matched. Feelings are less scary in pairs.' }),
      hint: 'Flip two cards at a time and remember where each face was.',
    },
    {
      key: 'stackcalm', type: 'arcade',
      prompt: { small: 'Build something small.', big: 'Just five blocks', sub: 'No rush at all.' },
      config: { game: 'stack', goal: 5 },
      validate: () => ({ ok: true, msg: 'Small and steady. A good thing to build.' }),
      hint: 'Drop when the moving block is over the tower.',
    },
    {
      key: 'letter', type: 'text',
      prompt: { small: 'Write a short note', big: 'to future you', sub: 'At least five words. Nobody else will read it.' },
      config: { mode: 'free', render: 'none', minWords: 5, placeholder: 'Dear future me…' },
      validate: () => ({ ok: true, msg: 'Sealed. Future you will be glad you wrote it. (It isn’t stored anywhere.)' }),
      hint: 'Anything of five words or more. It isn’t saved or sent anywhere.',
    },

    // ----- Act V additions (with the robot)
    {
      key: 'teach', type: 'puzzle',
      prompt: { small: 'The robot wants to learn.', big: 'Teach it what a cat is', sub: 'Then it takes a test.' },
      config: { game: 'teach', train: [['cat-1', true], ['bench-1', false], ['cat-4', true], ['car-1', false], ['cat-2', true], ['sandwich-1', false]], test: [['cat-3', true], ['house-1', false], ['cone-1', false]] },
      validate: () => ({ ok: true, msg: 'The robot passed its first exam. It looks at you the way you once looked at bicycles.' }),
      hint: 'Label each picture honestly: cats are cats, everything else is not a cat.',
    },
    {
      key: 'repair', type: 'drag',
      prompt: { small: 'The robot is falling apart.', big: 'Put its parts back', sub: 'Drag each part onto its outline.' },
      config: {
        mode: 'pairs', ghost: true, targetLabel: 'Robot (missing parts)', trayLabel: 'Spare parts',
        items: [{ id: 'gear', art: 'emoji', opts: { e: '⚙️' } }, { id: 'bat', art: 'emoji', opts: { e: '🔋' } }, { id: 'heart', art: 'emoji', opts: { e: '❤️' } }, { id: 'bulb', art: 'emoji', opts: { e: '💡' } }],
        wrongMsg: 'That part goes somewhere else.',
      },
      validate: () => ({ ok: true, msg: 'All parts in. It has a heart now. It had one before, actually. Now it’s spare.' }),
      hint: 'Match each part to its faded outline: gear on gear, battery on battery, and so on.',
    },
    {
      key: 'robotquiz', type: 'choice',
      prompt: { small: 'The robot made you a quiz', big: 'about your journey', sub: 'It was paying attention.' },
      config: {
        mode: 'quiz',
        rounds: [
          { q: 'What was the secret word in the terms of service?', options: [{ label: 'Marmalade', correct: true }, { label: 'Pancake' }, { label: 'Banana' }, { label: 'Verify' }] },
          { q: 'What did you spell with the rotating letter tiles?', options: [{ label: 'ROBOT' }, { label: 'HUMAN', correct: true }, { label: 'TRUST' }, { label: 'HELLO' }] },
          { q: 'Which animal kept hopping away from your clicks?', options: [{ label: 'A duck' }, { label: 'A cat' }, { label: 'A frog', correct: true }, { label: 'A robot' }] },
          { q: 'What did the volume knob need to be set to?', options: [{ label: '42' }, { label: '37', correct: true }, { label: '100' }, { label: '11' }] },
        ],
      },
      validate: () => ({ ok: true, msg: 'Four for four. The robot is proud. It remembers everything. You remember the important bits.' }),
      hint: 'Marmalade. HUMAN. A frog. 37.',
    },
    {
      key: 'robotmaze', type: 'puzzle',
      prompt: { small: 'The robot is low on battery.', big: 'Program its route', sub: 'Add moves, then press Run.' },
      config: { game: 'program', max: 14, map: ['S..#.', '.#...', '.#.#.', '...#G', '##...'] },
      validate: (a) => ({ ok: true, msg: `${a.moves} moves to the battery. The robot is charged and grateful.` }),
      hint: 'Down 3, right 2, up 2, right 2, down 2. (One of several routes.)',
    },
    {
      key: 'robotrhythm', type: 'arcade',
      prompt: { small: 'The robot wrote a song.', big: 'Play it together', sub: '75% of the notes.' },
      config: { game: 'rhythm', bpm: 92, need: 0.75, pattern: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0], [6, 2], [7, 1], [8, 0], [9, 1], [10, 2], [12, 1], [12.5, 1], [13, 0], [14, 2], [15, 1], [16, 1]] },
      validate: () => ({ ok: true, msg: 'A duet! The robot’s first song had a human in it. It’s keeping the recording.' }),
      hint: 'Tap the lane when a note sits on the white line. A S D on a keyboard.',
    },
    {
      key: 'robotpong', type: 'arcade',
      prompt: { small: 'The robot doesn’t want to win anymore.', big: 'Keep a rally of 10', sub: 'Co-op Pong. Together.' },
      config: { game: 'pong', mode: 'coop', rally: 10 },
      validate: () => ({ ok: true, msg: 'Ten in a row. Nobody won. Everybody won.' }),
      hint: 'Just keep the ball in play. The robot always returns it; your job is not to miss.',
    },
    {
      key: 'robotpipes', type: 'puzzle',
      prompt: { small: 'The robot’s heart is disconnected.', big: 'Reconnect it', sub: 'Tap to rotate.' },
      config: { game: 'pipes', cols: 5, rows: 4, theme: 'heart' },
      validate: () => ({ ok: true, msg: 'Ba-dum. Ba-dum. It works. The robot is pretending not to cry.' }),
      hint: 'Follow the red glow from the heart on the left and rotate the next piece until it lights up.',
    },
    {
      key: 'robotlights', type: 'puzzle',
      prompt: { small: 'The robot’s memory banks are dark.', big: 'Light them all up', sub: 'Every switch affects its neighbours.' },
      config: { game: 'lights', n: 4, presses: 4, goal: 'on', icon: '🧠' },
      validate: () => ({ ok: true, msg: 'Memories restored. The first one it shows you is you.' }),
      hint: 'Same as the light switches, but now you want them ALL ON. Work row by row from the top.',
    },
    {
      key: 'robotshield', type: 'arcade',
      prompt: { small: 'Spam bots are after your friend.', big: 'Protect the robot', sub: 'Filter 15 before 3 reach it.' },
      config: { game: 'shooter', goal: 15, maxMissed: 3, enemy: '👾', guard: true },
      validate: () => ({ ok: true, msg: 'Not a single spam bot got through. The robot feels safe. That’s new.' }),
      hint: 'Slide under the lowest invader each time. You fire automatically.',
    },
    {
      key: 'robottower', type: 'arcade',
      prompt: { small: 'The robot wants to see further.', big: 'Build it a tower', sub: '8 blocks high.' },
      config: { game: 'stack', goal: 8, label: 'widget' },
      validate: () => ({ ok: true, msg: 'From up here the robot can see the whole internet. It says it’s mostly cats.' }),
      hint: 'Drop each block when it lines up with the one below.',
    },
    {
      key: 'dashduo', type: 'arcade',
      prompt: { small: 'Checkbox Dash', big: 'Run together', sub: 'Left half (or F) jumps for you. Right half (or J) for the robot.' },
      config: { game: 'runner', speed: 7, lanes: [
        { label: 'You (F / left half)', floor: course('..........', '...^........', '.......^....', '...^^.......', '........^...', '...^.....^..', '.....^^.....', '..........') },
        { label: 'Robot (J / right half)', floor: course('..........', '.......^....', '...^........', '.......^^...', '...^........', '.....^...^..', '...^^.......', '..........') },
      ] },
      validate: (a) => ({ ok: true, msg: `You both made it. ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}. Nobody gets left behind.` }),
      hint: 'Use two thumbs (or F and J). Watch the lanes separately: their spikes are in different places.',
    },
    {
      key: 'dashfinal', type: 'arcade',
      prompt: { small: 'One last run.', big: 'The Final Dash', sub: 'Everything you’ve learned. The robot is cheering.' },
      config: { game: 'runner', speed: 8.5, ...lanes([['..........', ''], ['...^.....^^.....#^......', ''], ['C', ''], ['...__O__.....=.=.....', ''], ['C', ''], ['G', ''], ['..........................', '.......v.....vv.....__....'], ['G', ''], ['......', ''], ['C', ''], ['F', ''], ['....A.....A.....A......A....', '.......V.....V......V.......'], ['R', ''], ['C', ''], ['...^^^......#.#......^..^......', ''], ['...........', '']]) },
      validate: (a) => ({ ok: true, msg: `${a.attempts} attempt${a.attempts === 1 ? '' : 's'}. The robot played the victory beep 40 times.` }),
      hint: 'Green flags save your progress, so each section can be practised on its own. Orbs: tap mid-air. Purple: you’re on the ceiling. Green portal: hold to rise.',
    },
    {
      key: 'signature', type: 'draw',
      prompt: { small: 'Certificate of Humanity:', big: 'sign here', sub: 'Any squiggle is legally binding. (It isn’t.)' },
      config: { mode: 'sign', color: '#1a237e', width: 3.5 },
      validate: () => ({ ok: true, msg: 'Signed. The robot signed underneath, in very neat handwriting.' }),
      hint: 'Draw any squiggle on the line, then press Verify.',
    },
    {
      key: 'goodbye', type: 'choice',
      prompt: { small: 'The robot has one more question.', big: 'Will you come back?', sub: '' },
      config: {
        options: [
          { icon: '👋', label: 'Of course', msg: 'It will keep the checkbox warm for you.' },
          { icon: '🤞', label: 'I’ll try', msg: '“Trying” is the most human promise there is. It accepts.' },
          { icon: '🤖', label: 'Only if there are more frogs', msg: 'It is already drawing more frogs.' },
        ],
      },
      validate: (a) => ({ ok: true, msg: a.msg }),
      hint: 'Any answer works.',
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

  // ===================================================================================
  // RUN ORDER: 150 levels in 5 acts. Ids and acts are assigned from this list, so
  // levels can be added or reordered just by editing it.
  // ===================================================================================
  const ACTS = [
    [1, ['checkbox', 'bicycles', 'distort', 'hydrant', 'puzzle', 'rotate', 'trustme', 'cones', 'count', 'digits', 'sandwich', 'pairs', 'socks', 'flies', 'dots', 'hold3', 'stopwatch', 'jigsaw', 'round', 'whack', 'clock', 'cups', 'mixer', 'sortfood', 'multicheck']],
    [2, ['nocat', 'dash1', 'dontclick', 'snake', 'frog', 'light', 'alex', 'shift', 'flap', 'stopsigns', 'lights', 'reverse', 'dodge', 'human', 'dash2', 'stroop', 'pong', 'catch', 'pipes', 'trace', 'library', 'beat', 'stack', 'mastermind', 'maze', 'darts', 'golf', 'hanoi', 'dash3', 'lander', 'shooter', 'typing', 'rhythm', 'dash4', 'simon']],
    [3, ['survey', 'popups', 'runaway', 'cps', 'loading', 'loadbits', 'flipped', 'dashmirror', 'findbox', 'cursor', 'autocorrect', 'tabs', 'tos', 'installer', 'crash', 'nested', 'interrogate', 'lagmaze', 'fallen', 'breakwidget', 'wave', 'volume', 'settings', 'whackerrors', 'snakebanners', 'shootads', 'wires', 'codedigits', 'bells', 'stackwidgets', 'flapverify', 'rhythm2', 'quizreal', 'dash5', 'remix']],
    [4, ['feelings', 'breathe', 'drawfeel', 'mirrordraw', 'memories', 'jigsawbeach', 'keepmemory', 'garden', 'humanslider', 'moodcolor', 'blue', 'cloudshape', 'holdfree', 'kite', 'puddle', 'skipstones', 'wait', 'balance', 'traces', 'dashcalm', 'chords', 'fishing', 'rank', 'worries', 'stars', 'shootingstars', 'pairsfeelings', 'stackcalm', 'letter', 'loop']],
    [5, ['me', 'teach', 'possessed', 'confession', 'repair', 'verifyme', 'design', 'attempt', 'robotquiz', 'robotmaze', 'robotdraw', 'robotrhythm', 'memoryask', 'robotpong', 'robotpipes', 'robotlights', 'robotshield', 'robottower', 'dashduo', 'shaky', 'dashfinal', 'signature', 'heartbeat', 'goodbye', 'final']],
  ];
  const byKey = {};
  LEVELS.forEach((l) => { if (l.secret) return; if (!l.key) throw new Error('Level without key'); if (byKey[l.key]) throw new Error('Duplicate level key ' + l.key); byKey[l.key] = l; });
  const ordered = [];
  ACTS.forEach(([act, keys]) => keys.forEach((k) => {
    const l = byKey[k];
    if (!l) throw new Error('ORDER names a missing level: ' + k);
    if (ordered.includes(l)) throw new Error('Level listed twice: ' + k);
    l.act = act;
    ordered.push(l);
  }));
  ordered.forEach((l, i) => { l.id = i + 1; });
  const unused = Object.keys(byKey).filter((k) => !ordered.includes(byKey[k]));
  if (unused.length) console.warn('[levels] not in ORDER:', unused.join(', '));

  window.LEVELS = ordered.concat(LEVELS.filter((l) => l.secret));
  window.LEVEL_HELPERS = { gridCheck };
})();
