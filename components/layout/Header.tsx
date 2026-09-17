import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME, SITE_SLOGAN } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';
import { formatTodayLabel } from '@/lib/format';
import { SearchOverlay } from './SearchOverlay';
import { ScrollShrinkEffect } from './ScrollShrinkEffect';
import { MobileMenu } from './MobileMenu';
import { CategoryNavLink } from './CategoryNavLink';

export async function Header() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, slug: c.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  const todayLabel = formatTodayLabel();

  return (
    <>
      <ScrollShrinkEffect />
      <header className="site-header">
        {/* Utility bar — fecha + redes (solo desktop/tablet) */}
        <div className="masthead-utility">
          <div className="container masthead-utility-inner">
            <span className="masthead-date">{todayLabel}</span>
            <div className="masthead-social" aria-label="Redes sociales">
              <a href="https://facebook.com/lavozriojana" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">X</a>
              <a href="https://instagram.com/lavozriojana" target="_blank" rel="noopener noreferrer">Instagram</a>
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
