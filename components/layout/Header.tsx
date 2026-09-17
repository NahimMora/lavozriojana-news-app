import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME, SITE_SLOGAN } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';
import { formatTodayLabel } from '@/lib/format';
import { getLaRiojaTemperature } from '@/lib/weather';
import { SearchOverlay } from './SearchOverlay';
import { ScrollShrinkEffect } from './ScrollShrinkEffect';
import { MobileMenu } from './MobileMenu';
import { CategoryNavLink } from './CategoryNavLink';

const IconFacebook = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2h3.3l-7.2 8.2L23.4 22h-6.6l-5.2-6.8L5.6 22H2.3l7.7-8.8L1.6 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z" />
  </svg>
);
const IconInstagram = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
  </svg>
);
const IconSun = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export async function Header() {
  const [dbCategories, temperature] = await Promise.all([
    getCategoriesSafe(),
    getLaRiojaTemperature()
  ]);
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, slug: c.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  const todayLabel = formatTodayLabel();

  return (
    <>
      <ScrollShrinkEffect />
      <header className="site-header">
        {/* Utility bar — fecha + clima + redes (solo desktop/tablet) */}
        <div className="masthead-utility">
          <div className="container masthead-utility-inner">
            <div className="masthead-date-group">
              <span className="masthead-date">{todayLabel}</span>
              {temperature !== null && (
                <span className="masthead-weather">
                  <IconSun />
                  {temperature}°C · La Rioja
                </span>
              )}
            </div>
            <div className="masthead-social" aria-label="Redes sociales">
              <a href="https://facebook.com/lavozriojana" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IconFacebook /></a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="X"><IconX /></a>
              <a href="https://instagram.com/lavozriojana" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IconInstagram /></a>
            </div>
          </div>
        </div>

        {/* 3-col masthead */}
        <div className="container masthead">

          {/* LEFT — mobile hamburger only */}
          <div className="masthead-left">
            <MobileMenu categories={categories} />
          </div>

          {/* CENTER — logo + tagline */}
          <div className="masthead-center">
            <Link href="/" aria-label={`Inicio · ${SITE_NAME}`}>
              <Image
                src="/logo.png"
                alt={SITE_NAME}
                width={128}
                height={128}
                sizes="120px"
                priority
                className="header-logo"
              />
            </Link>
            <p className="masthead-tagline">{SITE_SLOGAN}</p>
          </div>

          {/* RIGHT — search toggle */}
          <div className="masthead-right">
            <SearchOverlay />
          </div>
        </div>

        {/* Desktop category nav */}
        <div className="nav-strip">
          <nav className="container" aria-label="Categorías">
            <ul className="nav-list">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <CategoryNavLink href={`/categoria/${cat.slug}`}>{cat.name}</CategoryNavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
