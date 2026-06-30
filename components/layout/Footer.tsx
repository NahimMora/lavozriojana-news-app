import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME, SITE_SLOGAN } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';

export async function Footer() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, slug: c.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">

            {/* Brand */}
            <div className="footer-brand-block">
              <Link href="/" aria-label={`Inicio · ${SITE_NAME}`}>
                <Image
                  src="/logo.png"
                  alt={SITE_NAME}
                  width={160}
                  height={42}
                  className="footer-logo"
                  style={{ height: '38px', width: 'auto' }}
                />
              </Link>
              <p className="footer-brand-desc">
                Noticias de La Rioja con foco local, actualidad y cobertura provincial.
              </p>
              <div className="footer-social" aria-label="Redes sociales">
                <a href="https://facebook.com/"  target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">FB</a>
                <a href="https://twitter.com/"   target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" title="X">X</a>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="IG">IG</a>
              </div>
            </div>

            {/* Secciones */}
            <div>
              <h3>Secciones</h3>
              <div className="footer-links">
                {categories.slice(0, 7).map((cat) => (
                  <Link href={`/categoria/${cat.slug}`} key={cat.slug}>{cat.name}</Link>
                ))}
              </div>
            </div>

            {/* Más */}
            <div>
              <h3>Más</h3>
              <div className="footer-links">
                {categories.slice(7, 14).map((cat) => (
                  <Link href={`/categoria/${cat.slug}`} key={cat.slug}>{cat.name}</Link>
                ))}
              </div>
            </div>

            {/* Institucional */}
            <div>
              <h3>Institucional</h3>
              <div className="footer-links">
                <Link href="/quienes-somos">Quiénes somos</Link>
                <Link href="/contacto">Contacto</Link>
                <Link href="/publicidad">Publicidad</Link>
                <Link href="/politica-de-privacidad">Privacidad</Link>
                <Link href="/terminos-y-condiciones">Términos</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.</span>
        <span>lavozriojana.com · La Rioja, Argentina</span>
      </div>
    </footer>
  );
}
