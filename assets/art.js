/* I'm Still Not a Robot — art library.
 * Grid tiles, the hydrant, the duck and the puzzle landscape use public-domain / CC0
 * photos from assets/photos (sources and licenses in CREDITS.md) via A.photo().
 * The game's own UI (logo, mini widgets), the robots, socks and emoji tiles are
 * original SVG drawn in code. Each function returns an HTML/SVG string.
 */
(function () {
  'use strict';
  let uid = 0;
  const nid = (p) => p + '-' + (++uid);

  const svg = (vb, inner, attrs = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${attrs}>${inner}</svg>`;


  const A = {};
  const SOCK = 'M16 4 H40 V54 L55 67 Q63 77 55 87 Q47 95 35 87 L18 72 Q12 66 14 58 Z';
  A.sock = (o = {}) => {
    const clip = nid('sock');
    const base = o.base || '#fff';
    let pat = '';
    if (o.pattern === 'stripes') {
      for (let y = 18; y < 100; y += 10) pat += `<rect x="0" y="${y}" width="70" height="5" fill="${o.color}"/>`;
    } else if (o.pattern === 'dots') {
      for (let y = 22; y < 100; y += 11) for (let x = 14 + ((y / 11) % 2) * 5; x < 64; x += 10) pat += `<circle cx="${x}" cy="${y}" r="2.6" fill="${o.color}"/>`;
    } else if (o.pattern === 'zigzag') {
      for (let y = 22; y < 100; y += 14) pat += `<path d="M0 ${y} l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5 l6 5 l6 -5" stroke="${o.color}" stroke-width="3" fill="none"/>`;
    } else if (o.pattern === 'hearts') {
      for (let y = 26; y < 100; y += 16) for (let x = 20; x < 64; x += 16) pat += `<path d="M${x} ${y + 4} l-5 -5 a3 3 0 0 1 5 -4 a3 3 0 0 1 5 4 z" fill="${o.color}"/>`;
    } else if (o.pattern === 'solid') {
      pat = `<rect width="70" height="100" fill="${o.color}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100" aria-hidden="true">` +
      `<defs><clipPath id="${clip}"><path d="${SOCK}"/></clipPath></defs>` +
      `<path d="${SOCK}" fill="${base}"/>` +
      `<g clip-path="url(#${clip})">${pat}<rect x="0" y="4" width="70" height="11" fill="${o.cuff || '#e9e9e9'}"/>` +
      `<path d="M14 4 v11 M20 4 v11 M26 4 v11 M32 4 v11 M38 4 v11" stroke="rgba(0,0,0,.08)" stroke-width="1.5"/>` +
      `<ellipse cx="50" cy="80" rx="10" ry="9" fill="rgba(0,0,0,.08)"/></g>` +
      `<path d="${SOCK}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/></svg>`;
  };

  A.logo = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true">` +
    `<rect x="6" y="10" width="28" height="22" rx="6" fill="#4a7fd8"/>` +
    `<path d="M20 4 v6" stroke="#4a7fd8" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="4" r="2.6" fill="#f2b632"/>` +
    `<circle cx="14" cy="20" r="3" fill="#fff"/><circle cx="26" cy="20" r="3" fill="#fff"/>` +
    `<path d="M14 27 q6 3 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<rect x="2" y="17" width="4" height="8" rx="2" fill="#9db7e6"/><rect x="34" y="17" width="4" height="8" rx="2" fill="#9db7e6"/></svg>`;


  A.robot = (o = {}) => {
    const c = o.color || ['#90a4ae', '#4a7fd8', '#ef6c00', '#8e24aa', '#43a047', '#e53935'][(o.v || 0) % 6];
    return svg('0 0 100 100',
      `<rect width="100" height="100" fill="${o.bg || '#e9eef3'}"/>` +
      `<rect x="47" y="10" width="6" height="14" fill="#555"/><circle cx="50" cy="10" r="5" fill="#f2b632"/>` +
      `<rect x="24" y="22" width="52" height="40" rx="10" fill="${c}"/>` +
      `<circle cx="38" cy="40" r="7" fill="#fff"/><circle cx="62" cy="40" r="7" fill="#fff"/>` +
      `<circle cx="38" cy="40" r="3" fill="#222"/><circle cx="62" cy="40" r="3" fill="#222"/>` +
      `<rect x="38" y="51" width="24" height="4" rx="2" fill="#fff"/>` +
      `<rect x="30" y="64" width="40" height="26" rx="6" fill="${c}"/><circle cx="50" cy="77" r="5" fill="#fff" opacity=".7"/>`);
  };

  A.blank = (o = {}) => svg('0 0 100 100', `<rect width="100" height="100" fill="${o.bg || '#f1f1f1'}"/>`);

  /** Tiny copy of the widget itself. kind: 'checkbox' | 'grid' | 'slider' | 'logo' | 'error' | 'text' */
  A.miniWidget = (o = {}) => {
    const k = o.kind || 'checkbox';
    let inner = '';
    if (k === 'checkbox') inner = `<rect x="12" y="34" width="76" height="32" rx="2" fill="#f9f9f9" stroke="#ccc"/><rect x="18" y="42" width="14" height="14" rx="1.5" fill="#fff" stroke="#bbb" stroke-width="1.5"/><rect x="38" y="47" width="30" height="4" rx="2" fill="#999"/><circle cx="79" cy="47" r="5" fill="#4a7fd8"/>`;
    if (k === 'checked') inner = `<rect x="12" y="34" width="76" height="32" rx="2" fill="#f9f9f9" stroke="#ccc"/><path d="M18 49 l5 5 l9 -11" stroke="#1f9d55" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="38" y="47" width="30" height="4" rx="2" fill="#999"/><circle cx="79" cy="47" r="5" fill="#4a7fd8"/>`;
    if (k === 'grid') { inner = `<rect x="18" y="12" width="64" height="76" fill="#fff" stroke="#ccc"/><rect x="21" y="15" width="58" height="14" fill="#3f7fe0"/>`; for (let i = 0; i < 9; i++) inner += `<rect x="${22 + (i % 3) * 19}" y="${32 + Math.floor(i / 3) * 17}" width="17" height="15" fill="${['#9ccf7a', '#bfdcf5', '#e8b46a'][(i * 5) % 3]}"/>`; }
    if (k === 'slider') inner = `<rect x="12" y="30" width="76" height="40" fill="#fff" stroke="#ccc"/><rect x="18" y="52" width="64" height="10" rx="2" fill="#eef1f4"/><rect x="40" y="50" width="14" height="14" rx="2" fill="#fff" stroke="#bbb"/><rect x="18" y="36" width="64" height="12" fill="#ffd3a5"/>`;
    if (k === 'logo') inner = A.logo().replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true">', '<g transform="translate(25 25) scale(1.25)">').replace('</svg>', '</g>');
    if (k === 'text') inner = `<rect x="12" y="28" width="76" height="44" fill="#fff" stroke="#ccc"/><path d="M18 46 q6 -10 12 0 t12 0 t12 0 t12 0" stroke="#445" stroke-width="2.5" fill="none"/><rect x="18" y="58" width="64" height="8" fill="#fff" stroke="#bbb"/>`;
    return svg('0 0 100 100', `<rect width="100" height="100" fill="${o.bg || '#eceff3'}"/>` + inner);
  };

  /** Any emoji as a tile. */
  A.emoji = (o = {}) => svg('0 0 100 100',
    `<rect width="100" height="100" fill="${o.bg || '#f4f6f8'}"/><text x="50" y="54" font-size="${o.size || 58}" text-anchor="middle" dominant-baseline="middle">${o.e || '❓'}</text>`);

  /** A local photo from assets/photos. o.src = file name without extension. */
  A.photo = (o = {}) => `<img class="photo${o.round ? ' round' : ''}" src="assets/photos/${o.src}.jpg" alt="${o.alt || ''}" draggable="false" decoding="async">`;
  A.hydrantPhoto = () => A.photo({ src: 'hydrant-split', alt: 'A red fire hydrant on grass' });
  // The moving duck and the puzzle landscape are photos too.
  // The moving frog and the puzzle-slider landscape are photos too.
  A.duck = () => A.photo({ src: 'duck-1', round: true, alt: 'Duck' });
  A.frog = () => A.photo({ src: 'frog-1', round: true, alt: 'Frog' });
  A.puzzleScene = () => A.photo({ src: 'landscape-1', alt: 'Landscape' });

  window.ART = A;
})();
