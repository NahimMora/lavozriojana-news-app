import Link from 'next/link';

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb" aria-label="Migas de pan">
      <Link href="/">Inicio</Link>
      {items.map((item) => (
        <span key={`${item.label}-${item.href || ''}`}>
          / {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </nav>
  );
}
