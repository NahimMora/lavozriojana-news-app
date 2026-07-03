import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';
import { SearchOverlay } from './SearchOverlay';
import { ScrollShrinkEffect } from './ScrollShrinkEffect';
import { MobileMenu } from './MobileMenu';

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
            <MobileMenu categories={categories} />
          </div>

          {/* CENTER — logo */}
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
