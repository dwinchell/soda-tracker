import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../store.js';

const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const NOW = new Date(2026, 9, 14, 15, 0, 0); // Wed 2026-10-14 local

function fakeRemote({ failWith } = {}) {
  const db = { entries: [], goals: [], cheats: [] };
  const calls = [];
  const ok = { error: null };
  return {
    db, calls,
    currentUserId: async () => 'u1',
    insertEntry: async (u, e) => { calls.push(['ins', e.id]); if (failWith) return { error: failWith }; db.entries.push({ id: e.id, log_date: e.log_date, drank_at: e.drank_at }); return ok; },
    deleteEntry: async (id) => { calls.push(['del', id]); db.entries = db.entries.filter((e) => e.id !== id); return ok; },
    upsertGoal: async (u, g) => { calls.push(['goal']); db.goals = db.goals.filter((x) => x.effective_from !== g.effective_from).concat({ effective_from: g.effective_from, daily_limit: g.daily_limit }); return ok; },
    addCheat: async (u, d) => {
      calls.push(['cheat', d]);
      if (db.cheats.length) return { error: { message: 'duplicate key value violates unique constraint', transient: false } };
      db.cheats.push(d); return ok;
    },
    removeCheat: async (d) => { calls.push(['uncheat', d]); db.cheats = db.cheats.filter((x) => x !== d); return ok; },
    fetchAll: async () => ({ error: null, data: { entries: [...db.entries], goals: [...db.goals], cheats: [...db.cheats] } }),
  };
}
const make = (remote = fakeRemote()) => ({ remote, store: createStore({ storage: memStorage(), remote, now: () => NOW }) });

test('tapping adds a soda locally at once and sends it once on sync', async () => {
  const { store, remote } = make();
  store.addSoda(); store.addSoda();
  assert.equal(store.get().entries.length, 2);
  await store.sync();
  assert.equal(remote.db.entries.length, 2);
  assert.equal(store.get().outbox.length, 0);
  await store.sync();
  assert.equal(remote.calls.filter((c) => c[0] === 'ins').length, 2); // not re-sent
});

test('an unsent soda that is undone never reaches the server', async () => {
  const { store, remote } = make();
  store.addSoda(); store.undoLast();
  assert.equal(store.get().entries.length, 0);
  await store.sync();
  assert.deepEqual(remote.calls, []);
});

test('undo removes a synced soda on the server', async () => {
  const { store, remote } = make();
  store.addSoda(); await store.sync();
  assert.equal(store.undoLast(), true);
  await store.sync();
  assert.equal(remote.db.entries.length, 0);
  assert.equal(store.undoLast(), false);
});

test('transient failure keeps the change queued', async () => {
  const { store } = make(fakeRemote({ failWith: { message: 'offline', transient: true } }));
  store.addSoda(); await store.sync();
  assert.equal(store.get().outbox.length, 1);
  assert.equal(store.get().entries.length, 1);
});

test('goal applies from today and the latest per date wins', () => {
  const { store } = make();
  store.setGoal(3); store.setGoal(2);
  assert.deepEqual(store.get().goals, [{ effective_from: '2026-10-14', daily_limit: 2 }]);
  assert.equal(store.get().outbox.length, 1);
});

test('only one cheat day per week locally; server refusal is rolled back', async () => {
  const { store, remote } = make();
  assert.equal(store.applyCheat('2026-10-13'), true);
  assert.equal(store.applyCheat('2026-10-14'), false); // same Mon-Sun week
  assert.equal(store.applyCheat('2026-10-05'), false); // older than 7 days
  await store.sync();
  assert.deepEqual(remote.db.cheats, ['2026-10-13']);
  // Simulate another device having used this week's cheat: server refuses ours, local is corrected.
  const { store: s2, remote: r2 } = make();
  r2.db.cheats.push('2026-10-12');
  s2.applyCheat('2026-10-14');
  await s2.sync();
  assert.deepEqual(s2.get().cheats, ['2026-10-12']);
  assert.match(s2.get().error, /unique/);
});

test('removing an unsent cheat day cancels it', async () => {
  const { store, remote } = make();
  store.applyCheat('2026-10-14'); store.removeCheat('2026-10-14');
  await store.sync();
  assert.deepEqual(remote.calls, []);
});

test('state survives a reload', () => {
  const storage = memStorage();
  const a = createStore({ storage, remote: fakeRemote(), now: () => NOW });
  a.addSoda();
  const b = createStore({ storage, remote: fakeRemote(), now: () => NOW });
  assert.equal(b.get().entries.length, 1);
  assert.equal(b.get().outbox.length, 1);
});
