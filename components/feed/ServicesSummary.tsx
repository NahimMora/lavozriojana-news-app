import Link from 'next/link';
import { Suspense } from 'react';
import { getServicesView } from '@/lib/feed';
import { selectServicesSummary } from '@/lib/feed-select';

/**
 * One line of service data after the home opening: up to four items chosen
 * by relevance (lib/feed-select.ts → selectServicesSummary), each linking to
 * its section of /servicios. Without data it takes no space.
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
                <span className="services-strip-label">{item.label}</span>
                <span className="services-strip-value">{item.value}</span>
                {item.note && <span className="services-strip-note">{item.note}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="services-strip-more" href="/servicios">
          Ver todos los servicios
        </Link>
      </div>
    </section>
  );
}
