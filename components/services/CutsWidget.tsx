import { CUT_LABELS, DAY, formatUpdated, type CutsView } from '@/lib/feed-select';
import { ServiceIcon } from './ServiceIcon';
import { ServiceMeta } from './ServiceMeta';

/**
 * Cut and road notices published in the last 72 hours. They are notices with
 * their publication date, not a live service status.
 */
export function CutsWidget({ view, now }: { view: CutsView; now: Date }) {
  return (
    <section className="service-section" id="cortes" aria-labelledby="cortes-titulo">
      <h2 className="service-title" id="cortes-titulo">
        <ServiceIcon name="cortes" />
        Cortes y rutas
      </h2>
      <p className="service-intro">Avisos publicados en las últimas 72 horas. Consultá la fuente para saber si siguen vigentes.</p>
      <ul className="service-list cut-list">
        {view.items.map((cut) => (
          <li key={`${cut.url}-${cut.titulo}`}>
            <span className={`cut-service cut-${cut.servicio}`}>
              <ServiceIcon name={cut.servicio} size={14} />
              {CUT_LABELS[cut.servicio]}
            </span>
            <div>
              <a className="cut-title" href={cut.url} target="_blank" rel="noopener noreferrer">
                {cut.titulo}
              </a>
              <p className="service-list-note">
                {cut.zona ? `${cut.zona} · ` : ''}Publicado: {formatUpdated(cut.publicado, now)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <ServiceMeta source={view.source} updated={view.updated} now={now} freshMs={DAY} />
    </section>
  );
}
