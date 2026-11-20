/* I'm Still Not a Robot — game engine.
 * Owns: save state, HUD, widget shell, pass/fail flow, suspicion meter,
 * achievements, secrets, hints, timer, sound, menus, debug jump (?level=N).
 */
(function () {
  'use strict';
  const { h, clamp, pick } = U;
  const $ = (s) => document.querySelector(s);

  const SAVE_KEY = 'isnar-save-v2';
  const OLD_SAVE_KEYS = ['isnar-save-v1'];
  const ACT_NAMES = { 1: 'Normal-ish', 2: 'Rule-bending', 3: 'Meta', 4: 'Existential', 5: 'Finale' };
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  const PLANNED_SECRETS = ['S1', 'S2', 'S3', 'S4', 'S5'];

  const TIERS = [
    { name: 'Low', errors: ['Please try again.', 'Not quite. Give it another go.', "Hmm. That wasn't it."], flavor: '' },
    { name: 'Curious', errors: ['Interesting choice. Try again.', "That's... not what most humans do.", 'Close-ish. Again?'], flavor: 'The CAPTCHA is paying a little more attention to you now.' },
    { name: 'Suspicious', errors: ['Try again, "human".', 'Our sensors are tingling.', 'Wrong. Very robot-adjacent of you.'], flavor: 'The CAPTCHA has narrowed its eyes. It does not have eyes.' },
    { name: 'ALARMED', errors: ['SURE. TOTALLY HUMAN. AGAIN.', 'Beep boop? Just kidding. Unless...?', 'Wrong. Just like a robot would be. (Kidding. Mostly.)'], flavor: '⚠ Suspicion critical. Every click is being judged.' },
  ];

  const ACHIEVEMENTS = [
    { id: 'clickaholic', icon: '🖱️', name: 'Clickaholic', desc: 'Clicked a checkbox 50 times.' },
    { id: 'flawless', icon: '💎', name: 'Flawless Act', desc: 'Cleared a whole act without a single mistake.' },
    { id: 'maxsus', icon: '🚨', name: 'Maximum Suspicion', desc: 'Maxed out the Robot Suspicion Meter.' },
    { id: 'speedrun', icon: '⏱️', name: 'Speedrunner', desc: 'Finished the game in under 15 minutes.' },
    { id: 'patience', icon: '🧘', name: 'Patience of a Human', desc: 'Held on for a whole minute.' },
    { id: 'camerashy', icon: '🙈', name: 'Camera Shy', desc: 'Declined to show your face.' },
    { id: 'cornered', icon: '🪤', name: 'Cornered', desc: 'Caught the runaway button by hand.' },
    { id: 'nohints', icon: '🧠', name: 'No Hints Needed', desc: 'Finished the game without using a hint.' },
    { id: 'philosopher', icon: '🤔', name: 'Philosopher', desc: 'Answered "I don\'t know" three times in a row.' },
    { id: 'secret1', icon: '🗝️', name: 'Secret Agent', desc: 'Found a secret level.' },
    { id: 'allsecrets', icon: '🏆', name: 'Completionist', desc: 'Found every secret level.' },
    { id: 'whisperer', icon: '🤖', name: 'Robot Whisperer', desc: 'Let the robot pass.' },
    { id: 'tough', icon: '📝', name: 'Tough Grader', desc: 'Failed the robot.' },
    { id: 'nightowl', icon: '🦉', name: 'Night Owl', desc: 'Played between midnight and 5 a.m.' },
    { id: 'finished', icon: '✅', name: 'Not a Robot (Probably)', desc: 'Finished the game.' },
  ];

  // ---------------------------------------------------------------- levels
  const LEVELS = window.LEVELS || [];
  const MAIN = LEVELS.filter((l) => !l.secret);
  const BY_ID = {};
  LEVELS.forEach((l) => { BY_ID[String(l.id)] = l; if (l.key) BY_ID[l.key] = l; });
  const mainIndex = (l) => MAIN.indexOf(l);

  // ---------------------------------------------------------------- state
  const fresh = () => ({
    v: 1,
    current: MAIN[0] ? MAIN[0].id : 1,
    furthest: 0,           // index into MAIN of the first uncleared level
    cleared: {},
    fails: {},
    mistakes: 0,
    suspicion: 0,
    elapsed: 0,
    started: false,
    finished: false,
    achievements: {},
    secrets: {},
    stats: { checkboxClicks: 0, hintsUsed: 0, privacyClicks: 0 },
    muted: false,
    memory: null,
    flags: {},
  });

  let memoryOnly = false;
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        // level numbers changed in v2 (62 → 150 levels): carry over only what still makes sense
        for (const k of OLD_SAVE_KEYS) {
          const old = localStorage.getItem(k);
          if (!old) continue;
          const o = JSON.parse(old);
          const s = fresh();
          ['achievements', 'secrets', 'muted'].forEach((f) => { if (o[f] != null) s[f] = o[f]; });
          s.stats = Object.assign(s.stats, o.stats);
          return s;
        }
        return fresh();
      }
      const s = Object.assign(fresh(), JSON.parse(raw));
      s.stats = Object.assign(fresh().stats, s.stats);
      return s;
    } catch (e) {
      memoryOnly = true;
      return fresh();
    }
  }
  let state = load();
  function save() {
    if (memoryOnly) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { memoryOnly = true; }
  }

  const tierIndex = () => (state.suspicion >= 75 ? 3 : state.suspicion >= 50 ? 2 : state.suspicion >= 25 ? 1 : 0);

  // ---------------------------------------------------------------- sound (WebAudio synth, no files)
  const Sound = {
    ctx: null,
    ac() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { this.ctx = new AC(); } catch (e) { return null; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(f, d = 0.12, type = 'sine', vol = 0.15, delay = 0, slideTo) {
      if (state.muted) return;
      const ac = this.ac();
      if (!ac) return;
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + d + 0.03);
    },
    click() { this.tone(880, 0.045, 'square', 0.035); },
    tick() { this.tone(1400, 0.035, 'sine', 0.06); },
    pop() { this.tone(420, 0.08, 'triangle', 0.08, 0, 760); },
    success() { this.tone(660, 0.13, 'sine', 0.13); this.tone(990, 0.22, 'sine', 0.13, 0.09); },
    error() { this.tone(200, 0.24, 'sawtooth', 0.06, 0, 110); },
    achieve() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.09, i * 0.08)); },
  };

  // ---------------------------------------------------------------- toasts & modals
  function toast(text, icon, ms = 3200) {
    const t = h('div', { class: 'toast', role: 'status' }, icon ? h('span', { class: 'toast-icon' }, icon) : null, h('span', null, text));
    $('#toast-root').appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, ms);
  }

  let modalOpen = null;
  function openModal(title, content, { onClose } = {}) {
    closeModal();
    const close = h('button', { class: 'modal-close', type: 'button', 'aria-label': 'Close' }, '×');
    const panel = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'modal-head' }, h('h2', null, title), close),
      h('div', { class: 'modal-body' }, content));
    const backdrop = h('div', { class: 'modal-backdrop' }, panel);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    close.addEventListener('click', closeModal);
    $('#modal-root').appendChild(backdrop);
    modalOpen = { el: backdrop, title, onClose };
    requestAnimationFrame(() => backdrop.classList.add('in'));
    return panel;
  }
  function closeModal() {
    if (!modalOpen) return;
    const m = modalOpen;
    modalOpen = null;
    m.el.remove();
    if (m.onClose) m.onClose();
  }

  // ---------------------------------------------------------------- achievements & secrets
  function unlock(id) {
    if (state.achievements[id]) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    state.achievements[id] = Date.now();
    save();
    Sound.achieve();
    toast('Achievement unlocked: ' + a.name, a.icon, 3800);
  }

  function unlockSecret(id) {
    if (state.secrets[id]) return;
    state.secrets[id] = true;
    save();
    unlock('secret1');
    if (PLANNED_SECRETS.every((s) => state.secrets[s])) unlock('allsecrets');
    const lvl = BY_ID[id];
    if (lvl) toast(`Secret level ${id} unlocked! Find it in the level menu.`, '🗝️', 4200);
    else toast(`Secret ${id} found! (Its level arrives in a later build.)`, '🗝️', 4200);
  }

  // ---------------------------------------------------------------- timer
  let lastTick = performance.now();
  let timerPaused = false;
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    const p = (n) => String(n).padStart(2, '0');
    return hh ? `${hh}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
  }
  let saveCounter = 0;
  setInterval(() => {
    const now = performance.now();
    const dt = now - lastTick;
    lastTick = now;
    if (!document.hidden && !timerPaused && !state.finished && state.started && dt < 5000) {
      state.elapsed += dt;
      if (++saveCounter % 8 === 0) save();
    }
    $('#timer').textContent = fmtTime(state.elapsed);
  }, 250);

  // ---------------------------------------------------------------- HUD
  function updateHud(level) {
    const clearedMain = MAIN.filter((l) => state.cleared[l.id]).length;
    $('#progress-fill').style.width = (MAIN.length ? (clearedMain / MAIN.length) * 100 : 0) + '%';
    if (level) {
      $('#level-label').textContent = level.secret ? `Secret level ${level.id}` : `Level ${mainIndex(level) + 1} / ${MAIN.length}`;
      $('#act-label').textContent = level.secret ? '???' : `Act ${ROMAN[level.act]} · ${ACT_NAMES[level.act]}`;
    }
    updateSuspicion();
  }
  function updateSuspicion() {
    const ti = tierIndex();
    $('#sus-fill').style.width = state.suspicion + '%';
    $('#sus-label').textContent = TIERS[ti].name;
    document.body.classList.remove('tone-0', 'tone-1', 'tone-2', 'tone-3');
    document.body.classList.add('tone-' + ti);
    $('.suspicion').setAttribute('aria-label', `Robot suspicion: ${TIERS[ti].name} (${Math.round(state.suspicion)}%)`);
  }
  function setFlavor(text) { $('#flavor').textContent = text || ''; }

  // ---------------------------------------------------------------- page footer links (also used in the widget)
  function onPrivacy(e) {
    if (e) e.preventDefault();
    state.stats.privacyClicks++;
    save();
    const n = state.stats.privacyClicks;
    const lines = [
      'Privacy: we collect nothing. Except your clicks. Like this one.',
      'Privacy: still nothing collected. Well. Two clicks now.',
      'Privacy: you seem very interested in privacy.',
      'Privacy: one more and we start to worry.',
    ];
    if (n >= 5) unlockSecret('S3');
    else toast(lines[Math.min(n - 1, lines.length - 1)], '🔒');
  }
  function onTerms(e) {
    if (e) e.preventDefault();
    toast(pick([
      'Terms: by reading this you agree that you have read this.',
      'Terms: the CAPTCHA may change its mind at any time.',
      'Terms: no robots were harmed. Several were mildly inconvenienced.',
    ]), '📄');
  }
  function brandBlock() {
    return h('div', { class: 'anchor-brand' },
      h('div', { class: 'anchor-logo', html: ART.logo() }),
      h('div', { class: 'anchor-name' }, 'stillCAPTCHA'),
      h('div', { class: 'anchor-links' },
        h('a', { href: '#', onClick: onPrivacy }, 'Privacy'), ' - ',
        h('a', { href: '#', onClick: onTerms }, 'Terms')));
  }

  // ---------------------------------------------------------------- level lifecycle
  let cur = null;        // context of the running level
  let lastAct = null;

  function teardown() {
    if (!cur) return;
    cur.dead = true;
    cur.timers.forEach(clearTimeout);
    cur.intervals.forEach(clearInterval);
    cur.rafs.forEach(cancelAnimationFrame);
    cur.cleanups.forEach((f) => { try { f(); } catch (e) { console.warn(e); } });
    cur = null;
  }

  function startLevel(id) {
    teardown();
    closeModal();
    timerPaused = false;
    const level = BY_ID[String(id)];
    if (!level) { showCredits(); return; }
    const idx = mainIndex(level);
    if (!level.secret) state.current = level.id;
    state.started = true;
    save();
    updateHud(level);
    setFlavor(TIERS[tierIndex()].flavor);
    $('#result').innerHTML = '';
    $('#hint-text').hidden = true;
    $('.hint-row').hidden = false;

    const replay = level.secret || idx < state.furthest;
    if (!level.secret && level.act !== lastAct && !replay) {
      lastAct = level.act;
      showActCard(level.act, () => mount(level, replay));
    } else {
      lastAct = level.act;
      mount(level, replay);
    }
  }

  function showActCard(act, done) {
    const slot = $('#widget-slot');
    slot.innerHTML = '';
    const card = h('div', { class: 'act-card', role: 'button', tabindex: '0', 'aria-label': 'Continue' },
      h('div', { class: 'act-num' }, 'Act ' + ROMAN[act]),
      h('div', { class: 'act-name' }, ACT_NAMES[act]),
      h('div', { class: 'act-skip' }, 'tap to continue'));
    slot.appendChild(card);
    let finished = false;
    const go = () => { if (finished) return; finished = true; clearTimeout(t); done(); };
    const t = setTimeout(go, 2200);
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); });
  }

  function renderPrompt(head, p) {
    head.innerHTML = '';
    if (typeof p === 'string') head.appendChild(h('div', { class: 'head-big' }, p));
    else if (p) {
      if (p.small) head.appendChild(h('div', { class: 'head-small' }, p.small));
      if (p.big) head.appendChild(h('div', { class: 'head-big' }, p.big));
      if (p.sub) head.appendChild(h('div', { class: 'head-sub' }, p.sub));
    }
  }

  const ICON = {
    reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.6 6.4A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h7V4z" fill="currentColor"/></svg>',
    audio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a8 8 0 0 0-8 8v6a3 3 0 0 0 3 3h1v-8H6v-1a6 6 0 0 1 12 0v1h-2v8h1a3 3 0 0 0 3-3v-6a8 8 0 0 0-8-8z" fill="currentColor"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z" fill="currentColor"/></svg>',
  };

  function mount(level, replay) {
    const slot = $('#widget-slot');
    slot.innerHTML = '';
    const ctx = cur = {
      level, replay, dead: false, locked: false,
      timers: [], intervals: [], rafs: [], cleanups: [], failFns: [],
      getAnswer: null, reloadFn: null,
    };

    const head = h('div', { class: 'captcha-head' });
    const err = h('div', { class: 'captcha-error', role: 'alert' });
    const body = h('div', { class: 'captcha-body' });
    const verify = h('button', { class: 'btn-verify', type: 'button' }, 'Verify');
    const reloadBtn = h('button', { class: 'foot-icon', type: 'button', title: 'Get a new challenge', 'aria-label': 'New challenge', html: ICON.reload, disabled: true });
    const audioBtn = h('button', { class: 'foot-icon', type: 'button', title: 'Audio challenge', 'aria-label': 'Audio challenge', html: ICON.audio });
    const infoBtn = h('button', { class: 'foot-icon', type: 'button', title: 'Help', 'aria-label': 'Help', html: ICON.info });
    const foot = h('div', { class: 'captcha-foot' }, h('div', { class: 'foot-icons' }, reloadBtn, audioBtn, infoBtn), verify);
    const widget = h('div', { class: 'captcha', role: 'group', 'aria-label': 'Verification challenge' }, head, err, body, foot);
    renderPrompt(head, level.prompt);
    if (level.config && level.config.widgetClass) widget.classList.add(...level.config.widgetClass.split(' '));
    slot.appendChild(widget);

    reloadBtn.addEventListener('click', () => { if (ctx.reloadFn && !ctx.locked) { Sound.click(); clearError(); ctx.reloadFn(); } });
    audioBtn.addEventListener('click', () => toast(pick([
      'The audio challenge is also a robot. It has been asked to wait outside.',
      'Audio challenge unavailable. It is having a quiet day.',
    ]), '🎧'));
    infoBtn.addEventListener('click', () => toast(pick([
      'This CAPTCHA is protected by a different CAPTCHA.',
      'Help: be human. Not too human. Just the right amount.',
      'Stuck? Fail a few times and a hint appears below.',
    ]), 'ℹ️'));

    const clearError = () => { err.textContent = ''; };

    const doFail = (msg, opts = {}) => {
      if (ctx.locked || ctx.dead) return;
      state.fails[level.id] = (state.fails[level.id] || 0) + 1;
      state.mistakes++;
      state.suspicion = clamp(state.suspicion + (opts.suspicion != null ? opts.suspicion : opts.soft ? 3 : 12), 0, 100);
      if (state.suspicion >= 100) unlock('maxsus');
      Sound.error();
      widget.classList.remove('shake');
      void widget.offsetWidth;
      widget.classList.add('shake');
      err.textContent = msg || pick(TIERS[tierIndex()].errors);
      updateSuspicion();
      setFlavor(TIERS[tierIndex()].flavor);
      updateHint(level);
      save();
      ctx.failFns.forEach((f) => f());
    };

    const doPass = (msg) => {
      if (ctx.locked || ctx.dead) return;
      ctx.locked = true;
      widget.classList.add('locked');
      clearError();
      Sound.success();
      state.cleared[level.id] = true;
      state.suspicion = clamp(state.suspicion - 4, 0, 100);
      const idx = mainIndex(level);
      if (!level.secret && idx >= state.furthest) state.furthest = idx + 1;
      if (typeof level.onPass === 'function') level.onPass(state, api);
      checkActFlawless(level);
      save();
      updateHud(level);
      showSuccess(widget, msg, () => next(level, replay));
    };

    const evaluate = (answer) => {
      if (ctx.locked || ctx.dead) return;
      let r = typeof level.validate === 'function' ? level.validate(answer, { state, api }) : true;
      if (typeof r === 'boolean') r = { ok: r };
      if (r && r.ok) doPass(r.msg);
      else doFail(r && r.msg);
    };

    verify.addEventListener('click', () => {
      if (ctx.locked) return;
      if (ctx.getAnswer) evaluate(ctx.getAnswer());
    });

    const api = {
      level, state, body, widget, head, sound: Sound, replay,
      setMode(m) { widget.classList.toggle('anchor', m === 'anchor'); },
      setPrompt(p) { renderPrompt(head, p); },
      setAnswer(fn) { ctx.getAnswer = fn; },
      showVerify(b) { verify.hidden = !b; },
      setVerifyEnabled(b) { verify.disabled = !b; },
      setVerifyLabel(t) { verify.textContent = t; },
      verify() { if (!verify.disabled && !verify.hidden) verify.click(); },
      submit: evaluate,
      pass: doPass,
      fail: doFail,
      clearError,
      onFail(fn) { ctx.failFns.push(fn); },
      onReload(fn) { ctx.reloadFn = fn; reloadBtn.disabled = false; },
      onCleanup(fn) { ctx.cleanups.push(fn); },
      after(ms, fn) { const t = setTimeout(() => { if (!ctx.dead) fn(); }, ms); ctx.timers.push(t); return t; },
      every(ms, fn) { const t = setInterval(() => { if (!ctx.dead) fn(); }, ms); ctx.intervals.push(t); return t; },
      loop(fn) {
        let last = performance.now();
        const step = (now) => {
          if (ctx.dead) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (fn(dt, now) === false) return;
          ctx.rafs.push(requestAnimationFrame(step));
        };
        ctx.rafs.push(requestAnimationFrame(step));
      },
      isLocked() { return ctx.locked || ctx.dead; },
      /** Tests / demo: when window.ISNAR_AUTOPLAY is set, challenges may drive themselves with a bot
       *  that only uses the same inputs a player has. */
      autoplay: !!window.ISNAR_AUTOPLAY,
      setBot(fn) { ctx.bot = fn; },
      setHeadVisible(b) { head.hidden = !b; },
      foot,
      save,
      /** Append an element outside the widget (removed when the level ends). */
      mountOutside(el, parent) { (parent || document.body).appendChild(el); ctx.cleanups.push(() => el.remove()); return el; },
      flavor: setFlavor,
      toast,
      unlock,
      unlockSecret,
      brandBlock,
      attempts() { return state.fails[level.id] || 0; },
      countCheckboxClick() {
        state.stats.checkboxClicks++;
        if (state.stats.checkboxClicks >= 50) {
          unlock('clickaholic');
          unlockSecret('S1');
        }
        save();
      },
    };

    updateHint(level);
    const ch = window.Challenges[level.type];
    if (!ch) {
      body.appendChild(h('p', { class: 'missing' }, `Unknown challenge type "${level.type}".`));
      console.error('Unknown challenge type', level.type);
      return;
    }
    ch.render(api);
  }

  function showSuccess(widget, msg, cont) {
    const overlay = h('div', { class: 'success-overlay', html:
      '<svg class="bigcheck" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M14 27 L22.5 35 L38.5 18"/></svg>' });
    const delay = widget.classList.contains('anchor') ? 420 : 0;
    setTimeout(() => widget.appendChild(overlay), delay);

    const result = $('#result');
    result.innerHTML = '';
    let gone = false;
    const go = () => { if (gone) return; gone = true; document.removeEventListener('keydown', onKey); cont(); };
    const onKey = (e) => { if (e.key === 'Enter' && !modalOpen) { e.preventDefault(); go(); } };
    if (msg) {
      const btn = h('button', { class: 'btn-primary', type: 'button' }, 'Continue');
      btn.addEventListener('click', go);
      result.appendChild(h('div', { class: 'result-card' }, h('p', null, msg), btn));
      setTimeout(() => { document.addEventListener('keydown', onKey); if (U.finePointer()) btn.focus(); }, 300);
    } else {
      setTimeout(go, 1100 + delay);
    }
  }

  function next(level, replay) {
    let target;
    if (replay || level.secret) target = MAIN[state.furthest];
    else target = MAIN[mainIndex(level) + 1];
    if (!target) { showCredits(); return; }
    startLevel(target.id);
  }

  function checkActFlawless(level) {
    if (level.secret) return;
    const actLevels = MAIN.filter((l) => l.act === level.act);
    if (actLevels[actLevels.length - 1] !== level) return;
    if (actLevels.every((l) => state.cleared[l.id]) && actLevels.every((l) => !state.fails[l.id])) unlock('flawless');
  }

  // ---------------------------------------------------------------- hints
  function updateHint(level) {
    const btn = $('#hint-btn');
    const fails = state.fails[level.id] || 0;
    const ready = fails >= 3 && !!level.hint;
    btn.disabled = !ready;
    btn.textContent = ready ? '💡 Hint' : `💡 Hint (unlocks after ${Math.max(0, 3 - fails)} more ${3 - fails === 1 ? 'try' : 'tries'})`;
    if (!level.hint) btn.textContent = '💡 No hint for this one';
    btn.onclick = () => {
      if (!ready) return;
      const t = $('#hint-text');
      t.textContent = level.hint;
      t.hidden = false;
      state.stats.hintsUsed++;
      state.flags.usedHint = true;
      save();
    };
  }

  // ---------------------------------------------------------------- credits & share card
  function finishRun() {
    if (state.finished) return;
    state.finished = true;
    state.finishedAt = Date.now();
    unlock('finished');
    if (state.elapsed < 15 * 60 * 1000) unlock('speedrun');
    if (!state.flags.usedHint) unlock('nohints');
    save();
  }

  function shareText() {
    const n = Object.keys(state.achievements).length;
    return `I'm Still Not a Robot ✅\n⏱️ ${fmtTime(state.elapsed)} · ❌ ${state.mistakes} mistakes · 🏆 ${n}/${ACHIEVEMENTS.length} achievements · 🗝️ ${PLANNED_SECRETS.filter((x) => state.secrets[x]).length}/5 secrets\nVerdict: ${verdict()}`;
  }
  function verdict() {
    if (state.mistakes === 0) return 'Suspiciously perfect.';
    if (state.mistakes < 10) return 'Probably human.';
    if (state.mistakes < 30) return 'Human-ish. Close enough.';
    return 'Extremely, chaotically human.';
  }

  function drawShareCard() {
    const W = 1200, H = 630;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const font = (w, px) => `${w} ${px}px Roboto, system-ui, -apple-system, "Segoe UI", Arial, sans-serif`;
    g.fillStyle = '#f3f4f6'; g.fillRect(0, 0, W, H);
    // card
    g.fillStyle = '#fff'; g.strokeStyle = '#d3d3d3'; g.lineWidth = 2;
    g.fillRect(60, 60, W - 120, H - 120); g.strokeRect(60, 60, W - 120, H - 120);
    g.fillStyle = '#3f7fe0'; g.fillRect(76, 76, W - 152, 150);
    g.fillStyle = '#fff'; g.font = font(400, 30); g.fillText('Verification complete', 110, 128);
    g.font = font(700, 58); g.fillText("I'm Still Not a Robot", 110, 192);
    // checkmark
    g.strokeStyle = '#1f9d55'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.arc(1010, 395, 92, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(962, 398); g.lineTo(997, 432); g.lineTo(1062, 362); g.stroke();
    // stats
    const n = Object.keys(state.achievements).length;
    const rows = [
      ['⏱️', 'Time', fmtTime(state.elapsed)],
      ['❌', 'Mistakes', String(state.mistakes)],
      ['🏆', 'Achievements', `${n} / ${ACHIEVEMENTS.length}`],
      ['🗝️', 'Secrets', `${PLANNED_SECRETS.filter((x) => state.secrets[x]).length} / 5`],
    ];
    rows.forEach((r, i) => {
      const y = 300 + i * 62;
      g.font = font(400, 34); g.fillStyle = '#202124'; g.fillText(r[0], 110, y);
      g.fillStyle = '#5f6368'; g.fillText(r[1], 165, y);
      g.fillStyle = '#202124'; g.font = font(700, 34); g.fillText(r[2], 420, y);
    });
    g.font = font(400, 26); g.fillStyle = '#5f6368';
    g.fillText('Verdict: ' + verdict(), 110, 548);
    const icons = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).map((a) => a.icon).join(' ');
    g.font = font(400, 28); g.fillText(icons.slice(0, 60), 640, 548);
    return c;
  }

  function openShare() {
    const card = drawShareCard();
    const img = h('img', { class: 'share-img', alt: 'Share card', src: card.toDataURL('image/png') });
    const copy = h('button', { class: 'btn-primary', type: 'button' }, 'Copy text');
    const dl = h('a', { class: 'btn-primary', download: 'im-still-not-a-robot.png', href: img.src }, 'Download image');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(shareText()); copy.textContent = 'Copied!'; }
      catch (e) { copy.textContent = 'Copy failed. Select the text below.'; }
    });
    openModal('Share card', h('div', { class: 'share' }, img, h('pre', { class: 'share-text' }, shareText()), h('div', { class: 'share-actions' }, dl, copy)));
  }

  function showCredits() {
    teardown();
    finishRun();
    timerPaused = true;
    const slot = $('#widget-slot');
    slot.innerHTML = '';
    $('#result').innerHTML = '';
    $('.hint-row').hidden = true;
    setFlavor('');
    updateHud();
    $('#level-label').textContent = 'Verified';
    $('#act-label').textContent = 'The End';
    const reaction = state.flags.reaction;
    const lines = [
      ['Verification', 'Complete. Mutually.'],
      ['Starring', 'You, a human (probably)'],
      ['Co-starring', 'stillCAPTCHA, a robot (definitely)'],
      ['Featuring', 'Three bicycles, one hydrant, four lonely socks and a duck that refused to be clicked'],
      ['Memory kept', state.memory || 'none (the robot kept one for you)'],
      ['Your reaction to the twist', reaction || 'unspoken'],
      ['The robot\'s grade', state.flags.robotPassed === true ? 'Passed. It printed the certificate and framed it.' : state.flags.robotPassed === false ? 'Failed. It is practicing. Quietly.' : 'Pending'],
      ['Art', 'Hand-drawn SVG, made in code'],
      ['Sound', 'Synthesized live by your browser'],
      ['Special thanks', 'Everyone who has ever clicked a traffic light'],
      ['No robots were harmed', 'One was gently understood'],
    ];
    const roll = h('div', { class: 'credits-roll' }, lines.map(([a, b]) => h('div', { class: 'credit' }, h('small', null, a), h('div', null, b))));
    let robotTaps = 0;
    const robot = h('button', { class: 'credits-robot', type: 'button', 'aria-label': 'The robot', html: ART.logo() });
    robot.addEventListener('click', () => {
      robotTaps++;
      Sound.tone(500 + robotTaps * 60, 0.08, 'triangle', 0.08);
      robot.classList.remove('boop'); void robot.offsetWidth; robot.classList.add('boop');
      if (robotTaps === 10) unlockSecret('S5');
    });
    const n = Object.keys(state.achievements).length;
    slot.appendChild(h('div', { class: 'captcha end-card' },
      h('div', { class: 'captcha-head' }, h('div', { class: 'head-small' }, 'Thank you for verifying'), h('div', { class: 'head-big' }, "We're not robots."), h('div', { class: 'head-sub' }, 'Well. One of us is. And that\'s okay.')),
      h('div', { class: 'end-body' },
        robot,
        h('div', { class: 'credits-window' }, roll),
        h('ul', { class: 'stats' },
          h('li', null, h('b', null, fmtTime(state.elapsed)), ' time'),
          h('li', null, h('b', null, String(state.mistakes)), ' mistakes'),
          h('li', null, h('b', null, `${n}/${ACHIEVEMENTS.length}`), ' achievements'),
          h('li', null, h('b', null, `${PLANNED_SECRETS.filter((x) => state.secrets[x]).length}/5`), ' secrets')),
        h('div', { class: 'end-actions' },
          h('button', { class: 'btn-primary', type: 'button', onClick: openShare }, 'Share card'),
          h('button', { class: 'btn-ghost', type: 'button', onClick: openMenu }, 'Level select'),
          h('button', { class: 'btn-ghost', type: 'button', onClick: () => { const keep = { achievements: state.achievements, secrets: state.secrets, stats: state.stats, muted: state.muted }; state = Object.assign(fresh(), keep); save(); lastAct = null; startLevel(MAIN[0].id); } }, 'New run')))));
  }

  // ---------------------------------------------------------------- menu: level select, achievements, settings
  function openMenu() {
    const tabs = ['Levels', 'Achievements', 'Settings'];
    const tabBar = h('div', { class: 'tabs', role: 'tablist' });
    const pane = h('div', { class: 'tab-pane' });
    const render = (name) => {
      [...tabBar.children].forEach((b) => b.classList.toggle('active', b.textContent === name));
      pane.innerHTML = '';
      if (name === 'Levels') pane.appendChild(levelSelect());
      if (name === 'Achievements') pane.appendChild(achievementList());
      if (name === 'Settings') pane.appendChild(settings());
    };
    tabs.forEach((t) => tabBar.appendChild(h('button', { class: 'tab', type: 'button', role: 'tab', onClick: () => render(t) }, t)));
    openModal('Menu', h('div', null, tabBar, pane));
    render('Levels');
  }

  function levelSelect() {
    const wrap = h('div', { class: 'level-select' });
    const acts = [...new Set(MAIN.map((l) => l.act))];
    acts.forEach((act) => {
      const grid = h('div', { class: 'level-grid' });
      MAIN.filter((l) => l.act === act).forEach((l) => {
        const idx = mainIndex(l);
        const cleared = !!state.cleared[l.id];
        const open = cleared || idx === state.furthest;
        const b = h('button', {
          class: 'lvl' + (cleared ? ' cleared' : '') + (idx === state.furthest ? ' current' : ''),
          type: 'button', disabled: !open, title: open ? `Level ${idx + 1}` : 'Locked',
        }, open ? String(idx + 1) : '🔒');
        if (open) b.addEventListener('click', () => { closeModal(); lastAct = l.act; startLevel(l.id); });
        grid.appendChild(b);
      });
      wrap.append(h('h3', null, `Act ${ROMAN[act]} · ${ACT_NAMES[act]}`), grid);
    });
    const secrets = LEVELS.filter((l) => l.secret && state.secrets[l.id]);
    const found = PLANNED_SECRETS.filter((s) => state.secrets[s]).length;
    let headTaps = 0;
    wrap.appendChild(h('h3', { class: 'secrets-head', onClick: () => { if (++headTaps === 8) unlockSecret('S2'); } }, `Secrets · ${found}/${PLANNED_SECRETS.length} found`));
    if (secrets.length) {
      const grid = h('div', { class: 'level-grid' });
      secrets.forEach((l) => grid.appendChild(h('button', {
        class: 'lvl secret' + (state.cleared[l.id] ? ' cleared' : ''), type: 'button',
        onClick: () => { closeModal(); startLevel(l.id); },
      }, String(l.id))));
      wrap.appendChild(grid);
    } else {
      wrap.appendChild(h('p', { class: 'muted' }, 'Easter eggs unlock secret levels. Some involve clicking things you shouldn\'t.'));
    }
    return wrap;
  }

  function achievementList() {
    const n = Object.keys(state.achievements).length;
    return h('div', null,
      h('p', { class: 'muted' }, `${n} of ${ACHIEVEMENTS.length} unlocked`),
      h('ul', { class: 'ach-list' }, ACHIEVEMENTS.map((a) => {
        const got = !!state.achievements[a.id];
        return h('li', { class: got ? 'got' : '' },
          h('span', { class: 'ach-icon' }, got ? a.icon : '❔'),
          h('div', null, h('b', null, a.name), h('small', null, a.desc)));
      })));
  }

  function settings() {
    const mute = h('label', { class: 'setting' },
      h('input', { type: 'checkbox', checked: !state.muted, onChange: (e) => { state.muted = !e.target.checked; save(); syncMute(); } }),
      ' Sound effects');
    const reset = h('button', { class: 'btn-danger', type: 'button' }, 'Reset all progress');
    reset.addEventListener('click', () => {
      if (reset.dataset.armed) {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
        state = fresh();
        save();
        closeModal();
        lastAct = null;
        syncMute();
        startLevel(MAIN[0].id);
        toast('Progress reset. Hello again, stranger.', '🧹');
      } else {
        reset.dataset.armed = '1';
        reset.textContent = 'Really? Click again to confirm';
      }
    });
    return h('div', { class: 'settings' },
      mute,
      h('p', { class: 'muted' }, `Total checkbox clicks: ${state.stats.checkboxClicks}. Hints used: ${state.stats.hintsUsed}.`),
      memoryOnly ? h('p', { class: 'muted' }, 'Saving is unavailable in this browser mode; progress lasts until you close the tab.') : null,
      h('p', { class: 'muted' }, 'Debug: add ?level=N to the URL to jump to any level.'),
      reset);
  }

  function syncMute() {
    const b = $('#btn-mute');
    b.textContent = state.muted ? '🔇' : '🔊';
    b.setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
  }

  // ---------------------------------------------------------------- easter-egg key listener
  let keyBuf = '';
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : ({ ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' })[e.key] || '';
    if (!k) return;
    keyBuf = (keyBuf + k).slice(-16);
    if (modalOpen && modalOpen.title === 'Menu' && keyBuf.endsWith('beepboop')) unlockSecret('S2');
    if (keyBuf.endsWith('UUDD')) unlockSecret('S4');
    if (e.key === 'Escape') closeModal();
  });

  // swipe down twice on the top area (mobile alternative to ↑↑↓↓)
  let swipeY = null, swipes = [];
  document.addEventListener('touchstart', (e) => { const t = e.touches[0]; swipeY = t.clientY < 160 ? t.clientY : null; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (swipeY == null) return;
    const dy = e.changedTouches[0].clientY - swipeY;
    swipeY = null;
    if (dy > 70) {
      const now = Date.now();
      swipes = swipes.filter((t) => now - t < 3000).concat(now);
      if (swipes.length >= 2) unlockSecret('S4');
    }
  }, { passive: true });

  // ---------------------------------------------------------------- boot
  function boot() {
    $('#btn-menu').addEventListener('click', openMenu);
    $('#btn-mute').addEventListener('click', () => { state.muted = !state.muted; save(); syncMute(); if (!state.muted) Sound.click(); });
    document.querySelectorAll('[data-link="privacy"]').forEach((a) => a.addEventListener('click', onPrivacy));
    document.querySelectorAll('[data-link="terms"]').forEach((a) => a.addEventListener('click', onTerms));
    document.querySelectorAll('[data-link="help"]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      toast('Help: prove you are human. Hints unlock after 3 failed tries.', '❓');
    }));
    syncMute();

    const hr = new Date().getHours();
    if (hr < 5) setTimeout(() => unlock('nightowl'), 1500);

    const params = new URLSearchParams(location.search);
    if (params.has('reset')) {
      state = fresh();
      save();
      params.delete('reset');
      history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash);
    }
    const jump = params.get('level');
    let startId = state.current;
    if (jump) {
      const lvl = BY_ID[jump] || BY_ID[jump.toUpperCase()];
      if (lvl) {
        startId = lvl.id;
        if (!lvl.secret) state.furthest = Math.max(state.furthest, mainIndex(lvl));
        console.info(`[debug] Jumping to level ${lvl.id}`);
      } else {
        console.warn(`[debug] No level "${jump}"`);
      }
    }
    if (!BY_ID[String(startId)] && !jump) startId = (MAIN[state.furthest] || MAIN[MAIN.length - 1]).id;
    if (state.furthest >= MAIN.length && !jump) showCredits();
    else startLevel(startId);
  }

  // expose a tiny surface for debugging in the console
  window.ISNAR = { get state() { return state; }, startLevel, unlock, unlockSecret, LEVELS, showCredits, openShare, bot() { if (cur && cur.bot) cur.bot(); return !!(cur && cur.bot); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
