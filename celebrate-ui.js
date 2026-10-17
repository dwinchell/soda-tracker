// Celebration overlay: the cat, a message, new badges, and confetti. Honors reduced-motion.
import { catSvg } from './cat.js';
import { badgeSvg } from './achievements.js';
import { CLOSE_LABELS } from './messages.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMOJI = ['🐟', '🐾', '✨', '🎉', '🐱', '💖'];
const COLORS = ['#c8102e', '#f0b429', '#8b7bea', '#2fa36b', '#3b82f6', '#f06fa4'];

function confetti(canvas, count, ms) {
  const dpr = window.devicePixelRatio || 1;
  const w = (canvas.width = innerWidth * dpr), h = (canvas.height = innerHeight * dpr);
  const ctx = canvas.getContext('2d');
  const parts = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * w, y: -Math.random() * h * 0.6, vx: (Math.random() - 0.5) * 3 * dpr, vy: (2 + Math.random() * 3.5) * dpr,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25, size: (10 + Math.random() * 12) * dpr,
    emoji: i % 3 === 0 ? EMOJI[i % EMOJI.length] : null, color: COLORS[i % COLORS.length],
  }));
  const start = performance.now();
  let raf;
  const frame = (t) => {
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += 0.015 * dpr;
      if (p.y < h + 30) alive++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      if (p.emoji) { ctx.font = `${p.size * 1.3}px serif`; ctx.fillText(p.emoji, 0, 0); }
      else { ctx.fillStyle = p.color; ctx.fillRect(-p.size / 4, -p.size / 2, p.size / 2, p.size); }
      ctx.restore();
    }
    if (alive && t - start < ms) raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/** Shows the overlay for a plan from planCelebration(). `onClose` runs when she dismisses it. */
export function showCelebration(plan, { onClose } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opener = document.activeElement;
  const size = 120 + plan.level * 14;
  const el = document.createElement('div');
  el.className = `celebrate lvl${plan.level}${reduce ? ' still' : ''}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'cel-title');
  const badges = plan.badges.length ? `<div class="cel-badges">${plan.badges.map((b) => `
      <div class="cel-badge">${badgeSvg(b, { size: 76 })}<div><b>${esc(b.name)}</b><br><span class="muted">${esc(b.cheer)}</span></div></div>`).join('')}</div>` : '';
  const close = CLOSE_LABELS[Math.floor(Math.random() * CLOSE_LABELS.length)];
  el.innerHTML = `
    <canvas class="confetti" aria-hidden="true"></canvas>
    <div class="cel-card">
      <div class="cel-cat">${catSvg({ size, mood: plan.mood, hat: plan.hat, label: 'The cat, reacting' })}</div>
      <h2 id="cel-title">${esc(plan.title)}</h2>
      <p class="cel-msg">${esc(plan.message)}</p>
      ${badges}
      <button class="btn primary" data-close>${esc(close)}</button>
    </div>`;
  document.body.appendChild(el);

  const count = reduce || plan.kind === 'cheat' ? 0 : plan.kind === 'week' ? 90 + 45 * plan.level : plan.level ? 60 : 26;
  const stop = count ? confetti(el.querySelector('canvas'), count, plan.kind === 'week' ? 7000 : 3500) : () => {};

  const btn = el.querySelector('[data-close]');
  const done = () => {
    stop(); el.remove(); removeEventListener('keydown', onKey);
    opener?.focus?.(); onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') done(); };
  addEventListener('keydown', onKey);
  btn.addEventListener('click', done);
  btn.focus();
  return done;
}
