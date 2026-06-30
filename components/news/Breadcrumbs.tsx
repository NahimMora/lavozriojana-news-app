import Link from 'next/link';

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      <Link href="/">Inicio</Link>
      {items.map((item) =>
        item.href ? (
          <span key={`${item.label}-${item.href}`}>
            <span className="breadcrumb-sep">›</span>{' '}
            <Link href={item.href}>{item.label}</Link>
          </span>
        ) : (
          <span key={item.label}>
            <span className="breadcrumb-sep">›</span>{' '}
            <span aria-current="page">{item.label}</span>
          </span>
        )
      )}
    </nav>
  );
}
