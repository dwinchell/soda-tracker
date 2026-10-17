// Badges earned by reaching a streak length. A badge is earned once the best streak reaches `days`.
import { catGroup } from './cat.js';

export const BADGES = [
  { days: 3, name: 'Kitten Steps', ring: '#c27a3a', art: 'paw',
    blurb: 'Three days under the limit. Small paws, big start.', cheer: 'Three days. Your first little paw print.' },
  { days: 7, name: 'Whisker Week', ring: '#9aa7b5', art: { mood: 'half' },
    blurb: 'A whole week. I may have blinked slowly at you.', cheer: 'A slow blink. That is the highest honor I give.' },
  { days: 14, name: 'Catnap Champ', ring: '#6ea0d8', art: { mood: 'smug', zzz: true },
    blurb: 'Two weeks! Even the nap spot is proud.', cheer: 'Two weeks in. I can nap easy knowing you are on it.' },
  { days: 30, name: 'Purr-fect Month', ring: '#f0b429', art: { mood: 'heart' },
    blurb: 'Thirty days. I am not crying, you are crying.', cheer: 'A whole month. My heart is doing a little knead.' },
  { days: 100, name: 'Cool Cat', ring: '#8b7bea', art: { mood: 'shades' },
    blurb: 'One hundred days. Honestly? Iconic.', cheer: 'One hundred days. Even my sunglasses are impressed.' },
  { days: 365, name: 'Nine Lives Legend', ring: '#d6338f', art: { mood: 'wide', crown: true },
    blurb: 'A full year. You are royalty. Bow (I will not).', cheer: 'A YEAR. All nine of my lives are applauding.' },
];

const pawArt = `<g fill="#6b4a3a"><ellipse cx="50" cy="56" rx="14" ry="11.5"/><ellipse cx="33" cy="42" rx="5.6" ry="7.4" transform="rotate(-18 33 42)"/><ellipse cx="45" cy="34" rx="5.6" ry="7.6"/><ellipse cx="57" cy="34" rx="5.6" ry="7.6"/><ellipse cx="68" cy="42" rx="5.6" ry="7.4" transform="rotate(18 68 42)"/></g>`;

/** Round medallion with a cat (or paw) and the day count on a ribbon. */
export function badgeSvg(badge, { earned = true, size = 84 } = {}) {
  const art = badge.art === 'paw' ? pawArt
    : `<g transform="translate(24 18) scale(.43)">${catGroup(badge.art)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img"
    aria-label="${badge.name} badge, ${badge.days} days${earned ? '' : ' (locked)'}" class="badge-art ${earned ? '' : 'locked'}">
    <circle cx="50" cy="50" r="47" fill="${badge.ring}"/><circle cx="50" cy="50" r="40" fill="#fff6ea"/>
    ${art}
    <rect x="22" y="73" width="56" height="18" rx="9" fill="${badge.ring}" stroke="#fff" stroke-width="2"/>
    <text x="50" y="86" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="800" fill="#fff">${badge.days}d</text>
  </svg>`;
}
