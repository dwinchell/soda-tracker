// The judgmental cat (SVG strings only, so this runs in Node tests too).
// Moods: judge (heavy-lidded side-eye), half (grudgingly impressed), wide (delighted), smug (eyes closed),
// glare (angry brows), heart, shades. Accessories: hat, crown, zzz.
const FUR = '#f0a35e', FUR_DARK = '#c9772f', CREAM = '#fff0dc', PINK = '#f5a3b5', INK = '#3b2a20';

function eyes(mood) {
  const L = 42, R = 78, Y = 64;
  const white = (cx) => `<ellipse cx="${cx}" cy="${Y}" rx="9" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
  const pupil = (cx, dx = 0, dy = 0, r = 4.2) => `<circle cx="${cx + dx}" cy="${Y + dy}" r="${r}" fill="${INK}"/>`;
  const lid = (cx, chord, large) =>
    `<path d="M${cx - Math.sqrt(81 - (chord - Y) ** 2)} ${chord} A9 9 0 ${large} 1 ${cx + Math.sqrt(81 - (chord - Y) ** 2)} ${chord} Z" fill="${FUR}" stroke="${INK}" stroke-width="1.6"/>`;
  switch (mood) {
    case 'judge': // heavy lids, pupils slid sideways, one raised brow
      return white(L) + white(R) + pupil(L, 4, 2.5) + pupil(R, 4, 2.5) + lid(L, 66, 1) + lid(R, 66, 1) +
        `<path d="M31 55l17 1" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M70 45q9-6 19 1" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'half':
      return white(L) + white(R) + pupil(L, 0, 2) + pupil(R, 0, 2) + lid(L, 60, 0) + lid(R, 60, 0);
    case 'wide':
      return `<ellipse cx="${L}" cy="${Y}" rx="10.5" ry="11" fill="#fff" stroke="${INK}" stroke-width="1.6"/><ellipse cx="${R}" cy="${Y}" rx="10.5" ry="11" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` +
        pupil(L, 0, 0, 6.5) + pupil(R, 0, 0, 6.5) + `<circle cx="${L + 2.5}" cy="${Y - 3}" r="2.2" fill="#fff"/><circle cx="${R + 2.5}" cy="${Y - 3}" r="2.2" fill="#fff"/>`;
    case 'smug':
      return `<path d="M33 66q9-10 18 0M69 66q9-10 18 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'glare':
      return white(L) + white(R) + pupil(L, 2, 2) + pupil(R, -2, 2) +
        `<path d="M30 53H54V66Z" fill="${FUR}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M66 66V53H90Z" fill="${FUR}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    case 'heart': {
      const heart = (cx) => `<path d="M${cx} 72C${cx - 14} 63 ${cx - 9} 54 ${cx} 60C${cx + 9} 54 ${cx + 14} 63 ${cx} 72Z" fill="#e0314c"/>`;
      return heart(L) + heart(R);
    }
    case 'shades':
      return `<rect x="29" y="55" width="26" height="17" rx="6" fill="#1b1b1f"/><rect x="65" y="55" width="26" height="17" rx="6" fill="#1b1b1f"/><path d="M55 60h10" stroke="#1b1b1f" stroke-width="3"/><path d="M33 58l8 0" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
    default: return white(L) + white(R) + pupil(L) + pupil(R);
  }
}

function mouth(mood) {
  const line = (d, extra = '') => `<path d="${d}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  switch (mood) {
    case 'judge': return line('M52 88h16');
    case 'half': return line('M52 87q8 4 16-3');
    case 'glare': return line('M52 91q8-7 16 0');
    case 'wide': return `<path d="M50 84q10 15 20 0Z" fill="#8a2f3b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M55 92q5-4 10 0" fill="${PINK}"/>`;
    default: return line('M50 84q5 7 10 0q5 7 10 0'); // smug, heart, shades: little "w" smile
  }
}

/** The cat's head and shoulders as an SVG <g> in a 120x120 box. */
export function catGroup({ mood = 'judge', hat = false, crown = false, zzz = false } = {}) {
  const whisk = (x1, x2, dy1, dy2) =>
    `<path d="M${x1} ${80 + dy1}L${x2} ${78 + dy1 * 2}M${x1} ${85 + dy2}L${x2} ${89 + dy2 * 2}" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  return `
  <path d="M10 120q4-22 28-24h44q24 2 28 24Z" fill="${FUR}"/>
  <path d="M22 56L26 14L56 36Z" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M98 56L94 14L64 36Z" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M30 46L32 25L48 37Z" fill="${PINK}"/><path d="M90 46L88 25L72 37Z" fill="${PINK}"/>
  <ellipse cx="60" cy="68" rx="44" ry="38" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2"/>
  <path d="M60 31v11M49 33l3 9M71 33l-3 9" stroke="${FUR_DARK}" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="84" rx="17" ry="12" fill="${CREAM}"/>
  ${eyes(mood)}
  <path d="M55 74h10l-5 6Z" fill="${PINK}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M60 80v3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  ${mouth(mood)}
  ${whisk(40, 14, -1, 1)}${whisk(80, 106, -1, 1)}
  ${hat ? `<g transform="rotate(-10 60 20)"><path d="M60 -4L40 34H80Z" fill="#8a5cf6" stroke="#5b34c9" stroke-width="2" stroke-linejoin="round"/><path d="M50 18l20 0M45 27h30" stroke="#ffd447" stroke-width="3.5"/><circle cx="60" cy="-4" r="5.5" fill="#ffd447"/></g>` : ''}
  ${crown ? `<path d="M38 34L41 10L52 24L60 6L68 24L79 10L82 34Z" fill="#ffc933" stroke="#c98f00" stroke-width="2" stroke-linejoin="round"/><circle cx="41" cy="10" r="3" fill="#e0314c"/><circle cx="60" cy="6" r="3" fill="#3b82f6"/><circle cx="79" cy="10" r="3" fill="#e0314c"/>` : ''}
  ${zzz ? `<g fill="${INK}" font-family="system-ui,sans-serif" font-weight="700"><text x="92" y="30" font-size="16">z</text><text x="102" y="18" font-size="12">z</text><text x="109" y="9" font-size="9">z</text></g>` : ''}`;
}

export function catSvg({ size = 96, label = 'A judgmental cat', ...opts } = {}) {
  // overflow visible so the party hat and crown can poke above the box
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${label}" style="overflow:visible">${catGroup(opts)}</svg>`;
}

export const MOODS = ['judge', 'half', 'wide', 'smug', 'glare', 'heart', 'shades'];
