import { isDatabaseConfigured, prisma } from '@/lib/prisma';

const fallbackPages: Record<string, { title: string; contentHtml: string; description: string }> = {
  contacto: {
    title: 'Contacto',
    description: 'Canales de contacto de La Voz Riojana.',
    contentHtml:
      '<p>La Voz Riojana recibe consultas, comunicados, información de interés público y solicitudes comerciales.</p><p>Correo: <strong>contacto@lavozriojana.com</strong></p>'
  },
  publicidad: {
    title: 'Publicidad',
    description: 'Espacios publicitarios digitales de La Voz Riojana.',
    contentHtml:
      '<p>Ofrecemos banners manuales en portada, categorías, notas, búsquedas y footer para anunciantes locales.</p><p>Para consultar disponibilidad, escribí a <strong>publicidad@lavozriojana.com</strong>.</p>'
  },
  'quienes-somos': {
    title: 'Quiénes somos',
    description: 'Información institucional de La Voz Riojana.',
    contentHtml:
      '<p>La Voz Riojana es un medio digital local orientado a informar con claridad, rapidez y responsabilidad sobre la actualidad de La Rioja.</p>'
  },
  'politica-de-privacidad': {
    title: 'Política de privacidad',
    description: 'Política de privacidad de La Voz Riojana.',
    contentHtml:
      '<p>Recopilamos únicamente los datos necesarios para comentarios, formularios, estadísticas internas y futuros avisos autorizados por WhatsApp.</p><p>No vendemos datos personales.</p>'
  },
  'terminos-y-condiciones': {
    title: 'Términos y condiciones',
    description: 'Términos de uso de La Voz Riojana.',
    contentHtml:
      '<p>El uso del sitio implica aceptar estas condiciones generales. El contenido publicado tiene finalidad informativa y puede actualizarse cuando corresponda.</p>'
  }
};

export async function getStaticPage(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const page = await prisma.staticPage.findUnique({ where: { slug } });
      if (page) return page;
    } catch {
      // Fallback keeps institutional routes available before DB setup.
    }
  }

  const fallback = fallbackPages[slug];
  if (!fallback) return null;

  return {
    id: 0,
    slug,
    title: fallback.title,
    contentHtml: fallback.contentHtml,
    seoTitle: `${fallback.title} | La Voz Riojana`,
    seoDescription: fallback.description,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
