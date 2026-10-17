// Local-first state. The UI reads and writes only this module; changes are applied locally at once
// and queued in an outbox that is sent to Supabase whenever a connection allows.
import * as remoteReal from './remote.js';
import { localYmd, canApplyCheat } from './streak.js';

const KEY = 'soda.v1';
// met: has this user met Coca (accepted the intro)? null until the first sync says; the server table coca_intro is the truth.
const fresh = () => ({ entries: [], goals: [], cheats: [], met: null, outbox: [], rev: 0, synced: false, error: null });

export function createStore({ storage = globalThis.localStorage, remote = remoteReal, now = () => new Date() } = {}) {
  let state = fresh();
  try { state = { ...fresh(), ...JSON.parse(storage.getItem(KEY)) }; } catch { /* first run */ }
  const listeners = new Set();
  let syncing = false, retryMs = 0, timer = null, online = true, syncedOnce = false;

  const save = () => { try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ } };
  const emit = () => listeners.forEach((f) => f(state));
  const mutate = (fn) => { fn(state); state.rev++; save(); emit(); scheduleSync(300); };

  function queue(op) {
    const ob = state.outbox;
    // Coalesce: an unsent insert that is then deleted cancels out; likewise cheat/uncheat; latest goal per date wins.
    if (op.k === 'del') {
      const i = ob.findIndex((o) => o.k === 'ins' && o.id === op.id);
      if (i >= 0) { ob.splice(i, 1); return; }
    } else if (op.k === 'uncheat') {
      const i = ob.findIndex((o) => o.k === 'cheat' && o.day === op.day);
      if (i >= 0) { ob.splice(i, 1); return; }
    } else if (op.k === 'met') {
      if (ob.some((o) => o.k === 'met')) return;
    } else if (op.k === 'goal') {
      const i = ob.findIndex((o) => o.k === 'goal' && o.effective_from === op.effective_from);
      if (i >= 0) ob.splice(i, 1);
    }
    ob.push(op);
  }

  const api = {
    get: () => state,
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    today: () => localYmd(now()),

    addSoda() {
      const e = { id: crypto.randomUUID(), log_date: localYmd(now()), drank_at: now().toISOString() };
      mutate(() => { state.entries.push(e); queue({ k: 'ins', ...e }); });
      return e;
    },
    /** Removes the most recent soda logged today (the "oops" button). Returns false if none. */
    undoLast() {
      const today = localYmd(now());
      const todays = state.entries.filter((e) => e.log_date === today);
      if (!todays.length) return false;
      const last = todays.reduce((a, b) => (b.drank_at > a.drank_at ? b : a));
      mutate(() => { state.entries = state.entries.filter((e) => e.id !== last.id); queue({ k: 'del', id: last.id }); });
      return true;
    },
    /** Sets the daily limit starting today. Earlier days keep the limit they had. */
    setGoal(limit) {
      const n = Math.max(0, Math.min(50, Math.floor(Number(limit))));
      if (!Number.isFinite(n)) return;
      const g = { effective_from: localYmd(now()), daily_limit: n };
      mutate(() => {
        state.goals = state.goals.filter((x) => x.effective_from !== g.effective_from).concat(g);
        queue({ k: 'goal', ...g });
      });
    },
    /** Applies a cheat day. Refused (false) unless allowed: within the last 7 days, one per week. */
    applyCheat(day) {
      if (!canApplyCheat(day, localYmd(now()), new Set(state.cheats)) || state.cheats.includes(day)) return false;
      mutate(() => { state.cheats.push(day); queue({ k: 'cheat', day }); });
      return true;
    },
    /** Records that she has met Coca, so the intro is never shown again on any device. */
    meetCoca() {
      if (state.met === true) return;
      mutate(() => { state.met = true; queue({ k: 'met' }); });
    },
    removeCheat(day) {
      if (!state.cheats.includes(day)) return false;
      mutate(() => { state.cheats = state.cheats.filter((d) => d !== day); queue({ k: 'uncheat', day }); });
      return true;
    },

    setOnline(v) { online = v; if (v) scheduleSync(0); },
    clearError() { state.error = null; save(); emit(); },
    hasUnsent: () => state.outbox.length > 0,
    wipe() { state = fresh(); save(); emit(); },

    async sync() {
      if (syncing || !online) return;
      syncing = true;
      try {
        const uid = await remote.currentUserId();
        if (!uid) return;
        // 1. Send unsent changes in order.
        while (state.outbox.length) {
          const op = state.outbox[0];
          const r = await send(uid, op);
          if (r.error) {
            if (r.error.transient) { retryMs = Math.min(60000, retryMs ? retryMs * 2 : 2000); scheduleSync(retryMs); return; }
            // Permanent refusal (e.g. a second cheat day in a week): drop it; the pull below restores server truth.
            state.error = r.error.message;
          }
          state.outbox.shift();
          save();
        }
        // 2. Pull. Apply only if nothing changed locally meanwhile.
        const rev = state.rev;
        const r = await remote.fetchAll();
        if (r.error) { if (r.error.transient) { retryMs = Math.min(60000, retryMs ? retryMs * 2 : 2000); scheduleSync(retryMs); } return; }
        if (state.rev !== rev || state.outbox.length) { scheduleSync(300); return; }
        state.entries = r.data.entries; state.goals = r.data.goals; state.cheats = r.data.cheats; state.met = r.data.met;
        state.synced = true; syncedOnce = true; retryMs = 0;
        save(); emit();
      } finally { syncing = false; emit(); }
    },
  };

  function send(uid, op) {
    switch (op.k) {
      case 'ins': return remote.insertEntry(uid, op);
      case 'del': return remote.deleteEntry(op.id);
      case 'goal': return remote.upsertGoal(uid, op);
      case 'cheat': return remote.addCheat(uid, op.day);
      case 'uncheat': return remote.removeCheat(op.day);
      case 'met': return remote.markMet(uid);
      default: return Promise.resolve({ error: null });
    }
  }
  function scheduleSync(ms) { clearTimeout(timer); timer = setTimeout(() => api.sync(), ms); timer.unref?.(); }
  api.isSyncing = () => syncing;
  /** True once a full download from the server has completed during this page load. */
  api.hasSynced = () => syncedOnce;
  return api;
}
