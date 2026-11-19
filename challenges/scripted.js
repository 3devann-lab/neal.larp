/* scripted — one-off UI gags that don't fit a reusable type.
 * config.script picks one of the functions below. Each one decides when to
 * call api.submit(answer); the level's validate() makes the final call.
 */
(function () {
  'use strict';
  const { h, rand, pick, clamp, shuffle } = U;
  const S = {};

  // ------------------------------------------------------------------ 27: the runaway Verify button
  S.runaway = (api, cfg) => {
    api.showVerify(false);
    const zone = h('div', { class: 'runaway-zone' });
    const btn = h('button', { class: 'btn-verify runaway', type: 'button' }, 'Verify');
    zone.appendChild(btn);
    api.body.appendChild(zone);
    let escapes = 0;
    const max = cfg.escapes || 8;
    let bx = 50, by = 50;
    const place = () => { btn.style.left = bx + '%'; btn.style.top = by + '%'; };
    place();
    const flee = (px, py) => {
      if (escapes >= max) return false;
      escapes++;
      // jump to the far side of the zone from the pointer
      let best = null;
      for (let i = 0; i < 12; i++) {
        const cx = rand(14, 86), cy = rand(14, 86);
        const d = Math.hypot(cx - px, (cy - py) * 0.7);
        if (!best || d > best.d) best = { cx, cy, d };
      }
      bx = best.cx; by = best.cy;
      place();
      api.sound.tone(900 - escapes * 60, 0.06, 'triangle', 0.06);
      const lines = ['Nope.', 'Too slow!', 'Catch me!', 'Wheee!', 'Not today.', 'Almost!', '*pant*', '*wheeze*… okay… okay…'];
      btn.textContent = lines[Math.min(escapes - 1, lines.length - 1)];
      if (escapes >= max) {
        btn.classList.add('tired');
        btn.textContent = 'Verify (tired)';
        api.flavor('The button is out of breath. Go ahead.');
      }
      return true;
    };
    const rel = (e) => {
      const r = zone.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    };
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || api.isLocked()) return;
      const p = rel(e);
      if (Math.hypot(p.x - bx, (p.y - by) * 0.6) < 16) flee(p.x, p.y);
    });
    btn.addEventListener('pointerdown', (e) => {
      if (api.isLocked()) return;
      if (e.pointerType !== 'mouse' && escapes < max) { e.preventDefault(); const p = rel(e); flee(p.x, p.y); btn.dataset.fled = '1'; }
    });
    btn.addEventListener('click', (e) => {
      if (api.isLocked()) return;
      if (btn.dataset.fled) { delete btn.dataset.fled; return; }
      const byKeyboard = e.detail === 0;
      if (!byKeyboard) api.unlock('cornered');
      api.submit({ clicked: true, byKeyboard, escapes });
    });
  };

  // ------------------------------------------------------------------ 28: stuck at 99%
  S.loading = (api) => {
    api.showVerify(false);
    const fill = h('div', { class: 'load-fill' });
    const grip = h('div', { class: 'load-grip', title: 'Drag me', 'aria-label': 'Drag to finish loading', role: 'slider', tabindex: '0' });
    const bar = h('div', { class: 'load-bar' }, fill, grip);
    const pct = h('div', { class: 'load-pct' }, 'Verifying… 0%');
    const sub = h('div', { class: 'load-sub' }, 'Please do not close this window.');
    const cancel = h('button', { class: 'link-btn', type: 'button' }, 'Cancel');
    api.body.appendChild(h('div', { class: 'loading' }, h('div', { class: 'load-spinner' }), pct, bar, sub, cancel));
    let p = 0;
    let stuck = false;
    api.loop((dt) => {
      if (p < 99) {
        p = Math.min(99, p + dt * (p < 60 ? 38 : p < 90 ? 14 : 4));
        fill.style.width = p + '%';
        pct.textContent = `Verifying… ${Math.floor(p)}%`;
        return true;
      }
      stuck = true;
      grip.classList.add('show');
      grip.style.left = '99%';
      const lines = ['Almost there…', 'Any second now…', 'Still 99%…', 'The last 1% is the hardest.', 'Maybe it needs a nudge?'];
      let i = 0;
      api.every(2200, () => { sub.textContent = lines[Math.min(i++, lines.length - 1)]; if (i === 4) grip.classList.add('wiggle'); });
      return false;
    });
    let drag = false;
    grip.addEventListener('pointerdown', (e) => { if (!stuck || api.isLocked()) return; e.preventDefault(); drag = true; try { grip.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } });
    grip.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = bar.getBoundingClientRect();
      const v = clamp(((e.clientX - r.left) / r.width) * 100, 99, 100);
      fill.style.width = v + '%';
      grip.style.left = v + '%';
      pct.textContent = `Verifying… ${v >= 99.95 ? 100 : 99}%`;
      if (v >= 99.95) { drag = false; api.submit({ done: true }); }
    });
    grip.addEventListener('pointerup', () => { drag = false; if (!api.isLocked()) { fill.style.width = '99%'; grip.style.left = '99%'; } });
    grip.addEventListener('keydown', (e) => { if (stuck && (e.key === 'ArrowRight' || e.key === 'End')) { fill.style.width = '100%'; api.submit({ done: true }); } });
    cancel.addEventListener('click', () => api.fail('Cancelling is not supported. Nothing is supported. Everything is 99%.'));
  };

  // ------------------------------------------------------------------ 30: the checkbox fell out
  S.findCheckbox = (api) => {
    api.showVerify(false);
    const hole = h('div', { class: 'cbx-hole' }, h('div', { class: 'cbx-outline' }), h('span', null, "I'm not a robot"));
    api.body.appendChild(h('div', { class: 'find-wrap' }, hole, h('p', { class: 'muted center' }, 'It was right here a second ago.')));
    hole.addEventListener('click', () => api.fail("That's where it WAS.", { soft: true }));
    const spots = [
      () => [document.querySelector('.page-foot'), { right: '6px', bottom: '6px' }],
      () => [document.querySelector('.topbar'), { left: '46%', top: '14px' }],
      () => [document.querySelector('.hud'), { right: '-4px', top: '-24px' }],
      () => [document.querySelector('.hint-row'), { left: '4px', top: '46px' }],
    ];
    const [parent, pos] = pick(spots)();
    const stray = h('button', { class: 'cbx stray', type: 'button', 'aria-label': "The missing I'm not a robot checkbox", html: '<svg class="ck" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 21 L16 29 L33 10"/></svg>' });
    Object.assign(stray.style, pos);
    parent.classList.add('has-stray');
    api.onCleanup(() => parent.classList.remove('has-stray'));
    api.mountOutside(stray, parent);
    stray.addEventListener('click', () => {
      if (api.isLocked()) return;
      api.countCheckboxClick();
      stray.classList.add('checked');
      api.after(350, () => api.submit({ found: true }));
    });
  };

  // ------------------------------------------------------------------ 32: terms of service
  S.tos = (api, cfg) => {
    const terms = cfg.terms;
    const box = h('div', { class: 'tos', tabindex: '0', 'aria-label': 'Terms of service' }, terms.map((t) => h('p', null, t)));
    const agree = h('input', { type: 'checkbox', disabled: true, id: 'tos-agree' });
    const agreeLabel = h('label', { class: 'tos-agree', for: 'tos-agree' }, agree, ' I have read and agree to the terms');
    const q = h('label', { class: 'tos-q' }, cfg.question);
    const input = h('input', { class: 'text-input', type: 'text', autocomplete: 'off', placeholder: 'Your answer' });
    api.body.appendChild(h('div', { class: 'tos-wrap' }, box, agreeLabel, q, input));
    box.addEventListener('scroll', () => {
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 8) { agree.disabled = false; agreeLabel.classList.add('ready'); }
    });
    const sync = () => api.setVerifyEnabled(agree.checked && input.value.trim().length > 0);
    agree.addEventListener('change', sync);
    input.addEventListener('input', () => { api.clearError(); sync(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') api.verify(); });
    sync();
    api.setAnswer(() => ({ answer: input.value, agreed: agree.checked }));
  };

  // ------------------------------------------------------------------ 33: not responding → off and on again
  S.crash = (api) => {
    api.showVerify(false);
    const wait = h('button', { class: 'dlg-btn', type: 'button' }, 'Wait');
    const close = h('button', { class: 'dlg-btn', type: 'button' }, 'Close');
    const status = h('p', { class: 'dlg-status' }, 'stillCAPTCHA has stopped responding.');
    const dlg = h('div', { class: 'dlg' }, h('div', { class: 'dlg-title' }, '⚠ Not responding'), status, h('div', { class: 'dlg-actions' }, wait, close));
    const screen = h('div', { class: 'crash-screen' }, dlg);
    const power = h('button', { class: 'power', type: 'button', 'aria-label': 'Power', title: 'Power' }, '⏻');
    api.body.appendChild(h('div', { class: 'crash-wrap' }, screen, power));
    api.foot.classList.add('frozen');
    api.head.classList.add('frozen');
    api.onCleanup(() => { api.foot.classList.remove('frozen'); api.head.classList.remove('frozen'); });
    let on = true;
    wait.addEventListener('click', () => {
      status.textContent = 'Waiting…';
      wait.disabled = true;
      api.after(1800, () => { status.textContent = pick(['Still not responding.', 'Waited. Nothing. Have you tried… something else?', 'It is thinking about it. Forever.']); wait.disabled = false; });
    });
    close.addEventListener('click', () => api.fail('Close is not responding either.', { soft: true }));
    power.addEventListener('click', () => {
      if (api.isLocked()) return;
      api.sound.tone(on ? 220 : 440, 0.15, 'sine', 0.1);
      on = !on;
      screen.classList.toggle('off', !on);
      power.classList.toggle('lit', !on);
      if (on) {
        screen.innerHTML = '';
        screen.appendChild(h('div', { class: 'boot' }, h('div', { class: 'load-spinner' }), 'Restarting…'));
        api.after(1300, () => api.submit({ rebooted: true }));
      } else {
        api.flavor('…and now turn it on again.');
      }
    });
  };

  // ------------------------------------------------------------------ 37: double-negative settings
  S.settings = (api, cfg) => {
    const toggles = cfg.toggles.map((t) => {
      const input = h('input', { type: 'checkbox', role: 'switch' });
      input.checked = !!t.initial;
      return { def: t, input, el: h('label', { class: 'toggle-row' }, h('span', null, t.label), h('span', { class: 'switch' }, input, h('i'))) };
    });
    api.body.appendChild(h('div', { class: 'settings-panel' },
      h('p', { class: 'settings-goal' }, cfg.goal),
      toggles.map((t) => t.el)));
    toggles.forEach((t) => t.input.addEventListener('change', () => { api.sound.click(); api.clearError(); }));
    api.setAnswer(() => {
      const o = {};
      toggles.forEach((t) => { o[t.def.key] = t.input.checked; });
      return o;
    });
  };

  // ------------------------------------------------------------------ 38: glitch remix of earlier levels
  S.remix = (api, cfg) => {
    api.showVerify(false);
    const dur = cfg.duration || 15;
    const done = { box: false, slide: false, duck: false };
    const check = (k, el) => { if (done[k]) return; done[k] = true; el.classList.add('done'); api.sound.tick(); if (done.box && done.slide && done.duck) api.submit({ all: true }); };
    // checkbox
    const box = h('button', { class: 'cbx', type: 'button', 'aria-label': 'Mini checkbox', html: '<svg class="ck" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 21 L16 29 L33 10"/></svg>' });
    const t1 = h('div', { class: 'remix-task' }, h('span', { class: 'remix-n' }, '1'), box, h('span', null, 'Check'));
    box.addEventListener('click', () => { if (api.isLocked()) return; api.countCheckboxClick(); box.classList.add('checked'); check('box', t1); });
    // slider
    const knob = h('div', { class: 'mini-knob' });
    const rail = h('div', { class: 'mini-rail' }, knob);
    const t2 = h('div', { class: 'remix-task' }, h('span', { class: 'remix-n' }, '2'), rail, h('span', null, 'Slide →'));
    let dragging = false;
    knob.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; try { knob.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } });
    knob.addEventListener('pointermove', (e) => {
      if (!dragging || done.slide) return;
      const r = rail.getBoundingClientRect();
      const t = clamp((e.clientX - r.left - 14) / (r.width - 28), 0, 1);
      knob.style.left = `calc(${t * 100}% - ${t * 28}px)`;
      if (t >= 0.97) check('slide', t2);
    });
    knob.addEventListener('pointerup', () => { dragging = false; if (!done.slide) knob.style.left = '0'; });
    // duck strip
    const duck = h('button', { class: 'duck mini', type: 'button', 'aria-label': 'Duck', html: ART.duck() });
    const strip = h('div', { class: 'arena pond strip' }, duck);
    const t3 = h('div', { class: 'remix-task col' }, h('div', { class: 'remix-head' }, h('span', { class: 'remix-n' }, '3'), h('span', null, 'Click the duck')), strip);
    duck.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (api.isLocked() || done.duck) return; duck.classList.add('got'); check('duck', t3); });
    const fill = h('div', { class: 'countdown-fill hot' });
    const label = h('div', { class: 'remix-timer' }, `${dur}s`);
    api.body.appendChild(h('div', { class: 'remix glitch' }, h('div', { class: 'remix-top' }, label, h('div', { class: 'countdown' }, fill)), t1, t2, t3));
    let x = 10, v = 55;
    let t0 = performance.now();
    api.loop((dt, now) => {
      if (!done.duck) { x += v * dt; if (x > 82 || x < 0) { v = -v; x = clamp(x, 0, 82); } duck.style.left = x + '%'; duck.style.transform = v < 0 ? 'scaleX(-1)' : ''; }
      const el = (now - t0) / 1000;
      fill.style.width = clamp((1 - el / dur) * 100, 0, 100) + '%';
      label.textContent = Math.max(0, Math.ceil(dur - el)) + 's';
      if (el >= dur && !api.isLocked()) {
        api.fail('Time! The glitch reset everything.');
        t0 = performance.now();
        Object.keys(done).forEach((k) => { done[k] = false; });
        [t1, t2, t3].forEach((t) => t.classList.remove('done'));
        box.classList.remove('checked'); knob.style.left = '0'; duck.classList.remove('got');
      }
      return true;
    });
  };

  // ------------------------------------------------------------------ 35: the instruction bar fell off
  S.fallenHeader = (api, cfg) => {
    api.setHeadVisible(false);
    api.showVerify(false);
    const slotTop = h('div', { class: 'header-dock' }, 'Instructions go here ↑');
    const crumpled = h('div', { class: 'crumpled', 'aria-label': 'Fallen instruction bar. Drag it to the top.' }, h('span', null, 'Select all squares wi'), h('b', null, '…'));
    const area = h('div', { class: 'fallen-area' }, slotTop, h('p', { class: 'muted center' }, 'Something seems to have fallen off this CAPTCHA.'), crumpled);
    api.body.appendChild(area);
    Challenges.drag.draggable(api, crumpled, (x, y) => {
      if (!U.inRect(x, y, slotTop.getBoundingClientRect(), 24)) { api.flavor('Put it back where it belongs. The top.'); return false; }
      api.sound.success();
      area.remove();
      api.setHeadVisible(true);
      api.head.classList.add('reattached');
      api.showVerify(true);
      Challenges.grid.render(api, cfg.grid);
      return true;
    });
  };

  // ------------------------------------------------------------------ 57: the robot takes YOUR CAPTCHA
  S.robotAttempt = (api, cfg) => {
    api.showVerify(false);
    const design = api.state.flags.design || cfg.fallback;
    api.setPrompt({ small: 'Select all squares with', big: design.target, sub: 'Designed by: you. Attempted by: the robot.' });
    const grid = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(3, 1fr)' } });
    const tiles = design.cells.map((e) => {
      const t = h('div', { class: 'tile static', html: `<div class="tile-img">${ART.emoji({ e, bg: '#f4f6f8' })}</div><span class="tile-check"><svg viewBox="0 0 24 24"><path d="M6 12.5 L10.2 16.5 L18 8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` });
      grid.appendChild(t);
      return { e, el: t };
    });
    const cursor = h('div', { class: 'robot-cursor', html: '<svg viewBox="0 0 24 24"><path d="M3 2 L3 19 L8 14 L11 21 L14 20 L11 13 L18 13 Z" fill="#fff" stroke="#222" stroke-width="1.5"/></svg><span>🤖</span>' });
    const wrap = h('div', { class: 'robot-attempt' }, grid, cursor);
    const verdict = h('div', { class: 'robot-verdict' });
    api.body.append(wrap, verdict);
    // plan: select the right ones, but make one believable mistake
    const right = tiles.filter((t) => t.e === design.target);
    const wrong = tiles.filter((t) => t.e !== design.target);
    let picks = right.slice();
    let mistake = '';
    if (right.length > 1 && Math.random() < 0.5) { picks = right.slice(0, -1); mistake = 'It missed one.'; }
    else if (wrong.length) { picks = right.concat([pick(wrong)]); mistake = 'It picked one extra.'; }
    picks = shuffle(picks);
    let i = 0;
    const moveTo = (el) => {
      const a = wrap.getBoundingClientRect(), b = el.getBoundingClientRect();
      cursor.style.left = ((b.left - a.left + b.width * 0.55) / a.width) * 100 + '%';
      cursor.style.top = ((b.top - a.top + b.height * 0.55) / a.height) * 100 + '%';
    };
    const step = () => {
      if (i < picks.length) {
        moveTo(picks[i].el);
        api.after(650, () => { picks[i].el.classList.add('sel'); api.sound.click(); i++; api.after(350, step); });
      } else {
        cursor.classList.add('done');
        api.after(500, () => {
          verdict.appendChild(h('p', null, `The robot clicks "Verify" and looks at you hopefully. ${mistake ? '(' + mistake + ')' : '(It got them all.)'}`));
          const pass = h('button', { class: 'choice-btn primary', type: 'button' }, '✓ Pass the robot');
          const fail = h('button', { class: 'choice-btn', type: 'button' }, '✗ Fail the robot');
          pass.addEventListener('click', () => api.submit({ passed: true, mistake }));
          fail.addEventListener('click', () => api.submit({ passed: false, mistake }));
          verdict.appendChild(h('div', { class: 'choice-options list' }, pass, fail));
        });
      }
    };
    api.after(800, step);
  };

  // ------------------------------------------------------------------ S2: flip bits to make a number
  S.bits = (api, cfg) => {
    const target = cfg.target || 42;
    const bits = Array(8).fill(false);
    const out = h('div', { class: 'bits-out' }, '0');
    const row = h('div', { class: 'bits' });
    bits.forEach((_, i) => {
      const b = h('button', { class: 'bit', type: 'button', 'aria-label': `bit ${7 - i}` }, h('small', null, String(2 ** (7 - i))), h('span', null, '0'));
      b.addEventListener('click', () => {
        bits[i] = !bits[i];
        b.classList.toggle('on', bits[i]);
        b.querySelector('span').textContent = bits[i] ? '1' : '0';
        api.sound.click();
        out.textContent = String(bits.reduce((a, v, k) => a + (v ? 2 ** (7 - k) : 0), 0));
      });
      row.appendChild(b);
    });
    api.body.appendChild(h('div', { class: 'bits-wrap' }, row, h('div', { class: 'bits-eq' }, '= ', out)));
    api.setAnswer(() => ({ value: Number(out.textContent), target }));
  };

  Challenges.scripted = {
    render(api) {
      const cfg = api.level.config || {};
      const fn = S[cfg.script];
      if (!fn) throw new Error('Unknown script ' + cfg.script);
      fn(api, cfg);
    },
  };
})();
