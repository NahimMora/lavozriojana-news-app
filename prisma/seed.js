const { PrismaClient, PostStatus } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  'Política',
  'Policiales',
  'Sociedad',
  'Interior',
  'Deportes',
  'Espectáculos',
  'Cultura',
  'Economía',
  'Salud',
  'Educación'
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const staticPages = [
  {
    slug: 'contacto',
    title: 'Contacto',
    contentHtml:
      '<p>La Voz Riojana recibe consultas, información de interés público, comunicados y solicitudes comerciales vinculadas al medio.</p><p>Para contactar al equipo, escribí a <strong>contacto@lavozriojana.com</strong>. También podés usar el formulario preparado en la página de contacto del sitio.</p>'
  },
  {
    slug: 'publicidad',
    title: 'Publicidad',
    contentHtml:
      '<p>La Voz Riojana ofrece espacios publicitarios digitales para comercios, instituciones, profesionales y marcas con presencia en La Rioja.</p><p>Los formatos disponibles incluyen banners en portada, categorías, notas y pie de sitio, con publicación manual y seguimiento básico de impresiones y clicks.</p>'
  },
  {
    slug: 'quienes-somos',
    title: 'Quiénes somos',
    contentHtml:
      '<p>La Voz Riojana es un medio digital local orientado a informar con claridad, rapidez y responsabilidad sobre la actualidad de La Rioja.</p><p>Nuestro compromiso es acercar información útil para la comunidad, con una estructura editorial simple, transparente y enfocada en la lectura.</p>'
  },
  {
    slug: 'politica-de-privacidad',
    title: 'Política de privacidad',
    contentHtml:
      '<p>La Voz Riojana recopila únicamente los datos necesarios para operar sus formularios, comentarios, estadísticas internas y futuros canales de comunicación autorizados por los usuarios.</p><p>No vendemos datos personales. Los datos enviados por formularios se usan para responder consultas, moderar comentarios y gestionar solicitudes informativas o comerciales.</p>'
  },
  {
    slug: 'terminos-y-condiciones',
    title: 'Términos y condiciones',
    contentHtml:
      '<p>El uso de La Voz Riojana implica la aceptación de estas condiciones generales. El contenido publicado tiene finalidad informativa y puede actualizarse, corregirse o retirarse cuando corresponda.</p><p>Los comentarios enviados por lectores están sujetos a moderación y no deben incluir insultos, datos sensibles, spam ni contenido ilegal.</p>'
  }
];

const demoPosts = [
  {
    title: 'Nota demo: presentación editorial de La Voz Riojana',
    excerpt:
      'Contenido de demostración para validar la portada, la jerarquía editorial y el diseño del sitio.',
    category: 'Sociedad',
    isFeatured: true,
    isBreaking: true,
    priority: 100
  },
  {
    title: 'Nota demo: bloque de política y actualidad provincial',
    excerpt:
      'Ejemplo visual para comprobar cómo se listan las noticias de una categoría principal.',
    category: 'Política',
    priority: 80
  },
  {
    title: 'Nota demo: información del interior riojano',
    excerpt:
      'Publicación ficticia marcada como demo para probar grillas, buscador y páginas de categoría.',
    category: 'Interior',
    priority: 70
  },
  {
    title: 'Nota demo: agenda deportiva local',
    excerpt:
      'Texto de muestra no periodístico para verificar tarjetas, metadatos y enlaces internos.',
    category: 'Deportes',
    priority: 60
  },
  {
    title: 'Nota demo: salud, educación y servicios',
    excerpt:
      'Ejemplo de contenido inicial que debe reemplazarse por noticias reales antes de producción.',
    category: 'Salud',
    priority: 50
  }
];

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name, isActive: true },
      create: {
        name,
        slug: slugify(name),
        description: `Noticias de ${name} en La Rioja.`
      }
    });
  }

  const author = await prisma.author.upsert({
    where: { slug: 'redaccion-la-voz-riojana' },
    update: { name: 'Redacción La Voz Riojana', isActive: true },
    create: {
      name: 'Redacción La Voz Riojana',
      slug: 'redaccion-la-voz-riojana',
      bio: 'Equipo de redacción de La Voz Riojana.'
    }
  });

  for (const page of staticPages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        contentHtml: page.contentHtml,
        seoTitle: `${page.title} | La Voz Riojana`,
        seoDescription: `${page.title} de La Voz Riojana.`
      },
      create: {
        ...page,
        seoTitle: `${page.title} | La Voz Riojana`,
        seoDescription: `${page.title} de La Voz Riojana.`
      }
    });
  }

  for (const post of demoPosts) {
    const category = await prisma.category.findUnique({
      where: { slug: slugify(post.category) }
    });
    if (!category) continue;

    const contentHtml = `<p class="lr-lead">${post.excerpt}</p><div class="lr-key-points"><strong>Demo</strong><ul><li>Esta nota no es contenido periodístico real.</li><li>Sirve para probar diseño, SEO, comentarios y API.</li><li>Reemplazar por publicaciones reales antes del lanzamiento.</li></ul></div><h2>Bloque editorial de muestra</h2><p>El autopublicador externo enviará el contenido final en HTML sanitizado. La web lo renderiza con estilos editoriales propios y estructura semántica.</p>`;
    const slug = slugify(post.title);

    await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        title: post.title,
        slug,
        excerpt: post.excerpt,
        contentHtml,
        contentText: stripHtml(contentHtml),
        categoryId: category.id,
        authorId: author.id,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        seoTitle: `${post.title} | La Voz Riojana`,
        seoDescription: post.excerpt,
        ogTitle: post.title,
        ogDescription: post.excerpt,
        isFeatured: post.isFeatured || false,
        isBreaking: post.isBreaking || false,
        editorialPriority: post.priority,
        metadata: { demo: true }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
