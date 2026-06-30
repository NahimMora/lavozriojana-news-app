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
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ── Offset helper: hoursAgo(n) ─── */
const h = (hours) => new Date(Date.now() - hours * 3_600_000);

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

/* ─────────────────────────────────────────────────────────
   NOTICIAS DE SEED — 5 por categoría ≈ 55 artículos
   ───────────────────────────────────────────────────────── */
const seedPosts = [

  /* ── ULTIMO MOMENTO ─────────────────────────────────── */
  {
    title: 'El centro tendra cortes parciales por obras y recomiendan circular con precaucion',
    excerpt: 'Los trabajos se concentraran durante la manana en calles de alto transito. El municipio pidio usar vias alternativas y respetar la senalizacion.',
    category: 'Ultimo momento', isFeatured: true, isBreaking: true, priority: 100, hoursAgo: 0.5
  },
  {
    title: 'Se registra intensa actividad en controles viales en los accesos a la capital',
    excerpt: 'La policia despliega operativos preventivos en las principales rutas de ingreso. Se solicita documentacion en regla y buen estado de los vehiculos.',
    category: 'Ultimo momento', isBreaking: true, priority: 98, hoursAgo: 1
  },
  {
    title: 'Aviso por tormentas electricas para la zona serrana durante la tarde',
    excerpt: 'El Servicio Meteorologico Nacional emitio un alerta amarillo para los departamentos de la sierra riojana entre las 16 y las 22 horas.',
    category: 'Ultimo momento', isBreaking: true, priority: 97, hoursAgo: 2
  },
  {
    title: 'Corte en el suministro electrico afecto a tres barrios por mas de dos horas',
    excerpt: 'El servicio fue restituido pasado el mediodia. La empresa prestataria informo que la causa fue una falla en una linea de distribucion secundaria.',
    category: 'Ultimo momento', priority: 95, hoursAgo: 5
  },
  {
    title: 'La gobernacion convoca a concurso para cubrir cargos tecnicos en el area de obras',
    excerpt: 'Se abriran diez vacantes en distintas reparticiones del ejecutivo provincial. El plazo de inscripcion es de quince dias habiles.',
    category: 'Ultimo momento', priority: 90, hoursAgo: 10
  },

  /* ── POLITICA ─────────────────────────────────────── */
  {
    title: 'Legisladores analizan cambios en el esquema de asistencia a municipios',
    excerpt: 'La discusion incluye criterios de distribucion, rendicion de fondos y prioridades para obras pequenas en el interior provincial.',
    category: 'Politica', isFeatured: true, priority: 92, hoursAgo: 1
  },
  {
    title: 'El gobernador presento el plan provincial de obras para el segundo semestre',
    excerpt: 'El programa incluye pavimentacion, obra hidrica y edificios publicos en doce departamentos. La inversion proyectada supera los cien millones de pesos.',
    category: 'Politica', priority: 88, hoursAgo: 6
  },
  {
    title: 'Debate en el concejo deliberante por la nueva ordenanza de publicidad exterior',
    excerpt: 'El proyecto limita la cantidad y el tamano de carteleria en el microcentro. Comerciantes y agencias de publicidad expresaron posiciones encontradas.',
    category: 'Politica', priority: 82, hoursAgo: 14
  },
  {
    title: 'Concejales reciben una peticion vecinal por la seguridad en el barrio norte',
    excerpt: 'Residents presentaron firmas y un informe con registros de incidentes. El bloque mayoritario prometio un relevamiento con la policia.',
    category: 'Politica', priority: 76, hoursAgo: 20
  },
  {
    title: 'La oposicion solicita informes sobre el uso de fondos discrecionales del ejecutivo',
    excerpt: 'Los legisladores opositores pidieron el desglose de gastos no previsupuestados del ultimo trimestre. El ejecutivo tiene treinta dias para responder.',
    category: 'Politica', priority: 70, hoursAgo: 28
  },

  /* ── POLICIALES ───────────────────────────────────── */
  {
    title: 'Investigan una serie de robos ocurridos durante el fin de semana',
    excerpt: 'La policia releva camaras de seguridad y testimonios de vecinos para identificar a los responsables de los hechos denunciados.',
    category: 'Policiales', priority: 86, hoursAgo: 2
  },
  {
    title: 'Un hombre fue detenido por amenazas con arma blanca en el microcentro',
    excerpt: 'El hecho ocurrio en las primeras horas de la manana cerca de la plaza central. La victima no resulto herida y el sospechoso fue trasladado a dependencias policiales.',
    category: 'Policiales', priority: 84, hoursAgo: 4
  },
  {
    title: 'Clausuran un local nocturno por irregularidades y presunta venta de alcohol a menores',
    excerpt: 'Un operativo conjunto entre policia, municipio y INAU detectó varias infracciones. El establecimiento permanecera cerrado hasta regularizar su situacion.',
    category: 'Policiales', priority: 78, hoursAgo: 12
  },
  {
    title: 'Accidente de transito en la ruta provincial deja dos heridos leves',
    excerpt: 'El choque entre dos vehiculos particulares ocurrio a la altura del kilometro 43. Los lesionados fueron trasladados al hospital mas cercano sin riesgo de vida.',
    category: 'Policiales', priority: 72, hoursAgo: 18
  },
  {
    title: 'Operativo antidrogas culmino con dos detenidos y secuestro de estupefacientes',
    excerpt: 'El procedimiento fue coordinado por la division de investigaciones. Se secuestraron sustancias y elementos vinculados a la comercializacion ilegal.',
    category: 'Policiales', priority: 66, hoursAgo: 32
  },

  /* ── INTERIOR ─────────────────────────────────────── */
  {
    title: 'Chilecito pidio reforzar el servicio de agua antes de los dias de mayor consumo',
    excerpt: 'Vecinos y comerciantes reclamaron previsibilidad en la distribucion. La empresa prestataria anuncio controles en la red.',
    category: 'Interior', priority: 80, hoursAgo: 3
  },
  {
    title: 'Villa Union inaugura una nueva sala de primeros auxilios con equipamiento provincial',
    excerpt: 'La obra demoro casi dos anos y contempla guardia permanente los fines de semana. El intendente celebro el acuerdo con el ministerio de salud.',
    category: 'Interior', priority: 75, hoursAgo: 8
  },
  {
    title: 'En Aimogasta comenzaron las obras de pavimentacion prometidas desde 2024',
    excerpt: 'El contratista ingreso con maquinaria este lunes. El municipio espera terminar cuatro cuadras antes de que lleguen las lluvias de verano.',
    category: 'Interior', priority: 69, hoursAgo: 16
  },
  {
    title: 'Vinchina reclama mayor frecuencia de transporte interdepartamental',
    excerpt: 'Habitantes del departamento General Lamadrid denuncian que el servicio de colectivos no alcanza para cubrir la demanda de estudiantes y trabajadores.',
    category: 'Interior', priority: 63, hoursAgo: 24
  },
  {
    title: 'Famatina suma turistas en el inicio del circuito serrano de temporada',
    excerpt: 'Los caminos estivales hacia el cerro Famatina registran mas circulacion. Prestadores de servicios turisticos reportan reservas completas para el fin de semana.',
    category: 'Interior', priority: 57, hoursAgo: 36
  },

  /* ── SOCIEDAD ─────────────────────────────────────── */
  {
    title: 'Comedores barriales sostienen la demanda y buscan ampliar donaciones',
    excerpt: 'Organizaciones sociales advierten que crecio la asistencia de familias y solicitan acompanamiento de instituciones locales.',
    category: 'Sociedad', priority: 74, hoursAgo: 2
  },
  {
    title: 'Vecinos de barrio Hipodromo piden solucion al problema de alumbrado publico',
    excerpt: 'Mas de la mitad de las luminarias del sector estan fuera de servicio desde hace semanas. La cooperativa de electricidad atribuyo la demora a falta de materiales.',
    category: 'Sociedad', priority: 71, hoursAgo: 7
  },
  {
    title: 'ONG lanza programa de apoyo escolar gratuito para ninos de barrios vulnerables',
    excerpt: 'La iniciativa comenzara con veinte lugares disponibles para primaria. Los tutores son estudiantes universitarios de pedagogia.',
    category: 'Sociedad', priority: 65, hoursAgo: 15
  },
  {
    title: 'Merenderos de la capital reportan mayor demanda de asistencia alimentaria',
    excerpt: 'Las organizaciones que sostienen estos espacios piden donaciones de alimentos no perecederos. La red de merenderos abarca quince puntos en el area metropolitana.',
    category: 'Sociedad', priority: 59, hoursAgo: 22
  },
  {
    title: 'Familias del Chimbas denuncian falta de agua potable desde hace tres dias',
    excerpt: 'Decenas de hogares sin suministro reclaman respuesta del prestador. Se habilitaron puntos de distribucion de agua en bidones como medida provisoria.',
    category: 'Sociedad', priority: 53, hoursAgo: 40
  },

  /* ── ECONOMIA ─────────────────────────────────────── */
  {
    title: 'El comercio local espera una mejora de ventas con nuevas promociones de pago',
    excerpt: 'Locales del microcentro preparan descuentos y acuerdos de pago para impulsar el consumo durante la primera semana del mes.',
    category: 'Economia', priority: 68, hoursAgo: 1
  },
  {
    title: 'La camara de comercio solicita reduccion de tasas municipales para pymes locales',
    excerpt: 'La entidad presento un proyecto al concejo deliberante en el que se detallan los rubros mas afectados por la presion tributaria actual.',
    category: 'Economia', priority: 64, hoursAgo: 9
  },
  {
    title: 'Aumentaron las tarifas de servicios esenciales desde el primer dia del mes',
    excerpt: 'Gas, electricidad y agua registran incrementos de entre el doce y el dieciocho por ciento. Los usuarios tienen sesenta dias para ajustar sus presupuestos.',
    category: 'Economia', priority: 60, hoursAgo: 17
  },
  {
    title: 'Emprendedores locales presentan productos en la feria regional de inversion del NOA',
    excerpt: 'Once proyectos riojanos participaron del encuentro en Tucuman. Dos de ellos obtuvieron pre-acuerdos con fondos de capital semilla.',
    category: 'Economia', priority: 54, hoursAgo: 26
  },
  {
    title: 'El mercado inmobiliario muestra senales mixtas segun informe del colegio de corredores',
    excerpt: 'Las propiedades en zonas residenciales mantienen precio, pero los locales comerciales del centro registran una suba del cinco por ciento trimestral.',
    category: 'Economia', priority: 48, hoursAgo: 42
  },

  /* ── SALUD ────────────────────────────────────────── */
  {
    title: 'Salud intensifica controles territoriales por aumento de enfermedades respiratorias',
    excerpt: 'Los equipos de salud recomendaron completar esquemas de vacunacion y consultar temprano ante sintomas persistentes.',
    category: 'Salud', priority: 62, hoursAgo: 2
  },
  {
    title: 'Campana de vacunacion antigripal llega a los barrios mas alejados de la capital',
    excerpt: 'Los puestos moviles recorren sectores con menor acceso a centros de salud. La vacuna es gratuita para toda la poblacion priorizada.',
    category: 'Salud', priority: 58, hoursAgo: 10
  },
  {
    title: 'El hospital Vera Barros incorporo nuevo equipo de diagnostico por imagenes',
    excerpt: 'El equipamiento permitira reducir los tiempos de espera para estudios de alta complejidad. La donacion fue realizada por un organismo nacional.',
    category: 'Salud', priority: 52, hoursAgo: 19
  },
  {
    title: 'Autoridades de salud advierten sobre el aumento de casos de gripe en menores',
    excerpt: 'El pico estacional ya afecta a varias escuelas de la capital. Se recomendo mantener ventilacion adecuada en aulas y espacios cerrados.',
    category: 'Salud', priority: 46, hoursAgo: 27
  },
  {
    title: 'Medicos del barrio firman convenio con el municipio para atencion primaria en zonas sin CAPS',
    excerpt: 'El acuerdo garantiza dos guardias semanales en sectores sin centro de atencion primaria. El programa sera financiado con fondos municipales.',
    category: 'Salud', priority: 40, hoursAgo: 38
  },

  /* ── EDUCACION ────────────────────────────────────── */
  {
    title: 'Escuelas del interior recibiran mejoras edilicias antes del receso de invierno',
    excerpt: 'El plan incluye reparaciones menores, limpieza de tanques y relevamientos tecnicos en edificios con mayor demanda.',
    category: 'Educacion', priority: 56, hoursAgo: 3
  },
  {
    title: 'Lanzan becas para estudiantes universitarios de escasos recursos de La Rioja',
    excerpt: 'El programa provincial cubre gastos de transporte y materiales durante el ciclo lectivo. Las solicitudes se reciben hasta fin de mes en la web del ministerio.',
    category: 'Educacion', priority: 52, hoursAgo: 11
  },
  {
    title: 'La escuela tecnica de la capital abre inscripcion para cursos de oficios',
    excerpt: 'Se dictaran formaciones en electricidad, carpinteria, soldadura y cocina. Los cupos son limitados y el ingreso es gratuito y abierto a la comunidad.',
    category: 'Educacion', priority: 46, hoursAgo: 21
  },
  {
    title: 'Docentes analizan la propuesta de actualizacion curricular en escuelas primarias',
    excerpt: 'El borrador del nuevo diseno incorpora habilidades digitales y resoluciones de problemas cotidianos desde el primer ciclo. El gremio aun no se expidio.',
    category: 'Educacion', priority: 40, hoursAgo: 30
  },
  {
    title: 'El ministerio evalua la apertura de nuevas salas de nivel inicial en la capital',
    excerpt: 'La demanda insatisfecha de vacantes en jardin de infantes supera el quince por ciento en algunos barrios. El estudio de factibilidad ya fue presentado.',
    category: 'Educacion', priority: 34, hoursAgo: 44
  },

  /* ── DEPORTES ─────────────────────────────────────── */
  {
    title: 'El torneo local define cruces claves para la pelea por la punta de la tabla',
    excerpt: 'Los equipos llegan con diferencias minimas y la proxima fecha puede ordenar la tabla antes de la etapa decisiva.',
    category: 'Deportes', priority: 50, hoursAgo: 1
  },
  {
    title: 'La seleccion riojana de basquet clasifica al regional del norte con campana invicta',
    excerpt: 'El equipo gano sus cuatro partidos y quedo primero en su zona. El regional se jugara el proximo mes en San Miguel de Tucuman.',
    category: 'Deportes', priority: 47, hoursAgo: 8
  },
  {
    title: 'Atletas riojanos logran varios podios en la competencia provincial de pista',
    excerpt: 'La delegacion provincial se presento con doce competidores y regreso con medallas en salto en largo, cien metros y cinco mil metros.',
    category: 'Deportes', priority: 43, hoursAgo: 16
  },
  {
    title: 'Nadadores riojanos se destacan en los Juegos Evita region noroeste',
    excerpt: 'Cuatro jovenes talentos clasificaron a la instancia nacional. La delegacion fue apoyada por el ministerio provincial de deportes.',
    category: 'Deportes', priority: 39, hoursAgo: 25
  },
  {
    title: 'El boxeo local suma un nuevo campeon provincial en la categoria peso ligero',
    excerpt: 'El riojano gano por puntos en doce asaltos y retiene el cinturon hasta la proxima defensa obligatoria dentro de noventa dias.',
    category: 'Deportes', priority: 35, hoursAgo: 34
  },

  /* ── CULTURA ──────────────────────────────────────── */
  {
    title: 'La agenda cultural suma teatro, musica y feria de emprendedores en el fin de semana',
    excerpt: 'Espacios independientes y salas municipales preparan actividades con entrada libre o popular.',
    category: 'Cultura', priority: 44, hoursAgo: 2
  },
  {
    title: 'La feria del libro local abre sus puertas con la presencia de autores riojanos',
    excerpt: 'El evento dura tres dias e incluye presentaciones, firmas de libros y talleres para ninos. La entrada es libre y gratuita en el parque de la ciudad.',
    category: 'Cultura', priority: 41, hoursAgo: 9
  },
  {
    title: 'Artistas plasticos riojanos exponen obras en el museo de arte de la provincia',
    excerpt: 'La muestra reune pinturas, esculturas y fotografia de doce creadores locales. Permanecera abierta durante todo el mes con acceso sin costo.',
    category: 'Cultura', priority: 37, hoursAgo: 18
  },
  {
    title: 'El cine del parque lanza ciclo de peliculas latinoamericanas los martes de julio',
    excerpt: 'La programacion incluye filmes premiados de Argentina, Chile, Mexico y Brasil. Las proyecciones son al aire libre y con entrada a precio popular.',
    category: 'Cultura', priority: 33, hoursAgo: 28
  },
  {
    title: 'Nuevos murales en el casco historico transforman calles del primer cuadro',
    excerpt: 'El programa de arte urbano ya intervino seis paredes con la participacion de artistas locales y de otras provincias. Las obras abordan la identidad riojana.',
    category: 'Cultura', priority: 29, hoursAgo: 38
  },

  /* ── ESPECTACULOS ─────────────────────────────────── */
  {
    title: 'Artista folklorico riojano presentara su nuevo disco en el teatro del pueblo',
    excerpt: 'El espectaculo incluye canciones ineditas y musicos invitados de la region. Las entradas estan disponibles en la boleteria del teatro y en forma digital.',
    category: 'Espectaculos', priority: 38, hoursAgo: 4
  },
  {
    title: 'Stand up nacional llega a La Rioja con dos funciones en la sala principal',
    excerpt: 'El comediante trae su espectaculo de gira federal. La primera funcion es apta para todo publico y la segunda tiene clasificacion para mayores de dieciséis.',
    category: 'Espectaculos', priority: 35, hoursAgo: 12
  },
  {
    title: 'Banda local celebra decimo aniversario con recital a sala llena en el anfiteatro',
    excerpt: 'El grupo invito a artistas que los acompanaron en distintas etapas de su carrera. El recital sera transmitido en vivo por redes sociales.',
    category: 'Espectaculos', priority: 31, hoursAgo: 20
  },
  {
    title: 'Festival de folclore en el parque convoca a grupos de toda la region noroeste',
    excerpt: 'La edicion de este ano suma artistas de Catamarca, Tucuman y La Rioja. El escenario principal recibira a mas de veinte conjuntos durante el fin de semana.',
    category: 'Espectaculos', priority: 27, hoursAgo: 30
  },
  {
    title: 'La obra de teatro de fin de ano ya agoto sus entradas en el centro cultural',
    excerpt: 'La obra es una produccion propia del elenco estable municipal. Ante la demanda, se abrira una segunda funcion especial para el lunes siguiente.',
    category: 'Espectaculos', priority: 23, hoursAgo: 46
  }
];

function articleHtml(post) {
  return `<p class="lr-lead">${post.excerpt}</p>

<h2>El dato central</h2>
<p>La informacion fue confirmada por fuentes locales y forma parte de la agenda publica que continuara durante las proximas horas. El eje esta puesto en el impacto concreto para vecinos, comerciantes e instituciones de la provincia.</p>

<div class="lr-key-points"><strong>Puntos clave</strong><ul><li>La situacion tendra seguimiento durante la jornada.</li><li>Las areas involucradas pidieron consultar canales oficiales.</li><li>La Voz Riojana actualizara la informacion cuando haya novedades.</li></ul></div>

<h2>Contexto y antecedentes</h2>
<p>Este tipo de situaciones se repite con cierta periodicidad en la provincia. Los actores involucrados han expresado distintas posiciones en las ultimas semanas, y la cobertura del caso continua abierta mientras se aguardan definiciones.</p>
<p>La ciudadania puede acercar informacion o denuncias a traves de los canales habituales del organismo competente.</p>

<h2>Que puede pasar ahora</h2>
<p>La evolucion dependera de las decisiones administrativas, operativas o comunitarias que se tomen en cada zona. Mientras tanto, se recomienda prestar atencion a los avisos locales y verificar las fuentes antes de compartir informacion en redes.</p>`;
}

async function main() {
  const categorySlugs = categories.map(slugify);

  /* Upsert categories */
  for (const name of categories) {
    await prisma.category.upsert({
      where:  { slug: slugify(name) },
      update: { name, isActive: true },
      create: { name, slug: slugify(name), description: `Noticias de ${name} en La Rioja.` }
    });
  }

  await prisma.category.updateMany({
    where: { slug: { notIn: categorySlugs } },
    data:  { isActive: false }
  });

  /* Upsert author */
  const author = await prisma.author.upsert({
    where:  { slug: 'redaccion-la-voz-riojana' },
    update: { name: 'Redaccion La Voz Riojana', isActive: true },
    create: { name: 'Redaccion La Voz Riojana', slug: 'redaccion-la-voz-riojana', bio: 'Equipo de redaccion de La Voz Riojana.' }
  });

  /* Static pages */
  for (const page of staticPages) {
    await prisma.staticPage.upsert({
      where:  { slug: page.slug },
      update: { title: page.title, contentHtml: page.contentHtml, seoTitle: `${page.title} | La Voz Riojana`, seoDescription: `${page.title} de La Voz Riojana.` },
      create: { ...page, seoTitle: `${page.title} | La Voz Riojana`, seoDescription: `${page.title} de La Voz Riojana.` }
    });
  }

  /* Remove any old demo posts */
  await prisma.post.deleteMany({ where: { title: { startsWith: 'Nota demo' } } });

  /* Upsert seed posts */
  for (const post of seedPosts) {
    const category = await prisma.category.findUnique({ where: { slug: slugify(post.category) } });
    if (!category) continue;

    const contentHtml = articleHtml(post);
    const slug        = slugify(post.title);
    const publishedAt = h(post.hoursAgo ?? 0);

    const data = {
      title:             post.title,
      excerpt:           post.excerpt,
      contentHtml,
      contentText:       stripHtml(contentHtml),
      categoryId:        category.id,
      authorId:          author.id,
      status:            PostStatus.PUBLISHED,
      publishedAt,
      seoTitle:          `${post.title} | La Voz Riojana`,
      seoDescription:    post.excerpt,
      ogTitle:           post.title,
      ogDescription:     post.excerpt,
      isFeatured:        post.isFeatured  || false,
      isBreaking:        post.isBreaking  || false,
      editorialPriority: post.priority    || 0,
      metadata:          { seed: true }
    };

    await prisma.post.upsert({
      where:  { slug },
      update: data,
      create: { ...data, slug }
    });
  }

  console.log(`Seed completado: ${seedPosts.length} noticias en ${categories.length} categorias.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
