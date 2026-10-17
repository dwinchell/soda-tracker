// The only module that talks to Supabase. Loaded lazily so tests can import store.js in Node.
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_JS } from './config.js';

let clientPromise, attempts = 0;
export function client() {
  // Browsers remember a failed module import for that exact URL, so a retry uses a distinct fragment
  // (same network request, different module-map key).
  clientPromise ||= import(attempts++ ? `${SUPABASE_JS}#retry${attempts}` : SUPABASE_JS).then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } }))
    // If the library could not load (offline, first run), try again next time instead of caching the failure.
    .catch((e) => { clientPromise = null; throw e; });
  return clientPromise;
}

/** Signed-in user id (from the saved session), or null. Works offline from the stored session. */
export async function currentUserId() {
  try {
    const sb = await client();
    const { data } = await sb.auth.getSession();
    if (data?.session) return data.session.user.id;
  } catch { /* offline import failure: fall through to stored session */ }
  return storedUserId();
}

/** Reads the saved session directly, so the app opens offline even if the token cannot refresh. */
export function storedUserId() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        return JSON.parse(localStorage.getItem(k))?.user?.id || null;
      }
    }
  } catch { /* ignore */ }
  return null;
}

export async function signIn(email, password) {
  const sb = await client();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signOut() {
  const sb = await client();
  await sb.auth.signOut();
}

// Every call resolves to { error: null } or { error: { message, transient } }.
const wrap = async (fn) => {
  try {
    const res = await fn(await client());
    if (!res.error) return { error: null, data: res.data };
    const s = res.status ?? 0;
    return { error: { message: res.error.message, transient: s === 0 || s >= 500 || s === 401 || s === 408 || s === 429 } };
  } catch (e) {
    return { error: { message: String(e?.message || e), transient: true } };
  }
};

export const insertEntry = (userId, e) =>
  wrap((sb) => sb.from('soda_entries').upsert(
    { client_id: e.id, user_id: userId, log_date: e.log_date, drank_at: e.drank_at }, { onConflict: 'client_id' }));
export const deleteEntry = (id) => wrap((sb) => sb.from('soda_entries').delete().eq('client_id', id));
export const upsertGoal = (userId, g) =>
  wrap((sb) => sb.from('goals').upsert(
    { user_id: userId, effective_from: g.effective_from, daily_limit: g.daily_limit }, { onConflict: 'user_id,effective_from' }));
export const addCheat = (userId, day) =>
  wrap((sb) => sb.from('cheat_days').upsert({ user_id: userId, day }, { onConflict: 'user_id,day', ignoreDuplicates: true }));
export const markMet = (userId) =>
  wrap((sb) => sb.from('coca_intro').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true }));
export const removeCheat = (day) => wrap((sb) => sb.from('cheat_days').delete().eq('day', day));

/** Downloads everything (keyset-paged: PostgREST returns at most 1000 rows per request). */
export async function fetchAll() {
  const entries = [];
  let last = 0;
  for (;;) {
    const r = await wrap((sb) => sb.from('soda_entries').select('id,client_id,log_date,drank_at')
      .gt('id', last).order('id').limit(1000));
    if (r.error) return r;
    entries.push(...r.data.map((x) => ({ id: x.client_id, log_date: x.log_date, drank_at: x.drank_at })));
    if (r.data.length < 1000) break;
    last = r.data[r.data.length - 1].id;
  }
  const g = await wrap((sb) => sb.from('goals').select('effective_from,daily_limit'));
  if (g.error) return g;
  const c = await wrap((sb) => sb.from('cheat_days').select('day'));
  if (c.error) return c;
  const m = await wrap((sb) => sb.from('coca_intro').select('user_id').limit(1));
  if (m.error) return m;
  return { error: null, data: { entries, goals: g.data, cheats: c.data.map((x) => x.day), met: m.data.length > 0 } };
}
