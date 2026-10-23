import { formatCalendarDate, formatDecimal, formatDegrees, type WeatherView } from '@/lib/feed-select';
import { ServiceIcon, skyIcon } from './ServiceIcon';
import { ServiceMeta } from './ServiceMeta';

/* Units the contract leaves implicit; see "Supuestos" in docs/FEED_INTEGRATION.md. */
const wind = (value: string | number) => (typeof value === 'number' ? `${formatDecimal(value)} km/h` : value);
const rain = (value: string | number) => (typeof value === 'number' ? `${formatDecimal(value)} %` : value);

function range(min: number | null, max: number | null) {
  return [min !== null ? `Mín. ${formatDegrees(min)}` : null, max !== null ? `Máx. ${formatDegrees(max)}` : null].filter(Boolean).join(' · ');
}

/** Current conditions and forecast from the services feed; a missing value is left out, never filled in. */
export function WeatherWidget({ view, now }: { view: WeatherView; now: Date }) {
  const current = view.now;
  const reference = current ? current.observado || current.updated : null;
  const details = current
    ? [
        current.humedad !== null ? { label: 'Humedad', value: `${formatDecimal(current.humedad)} %` } : null,
        current.viento !== null ? { label: 'Viento', value: wind(current.viento) } : null,
        view.today?.min != null ? { label: 'Mínima', value: formatDegrees(view.today.min) } : null,
        view.today?.max != null ? { label: 'Máxima', value: formatDegrees(view.today.max) } : null
      ].filter((item): item is { label: string; value: string } => !!item)
    : [];

  return (
    <section className="service-section service-weather" id="clima" aria-labelledby="clima-titulo">
      <h2 className="service-title" id="clima-titulo">
        <ServiceIcon name={skyIcon(current?.cielo)} />
        Clima en La Rioja
      </h2>
      {current && (
        <div className="weather-now">
          <span className="weather-now-icon">
            <ServiceIcon name={skyIcon(current.cielo)} size={56} />
          </span>
          {current.temperatura !== null && <p className="weather-temp">{formatDegrees(current.temperatura)}</p>}
          <div className="weather-now-text">
            {current.cielo && <p className="weather-sky">{current.cielo}</p>}
            {view.station && <p className="weather-station">Estación {view.station}</p>}
          </div>
        </div>
      )}
      {details.length > 0 && (
        <dl className="weather-details">
          {details.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {view.forecast.length > 0 && (
        <>
          <h3 className="service-subtitle">Pronóstico</h3>
          <ol className="weather-forecast" aria-label="Pronóstico extendido">
            {view.forecast.map((day) => (
              <li key={day.fecha}>
                <span className="weather-day">{day.dia || formatCalendarDate(day.fecha, 'short')}</span>
                <span className="weather-minmax">
                  <span className="weather-max">{day.max !== null ? formatDegrees(day.max) : '—'}</span>
                  <span className="weather-min">{day.min !== null ? formatDegrees(day.min) : '—'}</span>
                </span>
                {day.lluvia !== null && (
                  <span className="weather-rain">
                    <ServiceIcon name="agua" size={12} />
                    {rain(day.lluvia)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
      {!current && view.today && <p className="weather-range">{range(view.today.min, view.today.max)}</p>}
      {reference && <ServiceMeta source={view.source} updated={reference} label={current?.observado ? 'Observado' : 'Actualizado'} now={now} />}
    </section>
  );
}

/** When the feed has no weather: the temperature the header shows, with its own source and time. */
export function WeatherFallback({ temperatura, source, observed, now }: { temperatura: number; source: string; observed: string | null; now: Date }) {
  return (
    <section className="service-section service-weather" id="clima" aria-labelledby="clima-titulo">
      <h2 className="service-title" id="clima-titulo">
        <ServiceIcon name="termometro" />
        Clima en La Rioja
      </h2>
      <div className="weather-now">
        <p className="weather-temp">{formatDegrees(temperatura)}</p>
        <div className="weather-now-text">
          <p className="weather-sky">Temperatura en La Rioja capital</p>
        </div>
      </div>
      {observed ? <ServiceMeta source={source} updated={observed} label="Dato de" now={now} /> : <p className="service-meta">Fuente: {source}</p>}
    </section>
  );
}
