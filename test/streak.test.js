import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, weekStart, limitFor, dayStatus, countsByDay, cheatInWeek, canApplyCheat,
  computeStats, recentDays, weeklyTrend,
} from '../streak.js';

// 2026-10-12 is a Monday.
const MON = '2026-10-12';
const mk = (map) => new Map(Object.entries(map));
const stats = (o) => computeStats({ cheats: new Set(), counts: new Map(), ...o });

test('date helpers', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(weekStart('2026-10-18'), MON); // Sunday -> Monday before
  assert.equal(weekStart(MON), MON);
});

test('limitFor uses the latest goal effective on that day', () => {
  const goals = [{ effective_from: '2026-10-01', daily_limit: 4 }, { effective_from: '2026-10-10', daily_limit: 2 }];
  assert.equal(limitFor(goals, '2026-09-30'), null);
  assert.equal(limitFor(goals, '2026-10-09'), 4);
  assert.equal(limitFor(goals, '2026-10-10'), 2);
});

test('dayStatus', () => {
  assert.equal(dayStatus('d', 3, 3, new Set()), 'ok');
  assert.equal(dayStatus('d', 4, 3, new Set()), 'over');
  assert.equal(dayStatus('d', 4, 3, new Set(['d'])), 'cheat');
  assert.equal(dayStatus('d', 1, 3, new Set(['d'])), 'ok');
  assert.equal(dayStatus('d', 1, null, new Set()), 'nogoal');
});

test('no goal -> no streak', () => assert.equal(stats({ today: MON, goals: [] }).hasGoal, false));

test('empty days count as compliant; today counts live', () => {
  const s = stats({ today: MON, goals: [{ effective_from: addDays(MON, -3), daily_limit: 2 }] });
  assert.equal(s.current, 4); // 3 prior days + today
  assert.equal(s.best, 4);
});

test('going over today drops the streak to 0 but remembers what was saved', () => {
  const goals = [{ effective_from: addDays(MON, -5), daily_limit: 2 }];
  const s = stats({ today: MON, goals, counts: mk({ [MON]: 3 }) });
  assert.equal(s.current, 0);
  assert.equal(s.savedStreak, 5);
  assert.equal(s.todayStatus, 'over');
  assert.equal(s.best, 5);
});

test('a cheat day over the limit keeps the streak but does not add to it', () => {
  const goals = [{ effective_from: addDays(MON, -5), daily_limit: 2 }];
  const counts = mk({ [addDays(MON, -2)]: 5 });
  assert.equal(stats({ today: MON, goals, counts }).current, 2); // reset on -2, then -1 and today
  const s = stats({ today: MON, goals, counts, cheats: new Set([addDays(MON, -2)]) });
  assert.equal(s.current, 5); // -5,-4,-3 (3) + (-2 neutral) + -1 + today = 5
});

test('cheat covers today', () => {
  const goals = [{ effective_from: addDays(MON, -2), daily_limit: 1 }];
  const s = stats({ today: MON, goals, counts: mk({ [MON]: 4 }), cheats: new Set([MON]) });
  assert.equal(s.todayStatus, 'cheat');
  assert.equal(s.current, 2);
});

test('raising a limit later does not rewrite past days', () => {
  const goals = [{ effective_from: addDays(MON, -4), daily_limit: 1 }, { effective_from: MON, daily_limit: 5 }];
  const counts = mk({ [addDays(MON, -2)]: 3 }); // over under the old limit of 1
  assert.equal(stats({ today: MON, goals, counts }).current, 2); // -1 and today
});

test('limit of zero', () => {
  const goals = [{ effective_from: addDays(MON, -1), daily_limit: 0 }];
  assert.equal(stats({ today: MON, goals }).current, 2);
  assert.equal(stats({ today: MON, goals, counts: mk({ [MON]: 1 }) }).current, 0);
});

test('best streak survives a later reset', () => {
  const goals = [{ effective_from: addDays(MON, -9), daily_limit: 1 }];
  const s = stats({ today: MON, goals, counts: mk({ [addDays(MON, -3)]: 2 }) });
  assert.equal(s.best, 6); // days -9..-4
  assert.equal(s.current, 3); // -2, -1, today
});

test('one cheat day per Mon-Sun week', () => {
  const wed = addDays(MON, 2), fri = addDays(MON, 4), nextMon = addDays(MON, 7);
  const cheats = new Set([wed]);
  assert.equal(cheatInWeek(fri, cheats), wed);
  assert.equal(cheatInWeek(nextMon, cheats), null);
  assert.equal(canApplyCheat(fri, fri, cheats), false);
  assert.equal(canApplyCheat(wed, fri, cheats), true); // already the cheat day (can be removed)
  assert.equal(canApplyCheat(nextMon, nextMon, cheats), true);
});

test('cheat can only target today or the last 6 days', () => {
  const today = addDays(MON, 6); // Sunday
  assert.equal(canApplyCheat(addDays(today, 1), today, new Set()), false); // future
  assert.equal(canApplyCheat(addDays(today, -6), today, new Set()), true);
  assert.equal(canApplyCheat(addDays(today, -7), today, new Set()), false);
});

test('recentDays and weeklyTrend', () => {
  const goals = [{ effective_from: addDays(MON, -20), daily_limit: 2 }];
  const counts = countsByDay([
    { log_date: MON }, { log_date: MON }, { log_date: MON },
    { log_date: addDays(MON, -8) }, { log_date: addDays(MON, -9) }, { log_date: addDays(MON, -10) },
    { log_date: addDays(MON, -11) }, { log_date: addDays(MON, -12) },
  ]);
  const r = recentDays({ today: MON, n: 3, counts, goals, cheats: new Set() });
  assert.deepEqual(r.map((x) => [x.day, x.count, x.status]), [[MON, 3, 'over'], [addDays(MON, -1), 0, 'ok'], [addDays(MON, -2), 0, 'ok']]);
  assert.deepEqual(weeklyTrend(MON, counts), { last7: 3, prev7: 5, change: -2 });
});
