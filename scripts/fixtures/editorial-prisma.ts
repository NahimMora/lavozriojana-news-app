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
const author = { id: 1, name: 'Fernando Nahim Mora', slug: 'fernando-nahim-mora', role: 'Director editorial', bio: 'Periodismo con mirada local y compromiso con la comunidad riojana.', isInstitutional: false, isActive: true };
const paragraph = 'La Rioja tiene una historia que se escribe todos los días en sus ciudades y pueblos. Las iniciativas de la comunidad ponen en primer plano el trabajo compartido, la participación de los vecinos y los desafíos que atraviesa la provincia.';
const posts = Array.from({ length: 78 }, (_, i) => ({
  id: i + 1, slug: `noticia-de-prueba-${i + 1}`, title: i === 3 ? 'NUEVAS PROPUESTAS PARA LA RIOJA: EDUCACIÓN, CULTURA Y PARTICIPACIÓN CIUDADANA' : titles[i % titles.length],
  excerpt: 'Con la mirada puesta en el futuro de la provincia, instituciones y vecinos impulsan iniciativas que conectan el trabajo, la cultura y la vida cotidiana.',
  contentHtml: `<p>${paragraph}</p><p>${paragraph}</p><p>La propuesta reúne a instituciones, organizaciones y familias de distintos departamentos. <strong>El protagonismo de la comunidad</strong> es el punto de partida de esta etapa.</p><h2>Una mirada desde el territorio</h2><p>${paragraph}</p><blockquote><p>El encuentro y la participación son el motor de nuestra comunidad.</p></blockquote><p>${paragraph}</p><ul><li>Actividades abiertas a la comunidad.</li><li>Participación de los departamentos del interior.</li></ul><p>Más información en <a href="/categoria/interior">nuestra cobertura del interior</a>.</p>`,
  contentText: paragraph.repeat(10), category: categories[i % categories.length], categoryId: i % categories.length + 1,
  author, authorId: 1, status: 'PUBLISHED', publishedAt: new Date(Date.UTC(2026, 9, 22, 18) - i * 3600000), updatedAt: new Date('2026-10-22T18:00:00Z'), createdAt: new Date('2026-10-01T12:00:00Z'),
  mainImageUrl: i === 9 ? null : `/qa/photo-${i % 6}.jpg`, mainImageAlt: 'Imagen de referencia para la vista de prueba', mainImageWidth: 1200, mainImageHeight: 800,
  mainImageCaption: 'Contenido de prueba para revisión visual. No es una noticia publicada.', mainImageCredit: null,
  videoUrl: i === 5 ? '/qa/horizontal.mp4' : i === 8 ? '/qa/vertical.mp4' : null, videoPoster: `/qa/photo-${i % 6}.jpg`,
  isFeatured: i < 5, isBreaking: i < 3, editorialPriority: 100 - i, viewCount: 200 - i,
  tags: [{ tagId: 1, tag: { name: 'La Rioja', slug: 'la-rioja' } }], comments: [{ id: 1, authorName: 'Lector de prueba', body: 'Comentario de ejemplo para revisar la experiencia de lectura.' }],
  sources: [{ id: 1, name: 'Fuente de prueba', type: 'ELABORACION_PROPIA', url: null, order: 0 }], sourceName: null, sourceUrl: null, storyKey: i % 11 === 0 ? 'historia-de-prueba' : null, metadata: null
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
const banners = ['HOME_MIDDLE', 'ARTICLE_INLINE', 'CATEGORY_TOP', 'SIDEBAR'].map((slot, i) => ({ id: i + 1, name: 'Publicidad de prueba', slot, isActive: true, imageUrl: '/qa/banner.svg', altText: 'Publicidad de prueba — vista local', linkUrl: null, startsAt: null, endsAt: null, priority: 1, createdAt: new Date() }));
const sample = process.env.LVR_PREVIEW_MODE === 'empty' ? [] : process.env.LVR_PREVIEW_MODE === 'single' ? posts.slice(0, 1) : process.env.LVR_PREVIEW_MODE === 'sparse' ? posts.slice(0, 14) : posts;
const mock = { post: model(sample), category: model(categories), author: model([author]), banner: { ...model(banners), updateMany: async () => ({ count: 0 }) }, redirect: model([]), pageView: { findFirst: async () => ({ id: 1 }) } };
export const prisma = mock as unknown as PrismaClient;
export const isDatabaseConfigured = () => true;
