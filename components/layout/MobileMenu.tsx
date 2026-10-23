'use client';

import { useRef, useState } from 'react';
import { CategoryNavLink } from './CategoryNavLink';
import { OverlayDialog } from './OverlayDialog';

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

export function MobileMenu({ categories }: { categories: Array<{ name: string; slug: string }> }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="mobile-menu">
      <button
        ref={toggleRef}
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar menú de categorías' : 'Menú de categorías'}
        aria-expanded={open}
      >
        {open ? <IconX /> : <IconMenu />}
      </button>

      {open && (
        <OverlayDialog title="Secciones" className="mobile-menu-dialog" returnFocusRef={toggleRef} onClose={() => setOpen(false)}>
          <nav className="mobile-drawer" aria-label="Categorías">
            <CategoryNavLink href="/" onClick={() => setOpen(false)}>Portada</CategoryNavLink>
            {categories.map((cat) => (
              <CategoryNavLink href={`/categoria/${cat.slug}`} key={cat.slug} onClick={() => setOpen(false)}>
                {cat.name}
              </CategoryNavLink>
            ))}
          </nav>
          <a className="mobile-social-link" href="https://instagram.com/lavozriojana.ok" target="_blank" rel="noopener noreferrer">Instagram · @lavozriojana.ok</a>
        </OverlayDialog>
      )}
    </div>
  );
}
