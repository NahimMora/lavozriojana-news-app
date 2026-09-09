/**
 * Actualiza (upsert, no destructivo) las fichas de autor que respaldan /equipo
 * y /autores/[slug]: la firma institucional general y el perfil real del
 * responsable editorial. No reasigna el autor de notas ya publicadas.
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
