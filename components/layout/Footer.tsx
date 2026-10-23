import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME, SITE_SLOGAN } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';
import { CookiePreferencesButton } from './CookiePreferencesButton';

const social = [
  {
    href: 'https://facebook.com/lavozriojana',
    label: 'Facebook',
    icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="currentColor" />
  },
  {
    href: 'https://instagram.com/lavozriojana.ok',
    label: 'Instagram',
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
      </g>
    )
  }
];

const institutional = [
  { href: '/quienes-somos', label: 'Quiénes somos' },
  { href: '/equipo', label: 'Equipo' },
  { href: '/contacto', label: 'Contacto' },
  { href: '/publicidad', label: 'Publicidad' }
];

const legal = [
  { href: '/politica-editorial', label: 'Política editorial' },
  { href: '/politica-de-correcciones', label: 'Correcciones' },
  { href: '/politica-de-uso-de-ia', label: 'Uso de IA' },
  { href: '/politica-de-privacidad', label: 'Privacidad' },
  { href: '/terminos-y-condiciones', label: 'Términos' }
];

export async function Footer() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, slug: c.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-block">
          <Link href="/" className="footer-brand-link">
            <Image src="/logo.png" alt="" width={80} height={80} sizes="56px" className="footer-logo" />
            <span className="footer-wordmark">{SITE_NAME}</span>
          </Link>
          <p className="footer-brand-desc">
            Noticias de La Rioja con foco local, actualidad y cobertura provincial.
          </p>
          <ul className="footer-social" aria-label="Redes sociales">
            {social.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer-nav" aria-label="Pie de página">
          <div className="footer-col footer-col-sections">
            <h2 className="footer-heading">Secciones</h2>
            <ul className="footer-links footer-links-sections">
              {categories.slice(0, 14).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h2 className="footer-heading">Institucional</h2>
            <ul className="footer-links">
              {institutional.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h2 className="footer-heading">Legal</h2>
            <ul className="footer-links">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <CookiePreferencesButton />
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.</span>
          <span>{SITE_SLOGAN}</span>
        </div>
      </div>
    </footer>
  );
}
