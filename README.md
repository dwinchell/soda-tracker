# Soda Tracker

A tiny installable web app (PWA) for cutting down on soda: one big button to log a Coke, a daily limit, and a streak.

## How it works
- **Tap "I had a Coke"** to log one soda. It counts instantly (works offline) and syncs in the background. "Oops, undo last" removes the latest one from today.
- **Daily limit**: set how many sodas a day. Changing it applies from today on; earlier days keep the limit they had.
- **Streak**: each finished day at or under the limit adds 1; a finished day over the limit resets it to 0. Today is added once the day ends (at midnight). Days before the first goal was set are ignored, and days with no taps count as 0 sodas.
- **Cheat day**: once per week (Monday to Sunday) you can cover a day over the limit. A cheat day counts as a day in the streak instead of resetting it. Can be applied to today or any of the last 6 days, and removed again. The database enforces one per week.
- **Coca the cat**: a judgmental Havana Brown (cola-colored fur, green eyes, on a cream backdrop so she stands out in light and dark mode) reacts on the main screen (side-eye at the limit, glare when over, grudging approval otherwise) and throws the celebrations.
- **Introducing Coca**: the first time a user signs in, a full-screen intro playfully warns that Coca will judge her for going over the limit. Whether she has met Coca is stored in the `coca_intro` table (one row per user), so it shows once per user, on any device, never again. "Meet Coca" in the footer replays it. Celebrations wait until it has been accepted. The footer shows the build version.
- **Celebrations**: the first time she opens the app on a new day after a day under the limit, a pop-up with a random cat message appears (never the same one twice in a row). A cheat-day yesterday gets a suspicious message instead. Every 7th day of the streak is a bigger "Week N" party (party hat, more confetti, golden glow, growing with each week up to week 5). Shown once per device per day; skipped if yesterday was over the limit.
- **Badges** at 3, 7, 14, 30, 100 and 365 days of streak (Kitten Steps, Whisker Week, Catnap Champ, Purr-fect Month, Cool Cat, Nine Lives Legend), shown on a shelf with the date earned and celebrated when unlocked. Earned from her best streak, so they are never lost.
- **Progress**: last 7 days against the limit line, and last 7 days vs the 7 before.
- Days are the phone's local calendar days (midnight to midnight).

## Stack
Vanilla JS ES modules, no build step. Supabase (Postgres + email/password auth), hosted as static files (Vercel).
Same shape as the Personal Tracker app: local-first state in `localStorage` plus an outbox synced to Supabase, service worker for offline.

| File | Role |
|---|---|
| `streak.js` | Pure date and streak logic (unit-tested) |
| `store.js` | Local state, outbox, sync (unit-tested with a fake remote) |
| `remote.js` | The only code that talks to Supabase |
| `cat.js`, `achievements.js`, `messages.js` | Cat art (SVG), badge definitions and art, message pools |
| `celebrate.js`, `celebrate-ui.js` | What to celebrate (pure, tested) and the pop-up with confetti |
| `app.js`, `index.html`, `styles.css` | UI |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline and install support |
| `vendor/supabase.js` | supabase-js 2.45.4 bundled (so the app opens offline) |
| `sql/001_schema.sql`, `sql/002_coca_intro.sql` | Database schema (already applied) |

## Security
Row Level Security is on for all three tables; rows are visible only to their owner and `anon` has no access. The key in `config.js` is the public key and is safe to ship. Never commit the service-role key or database password. Turn off public signups in Supabase (Authentication, Sign In / Providers) and create the account by hand.

## Develop
```
node --test test/*.test.js
python3 -m http.server 8000     # then open http://localhost:8000
```
New app files must be added to `APP_FILES` in `sw.js` (a test checks). Bump `CACHE` in `sw.js` if cached files must be force-refreshed.

### Updating the vendored library
```
npm i @supabase/supabase-js@<version> esbuild
echo "export * from '@supabase/supabase-js';" > entry.js
npx esbuild entry.js --bundle --minify --format=esm --outfile=vendor/supabase.js
```
