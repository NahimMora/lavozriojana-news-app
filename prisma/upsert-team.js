/**
 * Actualiza (upsert, no destructivo) las fichas de autor que respaldan /equipo
 * y /autores/[slug]: la firma institucional general, el responsable editorial,
 * las firmas institucionales por sección y los corresponsales por sección.
 * No reasigna el autor de notas ya publicadas.
 *
 * `role` se usa como convención para agrupar /equipo:
 *   - "Director periodístico y responsable editorial" -> responsable editorial
 *   - "Corresponsal"                                   -> corresponsales por sección
 *   - "Redacción"                                       -> firmas institucionales
 *
 * Uso:
 *   node prisma/upsert-team.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/*
 * Ruta relativa, igual que Header/Footer (components/layout/*): el logo se sirve
 * desde public/logo.png en el propio dominio, no desde media.lavozriojana.com
 * (el único host habilitado en next.config.mjs para next/image). Una URL absoluta
 * a lavozriojana.com rompe next/image porque ese host no está en remotePatterns.
 */
const LOGO_URL = '/logo.png';

/* slug de las firmas institucionales "Redacción <Categoría>" ya creadas por el
   autopublicador externo, en el mismo orden que INITIAL_CATEGORIES (lib/site.ts). */
const SECTION_INSTITUTIONAL = [
  { slug: 'redaccion-politica', categoria: 'Política' },
  { slug: 'redaccion-policiales', categoria: 'Policiales' },
  { slug: 'redaccion-interior', categoria: 'Interior' },
  { slug: 'redaccion-sociedad', categoria: 'Sociedad' },
  { slug: 'redaccion-economia', categoria: 'Economía' },
  { slug: 'redaccion-salud', categoria: 'Salud' },
  { slug: 'redaccion-educacion', categoria: 'Educación' },
  { slug: 'redaccion-deportes', categoria: 'Deportes' },
  { slug: 'redaccion-cultura', categoria: 'Cultura' },
  { slug: 'redaccion-espectaculos', categoria: 'Espectáculos' }
];

/* Los 10 autores con nombre de persona que ya existían en la base (creados por el
   autopublicador externo, sin ninguna nota publicada todavía): se asignan 1 a 1
   como corresponsal de cada sección. */
const CORRESPONDENTS = [
  { slug: 'valeria-nievas', categoria: 'Política' },
  { slug: 'lucas-castillo', categoria: 'Policiales' },
  { slug: 'romina-vera', categoria: 'Interior' },
  { slug: 'gabriela-moyano', categoria: 'Sociedad' },
  { slug: 'martin-alvarez', categoria: 'Economía' },
  { slug: 'carolina-rios', categoria: 'Salud' },
  { slug: 'daniela-quiroga', categoria: 'Educación' },
  { slug: 'pablo-aranda', categoria: 'Deportes' },
  { slug: 'fernanda-acosta', categoria: 'Cultura' },
  { slug: 'facundo-llanos', categoria: 'Espectáculos' }
];

async function main() {
  await prisma.author.upsert({
    where: { slug: 'redaccion-la-voz-riojana' },
    update: {
      name: 'Redacción La Voz Riojana',
      role: 'Redacción',
      bio: 'Firma institucional de La Voz Riojana para la cobertura general del medio. Actualmente está a cargo de Fernando Nahim Mora, responsable editorial.',
      avatarUrl: LOGO_URL,
      isInstitutional: true,
      isActive: true
    },
    create: {
      name: 'Redacción La Voz Riojana',
      slug: 'redaccion-la-voz-riojana',
      role: 'Redacción',
      bio: 'Firma institucional de La Voz Riojana para la cobertura general del medio. Actualmente está a cargo de Fernando Nahim Mora, responsable editorial.',
      avatarUrl: LOGO_URL,
      isInstitutional: true
    }
  });
  console.log('OK: redaccion-la-voz-riojana');

  await prisma.author.upsert({
    where: { slug: 'fernando-nahim-mora' },
    update: {
      name: 'Fernando Nahim Mora',
      role: 'Director periodístico y responsable editorial',
      specialty: 'Cobertura general — Política, Sociedad, Policiales, Economía, Deportes y Espectáculos de La Rioja',
      bio: 'Responsable editorial de La Voz Riojana. Actualmente conduce en forma individual la cobertura de todas las secciones del medio, con foco en la actualidad de La Rioja.',
      avatarUrl: LOGO_URL,
      isInstitutional: false,
      isActive: true
    },
    create: {
      name: 'Fernando Nahim Mora',
      slug: 'fernando-nahim-mora',
      role: 'Director periodístico y responsable editorial',
      specialty: 'Cobertura general — Política, Sociedad, Policiales, Economía, Deportes y Espectáculos de La Rioja',
      bio: 'Responsable editorial de La Voz Riojana. Actualmente conduce en forma individual la cobertura de todas las secciones del medio, con foco en la actualidad de La Rioja.',
      avatarUrl: LOGO_URL,
      isInstitutional: false
    }
  });
  console.log('OK: fernando-nahim-mora');

  for (const { slug, categoria } of SECTION_INSTITUTIONAL) {
    const updated = await prisma.author.updateMany({
      where: { slug },
      data: {
        role: 'Redacción',
        specialty: categoria,
        bio: `Firma institucional de La Voz Riojana para la cobertura de ${categoria}.`,
        avatarUrl: LOGO_URL,
        isInstitutional: true
      }
    });
    console.log(updated.count ? `OK: ${slug}` : `SKIP (no existe): ${slug}`);
  }

  for (const { slug, categoria } of CORRESPONDENTS) {
    const updated = await prisma.author.updateMany({
      where: { slug },
      data: {
        role: 'Corresponsal',
        specialty: categoria,
        bio: `Cobertura de la sección ${categoria} de La Voz Riojana.`,
        avatarUrl: LOGO_URL,
        isInstitutional: true
      }
    });
    console.log(updated.count ? `OK: ${slug}` : `SKIP (no existe): ${slug}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Listo: fichas de equipo actualizadas.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
