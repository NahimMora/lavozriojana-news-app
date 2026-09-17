'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Link de categoría que se marca a sí mismo como activo cuando la ruta
 * actual es esa categoría (o una nota dentro de ella). Usado en el nav
 * de escritorio y en el drawer mobile para que el visitante sepa dónde
 * está parado dentro del sitio. */
export function CategoryNavLink({
  href,
  children,
  className,
  onClick
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive || undefined}
    >
      {children}
    </Link>
  );
}
