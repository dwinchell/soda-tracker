import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('service worker caches the vendored library', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.ok(sw.includes("'./vendor/supabase.js'"));
});

test('service worker caches every app file', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const files = readdirSync(new URL('..', import.meta.url)).filter((f) => /\.(js|html|css|webmanifest)$/.test(f) && f !== 'sw.js');
  for (const f of files) assert.ok(sw.includes(`'./${f}'`), `${f} missing from APP_FILES`);
});
