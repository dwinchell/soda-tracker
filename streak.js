// Pure date/streak logic. No DOM, no network: unit-tested in test/streak.test.js.
// Days are 'YYYY-MM-DD' strings in the device's local calendar. Weeks run Monday-Sunday.

const DAY_MS = 86400000;

export const parseYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
export const fmtYmd = (dt) => dt.toISOString().slice(0, 10);
export const addDays = (s, n) => fmtYmd(new Date(parseYmd(s).getTime() + n * DAY_MS));
export const localYmd = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const weekStart = (s) => addDays(s, -((parseYmd(s).getUTCDay() + 6) % 7));

/** Daily limit in force on `day`: the goal with the latest effective_from <= day, or null. */
export function limitFor(goals, day) {
  let best = null;
  for (const g of goals) {
    if (g.effective_from <= day && (!best || g.effective_from > best.effective_from)) best = g;
  }
  return best ? best.daily_limit : null;
}

/**
 * 'nogoal' | 'ok' (at or under the limit) | 'cheat' (over, but covered by a cheat day) | 'over'.
 * A cheat day on a day that stays under the limit is just 'ok' (it is not spent on anything).
 */
export function dayStatus(day, count, limit, cheats) {
  if (limit == null) return 'nogoal';
  if (count <= limit) return 'ok';
  return cheats.has(day) ? 'cheat' : 'over';
}

export function countsByDay(entries) {
  const m = new Map();
  for (const e of entries) m.set(e.log_date, (m.get(e.log_date) || 0) + 1);
  return m;
}

/** The cheat day used in the Mon-Sun week containing `day`, or null. */
export function cheatInWeek(day, cheats) {
  const ws = weekStart(day);
  for (const c of cheats) if (weekStart(c) === ws) return c;
  return null;
}

/** Can a cheat day be applied to `day`? Not in the future, within the last 7 days, one per week. */
export function canApplyCheat(day, today, cheats) {
  if (day > today || day < addDays(today, -6)) return false;
  const used = cheatInWeek(day, cheats);
  return used === null || used === day;
}

/**
 * Streak rules:
 *  - Days before the first goal was set are ignored.
 *  - Each day at or under the limit adds 1. Days with no taps count as 0 sodas.
 *  - A day over the limit resets the streak to 0, unless a cheat day covers it:
 *    then the streak neither grows nor resets.
 *  - Today counts live: it adds 1 while she is at or under the limit, and the
 *    streak drops to 0 the moment she goes over (unless today is a cheat day).
 * Returns { hasGoal, current, best, savedStreak, todayStatus, todayCount, todayLimit }.
 * `savedStreak` is the streak as of yesterday, i.e. what a cheat day would protect.
 */
export function computeStats({ today, counts, goals, cheats }) {
  if (!goals.length) return { hasGoal: false };
  const first = goals.reduce((a, g) => (g.effective_from < a ? g.effective_from : a), goals[0].effective_from);
  let run = 0, best = 0, saved = 0;
  for (let d = first; d <= today; d = addDays(d, 1)) {
    if (d === today) saved = run;
    const st = dayStatus(d, counts.get(d) || 0, limitFor(goals, d), cheats);
    if (st === 'ok') run++;
    else if (st === 'over') run = 0;
    best = Math.max(best, run);
  }
  const todayLimit = limitFor(goals, today);
  return {
    hasGoal: true,
    current: run,
    best,
    savedStreak: saved,
    todayCount: counts.get(today) || 0,
    todayLimit,
    todayStatus: dayStatus(today, counts.get(today) || 0, todayLimit, cheats),
  };
}

/** The last `n` days ending today, newest first, with counts and status. */
export function recentDays({ today, n, counts, goals, cheats }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const day = addDays(today, -i);
    const count = counts.get(day) || 0;
    const limit = limitFor(goals, day);
    out.push({ day, count, limit, status: dayStatus(day, count, limit, cheats), cheat: cheats.has(day) });
  }
  return out;
}

/** Total sodas in the 7 days ending today vs the 7 days before that. */
export function weeklyTrend(today, counts) {
  const sum = (from) => { let t = 0; for (let i = 0; i < 7; i++) t += counts.get(addDays(from, -i)) || 0; return t; };
  const last7 = sum(today), prev7 = sum(addDays(today, -7));
  return { last7, prev7, change: last7 - prev7 };
}
