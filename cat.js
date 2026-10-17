// Coca, the judgmental Havana Brown (SVG strings only, so this runs in Node tests too).
// Havana Browns have solid, warm mahogany fur (here: the color of cola), a rosy-brown nose and green eyes.
// Moods: judge (heavy-lidded side-eye), half (grudgingly impressed), wide (delighted), smug (eyes closed),
// glare (angry brows), heart, shades. Accessories: hat, crown, zzz.
const FUR = '#5c3021', FUR_DARK = '#2e160b', MUZZLE = '#a9714b', EAR = '#c98b7b', NOSE = '#d98a8a';
const IRIS = '#7fc24a', PUPIL = '#160b06', LINE = '#2a140b', LIGHT = '#f1d8b8', BROW = '#c98f66';
const RED = '#c8102e';

function eyes(mood) {
  const L = 42, R = 78, Y = 64;
  const white = (cx) => `<ellipse cx="${cx}" cy="${Y}" rx="9" ry="9.5" fill="#fff" stroke="${LINE}" stroke-width="1.6"/>`;
  const eye = (cx, dx = 0, dy = 0, ir = 5.4, pr = 2.7) =>
    `<circle cx="${cx + dx}" cy="${Y + dy}" r="${ir}" fill="${IRIS}"/><circle cx="${cx + dx}" cy="${Y + dy}" r="${pr}" fill="${PUPIL}"/>`;
  const lid = (cx, chord, large) => {
    const dx = Math.sqrt(81 - (chord - Y) ** 2);
    return `<path d="M${cx - dx} ${chord} A9 9 0 ${large} 1 ${cx + dx} ${chord} Z" fill="${FUR}" stroke="${LINE}" stroke-width="1.6"/>`;
  };
  switch (mood) {
    case 'judge': // heavy lids, eyes slid sideways, one raised brow
      return white(L) + white(R) + eye(L, 3, 2.5) + eye(R, 3, 2.5) + lid(L, 66, 1) + lid(R, 66, 1) +
        `<path d="M31 54l17 1" stroke="${BROW}" stroke-width="2.6" stroke-linecap="round"/><path d="M70 44q9-6 19 1" stroke="${BROW}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'half':
      return white(L) + white(R) + eye(L, 0, 2) + eye(R, 0, 2) + lid(L, 60, 0) + lid(R, 60, 0);
    case 'wide':
      return `<ellipse cx="${L}" cy="${Y}" rx="10.5" ry="11" fill="#fff" stroke="${LINE}" stroke-width="1.6"/><ellipse cx="${R}" cy="${Y}" rx="10.5" ry="11" fill="#fff" stroke="${LINE}" stroke-width="1.6"/>` +
        eye(L, 0, 0, 8, 4.6) + eye(R, 0, 0, 8, 4.6) + `<circle cx="${L + 3}" cy="${Y - 3.5}" r="2.4" fill="#fff"/><circle cx="${R + 3}" cy="${Y - 3.5}" r="2.4" fill="#fff"/>`;
    case 'smug':
      return `<path d="M33 66q9-10 18 0M69 66q9-10 18 0" stroke="${LIGHT}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case 'glare':
      return white(L) + white(R) + eye(L, 2, 2) + eye(R, -2, 2) +
        `<path d="M30 53H54V66Z" fill="${FUR}" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/><path d="M66 66V53H90Z" fill="${FUR}" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`;
    case 'heart': {
      const heart = (cx) => `<path d="M${cx} 72C${cx - 14} 63 ${cx - 9} 54 ${cx} 60C${cx + 9} 54 ${cx + 14} 63 ${cx} 72Z" fill="#ff4d6d" stroke="#fff" stroke-width="1.2"/>`;
      return heart(L) + heart(R);
    }
    case 'shades':
      return `<rect x="29" y="55" width="26" height="17" rx="6" fill="#16161a" stroke="${LIGHT}" stroke-width="1.4"/><rect x="65" y="55" width="26" height="17" rx="6" fill="#16161a" stroke="${LIGHT}" stroke-width="1.4"/><path d="M55 60h10" stroke="${LIGHT}" stroke-width="2.6"/><path d="M33 59h8" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`;
    default: return white(L) + white(R) + eye(L) + eye(R);
  }
}

function mouth(mood) {
  const line = (d) => `<path d="${d}" stroke="${LINE}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (mood) {
    case 'judge': return line('M52 88h16');
    case 'half': return line('M52 87q8 4 16-3');
    case 'glare': return line('M52 91q8-7 16 0');
    case 'wide': return `<path d="M50 84q10 15 20 0Z" fill="#8a2f3b" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/><path d="M55 92q5-4 10 0" fill="${NOSE}"/>`;
    default: return line('M50 84q5 7 10 0q5 7 10 0'); // smug, heart, shades: little "w" smile
  }
}

/** Head, shoulders and collar (no accessories, no backdrop), in a 120x120 box. */
function catBody(mood) {
  const whisk = (x1, x2) =>
    `<path d="M${x1} 80L${x2} 77M${x1} 85L${x2} 88" stroke="${LIGHT}" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>`;
  return `
  <path d="M10 120q4-22 28-24h44q24 2 28 24Z" fill="${FUR}"/>
  <path d="M22 56L26 14L56 36Z" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M98 56L94 14L64 36Z" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M30 46L32 25L48 37Z" fill="${EAR}"/><path d="M90 46L88 25L72 37Z" fill="${EAR}"/>
  <ellipse cx="60" cy="68" rx="44" ry="38" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2"/>
  <ellipse cx="60" cy="84" rx="17" ry="12" fill="${MUZZLE}"/>
  ${eyes(mood)}
  <path d="M55 74h10l-5 6Z" fill="${NOSE}" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M60 80v3" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
  ${mouth(mood)}
  ${whisk(44, 22)}${whisk(76, 98)}
  <path d="M35 103q25 11 50 0l2 8q-27 11-54 0Z" fill="${RED}" stroke="#8d0b21" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="60" cy="113.5" r="4.2" fill="#ffc933" stroke="#c98f00" stroke-width="1.2"/>`;
}

/** Hat, crown and sleepy z's: drawn separately so they may extend past the backdrop circle. */
function accessories({ hat = false, crown = false, zzz = false } = {}) {
  return `
  ${hat ? `<g transform="rotate(-10 60 20)"><path d="M60 -4L40 34H80Z" fill="#8a5cf6" stroke="#5b34c9" stroke-width="2" stroke-linejoin="round"/><path d="M50 18l20 0M45 27h30" stroke="#ffd447" stroke-width="3.5"/><circle cx="60" cy="-4" r="5.5" fill="#ffd447"/></g>` : ''}
  ${crown ? `<path d="M38 34L41 10L52 24L60 6L68 24L79 10L82 34Z" fill="#ffc933" stroke="#c98f00" stroke-width="2" stroke-linejoin="round"/><circle cx="41" cy="10" r="3" fill="#e0314c"/><circle cx="60" cy="6" r="3" fill="#3b82f6"/><circle cx="79" cy="10" r="3" fill="#e0314c"/>` : ''}
  ${zzz ? `<g fill="#7c83d9" font-family="system-ui,sans-serif" font-weight="700"><text x="92" y="30" font-size="16">z</text><text x="102" y="18" font-size="12">z</text><text x="109" y="9" font-size="9">z</text></g>` : ''}`;}

/** Body plus accessories in one <g>, no backdrop. Used inside badge medallions, which have their own cream backdrop. */
export function catGroup({ mood = 'judge', hat = false, crown = false, zzz = false } = {}) {
  return catBody(mood) + accessories({ hat, crown, zzz });
}

let uid = 0;
/**
 * Coca as a round "sticker" (the "stage"): a light backdrop circle with a ring, and the cat clipped to it, so her dark fur
 * stays visible in both light and dark mode. Hat, crown and z's are drawn outside the clip so they can poke out.
 */
export function catSvg({ size = 96, label = 'Coca, a judgmental cat', mood = 'judge', hat = false, crown = false, zzz = false, stage = true } = {}) {
  if (!stage) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${label}" style="overflow:visible">${catBody(mood)}${accessories({ hat, crown, zzz })}</svg>`;
  }
  const id = `cat-stage-${++uid}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${label}" style="overflow:visible">
  <defs><clipPath id="${id}"><circle cx="60" cy="62" r="60"/></clipPath></defs>
  <circle cx="60" cy="62" r="60" fill="#ffe7c9"/>
  <g clip-path="url(#${id})">${catBody(mood)}</g>
  <circle cx="60" cy="62" r="59" fill="none" stroke="#e8c49a" stroke-width="2"/>
  ${accessories({ hat, crown, zzz })}
</svg>`;
}

export const MOODS = ['judge', 'half', 'wide', 'smug', 'glare', 'heart', 'shades'];
