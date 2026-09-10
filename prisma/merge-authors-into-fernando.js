/**
 * Migración de datos, una sola vez (idempotente: se puede re-correr sin romper nada).
 *
 * Consolida bajo "Fernando Nahim Mora" (responsable editorial real) todas las notas
 * que hoy están firmadas por las cuentas institucionales "Redacción <Sección>"
 * (Política, Policiales, Interior, Sociedad, Economía, Salud, Educación, Deportes,
 * Cultura, Espectáculos), y elimina esas 10 cuentas institucionales y las 10 cuentas
 * de corresponsal con nombre de persona que se habían asignado a cada sección
 * (creadas antes por el autopublicador externo, sin ninguna nota publicada).
 *
 * No toca "Redacción La Voz Riojana" (queda como firma institucional de reserva)
 * ni las fechas (publishedAt/updatedAt) de ninguna nota.
 *
 * Uso:
 *   node prisma/merge-authors-into-fernando.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SECTION_INSTITUTIONAL_SLUGS = [
  'redaccion-politica',
  'redaccion-policiales',
  'redaccion-interior',
  'redaccion-sociedad',
  'redaccion-economia',
  'redaccion-salud',
  'redaccion-educacion',
  'redaccion-deportes',
  'redaccion-cultura',
  'redaccion-espectaculos'
];

const CORRESPONDENT_SLUGS = [
  'valeria-nievas',
  'lucas-castillo',
  'romina-vera',
  'gabriela-moyano',
  'martin-alvarez',
  'carolina-rios',
  'daniela-quiroga',
  'pablo-aranda',
  'fernanda-acosta',
  'facundo-llanos'
];

async function main() {
  const fernando = await prisma.author.findUnique({ where: { slug: 'fernando-nahim-mora' } });
  if (!fernando) {
    throw new Error('No existe el autor fernando-nahim-mora todavía. Correr primero: node prisma/upsert-team.js');
  }

  for (const slug of SECTION_INSTITUTIONAL_SLUGS) {
    const author = await prisma.author.findUnique({ where: { slug } });
    if (!author) {
      console.log(`SKIP (no existe): ${slug}`);
      continue;
    }

    const { count } = await prisma.post.updateMany({
      where: { authorId: author.id },
      data: { authorId: fernando.id }
    });

    await prisma.author.delete({ where: { id: author.id } });
    console.log(`OK: ${slug} -> ${count} nota(s) reasignada(s) a fernando-nahim-mora, cuenta eliminada.`);
  }

  for (const slug of CORRESPONDENT_SLUGS) {
    const author = await prisma.author.findUnique({ where: { slug } });
    if (!author) {
      console.log(`SKIP (no existe): ${slug}`);
      continue;
    }

    const remainingPosts = await prisma.post.count({ where: { authorId: author.id } });
    if (remainingPosts > 0) {
      // Por las dudas: si llegó a publicarse algo con este autor, reasignar antes de borrar.
      await prisma.post.updateMany({ where: { authorId: author.id }, data: { authorId: fernando.id } });
      console.log(`  (tenía ${remainingPosts} nota(s), reasignadas a fernando-nahim-mora)`);
    }

    await prisma.author.delete({ where: { id: author.id } });
    console.log(`OK: ${slug} -> cuenta de corresponsal eliminada.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Listo: notas consolidadas bajo Fernando Nahim Mora, cuentas obsoletas eliminadas.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
