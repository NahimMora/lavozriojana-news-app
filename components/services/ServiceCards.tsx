import Link from 'next/link';
import { Suspense } from 'react';
import { getServicesView, type ServicesView } from '@/lib/feed';
import {
  CUT_LABELS,
  daysLeftLabel,
  formatArs,
  formatCalendarDate,
  formatDecimal,
  formatDegrees,
  formatUpdated
} from '@/lib/feed-select';
import { ServiceIcon, skyIcon, type ServiceIconName } from './ServiceIcon';

export type ServiceCardKind = 'clima' | 'dolar' | 'feriado' | 'sismo' | 'cortes' | 'pagos';

/**
 * Small service cards spread across the site (home, notes, sections), each
 * with one service's data and a link to its section of /servicios. They use
 * the same selection as /servicios, so a stale or missing block shows no
 * card instead of an empty one. Rendered in their own Suspense boundary: a
 * slow feed never holds the page.
 */
export function ServiceCards({
  kinds,
  layout = 'stack',
  title,
  className,
  limit
}: {
  kinds: ServiceCardKind[];
  /** Show at most this many, the first ones with data in `kinds` order. */
  limit?: number;
  /** `stack`: one under the other (sidebars). `row`: a grid band (home). */
  layout?: 'stack' | 'row';
  title?: string;
  className?: string;
}) {
  return (
    <Suspense fallback={null}>
      <ServiceCardsData kinds={kinds} layout={layout} title={title} className={className} limit={limit} />
    </Suspense>
  );
}

async function ServiceCardsData({ kinds, layout, title, className, limit }: { kinds: ServiceCardKind[]; layout: 'stack' | 'row'; title?: string; className?: string; limit?: number }) {
  const now = new Date();
  const view = await getServicesView(now).catch(() => null);
  if (!view) return null;
  const cards = kinds.filter((kind) => hasData(kind, view)).slice(0, limit).map((kind) => renderCard(kind, view, now));
  if (!cards.length) return null;

  return (
    <section className={`svc-cards is-${layout}${className ? ` ${className}` : ''}`} aria-label={title || 'Servicios'}>
      {title && (
        <div className="svc-cards-head">
          <h2 className="section-title">{title}</h2>
          <Link className="cat-block-more" href="/servicios">
            Todos los servicios →
          </Link>
        </div>
      )}
      <div className="svc-cards-grid">{cards}</div>
    </section>
  );
}

/* The same conditions each card checks, known before rendering so that a
   band without any data takes no space (not even its title). */
function hasData(kind: ServiceCardKind, view: ServicesView) {
  switch (kind) {
    case 'clima':
      return (view.weather?.now?.temperatura ?? view.current?.temperatura ?? null) !== null || !!(view.weather?.now?.cielo ?? view.current?.cielo);
    case 'dolar':
      return !!view.dollar;
    case 'feriado':
      return !!view.holidays?.items.length;
    case 'sismo':
      return !!view.quakes?.items.length;
    case 'cortes':
      return !!view.cuts?.items.length;
    case 'pagos':
      return !!(view.payments?.today.length || view.payments?.upcoming.length);
  }
}

function renderCard(kind: ServiceCardKind, view: ServicesView, now: Date) {
  switch (kind) {
    case 'clima':
      return <WeatherCard key={kind} view={view} now={now} />;
    case 'dolar':
      return <DollarCard key={kind} view={view} now={now} />;
    case 'feriado':
      return <HolidayCard key={kind} view={view} />;
    case 'sismo':
      return <QuakeCard key={kind} view={view} now={now} />;
    case 'cortes':
      return <CutsCard key={kind} view={view} now={now} />;
    case 'pagos':
      return <PaymentsCard key={kind} view={view} />;
  }
}

function Card({ icon, label, href, children, tone }: { icon: ServiceIconName; label: string; href: string; children: React.ReactNode; tone?: string }) {
  return (
    <article className={`svc-card${tone ? ` tone-${tone}` : ''}`}>
      <header className="svc-card-head">
        <span className="svc-card-icon">
          <ServiceIcon name={icon} size={18} />
        </span>
        <h3 className="svc-card-label">{label}</h3>
      </header>
      <div className="svc-card-body">{children}</div>
      <Link className="svc-card-more" href={href}>
        Ver más<span className="sr-only"> sobre {label.toLocaleLowerCase('es-AR')}</span> <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function WeatherCard({ view, now }: { view: ServicesView; now: Date }) {
  const current = view.weather?.now ?? null;
  const temperature = current?.temperatura ?? view.current?.temperatura ?? null;
  const sky = current?.cielo ?? view.current?.cielo ?? null;
  if (temperature === null && !sky) return null;
  const today = view.weather?.today;
  const forecast = (view.weather?.forecast ?? []).slice(0, 3);
  const observed = current ? current.observado || current.updated : view.current?.observed ?? null;

  return (
    <Card icon={skyIcon(sky)} label="Clima en La Rioja" href="/servicios#clima" tone="sky">
      <p className="svc-big">
        {temperature !== null && <strong>{formatDegrees(temperature)}</strong>}
        {sky && <span className="svc-big-note">{sky}</span>}
      </p>
      {(today?.min != null || today?.max != null || current?.humedad != null) && (
        <p className="svc-line">
          {[
            today?.min != null ? `Mín. ${formatDegrees(today.min)}` : null,
            today?.max != null ? `Máx. ${formatDegrees(today.max)}` : null,
            current?.humedad != null ? `Humedad ${formatDecimal(current.humedad)} %` : null
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {forecast.length > 0 && (
        <ol className="svc-forecast" aria-label="Próximos días">
          {forecast.map((day) => (
            <li key={day.fecha}>
              <span>{day.dia || formatCalendarDate(day.fecha, 'short')}</span>
              <strong>{day.max !== null ? formatDegrees(day.max) : '—'}</strong>
              <span className="svc-muted">{day.min !== null ? formatDegrees(day.min) : '—'}</span>
            </li>
          ))}
        </ol>
      )}
      {observed && <p className="svc-meta">Observado: {formatUpdated(observed, now)}</p>}
    </Card>
  );
}

function DollarCard({ view, now }: { view: ServicesView; now: Date }) {
  const dollar = view.dollar;
  if (!dollar) return null;
  const quotes = dollar.quotes.slice(0, 4);
  const latest = quotes.map((quote) => quote.actualizado).sort().at(-1);

  return (
    <Card icon="dolar" label="Dólar hoy" href="/servicios#dolar" tone="money">
      <table className="svc-quotes">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Cotización</span>
            </th>
            <th scope="col">Compra</th>
            <th scope="col">Venta</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.casa}>
              <th scope="row">{quote.nombre}</th>
              <td>{quote.compra !== null ? formatArs(quote.compra) : '—'}</td>
              <td className="svc-strong">{quote.venta !== null ? formatArs(quote.venta) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {latest && <p className="svc-meta">Actualizado: {formatUpdated(latest, now)} · {dollar.source}</p>}
    </Card>
  );
}

function HolidayCard({ view }: { view: ServicesView }) {
  const holidays = view.holidays?.items ?? [];
  if (!holidays.length) return null;
  const [next, ...rest] = holidays;

  return (
    <Card icon="feriados" label="Próximo feriado" href="/servicios#feriados" tone="date">
      <div className="svc-holiday">
        <p className="svc-count" aria-hidden="true">
          {next.daysLeft > 1 ? (
            <>
              <strong>{next.daysLeft}</strong>
              <span>días</span>
            </>
          ) : (
            <strong className="is-word">{next.daysLeft === 0 ? 'Hoy' : 'Mañana'}</strong>
          )}
        </p>
        <div>
          <p className="svc-title">{next.nombre}</p>
          <p className="svc-line svc-capitalize">{formatCalendarDate(next.fecha)}</p>
          <p className="sr-only">{daysLeftLabel(next.daysLeft)}</p>
        </div>
      </div>
      {rest.length > 0 && (
        <ul className="svc-list">
          {rest.slice(0, 2).map((holiday) => (
            <li key={`${holiday.fecha}-${holiday.nombre}`}>
              <span className="svc-list-date">{formatCalendarDate(holiday.fecha, 'short')}</span>
              <span>{holiday.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function QuakeCard({ view, now }: { view: ServicesView; now: Date }) {
  const quakes = view.quakes?.items ?? [];
  if (!quakes.length) return null;

  return (
    <Card icon="sismos" label="Sismos recientes" href="/servicios#sismos" tone="earth">
      <ul className="svc-list svc-quakes">
        {quakes.slice(0, 3).map((quake) => (
          <li key={quake.id}>
            <span className="svc-magnitude" aria-label={`Magnitud ${formatDecimal(quake.magnitud)}`}>
              {formatDecimal(quake.magnitud)}
            </span>
            <span>
              {quake.lugar}
              <span className="svc-muted">
                {' '}
                · {formatUpdated(quake.fecha, now)}
                {quake.estado === 'automatico' ? ' · preliminar' : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="svc-meta">Fuente: {view.quakes?.source}</p>
    </Card>
  );
}

/** Notes of this site open in place; anything else keeps its link. */
function ownPath(url: string) {
  const match = /^https?:\/\/(?:www\.)?lavozriojana\.com(\/[^?#]*)/i.exec(url);
  return match ? match[1] : null;
}

function CutsCard({ view, now }: { view: ServicesView; now: Date }) {
  const cuts = view.cuts?.items ?? [];
  if (!cuts.length) return null;

  return (
    <Card icon="cortes" label="Avisos de cortes" href="/servicios#cortes" tone="warn">
      <ul className="svc-list">
        {cuts.slice(0, 3).map((cut) => {
          const path = ownPath(cut.url);
          return (
            <li key={`${cut.url}-${cut.titulo}`}>
              <span className={`cut-service cut-${cut.servicio}`}>{CUT_LABELS[cut.servicio]}</span>
              <span>
                {path ? (
                  <Link className="svc-link" href={path}>
                    {cut.titulo}
                  </Link>
                ) : (
                  <a className="svc-link" href={cut.url} target="_blank" rel="noopener noreferrer">
                    {cut.titulo}
                  </a>
                )}
                <span className="svc-muted"> · {formatUpdated(cut.publicado, now)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PaymentsCard({ view }: { view: ServicesView }) {
  const payments = view.payments;
  if (!payments) return null;
  const list = payments.today.length ? payments.today : payments.upcoming;
  if (!list.length) return null;

  return (
    <Card icon="pagos" label={payments.today.length ? 'Pagos de hoy' : 'Próximos pagos'} href="/servicios#pagos" tone="money">
      <ul className="svc-list">
        {list.slice(0, 3).map((payment) => (
          <li key={`${payment.fecha}-${payment.concepto}`}>
            <span className="svc-list-date">{formatCalendarDate(payment.fecha, 'short')}</span>
            <span>{payment.concepto}</span>
          </li>
        ))}
      </ul>
      <p className="svc-meta">Fuente: {payments.source}</p>
    </Card>
  );
}
