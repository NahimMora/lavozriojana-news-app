// node --test scripts/headline.test.mjs — no database, no network.
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = await readFile(new URL('../lib/headline.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { formatHeadline } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('leaves edited headlines and empty input untouched', () => {
  assert.equal(formatHeadline('La Rioja presentó el acuerdo con YPF'), 'La Rioja presentó el acuerdo con YPF');
  assert.equal(formatHeadline('Famatina: ESTADO DE ALERTA'), 'Famatina: ESTADO DE ALERTA');
  assert.equal(formatHeadline(''), '');
});

test('local places, acronyms and documents', () => {
  const ctx = 'Las obras avanzan en distintos departamentos de la provincia.';
  assert.equal(formatHeadline('AVANZAN LAS OBRAS EN FAMATINA, AIMOGASTA Y LA RIOJA', ctx), 'Avanzan las obras en Famatina, Aimogasta y La Rioja');
  assert.equal(formatHeadline('LA UNLAR ABRE LA INSCRIPCIÓN Y PIDE EL DNI', ctx), 'La UNLaR abre la inscripción y pide el DNI');
  assert.equal(formatHeadline('EDELAR CORTA EL SUMINISTRO ELÉCTRICO ESTE SÁBADO EN CHAMICAL', ctx), 'EDELaR corta el suministro eléctrico este sábado en Chamical');
  assert.equal(formatHeadline('CORTES DE LUZ EN ARAUCO, CASTRO BARROS Y SAN BLAS DE LOS SAUCES', ctx), 'Cortes de luz en Arauco, Castro Barros y San Blas de los Sauces');
  assert.equal(formatHeadline('EE.UU. EXPRESÓ PREOCUPACIÓN POR MALVINAS', ctx), 'EE.UU. expresó preocupación por Malvinas');
  assert.equal(formatHeadline('OBRAS EN LA RN38 Y PREVENCIÓN DEL COVID-19', ctx), 'Obras en la RN38 y prevención del COVID-19');
  assert.equal(formatHeadline('ÚLTIMAS NOVEDADES EN CHILECITO', ctx), 'Últimas novedades en Chilecito');
});

test('names come from the article body, verbs stay lowercase', () => {
  const body = 'El gobernador Ricardo Quintela recordó sus inicios junto a la periodista Esmeralda Mitre.';
  assert.equal(formatHeadline('RICARDO QUINTELA REPASÓ SU TRAYECTORIA POLÍTICA', body), 'Ricardo Quintela repasó su trayectoria política');
  assert.equal(formatHeadline('ANDREA RINCÓN REVELÓ DETALLES SOBRE LA INTERNA DE LOS ORTEGA', 'La actriz Andrea Rincón habló de su amistad con Julieta Ortega.'),
    'Andrea Rincón reveló detalles sobre la interna de los Ortega');
  // The body only uses the surname: the adjacent first name is recovered.
  assert.equal(formatHeadline('LUCIANA SALAZAR REVELÓ QUE SALIÓ CON UN HOMBRE MENOR', 'La modelo Salazar respondió preguntas.'), 'Luciana Salazar reveló que salió con un hombre menor');
  assert.equal(formatHeadline('LA JOAQUI ROMPE EL SILENCIO TRAS EL LANZAMIENTO DE LUCK RA', 'La cantante La Joaqui habló del tema de Luck Ra.'), 'La Joaqui rompe el silencio tras el lanzamiento de Luck Ra');
  assert.equal(formatHeadline('JUSTICIA POR DIEGO: EL PEDIDO FINAL DE SUS HIJAS', 'La familia pidió justicia.'), 'Justicia por Diego: el pedido final de sus hijas');
});

test('institution names versus their area as a common noun', () => {
  const body = 'El Ministerio de Salud lanzó un programa de salud mental. Participó la Escuela de Arte.';
  assert.equal(formatHeadline('SALUD PROVINCIAL CAPACITA A PROFESIONALES EN SALUD MENTAL', body), 'Salud provincial capacita a profesionales en salud mental');
  assert.equal(formatHeadline('EL MINISTERIO DE SALUD Y LA ESCUELA DE ARTE FIRMARON UN CONVENIO', body), 'El Ministerio de Salud y la Escuela de Arte firmaron un convenio');
  assert.equal(formatHeadline('ALERTA EN SALUD POR EL RECORTE DEL PROGRAMA', body), 'Alerta en salud por el recorte del programa');
});

test('without the article text, unknown words keep the original headline', () => {
  assert.equal(formatHeadline('ANDREA RINCÓN REVELÓ DETALLES'), 'ANDREA RINCÓN REVELÓ DETALLES');
  assert.equal(formatHeadline('LA UNLAR Y EL DNI EN LA RIOJA'), 'La UNLaR y el DNI en La Rioja');
});

test('quotations start with a capital letter', () => {
  assert.equal(formatHeadline('LANZARON EL TALLER "CUIDARTE ES AMARTE" EN LA RIOJA', 'El taller se dictó en la Capital.'), 'Lanzaron el taller "Cuidarte es amarte" en La Rioja');
});
