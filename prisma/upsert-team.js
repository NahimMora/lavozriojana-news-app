/**
 * Actualiza (upsert, no destructivo) las dos fichas de autor "de base":
 * el responsable editorial (Fernando Nahim Mora, firma real de las notas) y
 * la firma institucional general (Redacción La Voz Riojana, en espera por si
 * en el futuro se suma más gente y todavía no tiene nombre público).
 *
 * El esquema anterior de "Redacción <Sección>" + corresponsal ficticio por
 * sección se descontinuó: ver prisma/merge-authors-into-fernando.js.
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

async function main() {
  await prisma.author.upsert({
    where: { slug: 'redaccion-la-voz-riojana' },
    update: {
      name: 'Redacción La Voz Riojana',
      role: 'Redacción',
      bio: 'Firma institucional de reserva de La Voz Riojana. Las notas del medio se firman actualmente con el nombre real de su responsable editorial, Fernando Nahim Mora.',
      avatarUrl: LOGO_URL,
      isInstitutional: true,
      isActive: true
    },
    create: {
      name: 'Redacción La Voz Riojana',
      slug: 'redaccion-la-voz-riojana',
      role: 'Redacción',
      bio: 'Firma institucional de reserva de La Voz Riojana. Las notas del medio se firman actualmente con el nombre real de su responsable editorial, Fernando Nahim Mora.',
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
      bio: 'Responsable editorial de La Voz Riojana. Firma la cobertura de todas las secciones del medio, con foco en la actualidad de La Rioja.',
      avatarUrl: LOGO_URL,
      isInstitutional: false,
      isActive: true
    },
    create: {
      name: 'Fernando Nahim Mora',
      slug: 'fernando-nahim-mora',
      role: 'Director periodístico y responsable editorial',
      specialty: 'Cobertura general — Política, Sociedad, Policiales, Economía, Deportes y Espectáculos de La Rioja',
      bio: 'Responsable editorial de La Voz Riojana. Firma la cobertura de todas las secciones del medio, con foco en la actualidad de La Rioja.',
      avatarUrl: LOGO_URL,
      isInstitutional: false
    }
  });
  console.log('OK: fernando-nahim-mora');
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
