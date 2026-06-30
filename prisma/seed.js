const { PrismaClient, PostStatus } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  'Ultimo momento',
  'Politica',
  'Policiales',
  'Interior',
  'Sociedad',
  'Economia',
  'Salud',
  'Educacion',
  'Deportes',
  'Cultura',
  'Espectaculos'
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
      '<p>La Voz Riojana recibe consultas, comunicados, informacion de interes publico y solicitudes comerciales vinculadas al medio.</p><p>Para contactar al equipo, escribi a <strong>contacto@lavozriojana.com</strong>.</p>'
  },
  {
    slug: 'publicidad',
    title: 'Publicidad',
    contentHtml:
      '<p>La Voz Riojana ofrece espacios publicitarios digitales para comercios, instituciones, profesionales y marcas con presencia en La Rioja.</p><p>Los formatos disponibles incluyen banners en portada, categorias, notas y pie de sitio, con seguimiento basico de impresiones y clicks.</p>'
  },
  {
    slug: 'quienes-somos',
    title: 'Quienes somos',
    contentHtml:
      '<p>La Voz Riojana es un medio digital local orientado a informar con claridad, rapidez y responsabilidad sobre la actualidad de La Rioja.</p><p>Nuestro compromiso es acercar informacion util para la comunidad, con una estructura editorial simple, transparente y enfocada en la lectura.</p>'
  },
  {
    slug: 'politica-de-privacidad',
    title: 'Politica de privacidad',
    contentHtml:
      '<p>La Voz Riojana recopila unicamente los datos necesarios para operar formularios, comentarios, estadisticas internas y futuros canales de comunicacion autorizados por los usuarios.</p><p>No vendemos datos personales.</p>'
  },
  {
    slug: 'terminos-y-condiciones',
    title: 'Terminos y condiciones',
    contentHtml:
      '<p>El uso de La Voz Riojana implica la aceptacion de estas condiciones generales. El contenido publicado tiene finalidad informativa y puede actualizarse, corregirse o retirarse cuando corresponda.</p>'
  }
];

const seedPosts = [
  {
    title: 'El centro tendra cortes parciales por obras y recomiendan circular con precaucion',
    excerpt:
      'Los trabajos se concentraran durante la manana en calles de alto transito. El municipio pidio usar vias alternativas y respetar la senalizacion.',
    category: 'Ultimo momento',
    isFeatured: true,
    isBreaking: true,
    priority: 100
  },
  {
    title: 'Legisladores analizan cambios en el esquema de asistencia a municipios',
    excerpt:
      'La discusion incluye criterios de distribucion, rendicion de fondos y prioridades para obras pequenas en el interior provincial.',
    category: 'Politica',
    isFeatured: true,
    priority: 92
  },
  {
    title: 'Investigan una serie de robos ocurridos durante el fin de semana',
    excerpt:
      'La policia releva camaras de seguridad y testimonios de vecinos para identificar a los responsables de los hechos denunciados.',
    category: 'Policiales',
    priority: 86
  },
  {
    title: 'Chilecito pidio reforzar el servicio de agua antes de los dias de mayor consumo',
    excerpt:
      'Vecinos y comerciantes reclamaron previsibilidad en la distribucion. La empresa prestataria anuncio controles en la red.',
    category: 'Interior',
    priority: 80
  },
  {
    title: 'Comedores barriales sostienen la demanda y buscan ampliar donaciones',
    excerpt:
      'Organizaciones sociales advierten que crecio la asistencia de familias y solicitan acompanamiento de instituciones locales.',
    category: 'Sociedad',
    priority: 74
  },
  {
    title: 'El comercio local espera una mejora de ventas con nuevas promociones',
    excerpt:
      'Locales del microcentro preparan descuentos y acuerdos de pago para impulsar el consumo durante la primera semana del mes.',
    category: 'Economia',
    priority: 68
  },
  {
    title: 'Salud intensifica controles en barrios por enfermedades respiratorias',
    excerpt:
      'Los equipos territoriales recomendaron completar esquemas de vacunacion y consultar temprano ante sintomas persistentes.',
    category: 'Salud',
    priority: 62
  },
  {
    title: 'Escuelas del interior recibiran mejoras edilicias antes del receso',
    excerpt:
      'El plan incluye reparaciones menores, limpieza de tanques y relevamientos tecnicos en edificios con mayor demanda.',
    category: 'Educacion',
    priority: 56
  },
  {
    title: 'El torneo local define cruces claves para la pelea por la punta',
    excerpt:
      'Los equipos llegan con diferencias minimas y la proxima fecha puede ordenar la tabla antes de la etapa decisiva.',
    category: 'Deportes',
    priority: 50
  },
  {
    title: 'La agenda cultural suma teatro, musica y feria de emprendedores',
    excerpt:
      'Espacios independientes y salas municipales preparan actividades para el fin de semana con entrada libre o popular.',
    category: 'Cultura',
    priority: 44
  }
];

function articleHtml(post) {
  return `<p class="lr-lead">${post.excerpt}</p><h2>El dato central</h2><p>La informacion fue confirmada por fuentes locales y forma parte de la agenda publica que seguira durante las proximas horas.</p><p>El eje esta puesto en el impacto concreto para vecinos, comerciantes e instituciones de la provincia.</p><div class="lr-key-points"><strong>Puntos clave</strong><ul><li>La medida o situacion tendra seguimiento durante la jornada.</li><li>Las areas involucradas pidieron consultar canales oficiales.</li><li>La Voz Riojana actualizara la informacion cuando haya novedades.</li></ul></div><h2>Que puede pasar ahora</h2><p>La evolucion dependera de las decisiones administrativas, operativas o comunitarias que se tomen en cada zona. Mientras tanto, se recomienda prestar atencion a los avisos locales.</p>`;
}

async function main() {
  const categorySlugs = categories.map(slugify);

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

  await prisma.category.updateMany({
    where: { slug: { notIn: categorySlugs } },
    data: { isActive: false }
  });

  const author = await prisma.author.upsert({
    where: { slug: 'redaccion-la-voz-riojana' },
    update: { name: 'Redaccion La Voz Riojana', isActive: true },
    create: {
      name: 'Redaccion La Voz Riojana',
      slug: 'redaccion-la-voz-riojana',
      bio: 'Equipo de redaccion de La Voz Riojana.'
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

  await prisma.post.deleteMany({
    where: {
      title: {
        startsWith: 'Nota demo'
      }
    }
  });

  for (const post of seedPosts) {
    const category = await prisma.category.findUnique({
      where: { slug: slugify(post.category) }
    });
    if (!category) continue;

    const contentHtml = articleHtml(post);
    const slug = slugify(post.title);

    await prisma.post.upsert({
      where: { slug },
      update: {
        title: post.title,
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
        metadata: { seed: true }
      },
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
        metadata: { seed: true }
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
