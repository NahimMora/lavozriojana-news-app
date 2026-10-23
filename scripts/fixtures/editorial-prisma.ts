// ONLY copied into a disposable preview by editorial-preview.mjs.
// Synthetic editorial content; never imported by the application in this repo.
import type { PrismaClient } from '@prisma/client';

const names = ['Política', 'Policiales', 'Interior', 'Sociedad', 'Economía', 'Salud', 'Educación', 'Deportes', 'Cultura', 'Espectáculos', 'Último momento'];
const slugs = ['politica', 'policiales', 'interior', 'sociedad', 'economia', 'salud', 'educacion', 'deportes', 'cultura', 'espectaculos', 'ultimo-momento'];
const categories = names.map((name, i) => ({ id: i + 1, name, slug: slugs[i], isActive: true, description: `Actualidad, historias y protagonistas de ${name.toLowerCase()} en La Rioja.` }));
const titles = [
  'La Rioja abre un nuevo capítulo para su desarrollo productivo',
  'La ciudad recupera sus espacios públicos con una agenda abierta a los vecinos',
  'El interior riojano se prepara para un fin de semana de encuentros',
  'La cultura local encuentra nuevos escenarios en los barrios',
  'Comercios de La Rioja: las expectativas para la próxima temporada',
  'Una nueva campaña de prevención llega a los centros de salud',
  'Escuelas de toda la provincia comparten sus proyectos de innovación',
  'El deporte riojano se ilusiona con una nueva generación',
  'Las historias y los paisajes que hacen única a nuestra provincia',
  'La agenda cultural suma música, teatro y propuestas al aire libre',
  'Los vecinos protagonizan una jornada de trabajo comunitario'
];
// Production headlines arrive in full uppercase, 45–95 characters; the body
// spells the names. Fictional people and events, interleaved with edited titles.
const imported = [
  ['LA MUNICIPALIDAD HABILITÓ UN NUEVO CENTRO DE ATENCIÓN EN EL BARRIO FAECHA', 'La intendenta Teresa Madera recorrió el centro del barrio Faecha.'],
  ['CORTES DE LUZ PROGRAMADOS EN ARAUCO, CASTRO BARROS Y SAN BLAS DE LOS SAUCES', 'EDELaR informó los horarios de los trabajos.'],
  ['LA UNLAR ABRE LA INSCRIPCIÓN PARA SUS CARRERAS A DISTANCIA', 'La UNLaR habilitó el registro en su sitio.'],
  ['MARTA IBÁÑEZ PRESENTÓ SU LIBRO SOBRE LA HISTORIA DE FAMATINA EN LA FERIA PROVINCIAL', 'La escritora Marta Ibáñez dialogó con lectores en la feria.'],
  ['ALERTA POR VIENTO ZONDA EN CHILECITO Y LA ZONA CORDILLERANA', 'Defensa Civil recomendó evitar actividades al aire libre.'],
  ['UN NIÑO DE 9 AÑOS FUE RESCATADO TRAS PERDERSE DURANTE UNA EXCURSIÓN EN TALAMPAYA', 'Guardaparques del parque Talampaya encontraron al menor.'],
  ['EL MINISTERIO DE SALUD AMPLÍA LA CAMPAÑA DE VACUNACIÓN EN AIMOGASTA', 'El Ministerio de Salud sumó puestos móviles. La campaña de salud continuará.'],
  ['JULIÁN HERRERA FIRMÓ CON UN CLUB DE LA PRIMERA NACIONAL', 'El delantero Julián Herrera viajará la próxima semana.'],
  ['CAPACITAN A DOCENTES RURALES EN EDUCACIÓN AMBIENTAL', 'La propuesta llega a escuelas de distintos departamentos.'],
  ['PIDEN EL DNI ACTUALIZADO PARA COBRAR LA ASIGNACIÓN', 'ANSES recordó el trámite en sus oficinas.'],
  ['DETUVIERON A UN HOMBRE ACUSADO DE ROBAR HERRAMIENTAS DE UNA OBRA EN LA CAPITAL', 'La Policía de La Rioja secuestró los elementos.'],
  ['LA FIESTA DE LA CHAYA REUNIÓ A MILES DE PERSONAS EN EL PASEO CULTURAL CASTRO BARROS DURANTE TODO EL FIN DE SEMANA', 'La Chaya volvió al Paseo Cultural Castro Barros.'],
  ['SUBA EN EL PRECIO DE LOS ALIMENTOS', 'Comerciantes del centro observaron el aumento.'],
  ['VECINOS DE SANAGASTA RECLAMAN POR EL ESTADO DE LA RUTA 75', 'Los vecinos de Sanagasta enviaron una nota a Vialidad Provincial.'],
  ['LA ORQUESTA INFANTIL DE CHEPES SE PRESENTARÁ EN BUENOS AIRES', 'La Orquesta Infantil de Chepes viaja con 40 integrantes.'],
  ['QUÉ SE SABE DEL NUEVO PROTOCOLO ESCOLAR', 'El documento se aplicará desde marzo.']
];
const author = { id: 1, name: 'Fernando Nahim Mora', slug: 'fernando-nahim-mora', role: 'Director editorial', bio: 'Periodismo con mirada local y compromiso con la comunidad riojana.', isInstitutional: false, isActive: true };
const paragraph = 'La Rioja tiene una historia que se escribe todos los días en sus ciudades y pueblos. Las iniciativas de la comunidad ponen en primer plano el trabajo compartido, la participación de los vecinos y los desafíos que atraviesa la provincia.';
const posts = Array.from({ length: 78 }, (_, i) => ({
  id: i + 1, slug: `noticia-de-prueba-${i + 1}`, title: i === 3 ? 'NUEVAS PROPUESTAS PARA LA RIOJA: EDUCACIÓN, CULTURA Y PARTICIPACIÓN CIUDADANA' : i % 3 === 0 ? titles[(i / 3) % titles.length] : imported[i % imported.length][0],
  excerpt: 'Con la mirada puesta en el futuro de la provincia, instituciones y vecinos impulsan iniciativas que conectan el trabajo, la cultura y la vida cotidiana.',
  contentHtml: `<p>${paragraph}</p><p>${paragraph}</p><p>La propuesta reúne a instituciones, organizaciones y familias de distintos departamentos. <strong>El protagonismo de la comunidad</strong> es el punto de partida de esta etapa.</p><h2>Una mirada desde el territorio</h2><p>${paragraph}</p><blockquote><p>El encuentro y la participación son el motor de nuestra comunidad.</p></blockquote><p>${paragraph}</p><ul><li>Actividades abiertas a la comunidad.</li><li>Participación de los departamentos del interior.</li></ul><p>Más información en <a href="/categoria/interior">nuestra cobertura del interior</a>.</p>`,
  contentText: (i % 3 === 0 ? '' : imported[i % imported.length][1] + ' ') + paragraph.repeat(10), category: categories[i % categories.length], categoryId: i % categories.length + 1,
  author, authorId: 1, status: 'PUBLISHED', publishedAt: new Date(Date.UTC(2026, 9, 22, 18) - i * 3600000), updatedAt: new Date('2026-10-22T18:00:00Z'), createdAt: new Date('2026-10-01T12:00:00Z'),
  mainImageUrl: i === 9 ? null : `/qa/photo-${i % 6}.jpg`, mainImageAlt: 'Imagen de referencia para la vista de prueba', mainImageWidth: 1200, mainImageHeight: 800,
  mainImageCaption: 'Contenido de prueba para revisión visual. No es una noticia publicada.', mainImageCredit: null,
  videoUrl: i === 5 ? '/qa/horizontal.mp4' : i === 8 ? '/qa/vertical.mp4' : null, videoPoster: `/qa/photo-${i % 6}.jpg`,
  isFeatured: i < 5, isBreaking: i < 3, editorialPriority: 100 - i, viewCount: 200 - i,
  tags: [{ tagId: 1, tag: { name: 'La Rioja', slug: 'la-rioja' } }], comments: [{ id: 1, authorName: 'Lector de prueba', body: 'Comentario de ejemplo para revisar la experiencia de lectura.' }],
  sources: [{ id: 1, name: 'Fuente de prueba', type: 'ELABORACION_PROPIA', url: null, order: 0 }], sourceName: null, sourceUrl: null, storyKey: [4, 15, 26].includes(i) ? 'event:3f2a-ruta-75' : i === 60 ? 'event:otro' : i % 11 === 0 ? 'story:historia-de-prueba' : null, metadata: null
}));
function matches(row: any, where: any = {}): boolean {
  return Object.entries(where).every(([key, value]: [string, any]) => {
    if (key === 'OR') return value.some((part: any) => matches(row, part));
    if (key === 'AND') return value.every((part: any) => matches(row, part));
    if (key === 'tags') return false;
    if (value === null || typeof value !== 'object' || value instanceof Date) return row[key] === value;
    return Object.entries(value).every(([op, target]: [string, any]) => {
      if (op === 'not') return row[key] !== target;
      if (op === 'notIn') return !target.includes(row[key]);
      if (op === 'in') return target.includes(row[key]);
      if (op === 'lt') return row[key] < target;
      if (op === 'lte') return row[key] <= target;
      if (op === 'gte') return row[key] >= target;
      if (op === 'contains') return String(row[key]).toLowerCase().includes(target.toLowerCase());
      return matches(row[key] || {}, { [op]: target });
    });
  });
}
function model(rows: any[]) {
  const findMany = async (args: any = {}) => {
    const result = rows.filter(row => matches(row, args.where));
    const orders = Array.isArray(args.orderBy) ? args.orderBy : args.orderBy ? [args.orderBy] : [];
    result.sort((a, b) => { for (const order of orders) { const [key, dir] = Object.entries(order)[0]; if (a[key] !== b[key]) return (a[key] > b[key] ? 1 : -1) * (dir === 'desc' ? -1 : 1); } return 0; });
    return result.slice(args.skip || 0, (args.skip || 0) + (args.take || result.length));
  };
  return { findMany, findFirst: async (args: any) => (await findMany(args))[0] || null, findUnique: async (args: any) => (await findMany(args))[0] || null, count: async (args: any) => (await findMany(args)).length };
}
// --no-ads previews the site as production runs today, with no active banner.
const banners = (process.env.LVR_PREVIEW_ADS === 'off' ? [] : ['HOME_MIDDLE', 'ARTICLE_INLINE', 'CATEGORY_TOP', 'SIDEBAR']).map((slot, i) => ({ id: i + 1, name: 'Publicidad de prueba', slot, isActive: true, imageUrl: '/qa/banner.svg', altText: 'Publicidad de prueba — vista local', linkUrl: null, startsAt: null, endsAt: null, priority: 1, createdAt: new Date() }));
const sample = process.env.LVR_PREVIEW_MODE === 'empty' ? [] : process.env.LVR_PREVIEW_MODE === 'single' ? posts.slice(0, 1) : process.env.LVR_PREVIEW_MODE === 'sparse' ? posts.slice(0, 14) : posts;
const mock = { post: model(sample), category: model(categories), author: model([author]), banner: { ...model(banners), updateMany: async () => ({ count: 0 }) }, redirect: model([]), pageView: { findFirst: async () => ({ id: 1 }) } };
export const prisma = mock as unknown as PrismaClient;
export const isDatabaseConfigured = () => true;
