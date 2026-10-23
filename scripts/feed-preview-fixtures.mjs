/**
 * Copies tests/fixtures/feed/valid into the isolated preview, moving every
 * date so that the fixtures' "now" (2026-10-23 16:30 in La Rioja) becomes
 * the moment the preview starts. Date-times move by the exact difference;
 * calendar dates (YYYY-MM-DD) by whole days in La Rioja, so "today" stays
 * today and weekday names are recomputed. Used by scripts/editorial-preview.mjs.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_NOW = Date.parse('2026-10-23T16:30:00-03:00');
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TZ = 'America/Argentina/La_Rioja';

const dayKey = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ms));
const utcDay = (key) => Date.UTC(...key.split('-').map((part, index) => Number(part) - (index === 1 ? 1 : 0)));
const weekday = (key) => new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(utcDay(key) + 12 * 3600_000));

/** La Rioja has no daylight saving time: -03:00 all year. */
function laRiojaIso(ms) {
  const local = new Date(ms - 3 * 3600_000).toISOString().slice(0, 19);
  return `${local}-03:00`;
}

export function shiftDates(value, deltaMs, deltaDays) {
  if (typeof value === 'string') {
    if (DATE_TIME.test(value)) return laRiojaIso(Date.parse(value) + deltaMs);
    if (DATE.test(value) && !Number.isNaN(utcDay(value))) {
      const moved = new Date(utcDay(value) + deltaDays * 86400_000).toISOString().slice(0, 10);
      // Keep impossible dates impossible (the fixtures include one on purpose).
      return new Date(utcDay(value)).toISOString().slice(0, 10) === value ? moved : value;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => shiftDates(item, deltaMs, deltaDays));
  if (value && typeof value === 'object') {
    const shifted = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shiftDates(item, deltaMs, deltaDays)]));
    if (typeof shifted.fecha === 'string' && DATE.test(shifted.fecha) && typeof shifted.dia === 'string' && shifted.fecha !== value.fecha) {
      shifted.dia = weekday(shifted.fecha);
    }
    return shifted;
  }
  return value;
}

export async function writePreviewFeeds(targetDir, now = Date.now()) {
  const source = path.join(root, 'tests/fixtures/feed/valid');
  const deltaMs = now - FIXTURE_NOW;
  const deltaDays = Math.round((utcDay(dayKey(now)) - utcDay(dayKey(FIXTURE_NOW))) / 86400_000);
  await mkdir(targetDir, { recursive: true });
  const files = (await readdir(source)).filter((name) => name.endsWith('.json'));
  for (const name of files) {
    const data = JSON.parse(await readFile(path.join(source, name), 'utf8'));
    await writeFile(path.join(targetDir, name), JSON.stringify(shiftDates(data, deltaMs, deltaDays), null, 2));
  }
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) throw new Error('Uso: node scripts/feed-preview-fixtures.mjs <carpeta>');
  console.log((await writePreviewFeeds(path.resolve(target))).join(', '));
}
