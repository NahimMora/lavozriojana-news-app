import { formatUpdated, formatZones, type ActiveAlert } from '@/lib/feed-select';
import { ServiceIcon } from './ServiceIcon';

/** Every active alert in full, for /servicios; the site-wide band shows only the most severe one. */
export function AlertsList({ alerts, now }: { alerts: ActiveAlert[]; now: Date }) {
  return (
    <section className="service-section service-alerts" id="alertas" aria-labelledby="alertas-titulo">
      <h2 className="service-title" id="alertas-titulo">
        <ServiceIcon name="alerta" />
        Alertas meteorológicas
      </h2>
      <ul className="alerts-list">
        {alerts.map((alert) => (
          <li className={`alert-card level-${alert.level}`} key={alert.key}>
            <p className="alert-card-line">
              <strong className="weather-alert-label">{alert.label}</strong> {alert.cause}
            </p>
            {alert.zones.length > 0 && <p className="alert-card-zones">{formatZones(alert.zones, alert.zones.length)}</p>}
            <p className="alert-card-until">{alert.until}</p>
            {alert.description && <p className="alert-card-description">{alert.description}</p>}
            <p className="service-meta">
              Fuente: {alert.source} · Actualizado: {formatUpdated(alert.updated, now)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
