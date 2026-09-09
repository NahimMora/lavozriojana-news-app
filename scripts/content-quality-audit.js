/**
 * Auditoría de calidad de contenido (solo lectura, no destructiva).
 *
 * Recorre las noticias publicadas y reporta problemas potenciales de valor
 * editorial: notas muy cortas, sin autor identificable, sin fuentes, sin
 * imagen, sin descripción SEO, títulos duplicados o slugs casi idénticos.
 * No borra ni modifica nada: solo genera un reporte para revisión editorial manual.
 *
 * Uso:
 *   node scripts/content-quality-audit.js            → tabla en consola
 *   node scripts/content-quality-audit.js --csv       → CSV en stdout (redirigir a archivo)
 *   node scripts/content-quality-audit.js --min-words 250
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const asCsv = args.includes('--csv');
const minWordsArg = args.indexOf('--min-words');
const MIN_WORDS = minWordsArg !== -1 ? Number(args[minWordsArg + 1]) || 300 : 300;

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Distancia de Levenshtein simple, para detectar slugs casi idénticos. */
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

async function main() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      category: true,
      author: true,
      sources: true
    },
    orderBy: { publishedAt: 'desc' }
  });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lavozriojana.com').replace(/\/+$/, '');

  const titleGroups = new Map();
  for (const post of posts) {
    const key = normalizeTitle(post.title);
    if (!titleGroups.has(key)) titleGroups.set(key, []);
    titleGroups.get(key).push(post.slug);
  }

  const rows = posts.map((post) => {
    const words = wordCount(post.contentText);
    const hasSources = post.sources.length > 0 || !!post.sourceName;
    const hasImage = !!post.mainImageUrl;
    const hasDescription = !!(post.seoDescription || post.excerpt);
    const isInstitutionalOnly = post.author?.isInstitutional !== false;
    const duplicateTitle = (titleGroups.get(normalizeTitle(post.title)) || []).length > 1;

    const issues = [];
    if (words < MIN_WORDS) issues.push(`Nota corta (${words} palabras, mínimo sugerido ${MIN_WORDS})`);
    if (!hasSources) issues.push('Sin fuentes consultadas');
    if (!hasImage) issues.push('Sin imagen principal');
    if (!hasDescription) issues.push('Sin descripción SEO ni bajada');
    if (duplicateTitle) issues.push('Título duplicado o muy similar a otra nota');
    if (!post.category) issues.push('Sin categoría');
    if (isInstitutionalOnly && !hasSources && words < MIN_WORDS) {
      issues.push('Firma institucional + corta + sin fuentes: revisar si es una reescritura de bajo valor');
    }

    return {
      url: `${siteUrl}/noticias/${post.slug}`,
      title: post.title,
      words,
      author: post.author?.name || '(sin autor)',
      sources: post.sources.length || (post.sourceName ? 1 : 0),
      category: post.category?.name || '(sin categoría)',
      description: hasDescription ? 'sí' : 'no',
      image: hasImage ? 'sí' : 'no',
      issues: issues.join(' | ') || '—'
    };
  });

  // Slugs casi idénticos (distancia de edición baja entre notas distintas).
  const slugPairs = [];
  for (let i = 0; i < posts.length; i += 1) {
    for (let j = i + 1; j < posts.length; j += 1) {
      const a = posts[i].slug;
      const b = posts[j].slug;
      if (Math.abs(a.length - b.length) > 4) continue;
      if (levenshtein(a, b) <= 2 && a !== b) {
        slugPairs.push(`${a} ~ ${b}`);
      }
    }
  }

  const flagged = rows.filter((row) => row.issues !== '—');

  if (asCsv) {
    const header = 'URL,Titulo,Palabras,Autor,Fuentes,Categoria,Descripcion,Imagen,Problemas';
    const csvRows = rows.map((row) =>
      [row.url, row.title, row.words, row.author, row.sources, row.category, row.description, row.image, row.issues]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );
    console.log([header, ...csvRows].join('\n'));
  } else {
    console.log(`\nAuditoría de calidad de contenido — ${posts.length} notas publicadas, ${flagged.length} con algún problema detectado.\n`);
    console.table(
      flagged.map((row) => ({
        Título: row.title.length > 50 ? `${row.title.slice(0, 47)}...` : row.title,
        Palabras: row.words,
        Autor: row.author,
        Fuentes: row.sources,
        Categoría: row.category,
        Desc: row.description,
        Img: row.image,
        Problemas: row.issues
      }))
    );
    if (slugPairs.length) {
      console.log('\nSlugs casi idénticos (posible contenido duplicado o mal generado):');
      slugPairs.forEach((pair) => console.log(`  - ${pair}`));
    }
    console.log('\nEste reporte es solo informativo: no borra ni modifica notas. Las decisiones editoriales (reescribir, fusionar, despublicar) son manuales.\n');
    console.log('Para exportar a CSV: node scripts/content-quality-audit.js --csv > reporte.csv\n');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
