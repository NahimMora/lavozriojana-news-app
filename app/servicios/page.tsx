import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/news/Breadcrumbs';
import { AlertsList } from '@/components/services/AlertsList';
import { CutsWidget } from '@/components/services/CutsWidget';
import { DollarWidget } from '@/components/services/DollarWidget';
import { HolidaysWidget } from '@/components/services/HolidaysWidget';
import { PaymentsWidget } from '@/components/services/PaymentsWidget';
import { QuakesWidget } from '@/components/services/QuakesWidget';
import { WeatherFallback, WeatherWidget } from '@/components/services/WeatherWidget';
import { getServicesView } from '@/lib/feed';
import { selectServicesSummary } from '@/lib/feed-select';
import { pageMetadata } from '@/lib/seo';

export const runtime = 'nodejs';
export const revalidate = 300;

const title = 'Servicios';
const description = 'Clima, alertas, dólar, pagos, feriados, sismos y avisos de cortes en La Rioja, con su fuente y hora de actualización.';

export const metadata: Metadata = pageMetadata({ path: '/servicios', title, description });

export default async function ServicesPage() {
  const now = new Date();
  const view = await getServicesView(now);

  const sections = [
    view.alerts.length ? { id: 'alertas', label: 'Alertas' } : null,
    view.weather || view.current ? { id: 'clima', label: 'Clima' } : null,
    view.dollar ? { id: 'dolar', label: 'Dólar' } : null,
    view.payments ? { id: 'pagos', label: 'Pagos' } : null,
    view.holidays ? { id: 'feriados', label: 'Feriados' } : null,
    view.cuts ? { id: 'cortes', label: 'Cortes y rutas' } : null,
    view.quakes ? { id: 'sismos', label: 'Sismos' } : null
  ].filter((section): section is { id: string; label: string } => !!section);

  // The same relevance order as the home line: the day's essentials first.
  const glance = selectServicesSummary(
    {
      weather: view.current ? { temperatura: view.current.temperatura, cielo: view.current.cielo } : null,
      today: view.weather?.today ?? null,
      dollar: view.dollar,
      payments: view.payments,
      holidays: view.holidays?.items ?? [],
      quakes: view.quakes,
      cuts: view.cuts
    },
    now
  );

  return (
    <div className="container service-page">
      <Breadcrumbs items={[{ label: 'Servicios' }]} />
      <header className="service-hero">
        <div className="service-hero-text">
          <h1>Servicios</h1>
          <p>Información útil para La Rioja. Cada dato indica su fuente y cuándo se actualizó.</p>
        </div>
        {glance.length > 0 && (
          <ul className="service-glance" aria-label="De un vistazo">
            {glance.map((item) => (
              <li key={item.key}>
                <a href={item.href.replace('/servicios', '')}>
                  <span className="service-glance-label">{item.label}</span>
                  <span className="service-glance-value">{item.value}</span>
                  {item.note && <span className="service-glance-note">{item.note}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>
      {sections.length > 1 && (
        <nav className="service-nav" aria-label="Secciones de servicios">
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.label}
            </a>
          ))}
        </nav>
      )}

      {view.alerts.length > 0 && <AlertsList alerts={view.alerts} now={now} />}

      {sections.some((section) => section.id !== 'alertas') ? (
        // Balanced columns (three on wide screens, two on tablets): each
        // panel keeps its natural height and the next one fills the shortest
        // column, so a short section leaves no hole beside a long one. On
        // phones the panels follow this reading order.
        <div className="service-grid">
          {view.weather ? (
            <WeatherWidget view={view.weather} now={now} />
          ) : (
            view.current && <WeatherFallback temperatura={view.current.temperatura} source={view.current.source} observed={view.current.observed} now={now} />
          )}
          {view.dollar && <DollarWidget view={view.dollar} now={now} />}
          {view.payments && <PaymentsWidget view={view.payments} now={now} />}
          {view.holidays && <HolidaysWidget holidays={view.holidays.items} source={view.holidays.source} updated={view.holidays.updated} now={now} />}
          {view.cuts && <CutsWidget view={view.cuts} now={now} />}
          {view.quakes && <QuakesWidget view={view.quakes} now={now} />}
        </div>
      ) : (
        <div className="service-empty">
          <p>Los datos de servicios no están disponibles en este momento. Volvé a consultar en unos minutos.</p>
          <Link href="/">Ir a la portada</Link>
        </div>
      )}
    </div>
  );
}
