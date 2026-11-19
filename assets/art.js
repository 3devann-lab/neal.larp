/* I'm Still Not a Robot — hand-made SVG art library.
 * Every illustration here is original, drawn in code. No external images.
 * Each function returns an SVG string. Tiles use a 100×100 viewBox.
 */
(function () {
  'use strict';
  let uid = 0;
  const nid = (p) => p + '-' + (++uid);

  const svg = (vb, inner, attrs = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" ${attrs}>${inner}</svg>`;

  // ---------- backdrops ----------
  const SKIES = ['#cfe8ff', '#d9ecfb', '#bfdcf5', '#e3eefa', '#c9e3f7'];
  const pickSky = (o) => (o && o.sky) || SKIES[((o && o.v) || 0) % SKIES.length];

  const street = (o) => {
    const s = pickSky(o);
    return `<rect width="100" height="100" fill="${s}"/>` +
      `<rect y="70" width="100" height="30" fill="#a3a8ad"/>` +
      `<rect y="68" width="100" height="3" fill="#cfd2d5"/>` +
      `<path d="M8 86h14M40 86h14M72 86h14" stroke="#e8e8e8" stroke-width="2"/>`;
  };
  const park = (o) => {
    const s = pickSky(o);
    return `<rect width="100" height="100" fill="${s}"/>` +
      `<rect y="68" width="100" height="32" fill="#93c572"/>` +
      `<path d="M0 68 Q25 62 50 68 T100 68 V72 H0Z" fill="#84b866"/>`;
  };
  const table = (c = '#d9b48f') =>
    `<rect width="100" height="100" fill="${c}"/>` +
    `<path d="M0 22h100M0 54h100M0 84h100" stroke="rgba(120,80,40,.22)" stroke-width="1.5"/>` +
    `<ellipse cx="50" cy="66" rx="40" ry="10" fill="rgba(255,255,255,.55)"/>`;

  const A = {};

  // ---------- street things ----------
  A.bicycle = (o = {}) => {
    const c = o.color || '#e53935';
    return svg('0 0 100 100', street(o) +
      `<g stroke="#2b2b2b" stroke-width="3" fill="none"><circle cx="27" cy="66" r="14"/><circle cx="73" cy="66" r="14"/></g>` +
      `<g stroke="#9e9e9e" stroke-width=".8"><path d="M27 52v28M13 66h28M73 52v28M59 66h28"/></g>` +
      `<g stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M27 66 L42 45 L50 66 Z"/><path d="M42 45 L66 45 L50 66"/><path d="M66 45 L73 66"/><path d="M64 37 L66 45"/></g>` +
      `<path d="M36 41h11" stroke="#222" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M41 41v4" stroke="#555" stroke-width="2.5"/>` +
      `<path d="M59 36h9" stroke="#222" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="50" cy="66" r="3.2" fill="#555"/>`);
  };

  A.car = (o = {}) => {
    const c = o.color || '#1e88e5';
    return svg('0 0 100 100', street(o) +
      `<path d="M10 72 V60 Q10 55 17 54 L30 52 L40 40 H64 L76 52 L86 54 Q91 56 91 61 V72 Z" fill="${c}"/>` +
      `<path d="M33 52 L42 43 H51 V52 Z M55 43 H63 L72 52 H55 Z" fill="#e2f3ff"/>` +
      `<circle cx="29" cy="72" r="8" fill="#222"/><circle cx="29" cy="72" r="3.5" fill="#bbb"/>` +
      `<circle cx="72" cy="72" r="8" fill="#222"/><circle cx="72" cy="72" r="3.5" fill="#bbb"/>` +
      `<rect x="85" y="58" width="5" height="3" rx="1" fill="#ffe08a"/>`);
  };

  A.lamp = (o = {}) => svg('0 0 100 100', street(o) +
    `<rect x="48" y="22" width="4" height="50" fill="#3c4043"/>` +
    `<path d="M50 23 Q50 14 60 14 H64" stroke="#3c4043" stroke-width="4" fill="none"/>` +
    `<path d="M60 12 h15 l-3 8 h-9 z" fill="#3c4043"/><ellipse cx="67.5" cy="21" rx="4.5" ry="2" fill="#ffe9a8"/>` +
    `<rect x="43" y="70" width="14" height="4" rx="1" fill="#3c4043"/>`);

  A.trafficCone = (o = {}) => svg('0 0 100 100', street(o) +
    `<path d="M44 20 H56 L68 72 H32 Z" fill="#ff7a1a"/>` +
    `<path d="M41 34 H59 L61.4 45 H38.6 Z M36.8 53 H63.2 L65.3 62 H34.7 Z" fill="#fff"/>` +
    `<rect x="25" y="70" width="50" height="7" rx="1.5" fill="#e0650f"/>`);

  A.stopSign = (o = {}) => svg('0 0 100 100', street(o) +
    `<rect x="48" y="44" width="4" height="30" fill="#777"/>` +
    `<path d="M41 14 H59 L72 27 V45 L59 58 H41 L28 45 V27 Z" fill="#d93025" stroke="#fff" stroke-width="2.5"/>` +
    `<text x="50" y="40.5" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="11.5" fill="#fff" text-anchor="middle">STOP</text>`);

  A.bench = (o = {}) => svg('0 0 100 100', park(o) +
    `<g fill="#8b5a2b"><rect x="18" y="42" width="64" height="6" rx="1"/><rect x="18" y="51" width="64" height="6" rx="1"/><rect x="15" y="61" width="70" height="6" rx="1"/></g>` +
    `<g fill="#444"><rect x="21" y="67" width="4" height="15"/><rect x="75" y="67" width="4" height="15"/><rect x="21" y="44" width="3" height="18"/><rect x="76" y="44" width="3" height="18"/></g>`);

  A.house = (o = {}) => svg('0 0 100 100', park(o) +
    `<rect x="24" y="44" width="52" height="32" fill="${o.color || '#f2d7a6'}"/>` +
    `<path d="M17 46 L50 19 L83 46 Z" fill="${o.roof || '#b5523b'}"/>` +
    `<rect x="44" y="57" width="12" height="19" fill="#6b4226"/>` +
    `<rect x="29" y="51" width="10" height="10" fill="#e2f3ff" stroke="#fff" stroke-width="1.5"/>` +
    `<rect x="61" y="51" width="10" height="10" fill="#e2f3ff" stroke="#fff" stroke-width="1.5"/>`);

  A.tree = (o = {}) => svg('0 0 100 100', park(o) +
    `<rect x="45" y="48" width="10" height="28" fill="#7a5230"/>` +
    `<circle cx="50" cy="36" r="20" fill="#3f8f3a"/><circle cx="35" cy="47" r="13" fill="#4aa043"/><circle cx="65" cy="47" r="13" fill="#3a8535"/>`);

  A.cloud = (o = {}) => svg('0 0 100 100',
    `<rect width="100" height="100" fill="${o.sky || '#8cc8ff'}"/>` +
    `<g fill="#fff"><circle cx="38" cy="52" r="14"/><circle cx="54" cy="45" r="18"/><circle cx="70" cy="54" r="12"/><rect x="28" y="52" width="52" height="14" rx="7"/></g>`);

  A.ball = (o = {}) => {
    const c = o.color || '#ff5252';
    return svg('0 0 100 100', park(o) +
      `<ellipse cx="50" cy="76" rx="18" ry="4" fill="rgba(0,0,0,.18)"/>` +
      `<circle cx="50" cy="56" r="19" fill="${c}"/>` +
      `<path d="M31 56 Q50 44 69 56" stroke="#fff" stroke-width="4" fill="none"/>` +
      `<circle cx="43" cy="47" r="4" fill="rgba(255,255,255,.5)"/>`);
  };

  A.cat = (o = {}) => {
    const c = o.color || '#ff9f43';
    return svg('0 0 100 100',
      `<rect width="100" height="100" fill="#f3e3d0"/><rect y="74" width="100" height="26" fill="#c9a77f"/>` +
      `<path d="M70 72 Q90 70 84 48" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="55" cy="63" rx="21" ry="14" fill="${c}"/>` +
      `<circle cx="38" cy="45" r="13" fill="${c}"/>` +
      `<path d="M28 39 L29 25 L37 34 Z M48 39 L47 25 L39 34 Z" fill="${c}"/>` +
      `<circle cx="34" cy="45" r="2" fill="#222"/><circle cx="42" cy="45" r="2" fill="#222"/>` +
      `<path d="M36 50 l2 2 l2 -2" stroke="#222" stroke-width="1.2" fill="none"/>` +
      `<path d="M26 48 h-8 M26 51 h-7 M50 48 h8 M50 51 h7" stroke="#6b4c2a" stroke-width=".8"/>`);
  };

  // ---------- cones ----------
  A.iceCream = (o = {}) => {
    const c = o.color || '#ff9ec4';
    return svg('0 0 100 100',
      `<rect width="100" height="100" fill="${o.bg || '#ffe3ec'}"/>` +
      `<path d="M35 46 L50 90 L65 46 Z" fill="#e3b06c"/>` +
      `<path d="M39 54 H61 M42 64 H58 M45 74 H55 M40 48 L56 82 M60 48 L44 82" stroke="#c38c45" stroke-width="1.3"/>` +
      `<circle cx="50" cy="35" r="15" fill="${c}"/><circle cx="39" cy="44" r="8.5" fill="${c}"/><circle cx="61" cy="44" r="8.5" fill="${c}"/>` +
      `<circle cx="50" cy="19" r="4.5" fill="#e53935"/><path d="M50 15 q2 -5 6 -6" stroke="#5b8c2a" stroke-width="1.5" fill="none"/>`);
  };

  A.pineCone = () => {
    let scales = '';
    for (let i = 0; i < 8; i++) {
      const y = 33 + i * 6;
      const t = (y - 55) / 25;
      const w = 15 * Math.sqrt(Math.max(0, 1 - t * t));
      for (let x = 50 - w; x < 50 + w - 3; x += 7) {
        scales += `<path d="M${x.toFixed(1)} ${y} q3.5 5 7 0" stroke="#d6a36a" stroke-width="1.6" fill="none"/>`;
      }
    }
    return svg('0 0 100 100',
      `<rect width="100" height="100" fill="#dcebd2"/><rect y="70" width="100" height="30" fill="#a98d63"/>` +
      `<path d="M8 76 l6 -3 M20 84 l5 2 M80 78 l6 -2 M70 90 l-5 2" stroke="#7a6a3b" stroke-width="1.5"/>` +
      `<g transform="rotate(-18 50 55)"><ellipse cx="50" cy="55" rx="16" ry="26" fill="#7b4a22"/>${scales}` +
      `<path d="M50 29 v-7" stroke="#5b3a1a" stroke-width="3" stroke-linecap="round"/></g>`);
  };

  A.partyHat = () => svg('0 0 100 100',
    `<rect width="100" height="100" fill="#ece5ff"/>` +
    `<path d="M50 18 L70 80 H30 Z" fill="#5c6bc0"/>` +
    `<path d="M44.5 35 H55.5 M40 50 H60 M35.5 64 H64.5" stroke="#ffd54f" stroke-width="4"/>` +
    `<circle cx="50" cy="17" r="6" fill="#ff5c8a"/><ellipse cx="50" cy="80" rx="20" ry="4" fill="#3f4aa0"/>` +
    `<path d="M20 30 l3 3 M80 26 l-3 4 M78 60 l4 1 M18 66 l4 -1" stroke="#ff8a65" stroke-width="2" stroke-linecap="round"/>`);

  // ---------- food ----------
  A.sandwich = (o = {}) => svg('0 0 100 100', table(o.table) +
    `<rect x="18" y="58" width="64" height="11" rx="4" fill="#e9c27b"/>` +
    `<path d="M15 57 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 v4 h-60 z" fill="#5fb54a"/>` +
    `<rect x="20" y="49" width="60" height="7" rx="2" fill="#e2463a"/>` +
    `<path d="M18 44 H82 V49 H60 l-4 5 l-4 -5 H18 Z" fill="#f4d35e"/>` +
    `<path d="M17 45 Q17 30 50 30 Q83 30 83 45 Z" fill="#e9c27b"/>` +
    `<path d="M30 37 l2 -1 M45 34 l2 1 M62 36 l2 -1" stroke="#c99b4f" stroke-width="1.5" stroke-linecap="round"/>`);

  A.sub = (o = {}) => svg('0 0 100 100', table(o.table || '#cfa57c') +
    `<path d="M10 62 Q10 70 20 70 H80 Q90 70 90 62 Z" fill="#d9a35a"/>` +
    `<path d="M10 60 q5 -5 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 v4 h-80 z" fill="#66bb4a"/>` +
    `<rect x="12" y="53" width="76" height="6" rx="2" fill="#d9534f"/>` +
    `<rect x="12" y="49" width="76" height="5" rx="2" fill="#f6c6d0"/>` +
    `<path d="M10 50 Q10 36 26 36 H74 Q90 36 90 50 Z" fill="#d9a35a"/>` +
    `<path d="M26 42 l6 -3 M44 42 l6 -3 M62 42 l6 -3" stroke="#b77d36" stroke-width="2" stroke-linecap="round"/>`);

  A.burger = (o = {}) => svg('0 0 100 100', table(o.table || '#d7b593') +
    `<rect x="22" y="62" width="56" height="10" rx="5" fill="#d99a4e"/>` +
    `<rect x="20" y="54" width="60" height="9" rx="4" fill="#6b3e26"/>` +
    `<path d="M20 54 L80 54 L74 60 L66 54 L58 61 L50 54 L42 60 L34 54 L26 60 Z" fill="#f9c74f"/>` +
    `<path d="M18 52 q5 -5 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 v3 h-64 z" fill="#5fb54a"/>` +
    `<path d="M20 50 Q20 28 50 28 Q80 28 80 50 Z" fill="#e3a557"/>` +
    `<g fill="#fff6dc"><ellipse cx="38" cy="38" rx="2" ry="1.2"/><ellipse cx="50" cy="34" rx="2" ry="1.2"/><ellipse cx="62" cy="39" rx="2" ry="1.2"/><ellipse cx="45" cy="44" rx="2" ry="1.2"/><ellipse cx="57" cy="45" rx="2" ry="1.2"/></g>`);

  A.hotdog = (o = {}) => svg('0 0 100 100', table(o.table || '#cfe3f0') +
    `<rect x="12" y="46" width="76" height="14" rx="7" fill="#b5542f"/>` +
    `<path d="M16 54 Q16 70 30 70 H70 Q84 70 84 54 Q84 60 70 60 H30 Q16 60 16 54 Z" fill="#e8b46a"/>` +
    `<path d="M18 52 Q18 44 30 44 H70 Q82 44 82 52 Q76 50 70 50 H30 Q24 50 18 52 Z" fill="#e8b46a"/>` +
    `<path d="M22 50 q4 -4 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" stroke="#ffd21f" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);

  A.taco = (o = {}) => svg('0 0 100 100', table(o.table || '#f0d9b5') +
    `<path d="M18 46 q6 -8 12 -2 q6 -9 13 -2 q7 -9 14 -1 q7 -8 13 0 q6 -6 12 2 L80 60 H20 Z" fill="#5fb54a"/>` +
    `<circle cx="34" cy="46" r="4" fill="#e2463a"/><circle cx="52" cy="43" r="4" fill="#e2463a"/><circle cx="66" cy="47" r="4" fill="#e2463a"/>` +
    `<path d="M40 44 l6 -2 M58 46 l5 -3" stroke="#fff3b0" stroke-width="2.5" stroke-linecap="round"/>` +
    `<path d="M16 72 A34 30 0 0 1 84 72 Z" fill="#f2c14e" transform="translate(0 -2)"/>` +
    `<path d="M24 66 A28 22 0 0 1 76 66" stroke="#d9a33a" stroke-width="1.5" fill="none" transform="translate(0 -2)"/>`);

  // ---------- big split image: one fire hydrant spread across a 4×4 grid ----------
  // viewBox 400×400; columns are 100 wide. The hydrant body sits squarely in
  // columns 1–2; its side nozzles poke a few pixels into columns 0 and 3 (row 1).
  A.hydrantScene = () => svg('0 0 400 400',
    `<rect width="400" height="400" fill="#cfe6f7"/>` +
    `<circle cx="340" cy="60" r="26" fill="#fff4c2"/>` +
    `<rect x="0" y="178" width="400" height="76" rx="30" fill="#5d9c4a"/>` +
    `<circle cx="40" cy="186" r="30" fill="#6aab55"/><circle cx="110" cy="180" r="34" fill="#62a34e"/><circle cx="300" cy="182" r="32" fill="#6aab55"/><circle cx="370" cy="186" r="30" fill="#62a34e"/>` +
    `<rect y="250" width="400" height="150" fill="#b8bcc2"/>` +
    `<path d="M0 250 H400" stroke="#9aa0a6" stroke-width="5"/>` +
    `<path d="M0 330 H400 M70 250 V400 M330 250 V400" stroke="#a5aab0" stroke-width="2.5"/>` +
    `<ellipse cx="200" cy="384" rx="96" ry="10" fill="rgba(0,0,0,.18)"/>` +
    `<rect x="190" y="26" width="20" height="16" rx="3" fill="#a3221b"/>` +
    `<path d="M150 102 Q150 40 200 40 Q250 40 250 102 Z" fill="#d93025"/>` +
    `<rect x="140" y="96" width="120" height="18" rx="4" fill="#b3261e"/>` +
    `<rect x="150" y="112" width="100" height="242" fill="#d93025"/>` +
    `<rect x="166" y="116" width="12" height="234" fill="#ff7b6e" opacity=".45"/>` +
    `<rect x="88" y="160" width="64" height="34" rx="6" fill="#b3261e"/>` +
    `<rect x="248" y="160" width="64" height="34" rx="6" fill="#b3261e"/>` +
    `<rect x="88" y="156" width="10" height="42" rx="3" fill="#8c1d18"/>` +
    `<rect x="302" y="156" width="10" height="42" rx="3" fill="#8c1d18"/>` +
    `<circle cx="200" cy="232" r="27" fill="#b3261e"/><circle cx="200" cy="232" r="11" fill="#8c1d18"/>` +
    `<rect x="124" y="348" width="152" height="32" rx="5" fill="#b3261e"/>`);

  // ---------- puzzle slider landscape: 300×170 ----------
  A.puzzleScene = () => {
    const g = nid('pz');
    return svg('0 0 300 170',
      `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a8b"/><stop offset=".55" stop-color="#ffd3a5"/><stop offset="1" stop-color="#fff1c9"/></linearGradient></defs>` +
      `<rect width="300" height="170" fill="url(#${g})"/>` +
      `<circle cx="222" cy="70" r="28" fill="#ffb347"/>` +
      `<g fill="#fff" opacity=".85"><ellipse cx="60" cy="34" rx="26" ry="8"/><ellipse cx="80" cy="28" rx="16" ry="8"/><ellipse cx="160" cy="48" rx="20" ry="6"/></g>` +
      `<path d="M0 118 Q60 70 120 108 T240 96 T300 104 V170 H0 Z" fill="#7fb069"/>` +
      `<path d="M0 140 Q80 110 160 136 T300 128 V170 H0 Z" fill="#4f8a3c"/>` +
      `<rect x="96" y="80" width="6" height="30" fill="#6d4c2f"/><circle cx="99" cy="74" r="15" fill="#2f6b2f"/>` +
      `<rect x="190" y="100" width="34" height="24" fill="#f4e1c1"/><path d="M186 102 L207 84 L228 102 Z" fill="#c0563f"/><rect x="203" y="110" width="8" height="14" fill="#7a4b2a"/>` +
      `<path d="M30 160 q10 -6 20 0 M250 156 q8 -5 16 0" stroke="#2f5d25" stroke-width="2" fill="none"/>`);
  };

  // ---------- socks (60×100 viewBox) ----------
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

  // ---------- brand mark for the widget (original: a little robot head with a question mark) ----------
  A.logo = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true">` +
    `<rect x="6" y="10" width="28" height="22" rx="6" fill="#4a7fd8"/>` +
    `<path d="M20 4 v6" stroke="#4a7fd8" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="4" r="2.6" fill="#f2b632"/>` +
    `<circle cx="14" cy="20" r="3" fill="#fff"/><circle cx="26" cy="20" r="3" fill="#fff"/>` +
    `<path d="M14 27 q6 3 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<rect x="2" y="17" width="4" height="8" rx="2" fill="#9db7e6"/><rect x="34" y="17" width="4" height="8" rx="2" fill="#9db7e6"/></svg>`;


  // ---------- act 2+ additions ----------
  A.duck = () => svg('0 0 100 100',
    `<ellipse cx="50" cy="70" rx="30" ry="6" fill="rgba(0,40,80,.18)"/>` +
    `<path d="M22 58 Q22 76 46 76 H66 Q82 76 84 60 Q72 64 64 56 Q60 48 50 50 Q34 52 22 58 Z" fill="#ffd23f"/>` +
    `<circle cx="66" cy="40" r="14" fill="#ffd23f"/>` +
    `<path d="M78 40 L92 43 L78 47 Z" fill="#ff8c1a"/>` +
    `<circle cx="70" cy="37" r="2.4" fill="#222"/>` +
    `<path d="M36 60 Q46 54 56 62" stroke="#f0b400" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    'preserveAspectRatio="xMidYMid meet"');

  A.key = (o = {}) => svg('0 0 100 100',
    `<rect width="100" height="100" fill="${o.bg || '#efe6d8'}"/>` +
    `<g transform="rotate(${o.rot || -30} 50 50)">` +
    `<circle cx="32" cy="50" r="14" fill="none" stroke="${o.color || '#d4a017'}" stroke-width="7"/>` +
    `<rect x="44" y="46" width="40" height="8" rx="2" fill="${o.color || '#d4a017'}"/>` +
    `<rect x="70" y="54" width="6" height="10" fill="${o.color || '#d4a017'}"/><rect x="78" y="54" width="5" height="7" fill="${o.color || '#d4a017'}"/></g>`);

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

  A.cake = () => svg('0 0 100 100', table('#f7dfe8') +
    `<rect x="24" y="48" width="52" height="26" rx="4" fill="#f5c26b"/>` +
    `<path d="M24 52 q6 8 13 0 t13 0 t13 0 t13 0 V48 H24Z" fill="#fff"/>` +
    `<rect x="48" y="30" width="4" height="18" fill="#7fb3ff"/>` +
    `<path d="M50 22 q5 5 0 9 q-5 -4 0 -9 Z" fill="#ffb300"/>` +
    `<path d="M50 14 q3 -4 0 -8" stroke="#bbb" stroke-width="1.5" fill="none" opacity=".8"/>`);

  A.rainWindow = () => {
    let drops = '';
    for (let i = 0; i < 26; i++) drops += `<path d="M${(i * 37) % 90 + 6} ${(i * 53) % 80 + 8} l-2 7" stroke="#cfe3ff" stroke-width="1.6" stroke-linecap="round"/>`;
    return svg('0 0 100 100',
      `<rect width="100" height="100" fill="#6b5a4b"/><rect x="10" y="10" width="80" height="80" fill="#5d7489"/>` + drops +
      `<path d="M50 10 V90 M10 50 H90" stroke="#6b5a4b" stroke-width="5"/>` +
      `<rect x="6" y="86" width="88" height="8" fill="#8a7563"/><path d="M70 86 q4 -10 10 -6 q2 4 -2 6 Z" fill="#ffcf8a"/>`);
  };

  A.balloon = () => svg('0 0 100 100',
    `<rect width="100" height="100" fill="#bfe1ff"/>` +
    `<ellipse cx="58" cy="34" rx="16" ry="20" fill="#ff4f6d"/><path d="M58 54 l-3 5 h6 Z" fill="#e23b58"/>` +
    `<path d="M58 59 q-6 10 2 18 q8 8 -4 20" stroke="#555" stroke-width="1.2" fill="none"/>` +
    `<ellipse cx="52" cy="27" rx="4" ry="6" fill="#fff" opacity=".45"/>` +
    `<g fill="#fff" opacity=".9"><ellipse cx="22" cy="72" rx="14" ry="5"/><ellipse cx="30" cy="68" rx="9" ry="5"/></g>`);

  A.beach = () => svg('0 0 100 100',
    `<rect width="100" height="58" fill="#ffd9a1"/><circle cx="70" cy="50" r="14" fill="#ff9f43"/>` +
    `<rect y="50" width="100" height="22" fill="#4aa3df"/><path d="M0 60 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0" stroke="#bfe6ff" stroke-width="1.5" fill="none"/>` +
    `<path d="M0 72 Q50 64 100 72 V100 H0 Z" fill="#f2d39b"/><path d="M14 86 l4 -3 M30 92 l3 2 M76 88 l-4 2" stroke="#d1aa6a" stroke-width="1.5"/>`);

  A.kite = () => svg('0 0 100 100',
    `<rect width="100" height="100" fill="#cfeaff"/>` +
    `<path d="M60 12 L78 34 L60 60 L42 34 Z" fill="#ff7043"/><path d="M60 12 V60 M42 34 H78" stroke="#bf360c" stroke-width="1.5"/>` +
    `<path d="M60 60 q-8 8 0 14 q8 6 -2 12 q-10 6 -24 12" stroke="#555" stroke-width="1.2" fill="none"/>` +
    `<path d="M58 70 l-5 2 M60 78 l5 2" stroke="#ffca28" stroke-width="3" stroke-linecap="round"/>` +
    `<rect y="88" width="100" height="12" fill="#8fc46e"/>`);

  A.envelope = () => svg('0 0 100 100', table('#d9cbb8') +
    `<rect x="20" y="32" width="60" height="40" rx="2" fill="#fff8ee" stroke="#d8c6a8"/>` +
    `<path d="M20 32 L50 56 L80 32" stroke="#d8c6a8" stroke-width="2" fill="none"/>` +
    `<path d="M50 48 l-5 -5 a3 3 0 0 1 5 -4 a3 3 0 0 1 5 4 z" fill="#e53950"/>`);

  A.blank = (o = {}) => svg('0 0 100 100', `<rect width="100" height="100" fill="${o.bg || '#f1f1f1'}"/>`);

  A.portrait = (o = {}) => {
    const v = o.v || 0;
    const bgs = ['#ffe0b2', '#e1f5fe', '#f3e5f5', '#e8f5e9', '#fff9c4', '#fce4ec', '#e0f2f1', '#ede7f6', '#fbe9e7'];
    const skins = ['#f1c27d', '#c68642', '#8d5524', '#ffdbac', '#e0ac69', '#a0522d', '#9fa8da', '#80cbc4', '#ffab91'];
    const shapes = [
      `<circle cx="50" cy="48" r="24" fill="${skins[v % 9]}"/>`,
      `<rect x="28" y="24" width="44" height="50" rx="12" fill="${skins[v % 9]}"/>`,
      `<path d="M50 20 L76 70 H24 Z" fill="${skins[v % 9]}"/>`,
      `<ellipse cx="50" cy="50" rx="20" ry="28" fill="${skins[v % 9]}"/>`,
    ];
    const mouths = ['<path d="M40 60 q10 8 20 0" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      '<path d="M41 62 h18" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>',
      '<path d="M40 64 q10 -8 20 0" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      '<circle cx="50" cy="62" r="4" fill="#333"/>'];
    const eyes = v % 3 === 0
      ? '<path d="M38 46 q4 -4 8 0 M54 46 q4 -4 8 0" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
      : '<circle cx="42" cy="46" r="3" fill="#333"/><circle cx="58" cy="46" r="3" fill="#333"/>';
    return svg('0 0 100 100', `<rect width="100" height="100" fill="${bgs[v % 9]}"/>` + shapes[v % 4] + eyes + mouths[(v * 7) % 4] +
      (v % 4 === 1 ? '<path d="M28 30 q22 -16 44 0" stroke="#5d4037" stroke-width="6" fill="none"/>' : '') +
      `<path d="M20 100 Q50 76 80 100 Z" fill="${['#3f51b5', '#e91e63', '#009688', '#ff9800'][v % 4]}"/>`);
  };

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

  window.ART = A;
})();
