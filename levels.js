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
  ];

  window.LEVELS = LEVELS;
  window.LEVEL_HELPERS = { gridCheck };
})();
