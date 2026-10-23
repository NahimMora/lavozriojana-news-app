/**
 * Presentation-only sentence case for headlines imported in full uppercase.
 * Stored titles, metadata, feeds, JSON-LD and the article H1 keep the original.
 *
 * Spelling comes from evidence: the article's own excerpt and body (how the
 * newsroom wrote each name), intentional mixed case in the title (EDELaR,
 * RN38) and short lists of local places and acronyms. Titles that already use
 * lowercase are returned untouched.
 */
const acronyms = 'ONU OMS OPS OEA UE FMI BID BCRA AFIP ARCA ANSES PAMI INDEC IPC IVA DNI CBU CVU CUIL CUIT UTA CGT ATE CTA UATRE RENATRE UOCRA UCR PJ PRO LLA EE UU EEUU USA NASA FIFA AFA ATP NBA ADN VIH HPV COVID SAME UNLaR UNdeC UNDelta UNSJ UNCA UNT UBA UTN INV INTA SENASA ANMAT EDELaR YPF YCRT LAM PBI';
const namePhrases = [
  'La Rioja', 'La Voz Riojana', 'Chilecito', 'Famatina', 'Chañarmuyo', 'Sanagasta', 'Chamical',
  'Aimogasta', 'Chepes', 'Villa Unión', 'Patquía', 'Olta', 'Anillaco', 'Arauco', 'Vinchina',
  'Ulapes', 'Nonogasta', 'Pagancillo', 'Castro Barros', 'San Blas de los Sauces', 'El Portezuelo',
  'Talampaya', 'Buenos Aires', 'Santa Fe', 'Córdoba', 'Catamarca', 'Mendoza', 'Tucumán', 'Salta',
  'Jujuy', 'San Juan', 'San Luis', 'Santiago del Estero', 'Mar del Plata', 'Bariloche',
  'Estados Unidos', 'Brasil', 'Uruguay', 'Paraguay', 'Bolivia', 'Chile', 'Malvinas', 'Quintela'
];
// Frequent first names that headlines use alone ("JUSTICIA POR DIEGO") and the
// body may omit. Words that are also common nouns (Luz, Paz, Sol) are left out.
const firstNames = new Set(('diego lionel javier cristina mauricio alberto sergio axel patricia karina ricardo carlos juan josé luis jorge ' +
  'miguel daniel fernando gustavo marcelo pablo martín nicolás santiago mateo franco ezequiel gabriel andrés eduardo raúl ramón ' +
  'maría ana laura marcela silvia susana claudia graciela lucía sofía valentina camila florencia agustina julieta victoria natalia ' +
  'mirtha susana wanda yanina moria').split(/\s+/));
// Lowercase in running Spanish text whatever the context says.
const common = new Set(('a al ante bajo con contra de del desde durante e el en entre hacia hasta la las lo los mediante o para por según sin sobre tras u un una unas uno unos y ' +
  'que qué quien quién quienes cual cuál cuales como cómo cuando cuándo donde dónde cuanto cuánto se su sus le les me mi mis nos no ni ya sí si más menos muy ' +
  'este esta esto estos estas ese esa eso esos esas aquel aquella otro otra otros otras todo toda todos todas cada mismo misma ' +
  'es son fue fueron era eran será serán ser está están estuvo hay hubo habrá ha han había tiene tienen tuvo ' +
  'pero porque aunque mientras también además luego hoy ayer mañana tarde noche año años día días mes meses semana ' +
  'nuevo nueva nuevos nuevas gran grandes primer primera primero segundo segunda último última últimos últimas').split(/\s+/));
// Areas capitalized only inside an institution's name ("Ministerio de Salud").
// In a headline they stay lowercase unless that name is spelled out there too.
const institutionalAreas = new Set(('salud educación empleo industria trabajo desarrollo seguridad cultura turismo economía hacienda producción ' +
  'ambiente deportes defensa innovación ciencia tecnología transporte vivienda infraestructura minería agricultura comercio arte artes').split(' '));
// Conjugated verbs, infinitives with clitics and participles are never names.
const verbLike = /(?:ó|aron|ieron|aba|aban|ía|ían|ará|erá|irá|arán|erán|irán|ando|iendo|ado|ados|ada|adas|ido|idos|ida|idas|[aei]r(?:se|le|les|lo|la|los|las)?)$/u;
const connectors = new Set(['de', 'del', 'y', 'e']);

const word = /[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu;
const sentenceBreak = /[.!?:¡¿"“«(—–-]/;
const lower = (value: string) => value.toLocaleLowerCase('es-AR');
const capitalize = (value: string) => value.replace(/\p{L}/u, l => l.toLocaleUpperCase('es-AR'));
const isShouting = (text: string) => {
  const letters = text.match(/\p{L}/gu) || [];
  return letters.length > 0 && letters.filter(l => l !== lower(l)).length / letters.length >= 0.85;
};
const acronymSpellings = new Map(acronyms.split(' ').map(a => [lower(a), a]));
const phraseSpellings = new Map(namePhrases.map(p => [lower(p), p]));
const phrasePattern = new RegExp(`(^|[^\\p{L}])(${[...phraseSpellings.keys()].sort((a, b) => b.length - a.length).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^\\p{L}])`, 'giu');
const phraseWords = new Set([...phraseSpellings.keys()].flatMap(p => p.split(' ')));

type Evidence = { lower: number; proper: number; initial: number; spelling?: string; acronym?: string };
type Token = { start: number; end: number; key: string; text: string; name: boolean; unknown?: boolean };

function collectEvidence(contexts: Array<string | null | undefined>) {
  const evidence = new Map<string, Evidence>();
  for (const context of contexts) {
    if (!context || isShouting(context)) continue;
    for (const match of context.matchAll(word)) {
      const token = match[0];
      const key = lower(token);
      const entry = evidence.get(key) || { lower: 0, proper: 0, initial: 0 };
      const rest = token.slice(1);
      if (token === key) entry.lower++;
      else if (/\p{Ll}/u.test(rest) && /\p{Lu}/u.test(rest)) entry.acronym = token; // EDELaR, UNLaR
      else if (token.length > 1 && !/\p{Ll}/u.test(token) && !/^\p{N}+$/u.test(token)) entry.acronym = token; // UTN, LAM
      else {
        // Sentence starts are capitalized whatever the word is: not evidence.
        // Look back over whitespace only, without copying the text before it.
        let i = (match.index || 0) - 1;
        while (i >= 0 && /\s/.test(context[i])) i--;
        if (i >= 0 && !sentenceBreak.test(context[i])) entry.proper++;
        else entry.initial++;
        entry.spelling = token;
      }
      evidence.set(key, entry);
    }
  }
  return evidence;
}

export function formatHeadline(title: string, ...contexts: Array<string | null | undefined>): string {
  if (!title || !isShouting(title)) return title;
  const evidence = collectEvidence(contexts);

  const tokens: Token[] = [...title.matchAll(word)].map((match) => {
    const token = match[0];
    const key = lower(token);
    const base = { start: match.index || 0, end: (match.index || 0) + token.length, key };
    // Intentional mixed case or digits in the original (EDELaR, RN38, COVID-19).
    if (/\p{N}/u.test(token) || (/\p{Ll}/u.test(token) && /\p{Lu}/u.test(token))) return { ...base, text: token, name: true };
    const known = acronymSpellings.get(key);
    if (known) return { ...base, text: known, name: true };
    const seen = evidence.get(key);
    if (seen?.acronym && !seen.lower && !seen.proper) return { ...base, text: seen.acronym, name: true };
    if (seen?.proper && seen.proper >= seen.lower * 2 && !institutionalAreas.has(key)) return { ...base, text: seen.spelling || capitalize(key), name: true };
    // Only ever capitalized, at sentence starts: a name rather than a verb ("Diego").
    if (seen?.initial && !seen.lower && !seen.proper && !verbLike.test(key) && !institutionalAreas.has(key) && !common.has(key)) return { ...base, text: seen.spelling || capitalize(key), name: true };
    if (firstNames.has(key) && !seen?.lower) return { ...base, text: capitalize(key), name: true };
    const resolved = !!seen || common.has(key) || phraseWords.has(key) || /^\p{L}$/u.test(token);
    return { ...base, text: key, name: false, unknown: !resolved };
  });

  const adjacent = (a: Token, b: Token) => /^\s+$/.test(title.slice(a.end, b.start));
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    const next = tokens[i + 1];
    // "ESCUELA DE ARTE", "MINISTERIO DE SALUD": the area belongs to the name.
    if (institutionalAreas.has(t.key) && prev && connectors.has(prev.key) && tokens[i - 2]?.name) {
      t.text = capitalize(t.key);
      t.name = true;
    }
    // A word the article never uses, right before an attested name and not a
    // verb, is a first name the body omits: "LUCIANA SALAZAR".
    if (t.unknown && !verbLike.test(t.key) && next?.name && adjacent(t, next)) {
      t.text = capitalize(t.key);
      t.name = true;
    }
  });

  // Without the article's text there is no evidence for unknown words: they
  // could be names, so such a headline keeps its original spelling.
  const hasContext = contexts.some(context => !!context?.trim());
  if (!hasContext && tokens.some(t => t.unknown && !t.name)) return title;

  let result = '';
  let cursor = 0;
  for (const t of tokens) {
    result += title.slice(cursor, t.start) + t.text;
    cursor = t.end;
  }
  result += title.slice(cursor);
  return capitalize(result.replace(phrasePattern, (_, prefix: string, phrase: string) => prefix + phraseSpellings.get(lower(phrase))))
    // The first word of a quotation.
    .replace(/((?:^|[\s(])["“«])(\p{L})/gu, (_, quote: string, l: string) => quote + l.toLocaleUpperCase('es-AR'));
}
