import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from '../streak.js';
import { BADGES, badgeSvg } from '../achievements.js';
import { catSvg, MOODS } from '../cat.js';
import { POOLS, QUIPS, CAT_NAME } from '../messages.js';
import { planCelebration, pickMessage, fill, pickStable, loadCelebrated, saveCelebrated } from '../celebrate.js';

const TODAY = '2026-10-20';
const blank = { last: null, seen: [], msg: null };
// Goal began `days` finished days ago (so streak = days if every day was fine).
const goalsAgo = (days, limit = 2) => [{ effective_from: addDays(TODAY, -days), daily_limit: limit }];
const plan = (o) => planCelebration({ today: TODAY, counts: new Map(), cheats: new Set(), state: blank, rand: () => 0, ...o });
const Y = addDays(TODAY, -1);

test('badge thresholds are 3, 7, 14, 30, 100 and 365 days', () => {
  assert.deepEqual(BADGES.map((b) => b.days), [3, 7, 14, 30, 100, 365]);
});

test('yesterday under the limit -> a daily celebration with a pool message', () => {
  const p = plan({ goals: goalsAgo(2), counts: new Map([[Y, 1]]) });
  assert.equal(p.kind, 'daily');
  assert.equal(p.level, 0);
  assert.equal(p.streak, 2);
  assert.ok(POOLS.daily.map((t) => fill(t, { n: 2 })).includes(p.message));
  assert.equal(p.nextState.last, Y);
});

test('already celebrated yesterday -> nothing', () => {
  assert.equal(plan({ goals: goalsAgo(2), state: { ...blank, last: Y } }), null);
});

test('yesterday over the limit (no cheat) -> nothing', () => {
  assert.equal(plan({ goals: goalsAgo(2), counts: new Map([[Y, 5]]) }), null);
});

test('yesterday over but covered by a cheat day -> judgmental cheat message, no confetti kind', () => {
  const p = plan({ goals: goalsAgo(2), counts: new Map([[Y, 5]]), cheats: new Set([Y]) });
  assert.equal(p.kind, 'cheat');
  assert.equal(p.mood, 'judge');
});

test('zero sodas yesterday -> perfect-day message', () => {
  assert.equal(plan({ goals: goalsAgo(2) }).kind, 'perfect');
});

test('goal set today (no finished day) -> nothing', () => {
  assert.equal(plan({ goals: goalsAgo(0) }), null);
});

test('no goal -> nothing', () => assert.equal(plan({ goals: [] }), null));

test('3rd day awards the Kitten Steps badge once', () => {
  const p = plan({ goals: goalsAgo(3) });
  assert.deepEqual(p.badges.map((b) => b.days), [3]);
  assert.deepEqual(p.nextState.seen, [3]);
  const again = plan({ goals: goalsAgo(3), state: { ...blank, last: Y, seen: [3] } });
  assert.equal(again, null);
});

test('the 7th day is a bigger "week" celebration with the day-3 and day-7 badges', () => {
  const p = plan({ goals: goalsAgo(7) });
  assert.equal(p.kind, 'week');
  assert.equal(p.weeks, 1);
  assert.equal(p.level, 1);
  assert.equal(p.hat, true);
  assert.deepEqual(p.badges.map((b) => b.days), [3, 7]);
  assert.match(p.title, /Week 1/);
});

test('each successful week celebrates bigger, up to a cap', () => {
  const level = (weeks) => plan({ goals: goalsAgo(7 * weeks), state: { ...blank, seen: [3, 7, 14, 30, 100, 365] } }).level;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(level), [1, 2, 3, 4, 5, 5, 5]);
});

test('week message fills in the numbers', () => {
  const texts = POOLS.week.map((_, i) => plan({ goals: goalsAgo(14), state: { ...blank, seen: [3, 7, 14] }, rand: () => i / POOLS.week.length }).message);
  assert.ok(texts.some((t) => /14 days/.test(t) && /2 weeks/.test(t)));
  assert.ok(texts.every((t) => !t.includes('{')));
});

test('unseen badges are delivered late even if yesterday went badly', () => {
  // 5-day streak, then a bad day: badge 3 was earned but never shown.
  const counts = new Map([[Y, 9]]);
  const p = plan({ goals: goalsAgo(6), counts });
  assert.equal(p.kind, 'badges');
  assert.deepEqual(p.badges.map((b) => b.days), [3]);
  assert.equal(p.nextState.last, null);
});

test('a cheat day counts toward badges', () => {
  const p = plan({ goals: goalsAgo(3), counts: new Map([[addDays(TODAY, -2), 9]]), cheats: new Set([addDays(TODAY, -2)]) });
  assert.deepEqual(p.badges.map((b) => b.days), [3]);
});

test('never repeats the previous message', () => {
  const first = pickMessage('daily', () => 0, null);
  const second = pickMessage('daily', () => 0, first.id);
  assert.notEqual(first.id, second.id);
});

test('every pool is non-empty and every message fills cleanly', () => {
  for (const [k, pool] of Object.entries(POOLS)) {
    assert.ok(pool.length >= 3, k);
    for (const t of pool) assert.ok(!fill(t, { n: 1, weeks: 1, weeksText: '1 week' }).includes('{'));
  }
  for (const pool of Object.values(QUIPS)) assert.ok(pool.length >= 2);
});

test('pickStable is deterministic', () => {
  assert.equal(pickStable(['a', 'b', 'c'], 'x'), pickStable(['a', 'b', 'c'], 'x'));
});

test('celebration memory round-trips and tolerates junk', () => {
  const m = new Map();
  const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.deepEqual(loadCelebrated(st), blank);
  saveCelebrated({ last: Y, seen: [3], msg: 'daily:1' }, st);
  assert.equal(loadCelebrated(st).last, Y);
  m.set('soda.celebrated.v1', '{oops');
  assert.deepEqual(loadCelebrated(st), blank);
});

test('art builders produce SVG for every mood and badge', () => {
  for (const mood of MOODS) assert.match(catSvg({ mood }), /^<svg[\s\S]*<\/svg>$/);
  assert.match(catSvg({ mood: 'wide', hat: true, crown: true, zzz: true }), /<svg/);
  for (const b of BADGES) {
    assert.match(badgeSvg(b), /<svg/);
    assert.match(badgeSvg(b, { earned: false }), /locked/);
  }
});

test('the cat is named Coca and each svg gets its own clip id', () => {
  assert.equal(CAT_NAME, 'Coca');
  const ids = [...(catSvg() + catSvg()).matchAll(/id="(cat-stage-\d+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 2);
  assert.ok(!/clip-path/.test(catSvg({ stage: false })));
});
