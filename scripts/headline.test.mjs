import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = await readFile(new URL('../lib/headline.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { formatHeadline } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('preserves edited headlines and empty input', () => {
  assert.equal(formatHeadline('La Rioja presentó el acuerdo con YPF'), 'La Rioja presentó el acuerdo con YPF');
  assert.equal(formatHeadline(''), '');
});
test('uses sentence case with local names and accented initial letters', () => {
  assert.equal(formatHeadline('AVANZAN LAS OBRAS EN CHAÑARMUYO Y LA RIOJA'), 'Avanzan las obras en Chañarmuyo y La Rioja');
  assert.equal(formatHeadline('ÚLTIMAS NOVEDADES EN CHILECITO'), 'Últimas novedades en Chilecito');
  assert.equal(formatHeadline('RICARDO QUINTELA PARTICIPÓ DE UNA CUMBRE EN MAR DEL PLATA'), 'Ricardo Quintela participó de una cumbre en Mar del Plata');
  assert.equal(formatHeadline('YANINA LATORRE CRUZÓ A NORA COLOSIMO'), 'Yanina Latorre cruzó a Nora Colosimo');
  assert.equal(formatHeadline('ACUERDO DE LA UNDELTA Y LA UNDEC EN COSTA RICA'), 'Acuerdo de la UNDelta y la UNdeC en Costa Rica');
});
test('recovers names from context, without capitalizing articles or initial verbs', () => {
  assert.equal(formatHeadline('FERNANDO NAHIM MORA INFORMÓ SOBRE EL ACUERDO', 'Fernando Nahim Mora informó sobre el acuerdo.'), 'Fernando Nahim Mora informó sobre el acuerdo');
  assert.equal(formatHeadline('AVANZAN LAS OBRAS DE LA PROVINCIA', 'Avanzan las obras. La provincia anunció los trabajos.'), 'Avanzan las obras de la provincia');
});
test('preserves acronyms and mixed-case institutional names', () => {
  assert.equal(formatHeadline('LA ONU Y EDELAR FIRMARON UN ACUERDO CON YPF'), 'La ONU y EDELaR firmaron un acuerdo con YPF');
  assert.equal(formatHeadline('EDELaR PRESENTÓ SU PLAN'), 'EDELaR presentó su plan');
  assert.equal(formatHeadline('NUEVO ANUNCIO DE LA UNSJ', 'La UNSJ comunicó su decisión.'), 'Nuevo anuncio de la UNSJ');
  assert.equal(formatHeadline('OBRAS EN LA RN38 Y PREVENCIÓN DEL COVID-19'), 'Obras en la RN38 y prevención del COVID-19');
});
