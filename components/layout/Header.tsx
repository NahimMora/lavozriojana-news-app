import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';
import { SearchOverlay } from './SearchOverlay';
import { ScrollShrinkEffect } from './ScrollShrinkEffect';

const IconMenu = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
    <rect width="17" height="2" rx="1" />
    <rect y="5" width="12" height="2" rx="1" />
    <rect y="10" width="17" height="2" rx="1" />
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export async function Header() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({ name: c.name, slug: c.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  return (
    <>
      <ScrollShrinkEffect />
      <header className="site-header">
        {/* 3-col masthead */}
        <div className="container masthead">

          {/* LEFT — mobile hamburger only */}
          <div className="masthead-left">
            <details className="mobile-menu">
              <summary aria-label="Menú de categorías">
                <IconMenu />
              </summary>
              <nav className="mobile-drawer" aria-label="Categorías">
                {categories.map((cat) => (
                  <Link href={`/categoria/${cat.slug}`} key={cat.slug}>
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </details>
          </div>

          {/* CENTER — logo */}
          <div className="masthead-center">
            <Link href="/" aria-label={`Inicio · ${SITE_NAME}`}>
              <Image
                src="/logo.png"
                alt={SITE_NAME}
                width={220}
                height={56}
                priority
                className="header-logo"
                style={{ height: '120px', width: 'auto' }}
              />
            </Link>
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
                  <Link href={`/categoria/${cat.slug}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
