// Decides what to celebrate when the app opens. Pure (no DOM), so it is unit-tested.
import { addDays, dailyRuns, badgeDates } from './streak.js';
import { BADGES } from './achievements.js';
import { POOLS } from './messages.js';

const KEY = 'soda.celebrated.v1';
const blank = () => ({ last: null, seen: [], msg: null });

// Per-device memory of what has already been celebrated, so each celebration shows once.
export function loadCelebrated(storage = globalThis.localStorage) {
  try { return { ...blank(), ...JSON.parse(storage.getItem(KEY)) }; } catch { return blank(); }
}
export function saveCelebrated(state, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
}
export function clearCelebrated(storage = globalThis.localStorage) {
  try { storage.removeItem(KEY); } catch { /* ignore */ }
}

export const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

/** Random message from a pool, never the same one twice in a row (`avoid` is the previous id). */
export function pickMessage(kind, rand, avoid) {
  const pool = POOLS[kind];
  let i = Math.floor(rand() * pool.length) % pool.length;
  if (pool.length > 1 && `${kind}:${i}` === avoid) i = (i + 1) % pool.length;
  return { id: `${kind}:${i}`, text: pool[i] };
}

/**
 * What to show now, or null. Looks at yesterday (the last finished day):
 *  - under the limit (or covered by a cheat day) and not yet celebrated: a celebration;
 *  - the 7th, 14th, 21st... day of the streak: a bigger "week" celebration (level grows with the weeks, max 5);
 *  - any streak badge reached and not yet shown: shown on the same screen.
 * Returns { kind, level, title, message, mood, streak, weeks, badges, nextState } and the caller saves nextState.
 */
export function planCelebration({ today, counts, goals, cheats, state, rand = Math.random }) {
  const runs = dailyRuns({ today, counts, goals, cheats });
  if (!runs.length) return null;
  const y = runs[runs.length - 1];
  if (y.day !== addDays(today, -1)) return null;

  const earned = badgeDates(runs, BADGES.map((b) => b.days));
  const badges = BADGES.filter((b) => earned[b.days] && !state.seen.includes(b.days));
  const dayEligible = (y.status === 'ok' || y.status === 'cheat') && state.last !== y.day;
  if (!dayEligible && !badges.length) return null;

  const weeks = Math.floor(y.run / 7);
  let kind, mood, level = 0;
  if (!dayEligible) { kind = 'badges'; mood = 'wide'; level = 1; }
  else if (y.run > 0 && y.run % 7 === 0) { kind = 'week'; mood = 'party'; level = Math.min(5, weeks); }
  else if (y.status === 'cheat') { kind = 'cheat'; mood = 'judge'; }
  else if (y.count === 0) { kind = 'perfect'; mood = 'wide'; level = 1; }
  else { kind = 'daily'; mood = 'half'; }
  if (badges.length && level < 1) level = 1;

  const msg = pickMessage(kind, rand, state.msg);
  const vars = { n: y.run, weeks, weeksText: `${weeks} week${weeks === 1 ? '' : 's'}` };
  const title = kind === 'week' ? `Week ${weeks}!` : kind === 'badges' ? 'New badge!' : `Streak: ${y.run} day${y.run === 1 ? '' : 's'}`;
  return {
    kind, level, title, mood: mood === 'party' ? 'wide' : mood, hat: kind === 'week',
    message: fill(msg.text, vars), streak: y.run, weeks, badges,
    nextState: {
      last: dayEligible ? y.day : state.last,
      seen: [...new Set([...state.seen, ...badges.map((b) => b.days)])].sort((a, b) => a - b),
      msg: msg.id,
    },
  };
}

/** Stable pick (same input, same answer) so the mascot's remark does not change on every redraw. */
export function pickStable(pool, seed) {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}
