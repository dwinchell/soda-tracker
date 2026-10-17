import { createStore } from './store.js';
import * as remote from './remote.js';
import {
  addDays, localYmd, parseYmd, countsByDay, computeStats, recentDays, weeklyTrend,
  cheatInWeek, canApplyCheat, dailyRuns, badgeDates,
} from './streak.js';
import { catSvg } from './cat.js';
import { BADGES, badgeSvg } from './achievements.js';
import { QUIPS, CAT_NAME } from './messages.js';
import { planCelebration, loadCelebrated, saveCelebrated, clearCelebrated, pickStable } from './celebrate.js';
import { showCelebration } from './celebrate-ui.js';

const store = createStore();
const root = document.getElementById('app');
let showIntro = false;
let user = remote.storedUserId();   // known immediately from the saved session, even offline
let loginError = '';
let toast = '';

const dayName = (day, today) => {
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return parseYmd(day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
};
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function render() {
  if (!user) return renderLogin();
  const s = store.get();
  if (showIntro) return renderIntro(s, false);
  if (!s.goals.length) {
    if (!celebrateReady) return renderWaking(s); // wait for the first sync so a returning user is not treated as new
    return introSeen() ? renderGoalSetup(s) : renderIntro(s, true);
  }
  const today = store.today();
  const cheats = new Set(s.cheats);
  const counts = countsByDay(s.entries);
  const st = computeStats({ today, counts, goals: s.goals, cheats });
  const recent = recentDays({ today, n: 7, counts, goals: s.goals, cheats });
  const trend = weeklyTrend(today, counts);
  const weekCheat = cheatInWeek(today, cheats);
  const over = st.todayStatus === 'over';
  const maxScale = Math.max(st.todayLimit, ...recent.map((r) => Math.max(r.count, r.limit ?? 0)), 1);

  const dots = Array.from({ length: Math.max(st.todayLimit, st.todayCount) }, (_, i) =>
    `<span class="dot ${i < st.todayCount ? (i >= st.todayLimit ? 'extra' : 'on') : ''}"></span>`).join('');

  let banner = '';
  if (st.todayStatus === 'cheat') {
    banner = `<div class="banner cheat"><b>Cheat day in use.</b> Today still counts toward your streak.
      <button class="btn small" data-act="uncheat" data-day="${today}">Undo cheat day</button></div>`;
  } else if (over && !weekCheat) {
    banner = `<div class="banner over"><span><b>Over today's limit.</b> ${st.atRisk
      ? `Use your cheat day to keep your ${plural(st.current, 'day')} streak.` : 'Tomorrow is a fresh start.'}</span>
      <button class="btn primary" data-act="cheat" data-day="${today}">Use my cheat day</button></div>`;
  } else if (over) {
    banner = `<div class="banner over"><b>Over today's limit.</b> This week's cheat day is already used (${dayName(weekCheat, today)}).${st.atRisk ? ' Your streak resets at midnight.' : ' Tomorrow is a fresh start.'}</div>`;
  }

  const cheatLine = weekCheat
    ? `Cheat day this week: used on ${dayName(weekCheat, today)}.`
    : `Cheat day this week: <b>available</b>. ${over || st.todayStatus === 'cheat' ? '' : `<button class="linkbtn" data-act="cheat" data-day="${today}">Plan it for today</button>`}`;

  const rows = recent.map((r) => {
    const w = Math.min(100, (r.count / maxScale) * 100);
    const lim = r.limit == null ? '' : `<span class="limit" style="left:calc(${(r.limit / maxScale) * 100}% - 1px)"></span>`;
    const cls = r.status === 'over' ? 'over' : r.status === 'cheat' ? 'cheat' : '';
    let tag = `<span class="tag" style="color:var(--ok)">${r.count} ✓</span>`;
    if (r.status === 'nogoal') {
      tag = `<span class="tag muted">${r.count || '—'}</span>`;
    } else if (r.status === 'over') {
      tag = canApplyCheat(r.day, today, cheats)
        ? `<button class="btn small" data-act="cheat" data-day="${r.day}">${r.count} · cheat?</button>`
        : `<span class="tag" style="color:var(--over)">${r.count} over</span>`;
    } else if (r.status === 'cheat') {
      tag = `<button class="btn small" data-act="uncheat" data-day="${r.day}" title="Remove cheat day">${r.count} · cheat ✕</button>`;
    }
    return `<div class="row"><span class="when">${dayName(r.day, today)}</span>
      <span class="track"><span class="fill ${cls}" style="width:${w}%"></span>${lim}</span>${tag}</div>`;
  }).join('');

  const runs = dailyRuns({ today, counts, goals: s.goals, cheats });
  const earned = badgeDates(runs, BADGES.map((b) => b.days));
  const atLimit = st.todayLimit > 0 && st.todayCount === st.todayLimit;
  const quipKey = st.todayStatus === 'over' ? 'over' : st.todayStatus === 'cheat' ? 'cheat' : atLimit ? 'atLimit'
    : st.todayCount === 0 ? (runs.length ? 'zero' : 'fresh') : 'under';
  const mood = quipKey === 'over' ? 'glare' : quipKey === 'zero' ? 'smug' : quipKey === 'under' ? 'half' : 'judge';
  const quip = pickStable(QUIPS[quipKey], `${today}:${st.todayCount}:${st.todayLimit}`);
  const shelf = BADGES.map((b) => {
    const when = earned[b.days];
    return `<div class="shelf-item ${when ? 'got' : ''}" title="${b.blurb}">${badgeSvg(b, { earned: !!when, size: 64 })}
      <div class="shelf-name">${when ? b.name : `${b.days} days`}</div>
      ${when ? `<div class="muted shelf-sub">${parseYmd(when).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}</div>` : ''}</div>`;
  }).join('');

  const diff = trend.change;
  const trendText = trend.prev7 === 0 && trend.last7 === 0 ? 'No sodas in the last two weeks.'
    : `Last 7 days: <b>${trend.last7}</b> vs <b>${trend.prev7}</b> the week before` +
      (diff < 0 ? ` — down ${Math.abs(diff)} 🎉` : diff > 0 ? ` — up ${diff}` : ' — the same');

  root.innerHTML = `
    <div class="top"><h1>🐾 Soda Tracker</h1><span class="muted">${syncText(s)}</span></div>

    <section class="card streak" aria-label="Streak">
      <div class="num">${st.current}</div>
      <div class="label">day streak${st.current > 0 ? ' 🔥' : ''}</div>
      <div class="best">Best: ${plural(st.best, 'day')} · today counts when it ends</div>
    </section>

    <section class="card mascot" aria-label="${CAT_NAME} the cat">
      ${catSvg({ size: 76, mood, label: `${CAT_NAME}, the judgmental cat` })}
      <p class="bubble">${quip}</p>
    </section>

    <section class="card today" aria-label="Today">
      <div class="count ${over ? 'over' : ''}"><b>${st.todayCount}</b> of ${st.todayLimit} today</div>
      <div class="dots" aria-hidden="true">${dots}</div>
      <button id="soda" data-act="soda">🥤 I had a Coke</button>
      <div><button class="linkbtn" data-act="undo" ${st.todayCount ? '' : 'disabled'}>Oops, undo last</button></div>
    </section>

    ${banner}
    <div class="muted">${cheatLine}</div>

    <section class="card" aria-label="Recent days">
      <h2>Last 7 days <span style="text-transform:none;letter-spacing:0">(line = limit)</span></h2>
      <div class="rows">${rows}</div>
      <div class="trend">${trendText}</div>
    </section>

    <section class="card" aria-label="Badges">
      <h2>Badges</h2>
      <div class="shelf">${shelf}</div>
    </section>

    <section class="card" aria-label="Goal">
      <h2>Daily limit</h2>
      <div class="goal">
        <input id="goal" type="number" inputmode="numeric" min="0" max="50" value="${st.todayLimit}" aria-label="Sodas per day">
        <span>sodas per day</span>
        <button class="btn" data-act="goal">Save</button>
      </div>
      <p class="muted" style="margin:10px 0 0">Changes apply from today on. Earlier days keep the limit they had.</p>
    </section>

    ${s.error ? `<div class="banner over">${s.error} <button class="btn small" data-act="dismiss">OK</button></div>` : ''}
    <footer><span>${toast}</span><span><button class="linkbtn" data-act="meet">Meet ${CAT_NAME}</button><button class="linkbtn" data-act="signout">Sign out</button></span></footer>`;
}

function syncText(s) {
  if (!navigator.onLine) return s.outbox.length ? `Offline · ${s.outbox.length} waiting` : 'Offline';
  if (s.outbox.length) return `${s.outbox.length} waiting to sync`;
  return s.synced ? '✓ Synced' : 'Syncing…';
}

const introKey = () => `soda.intro.${user}`;
const introSeen = () => { try { return localStorage.getItem(introKey()) === '1'; } catch { return false; } };
const markIntroSeen = () => { try { localStorage.setItem(introKey(), '1'); } catch { /* ignore */ } };

function renderWaking(s) {
  root.innerHTML = `
    <div class="top"><h1>🐾 Soda Tracker</h1><span class="muted">${syncText(s)}</span></div>
    <section class="card mascot">${catSvg({ size: 76, mood: 'smug', label: `${CAT_NAME}, asleep` })}
      <p class="bubble">${CAT_NAME} is waking up…</p></section>`;
}

// First-login welcome (also reachable from the footer): warns, playfully, that she will be judged.
function renderIntro(s, first) {
  root.innerHTML = `
    <div class="top"><h1>🐾 Soda Tracker</h1></div>
    <section class="card intro">
      <div class="intro-cat">${catSvg({ size: 168, mood: 'judge', label: `${CAT_NAME}, a Havana Brown cat, judging you` })}</div>
      <h2 class="intro-title">Introducing ${CAT_NAME}</h2>
      <p class="bubble intro-quote">“I will be watching.”</p>
      <p>${CAT_NAME} is a Havana Brown, the exact color of a cold Coke, with strong opinions about yours.
        She counts every one. She forgets nothing.</p>
      <ul class="intro-list">
        <li><span>🥤</span><span>Tap the big button every time you have a Coke. She'll know if you don't.</span></li>
        <li><span>🔥</span><span>Stay at or under your daily limit to build a streak. She will pretend not to care.</span></li>
        <li><span>😾</span><span>Go over, and she will notice. She won't say a word. She will just <i>look at you</i>.</span></li>
        <li><span>🐟</span><span>One cheat day a week. She'll allow it. Silently. Judging.</span></li>
      </ul>
      <button class="btn primary" data-act="intro-ok">${first ? 'I accept being judged' : 'Back to her watchful gaze'}</button>
    </section>`;
}

function renderGoalSetup(s) {
  root.innerHTML = `
    <div class="top"><h1>🐾 Soda Tracker</h1><span class="muted">${syncText(s)}</span></div>
    <section class="card form">
      <h2>Set your goal</h2>
      <p style="margin:0">How many sodas a day is your limit? Stay at or under it each day to build a streak.</p>
      <label>Sodas per day
        <input id="goal" type="number" inputmode="numeric" min="0" max="50" value="3">
      </label>
      <button class="btn primary" data-act="goal">Start tracking</button>
    </section>`;
}

function renderLogin() {
  root.innerHTML = `
    <div class="top"><h1>🐾 Soda Tracker</h1></div>
    <form class="card form" id="login">
      <label>Email <input name="email" type="email" autocomplete="email" required></label>
      <label>Password <input name="password" type="password" autocomplete="current-password" required></label>
      <div class="err" role="alert">${loginError}</div>
      <button class="btn primary" type="submit">Sign in</button>
    </form>`;
}

root.addEventListener('submit', async (ev) => {
  if (ev.target.id !== 'login') return;
  ev.preventDefault();
  const f = new FormData(ev.target);
  loginError = 'Signing in…'; render();
  const err = await remote.signIn(f.get('email').trim(), f.get('password'));
  loginError = err ? (navigator.onLine ? err : 'You need to be online to sign in the first time.') : '';
  if (!err) { user = await remote.currentUserId(); store.sync(); }
  render();
});

let toastTimer;
const say = (msg) => { toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast = ''; render(); }, 2500); };

root.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const { act, day } = el.dataset;
  if (act === 'soda') { store.addSoda(); navigator.vibrate?.(30); }
  else if (act === 'undo') { if (store.undoLast()) say('Removed the last one'); }
  else if (act === 'goal') {
    const v = document.getElementById('goal').value;
    if (v === '' || !Number.isFinite(Number(v))) return;
    store.setGoal(v); say('Goal saved');
  }
  else if (act === 'cheat') { if (store.applyCheat(day)) say('Cheat day applied'); else say('One cheat day per week'); }
  else if (act === 'uncheat') { store.removeCheat(day); say('Cheat day removed'); }
  else if (act === 'dismiss') store.clearError();
  else if (act === 'intro-ok') { markIntroSeen(); showIntro = false; render(); }
  else if (act === 'meet') { showIntro = true; render(); window.scrollTo(0, 0); }
  else if (act === 'signout') {
    if (store.hasUnsent() && !confirm('Some changes have not synced yet and would be lost. Sign out anyway?')) return;
    await remote.signOut(); store.wipe(); clearCelebrated(); user = null; render();
  }
});

let celebrateReady = false, celebrating = false;
function maybeCelebrate() {
  if (!user || celebrating || !celebrateReady || showIntro) return;
  const s = store.get();
  if (!s.goals.length) return;
  const plan = planCelebration({
    today: store.today(), counts: countsByDay(s.entries), goals: s.goals, cheats: new Set(s.cheats),
    state: loadCelebrated(), rand: Math.random,
  });
  if (!plan) return;
  saveCelebrated(plan.nextState); // mark as shown now, so a reload does not repeat it
  celebrating = true;
  showCelebration(plan, { onClose: () => { celebrating = false; } });
}
// Wait for this session's sync so yesterday's sodas from other devices are counted; do not wait forever.
const readyNow = () => {
  celebrateReady = true;
  if (document.activeElement?.tagName !== 'INPUT') render(); // no-goal screens waited for this
  maybeCelebrate();
};
if (!navigator.onLine) readyNow(); else setTimeout(readyNow, 5000);

store.subscribe(() => {
  if (store.hasSynced() && !celebrateReady) readyNow();
  if (document.activeElement?.tagName === 'INPUT') return;
  render();
});
addEventListener('online', () => { store.setOnline(true); render(); });
addEventListener('offline', () => { store.setOnline(false); render(); });
let lastSync = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  render(); // the day may have rolled over
  maybeCelebrate();
  if (Date.now() - lastSync > 30000) { lastSync = Date.now(); store.sync(); }
});
setInterval(() => { if (document.visibilityState === 'visible') render(); }, 60000);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

render();
remote.currentUserId().then((id) => { user = id; render(); if (id) store.sync(); });
