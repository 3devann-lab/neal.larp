/* Shared DOM + random helpers, and the challenge registry.
 * Loaded before every challenge file. Classic script (no modules) so the game
 * runs straight from file://.
 */
(function () {
  'use strict';
  const U = {};

  /** h('div', {class:'x', onClick: fn, style:{...}}, child, 'text', [more]) */
  U.h = function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    };
    children.forEach(add);
    return el;
  };

  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.randString = (n, chars = 'abcdefghjkmnpqrstuvwxyz23456789') => {
    let s = '';
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  U.norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  U.finePointer = () => window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /** Point-in-rect test against a DOMRect. */
  U.inRect = (x, y, r, pad = 0) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;

  window.U = U;
  /** Registry: Challenges[type] = { render(api) } */
  window.Challenges = window.Challenges || {};
})();
