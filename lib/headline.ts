/** Sentence case for imported uppercase headlines, without changing stored text.
 * Context supplies the spelling of names; known local names and acronyms cover
 * headlines whose excerpt doesn't repeat them. Already edited titles stay intact.
 */
const acronyms = new Set(('ONU OMS OPS OEA UE FMI BID BM BCRA AFIP ARCA ANSES PAMI INDEC IPC IVA DNI CBU CVU CUIL CUIT UTA CGT ATE CTA UATRE RENATRE UOCRA UCR PJ PRO LLA EE UU EEUU USA NASA FIFA AFA ATP NBA IA ADN VIH HPV COVID SAME UNLaR UNdeC UNDelta UTN INV EDELaR YPF YCRT').split(' '));
const namePhrases = [
  'La Rioja', 'La Voz Riojana', 'Argentina', 'Chilecito', 'Famatina', 'Chañarmuyo',
  'Sanagasta', 'Chamical', 'Aimogasta', 'Chepes', 'Villa Unión', 'Patquía',
  'Anillaco', 'Arauco', 'Vinchina', 'Ulapes', 'Nonogasta', 'Pagancillo',
  'Buenos Aires', 'Santa Fe', 'Córdoba', 'Catamarca', 'Mendoza', 'Tucumán',
  'Salta', 'Jujuy', 'San Juan', 'San Luis', 'Santiago del Estero',
  'Estados Unidos', 'Brasil', 'Uruguay', 'Paraguay', 'Bolivia', 'Chile',
  'Costa Rica', 'Mar del Plata', 'Bariloche', 'San Justo', 'Rosario Central',
  'Paso de la Patria', 'Paraná', 'Itatí', 'Malvinas', 'El Saladillo',
  // Frequent local names and recurring subjects when excerpts omit their spelling.
  'Quintela', 'Ricardo', 'Menem', 'Mercado Luna', 'Yanina Latorre',
  'Nora Colosimo', 'La Joaqui', 'Luck Ra', 'Tomás Holder', 'Daniel Osvaldo',
  'Dibu Martínez', 'Diego Maradona', 'Casa Mama', 'Remediar'
];
const common = new Set(('el la los las un una unos unas en de del al por para con sin sobre entre desde hasta hacia tras según durante ante bajo contra que quien quienes cómo cuando donde qué más menos muy ya no sí se su sus este esta estos estas ese esa esos esas fue son es era hay será serán hubo habrá como también además así luego hoy ayer mañana mientras y o e ni pero porque aunque si a lo').split(' '));
const word = /[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu;
const lower = (value: string) => value.toLocaleLowerCase('es-AR');
const phraseSpellings = new Map(namePhrases.map(phrase => [lower(phrase), phrase]));
const phrasePattern = new RegExp(`(^|[^\\p{L}])(${[...phraseSpellings.keys()].map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^\\p{L}])`, 'gu');

export function formatHeadline(title: string, context = ''): string {
  const letters = title.match(/\p{L}/gu) || [];
  if (!letters.length || letters.filter(letter => letter === letter.toLocaleUpperCase('es-AR')).length / letters.length < .85) return title;

  const spellings = new Map<string, string>();
  for (const acronym of acronyms) spellings.set(lower(acronym), acronym);
  // Mixed-case brands in the original headline are intentional (e.g. EDELaR).
  for (const token of title.match(word) || []) {
    if (/\p{Lu}/u.test(token) && (/\p{Ll}/u.test(token) || /\d/u.test(token))) spellings.set(lower(token), token);
  }
  const contextLetters = context.match(/\p{L}/gu) || [];
  const contextIsShouting = contextLetters.length > 0 && contextLetters.filter(letter => letter === letter.toLocaleUpperCase('es-AR')).length / contextLetters.length > .85;
  if (!contextIsShouting) {
    for (const match of context.matchAll(word)) {
      const token = match[0];
      const key = lower(token);
      if (!/^\p{Lu}/u.test(token) || common.has(key)) continue;
      const prefix = context.slice(0, match.index).trimEnd();
      const next = context.slice((match.index || 0) + token.length).trimStart();
      // Sentence-initial verbs aren't names; a following capital suggests a name.
      if ((!prefix || /[.!?]$/.test(prefix)) && !/^\p{Lu}/u.test(next) && !/^[\p{Lu}\d-]{2,}$/u.test(token)) continue;
      spellings.set(key, token);
    }
  }
  const result = lower(title).replace(word, token => spellings.get(token) || token)
    .replace(phrasePattern, (_, prefix: string, phrase: string) => prefix + phraseSpellings.get(phrase));
  return result.replace(/\p{L}/u, letter => letter.toLocaleUpperCase('es-AR'));
}
