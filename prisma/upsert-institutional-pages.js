/**
 * Actualiza (upsert, no destructivo) el contenido de las páginas institucionales
 * en la tabla `static_pages`. Pensado para refrescar contenido ya sembrado en
 * producción/desarrollo sin tocar posts, categorías ni autores.
 *
 * Uso:
 *   node prisma/upsert-institutional-pages.js
 *
 * El contenido debe mantenerse alineado manualmente con `lib/static-pages.ts`
 * (mismo criterio que ya usaba este repo entre `prisma/seed.js` y ese archivo).
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const pages = [
  {
    slug: 'contacto',
    title: 'Contacto',
    seoDescription:
      'Canales de contacto de La Voz Riojana: consultas, comunicados de prensa, correcciones y espacios publicitarios.',
    contentHtml: `
      <p>La Voz Riojana recibe consultas de lectores, comunicados de prensa, información de interés público, pedidos de corrección y solicitudes comerciales.</p>
      <ul>
        <li><strong>Consultas generales y de redacción:</strong> <a href="mailto:contacto@lavozriojana.com">contacto@lavozriojana.com</a></li>
        <li><strong>Publicidad:</strong> <a href="mailto:publicidad@lavozriojana.com">publicidad@lavozriojana.com</a> (ver también <a href="/publicidad">Publicidad</a>)</li>
        <li><strong>Pedidos de corrección:</strong> usá el mismo correo de contacto indicando el título y la URL de la nota. Ver nuestra <a href="/politica-de-correcciones">política de correcciones</a>.</li>
      </ul>
      <p>También podés completar el formulario a continuación. Los mensajes se revisan de forma manual; el tiempo de respuesta habitual es de 1 a 3 días hábiles.</p>
    `
  },
  {
    slug: 'publicidad',
    title: 'Publicidad',
    seoDescription: 'Espacios publicitarios digitales de La Voz Riojana para comercios, instituciones y marcas de La Rioja.',
    contentHtml: `
      <p>La Voz Riojana ofrece espacios publicitarios digitales para comercios, instituciones, profesionales y marcas con presencia en La Rioja.</p>
      <p>Los formatos disponibles incluyen banners en portada, categorías, notas individuales, resultados de búsqueda y pie de sitio.</p>
      <p>La pauta comercial se gestiona de forma independiente del trabajo editorial: la publicidad no condiciona la cobertura periodística ni los criterios de selección de noticias.</p>
      <p>Para consultar disponibilidad y tarifas, escribí a <a href="mailto:publicidad@lavozriojana.com">publicidad@lavozriojana.com</a>.</p>
    `
  },
  {
    slug: 'quienes-somos',
    title: 'Quiénes somos',
    seoDescription:
      'La Voz Riojana es un medio digital local de La Rioja, Argentina. Conocé nuestra misión, criterios editoriales y compromiso con la información verificable.',
    contentHtml: `
      <p class="lr-lead">La Voz Riojana es un medio digital de noticias enfocado en la actualidad de la provincia de La Rioja, Argentina.</p>
      <h2>Qué es La Voz Riojana</h2>
      <p>Publicamos noticias locales y provinciales, así como información nacional e internacional cuando tiene relevancia o impacto directo para la comunidad riojana. Nuestro trabajo combina cobertura propia, seguimiento de fuentes oficiales y agencias, y contextualización de la información para el público de La Rioja.</p>
      <h2>Nuestro enfoque en La Rioja</h2>
      <p>La Rioja es el eje de nuestra cobertura. Priorizamos noticias de política, sociedad, policiales, economía, salud, educación, deportes y cultura de la provincia, y cuando reproducimos o retomamos información de alcance nacional, buscamos agregar contexto local: qué implica para los riojanos, qué organismos provinciales están involucrados y qué fuentes oficiales locales pueden consultarse.</p>
      <h2>Misión</h2>
      <p>Informar con claridad, rapidez y responsabilidad sobre los hechos que afectan a la comunidad de La Rioja, facilitando el acceso a información verificable y útil para la vida cotidiana, institucional y ciudadana de la provincia.</p>
      <h2>Criterios editoriales</h2>
      <ul>
        <li>Priorizamos la verificación de la información antes de su publicación.</li>
        <li>Cuando una nota se basa en una fuente externa (comunicado, medio, organismo público, entrevista), la identificamos en la sección "Fuentes consultadas" al pie de la nota.</li>
        <li>Distinguimos entre información confirmada y versiones a confirmar; evitamos titulares engañosos.</li>
        <li>Corregimos errores de forma visible según nuestra <a href="/politica-de-correcciones">política de correcciones</a>.</li>
        <li>Separamos el contenido editorial de la publicidad. Los espacios pagos están identificados como tales.</li>
      </ul>
      <h2>Tipo de cobertura</h2>
      <p>Cubrimos última hora, política provincial y municipal, policiales, sociedad, economía regional, salud, educación, deportes y espectáculos, con foco permanente en cómo cada hecho impacta en La Rioja.</p>
      <h2>Independencia editorial</h2>
      <p>Las decisiones sobre qué se publica y cómo se cubre cada tema son responsabilidad exclusiva del equipo editorial de La Voz Riojana, sin injerencia de anunciantes ni de terceros. Ver también nuestra <a href="/politica-editorial">política editorial</a> y nuestra <a href="/politica-de-uso-de-ia">política de uso de inteligencia artificial</a>.</p>
      <h2>Responsable editorial</h2>
      <p>La dirección periodística y la responsabilidad editorial de La Voz Riojana están a cargo de <strong>Fernando Nahim Mora</strong>.</p>
      <h2>Equipo</h2>
      <p>Actualmente, Fernando Nahim Mora conduce la cobertura de todas las secciones del medio. Conocé más en <a href="/equipo">Equipo</a>.</p>
      <h2>Cómo contactarnos</h2>
      <p>Para consultas, comunicados, correcciones o pauta publicitaria, visitá nuestra página de <a href="/contacto">Contacto</a>.</p>
    `
  },
  {
    slug: 'politica-de-privacidad',
    title: 'Política de privacidad',
    seoDescription:
      'Qué datos recopila La Voz Riojana, con qué finalidad, qué cookies y servicios de terceros utiliza, y cómo ejercer tus derechos sobre tus datos.',
    contentHtml: `
      <p class="lr-lead">Esta política explica qué información recopila La Voz Riojana (lavozriojana.com), con qué finalidad la utiliza y qué opciones tenés como usuario.</p>
      <h2>Datos que recopilamos</h2>
      <ul>
        <li><strong>Comentarios:</strong> nombre visible y el texto del comentario. Los comentarios quedan pendientes de aprobación antes de publicarse.</li>
        <li><strong>Formulario de contacto:</strong> nombre, email, asunto y mensaje que envíes voluntariamente.</li>
        <li><strong>Estadísticas internas de tráfico:</strong> registramos vistas de nota de forma agregada. La dirección IP y el user-agent se procesan únicamente en forma de hash (no se almacenan en texto plano) para evitar el conteo duplicado de una misma visita.</li>
        <li><strong>Suscripción por WhatsApp (si está habilitada):</strong> número de teléfono y nombre, solo si el usuario lo envía voluntariamente y con consentimiento explícito, para el envío de novedades.</li>
      </ul>
      <h2>Cookies y almacenamiento en el navegador</h2>
      <p>Utilizamos Google Analytics (GA4) para medir tráfico agregado y Google AdSense para mostrar publicidad. Ambos servicios pueden utilizar cookies o almacenamiento local del navegador. Antes de que se active cualquier cookie no esencial, se te consulta mediante el panel de preferencias de cookies del sitio; podés cambiar tu decisión en cualquier momento desde el enlace "Preferencias de cookies" en el pie de página.</p>
      <p>Utilizamos el <em>Consentimiento (Consent Mode)</em> de Google: mientras no otorgues consentimiento, las señales de analítica y publicidad personalizada se envían como denegadas.</p>
      <h2>Servicios de terceros</h2>
      <ul>
        <li><strong>Google Analytics (GA4):</strong> medición de audiencia. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de privacidad de Google</a>.</li>
        <li><strong>Google AdSense:</strong> publicidad contextual y, cuando el usuario da consentimiento, personalizada.</li>
        <li><strong>Cloudflare R2:</strong> alojamiento de imágenes y videos de las notas (media.lavozriojana.com). No implica seguimiento de usuarios.</li>
      </ul>
      <h2>No vendemos datos personales</h2>
      <p>No vendemos ni cedemos a terceros los datos personales que recopilamos, salvo los proveedores de servicios mencionados arriba, en la medida necesaria para su funcionamiento (por ejemplo, medición de audiencia o publicidad).</p>
      <h2>Tus derechos</h2>
      <p>Podés solicitar acceso, corrección o eliminación de los datos personales que nos hayas enviado (por ejemplo, un comentario o un mensaje de contacto) escribiendo a <a href="mailto:contacto@lavozriojana.com">contacto@lavozriojana.com</a>.</p>
      <h2>Cambios en esta política</h2>
      <p>Esta política puede actualizarse para reflejar cambios técnicos o legales. La fecha de última actualización figura en el pie de esta página cuando corresponda.</p>
    `
  },
  {
    slug: 'terminos-y-condiciones',
    title: 'Términos y condiciones',
    seoDescription: 'Condiciones de uso del sitio lavozriojana.com: finalidad informativa del contenido, propiedad intelectual y responsabilidades.',
    contentHtml: `
      <p class="lr-lead">El acceso y uso de lavozriojana.com implica la aceptación de estos términos y condiciones.</p>
      <h2>Finalidad del contenido</h2>
      <p>El contenido publicado en La Voz Riojana tiene finalidad informativa. Se elabora con criterios periodísticos y puede corregirse, actualizarse o retirarse cuando corresponda, conforme a nuestra <a href="/politica-de-correcciones">política de correcciones</a>.</p>
      <h2>Propiedad intelectual</h2>
      <p>Los textos, fotografías y demás contenidos originales de La Voz Riojana son propiedad del medio o de sus autores, salvo cuando se indique una fuente externa. Se permite compartir enlaces a nuestras notas; la reproducción total de contenidos sin autorización no está permitida.</p>
      <h2>Contenido de terceros y enlaces externos</h2>
      <p>Cuando citamos comunicados, redes sociales, organismos públicos u otros medios, lo identificamos en el cuerpo de la nota o en la sección "Fuentes consultadas". No nos responsabilizamos por el contenido de sitios externos enlazados desde nuestras notas.</p>
      <h2>Comentarios de usuarios</h2>
      <p>Los comentarios son responsabilidad exclusiva de quien los publica. Nos reservamos el derecho de moderar, editar o eliminar comentarios que contengan insultos, datos sensibles, spam o contenido ilegal.</p>
      <h2>Publicidad</h2>
      <p>Los espacios publicitarios están identificados como tales y son gestionados de forma independiente del contenido editorial.</p>
      <h2>Limitación de responsabilidad</h2>
      <p>La Voz Riojana pone su mejor esfuerzo en verificar la información publicada, pero no garantiza la exactitud absoluta de datos provenientes de terceros al momento de su publicación original.</p>
      <h2>Modificaciones</h2>
      <p>Estos términos pueden actualizarse. El uso continuado del sitio implica la aceptación de los cambios vigentes al momento de la visita.</p>
      <h2>Contacto</h2>
      <p>Consultas sobre estos términos: <a href="mailto:contacto@lavozriojana.com">contacto@lavozriojana.com</a>.</p>
    `
  },
  {
    slug: 'politica-editorial',
    title: 'Política editorial',
    seoDescription: 'Criterios editoriales de La Voz Riojana: verificación de fuentes, independencia, separación entre publicidad y contenido, y estándares de cobertura.',
    contentHtml: `
      <p class="lr-lead">Esta política describe los criterios que guían el trabajo periodístico de La Voz Riojana.</p>
      <h2>Verificación</h2>
      <p>Antes de publicar, buscamos confirmar la información con al menos una fuente identificable: un organismo oficial, un comunicado, una fuente directa o un medio de referencia. Cuando la información no pudo confirmarse de forma independiente, lo indicamos explícitamente en la nota.</p>
      <h2>Atribución de fuentes</h2>
      <p>Toda nota que se apoye en un comunicado, otro medio, una entrevista, redes sociales verificadas o documentación pública incluye una sección de "Fuentes consultadas" al final, con el tipo de fuente y, cuando corresponde, un enlace a la fuente original.</p>
      <h2>Independencia editorial</h2>
      <p>Las decisiones de cobertura —qué se publica, cómo se titula y con qué prioridad— son responsabilidad exclusiva de la redacción de La Voz Riojana. La pauta publicitaria no influye en estas decisiones.</p>
      <h2>Separación entre contenido y publicidad</h2>
      <p>Los espacios pagos (banners, publicidad contextual) están visualmente diferenciados del contenido editorial y no se presentan como noticias.</p>
      <h2>Enfoque local</h2>
      <p>Priorizamos el impacto en La Rioja: cuando cubrimos una noticia de alcance nacional o internacional, buscamos sumar contexto provincial (organismos locales involucrados, cifras regionales, referentes locales) cuando es relevante y verificable.</p>
      <h2>Uso de herramientas de asistencia editorial</h2>
      <p>Parte de nuestro flujo de trabajo puede apoyarse en herramientas de asistencia (incluida inteligencia artificial) para tareas de redacción, edición o publicación. El detalle de este uso está en nuestra <a href="/politica-de-uso-de-ia">política de uso de inteligencia artificial</a>. En todos los casos, la responsabilidad editorial final es humana.</p>
      <h2>Correcciones</h2>
      <p>Ver nuestra <a href="/politica-de-correcciones">política de correcciones</a> para saber cómo reportar un error.</p>
      <h2>Contacto editorial</h2>
      <p><a href="mailto:contacto@lavozriojana.com">contacto@lavozriojana.com</a></p>
    `
  },
  {
    slug: 'politica-de-correcciones',
    title: 'Política de correcciones',
    seoDescription: 'Cómo reporta y corrige errores La Voz Riojana, y cómo se identifican las actualizaciones en las notas.',
    contentHtml: `
      <p class="lr-lead">La Voz Riojana corrige los errores de sus notas de forma visible, tan pronto como se detectan o son reportados.</p>
      <h2>Cómo reportar un error</h2>
      <p>Si encontrás un dato incorrecto, un error tipográfico relevante o una imprecisión en alguna nota, escribinos a <a href="mailto:contacto@lavozriojana.com">contacto@lavozriojana.com</a> indicando el título y la URL de la nota, y el detalle del error.</p>
      <h2>Cómo corregimos</h2>
      <ul>
        <li><strong>Errores menores</strong> (ortografía, formato): se corrigen directamente, sin aviso adicional en el cuerpo de la nota.</li>
        <li><strong>Errores de datos o hechos</strong> (fechas, cifras, nombres, atribuciones): se corrigen en el texto y la nota actualiza su fecha de "Actualizado" visible en la cabecera del artículo.</li>
        <li><strong>Errores sustanciales</strong> que cambian el sentido de la información: se corrigen y, cuando corresponde, se agrega una aclaración visible al pie de la nota indicando qué se corrigió y cuándo.</li>
      </ul>
      <h2>Fecha de publicación y actualización</h2>
      <p>Cada nota muestra su fecha de <strong>publicación</strong> y, cuando fue editada después de publicada, su fecha de <strong>actualización</strong>. No modificamos la fecha de actualización por motivos técnicos ajenos al contenido (por ejemplo, tareas de mantenimiento del sitio).</p>
      <h2>Retiro de contenido</h2>
      <p>En casos excepcionales (por ejemplo, orden judicial, error grave que no admite corrección parcial, o pedido fundado de una de las partes involucradas), una nota puede ser retirada. Esto se evalúa caso por caso bajo criterio editorial.</p>
    `
  },
  {
    slug: 'politica-de-uso-de-ia',
    title: 'Política de uso de inteligencia artificial',
    seoDescription: 'Cómo utiliza La Voz Riojana herramientas de inteligencia artificial en su flujo editorial, y qué responsabilidad humana se mantiene sobre el contenido publicado.',
    contentHtml: `
      <p class="lr-lead">La Voz Riojana puede utilizar herramientas de inteligencia artificial como apoyo en determinadas tareas de su flujo editorial. Esta política explica en qué consiste ese uso y qué no cambia respecto a la responsabilidad editorial.</p>
      <h2>En qué tareas puede usarse IA</h2>
      <ul>
        <li>Redacción asistida o reescritura de borradores a partir de información ya verificada.</li>
        <li>Transcripción o traducción de material.</li>
        <li>Tareas de publicación y organización de contenido (por ejemplo, generación de etiquetas o metadatos).</li>
      </ul>
      <h2>Qué no delegamos en herramientas automáticas</h2>
      <ul>
        <li>La decisión editorial sobre qué se publica.</li>
        <li>La verificación de los hechos y de las fuentes citadas.</li>
        <li>La responsabilidad final sobre la exactitud del contenido publicado, que corresponde siempre a la redacción de La Voz Riojana.</li>
      </ul>
      <h2>Transparencia de fuentes</h2>
      <p>Independientemente de las herramientas usadas para redactar o editar, cada nota identifica sus fuentes consultadas cuando corresponde (ver <a href="/politica-editorial">política editorial</a>), para que el lector pueda distinguir información de cobertura propia de información basada en comunicados, otros medios o fuentes oficiales.</p>
      <h2>Revisión editorial</h2>
      <p>Todo contenido publicado está sujeto a criterio y responsabilidad editorial de La Voz Riojana. Si detectás contenido que consideres generado sin la revisión adecuada, por favor reportalo según nuestra <a href="/politica-de-correcciones">política de correcciones</a>.</p>
      <h2>Responsable de la revisión</h2>
      <p>La revisión editorial final de todo el contenido publicado en La Voz Riojana, incluido aquel que pudo apoyarse en herramientas de asistencia, está a cargo de Fernando Nahim Mora, responsable editorial del medio.</p>
    `
  }
];

async function main() {
  for (const page of pages) {
    await prisma.staticPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, contentHtml: page.contentHtml, seoTitle: `${page.title} | La Voz Riojana`, seoDescription: page.seoDescription },
      create: {
        slug: page.slug,
        title: page.title,
        contentHtml: page.contentHtml,
        seoTitle: `${page.title} | La Voz Riojana`,
        seoDescription: page.seoDescription
      }
    });
    console.log(`OK: ${page.slug}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Listo: ${pages.length} páginas institucionales actualizadas.`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
