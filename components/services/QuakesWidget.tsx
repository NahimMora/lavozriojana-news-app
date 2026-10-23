import { formatDecimal, formatUpdated, HOUR, QUAKE_STATE_LABELS, type QuakesView } from '@/lib/feed-select';
import { ServiceIcon } from './ServiceIcon';
import { ServiceMeta } from './ServiceMeta';

/** Quakes of the last seven days, stated plainly. Automatic readings are marked as preliminary. */
export function QuakesWidget({ view, now }: { view: QuakesView; now: Date }) {
  return (
    <section className="service-section" id="sismos" aria-labelledby="sismos-titulo">
      <h2 className="service-title" id="sismos-titulo">
        <ServiceIcon name="sismos" />
        Sismos
      </h2>
      <p className="service-intro">Movimientos registrados en los últimos siete días.</p>
      <ul className="service-list quake-list">
        {view.items.map((quake) => (
          <li key={quake.id}>
            <span className="quake-magnitude">
              <span className="sr-only">Magnitud </span>
              {formatDecimal(quake.magnitud)}
            </span>
            <div>
              <p className="quake-place">{quake.lugar}</p>
              <p className="service-list-note">
                {formatUpdated(quake.fecha, now)}
                {quake.profundidad_km !== null ? ` · ${formatDecimal(quake.profundidad_km)} km de profundidad` : ''}
                {' · '}
                <span className={`quake-state is-${quake.estado}`}>{QUAKE_STATE_LABELS[quake.estado]}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <ServiceMeta source={view.source} updated={view.updated} now={now} freshMs={6 * HOUR} />
    </section>
  );
}
