import Link from 'next/link';
import { Suspense } from 'react';
import { ServiceIcon, skyIcon, type ServiceIconName } from '@/components/services/ServiceIcon';
import { getServicesView } from '@/lib/feed';
import { selectServicesSummary, type SummaryItem } from '@/lib/feed-select';

const ICONS: Record<string, ServiceIconName> = {
  pagos: 'pagos',
  'proximo-pago': 'pagos',
  cortes: 'cortes',
  sismo: 'sismos',
  dolar: 'dolar',
  feriado: 'feriados'
};

/**
 * One line of service data after the home opening: up to four items chosen
 * by relevance (lib/feed-select.ts → selectServicesSummary), each linking to
 * its section of /servicios. On phones the title gives way to a 2×2 grid of
 * small cards: the icons and labels already say what each one is. Without
 * data it takes no space.
 */
export function ServicesSummary() {
  return (
    <Suspense fallback={null}>
      <ServicesSummaryData />
    </Suspense>
  );
}

async function ServicesSummaryData() {
  const now = new Date();
  const view = await getServicesView(now);
  const iconOf = (item: SummaryItem): ServiceIconName => (item.key === 'clima' ? skyIcon(view.current?.cielo) : ICONS[item.key] ?? 'termometro');
  const weather = view.current ? { temperatura: view.current.temperatura, cielo: view.current.cielo } : null;
  const items = selectServicesSummary(
    {
      weather,
      today: view.weather?.today ?? null,
      dollar: view.dollar,
      payments: view.payments,
      holidays: view.holidays?.items ?? [],
      quakes: view.quakes,
      cuts: view.cuts
    },
    now
  );
  // A single item would only repeat the header's temperature: the strip needs two.
  if (items.length < 2) return null;

  return (
    <section className="services-strip" aria-labelledby="services-strip-title">
      <div className="container services-strip-inner">
        <h2 className="services-strip-title" id="services-strip-title">
          Servicios
        </h2>
        <ul className="services-strip-list">
          {items.map((item) => (
            <li key={item.key}>
              <Link href={item.href}>
                <span className="services-strip-icon">
                  <ServiceIcon name={iconOf(item)} size={18} />
                </span>
                <span className="services-strip-label">{item.label}</span>
                <span className="services-strip-value">{item.value}</span>
                {item.note && <span className="services-strip-note">{item.note}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="services-strip-more" href="/servicios">
          Ver todos los servicios <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
