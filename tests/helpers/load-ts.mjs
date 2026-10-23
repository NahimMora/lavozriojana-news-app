// Loads TypeScript modules of the app for node --test, without a build step:
// each file and its relative or "@/" imports are transpiled with the
// project's own typescript into node_modules/.cache (so bare imports such as
// "zod" resolve from node_modules). No database, no network.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'node_modules/.cache/lvr-tests');
const built = new Map();

function resolveSource(fromFile, specifier) {
  const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
  }
  throw new Error(`No se encontró ${specifier} desde ${fromFile}`);
}

const outName = (file) => path.join(out, `${path.relative(root, file).replace(/[\\/]/g, '__').replace(/\.tsx?$/, '')}.mjs`);

async function build(file) {
  if (built.has(file)) return built.get(file);
  const target = outName(file);
  built.set(file, target);
  const source = await readFile(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: file
  });
  const imports = [...outputText.matchAll(/(from\s+|import\s*\(\s*|import\s+)(['"])((?:@\/|\.{1,2}\/)[^'"]+)\2/g)];
  let code = outputText;
  for (const match of imports) {
    const dependency = resolveSource(file, match[3]);
    const dependencyOut = await build(dependency);
    code = code.replace(`${match[2]}${match[3]}${match[2]}`, `'./${path.basename(dependencyOut)}'`);
  }
  await mkdir(out, { recursive: true });
  await writeFile(target, code);
  return target;
}

export async function loadTs(relativePath) {
  const target = await build(path.join(root, relativePath));
  return import(pathToFileURL(target).href);
}

export const fixturePath = (...parts) => path.join(root, 'tests/fixtures/feed', ...parts);
export const readFixture = async (...parts) => JSON.parse(await readFile(fixturePath(...parts), 'utf8'));
