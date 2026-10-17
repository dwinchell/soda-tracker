# Soda Tracker

A tiny installable web app (PWA) for cutting down on soda: one big button to log a Coke, a daily limit, and a streak.

## How it works
- **Tap "I had a Coke"** to log one soda. It counts instantly (works offline) and syncs in the background. "Oops, undo last" removes the latest one from today.
- **Daily limit**: set how many sodas a day. Changing it applies from today on; earlier days keep the limit they had.
- **Streak**: each day at or under the limit adds 1. A day over the limit resets it to 0. Days before the first goal was set are ignored, and days with no taps count as 0 sodas. Today counts live: it adds 1 while you are at or under the limit, and drops to 0 the moment you go over.
- **Cheat day**: once per week (Monday to Sunday) you can cover a day over the limit. It keeps the streak alive without adding to it. Can be applied to today or any of the last 6 days, and removed again. The database enforces one per week.
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
| `app.js`, `index.html`, `styles.css` | UI |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline and install support |
| `vendor/supabase.js` | supabase-js 2.45.4 bundled (so the app opens offline) |
| `sql/001_schema.sql` | Database schema (already applied) |

## Security
Row Level Security is on for all three tables; rows are visible only to their owner and `anon` has no access. The key in `config.js` is the public key and is safe to ship. Never commit the service-role key or database password. Turn off public signups in Supabase (Authentication, Sign In / Providers) and create the account by hand.

## Develop
```
node --test test/streak.test.js test/store.test.js test/shell.test.js
python3 -m http.server 8000     # then open http://localhost:8000
```
New app files must be added to `APP_FILES` in `sw.js` (a test checks). Bump `CACHE` in `sw.js` if cached files must be force-refreshed.

### Updating the vendored library
```
npm i @supabase/supabase-js@<version> esbuild
echo "export * from '@supabase/supabase-js';" > entry.js
npx esbuild entry.js --bundle --minify --format=esm --outfile=vendor/supabase.js
```
