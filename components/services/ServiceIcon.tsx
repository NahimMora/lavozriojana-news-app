/**
 * Line icons for /servicios, decorative (aria-hidden): the text always says
 * the same. The weather icon follows the sky text the feed gives; an
 * unknown text gets a neutral thermometer, never a guessed condition.
 */
export type ServiceIconName =
  | 'alerta'
  | 'dolar'
  | 'pagos'
  | 'feriados'
  | 'sismos'
  | 'cortes'
  | 'luz'
  | 'agua'
  | 'rutas'
  | 'sol'
  | 'sol-nube'
  | 'nube'
  | 'lluvia'
  | 'tormenta'
  | 'niebla'
  | 'termometro';

const paths: Record<ServiceIconName, JSX.Element> = {
  alerta: <path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3v.5" />,
  dolar: <path d="M12 3v18M16.5 7.5C16 6 14.3 5 12 5 9.2 5 7.5 6.4 7.5 8.4c0 4.6 9 2.6 9 7.2 0 2-1.9 3.4-4.5 3.4-2.4 0-4.2-1.1-4.8-2.8" />,
  pagos: <path d="M3 7h18v12H3zM3 11h18M7 15h4" />,
  feriados: <path d="M4 6h16v14H4zM4 10h16M8 3v5m8-5v5M8 14h3" />,
  sismos: <path d="M2 12h4l2-6 4 12 3-9 2 3h5" />,
  cortes: <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />,
  luz: <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />,
  agua: <path d="M12 3c3.5 4.4 6 7.7 6 10.5a6 6 0 0 1-12 0C6 10.7 8.5 7.4 12 3Z" />,
  rutas: <path d="M8 3 4 21m12-18 4 18M12 4v3m0 4v3m0 4v3" />,
  sol: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
  'sol-nube': <path d="M8 3v1.5M3.5 7.5H5M4.6 4.2l1 1M11.4 4.2l-1 1M6 10a3 3 0 0 1 5.7-1.3M8 20h9a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 8 20Z" />,
  nube: <path d="M7 19h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 19Z" />,
  lluvia: <path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 15Zm1 3-1 3m5-3-1 3m5-3-1 3" />,
  tormenta: <path d="M7 14h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 14Zm6 1-3 4h4l-3 4" />,
  niebla: <path d="M4 9h16M3 13h18M5 17h14M8 5h8" />,
  termometro: <path d="M10 4a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0V4Zm2 10v3" />
};

export function ServiceIcon({ name, size = 20 }: { name: ServiceIconName; size?: number }) {
  return (
    <svg className="service-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/** Icon for the feed's sky text ("parcialmente nublado" → sun and cloud). */
export function skyIcon(sky: string | null | undefined): ServiceIconName {
  const text = (sky || '').toLocaleLowerCase('es-AR');
  if (/tormenta|el[eé]ctric/.test(text)) return 'tormenta';
  if (/lluvi|llovizna|chaparr|chubasc/.test(text)) return 'lluvia';
  if (/niebla|neblina|bruma/.test(text)) return 'niebla';
  if (/parcial|algo nublado|poco nublado|mayormente despejado|nubosidad variable/.test(text)) return 'sol-nube';
  if (/nublado|cubierto/.test(text)) return 'nube';
  if (/despejado|soleado|claro|sol\b/.test(text)) return 'sol';
  return 'termometro';
}
