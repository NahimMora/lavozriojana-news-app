'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

export type NoticeAlert = {
  key: string;
  level: 'amarilla' | 'naranja' | 'roja';
  /** "Alerta naranja" */
  label: string;
  /** "por viento" */
  cause: string;
  zones: string;
  allZones: string;
  until: string;
  description: string | null;
  source: string;
  sourceShort: string;
  updated: string;
  hideAt: number;
};

/**
 * Weather alert of the home page. Alerts leave the page when they expire,
 * even if it stays open for hours.
 */
export function SiteNoticesClient({ alerts }: { alerts: NoticeAlert[] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const next = alerts.map((alert) => alert.hideAt).filter((at) => at > t).sort((a, b) => a - b)[0];
      if (next) timer = setTimeout(tick, Math.min(next - t + 250, 2 ** 31 - 1));
    };
    tick();
    return () => clearTimeout(timer);
  }, [alerts]);

  const visible = alerts.filter((alert) => now === null || alert.hideAt > now);
  if (!visible.length) return null;

  return (
    <div className="site-notices container">
      <AlertBand alert={visible[0]} more={visible.length - 1} />
    </div>
  );
}

function AlertBand({ alert, more }: { alert: NoticeAlert; more: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const detailId = `${id}-detalle`;

  return (
    <section className={`weather-alert level-${alert.level}`} aria-labelledby={`${id}-titulo`}>
      <div className="weather-alert-inner">
        <p className="weather-alert-line" id={`${id}-titulo`}>
          <strong className="weather-alert-label">{alert.label}</strong>{' '}
          <span>
            {alert.cause}
            {alert.zones && ` · ${alert.zones}`} · {alert.until}
          </span>
        </p>
        <span className="weather-alert-source">Fuente: {alert.sourceShort}</span>
        {more > 0 && (
          <Link className="weather-alert-count" href="/servicios#alertas">
            {more === 1 ? 'Otra alerta vigente' : `Otras ${more} alertas vigentes`}
          </Link>
        )}
        <button
          type="button"
          className="weather-alert-toggle"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </div>
      <div className="weather-alert-detail" id={detailId} hidden={!open}>
        {alert.description && <p className="weather-alert-description">{alert.description}</p>}
        <p className="weather-alert-meta">
          Zonas: {alert.allZones}. Fuente: {alert.source}. Actualizado: {alert.updated}.
        </p>
        <Link className="weather-alert-more" href="/servicios#alertas">
          Ver alertas y servicios
        </Link>
      </div>
    </section>
  );
}
