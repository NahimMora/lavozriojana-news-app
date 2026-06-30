'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    setValue('');
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      {/* Toggle button */}
      <button
        className="search-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar buscador' : 'Abrir buscador'}
        aria-expanded={open}
        type="button"
      >
        {open ? <IconX /> : <IconSearch />}
      </button>

      {/* Overlay panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="search-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Search panel */}
          <div className="search-overlay-panel" role="search">
            <div className="container">
              <form onSubmit={handleSubmit} className="search-overlay-form">
                <IconSearch />
                <input
                  ref={inputRef}
                  type="search"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Buscar noticias, temas, categorías…"
                  aria-label="Buscar noticias"
                  autoComplete="off"
                  className="search-overlay-input"
                />
                {value && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => { setValue(''); inputRef.current?.focus(); }}
                    aria-label="Limpiar búsqueda"
                  >
                    <IconX />
                  </button>
                )}
                <button type="submit" className="search-overlay-submit">
                  Buscar
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
