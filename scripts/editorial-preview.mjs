/** Isolated visual preview. Never loads .env or opens a database connection. */
import { cp, mkdir, mkdtemp, writeFile, symlink, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { writePreviewFeeds } from './feed-preview-fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const preview = await mkdtemp(path.join(tmpdir(), 'lvr-editorial-'));
// middleware.ts included: the preview applies the same CSP as production.
for (const name of ['app', 'components', 'lib', 'types', 'public', 'prisma', 'middleware.ts', 'package.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.mjs', 'postcss.config.mjs', 'tailwind.config.ts', '.eslintrc.json']) {
  try { await cp(path.join(root, name), path.join(preview, name), { recursive: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
// Dependencies are reused; no install, build script, migration, or .env copy.
await symlink(path.join(root, 'node_modules'), path.join(preview, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
await cp(path.join(root, 'scripts/fixtures/editorial-prisma.ts'), path.join(preview, 'lib/prisma.ts'));
await writeFile(path.join(preview, 'lib/weather.ts'), [
  'export async function getLaRiojaWeather() { return { temperature: 24, observed: null }; }',
  ''
].join('\n'));
// Third-party scripts are disabled in this disposable copy only.
let layout = await readFile(path.join(preview, 'app/layout.tsx'), 'utf8');
layout = layout.replace(/<Script\b[\s\S]*?<\/Script>/g, '').replace(/<Script\b[^>]*\/>/g, '');
await writeFile(path.join(preview, 'app/layout.tsx'), layout);
await mkdir(path.join(preview, 'public/qa'), { recursive: true });
await cp(path.join(root, 'scripts/fixtures/images'), path.join(preview, 'public/qa'), { recursive: true });
const port = process.argv[2] || '3100';
// Feed fixtures served by the preview itself, dated around the start time.
await writePreviewFeeds(path.join(preview, 'public/qa-feed'));
if (!/^\d{4,5}$/.test(port)) throw new Error('Usá un puerto local válido.');
const flags = process.argv.slice(3);
if (flags.some(flag => !['--build', '--empty', '--sparse', '--single', '--no-ads', '--no-feeds'].includes(flag))) throw new Error('Opciones: --build, --empty, --sparse, --single, --no-ads, --no-feeds');
const buildOnly = flags.includes('--build');
// Allowlist: credentials, NODE_OPTIONS and production settings cannot leak in.
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|TEMP|TMP|COMSPEC|APPDATA|LOCALAPPDATA|USERPROFILE|NUMBER_OF_PROCESSORS)$/i.test(key)));
Object.assign(env, { NODE_ENV: buildOnly ? 'production' : 'development', NEXT_TELEMETRY_DISABLED: '1', DATABASE_URL: 'mysql://preview:preview@127.0.0.1:1/isolated', NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`, LVR_PREVIEW_MODE: flags.includes('--empty') ? 'empty' : flags.includes('--single') ? 'single' : flags.includes('--sparse') ? 'sparse' : 'full', LVR_PREVIEW_ADS: flags.includes('--no-ads') ? 'off' : 'on',
  // --no-feeds: the seven feeds answer 404, as production did when this integration was written.
  FEED_BASE_URL: `http://127.0.0.1:${port}/${flags.includes('--no-feeds') ? 'qa-feed-ausente' : 'qa-feed'}` });
if (buildOnly) {
  const configPath = path.join(preview, 'next.config.mjs');
  const config = await readFile(configPath, 'utf8');
  await writeFile(configPath, config.replace('export default nextConfig;', 'nextConfig.experimental = { ...nextConfig.experimental, cpus: nextConfig.experimental?.cpus || 2 };\nexport default nextConfig;'));
}
console.log(`Vista aislada: http://localhost:${port}\nCopia temporal: ${preview}\nSin base de datos ni credenciales. Ctrl+C para cerrar.`);
const args = buildOnly ? ['build'] : ['dev', '-H', '127.0.0.1', '-p', port];
const child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), ...args], { cwd: preview, env, stdio: 'inherit' });
process.on('SIGINT', () => child.kill('SIGINT'));
child.on('exit', code => process.exit(code || 0));
