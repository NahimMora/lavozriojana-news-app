import { DAY, daysLeftLabel, formatCalendarDate, type HolidayView } from '@/lib/feed-select';
import { ServiceIcon } from './ServiceIcon';
import { ServiceMeta } from './ServiceMeta';

/** Next holidays by calendar date in La Rioja; a past date is never listed as upcoming. */
export function HolidaysWidget({ holidays, source, updated, now }: { holidays: HolidayView[]; source: string; updated: string; now: Date }) {
  const [next, ...rest] = holidays;
  return (
    <section className="service-section" id="feriados" aria-labelledby="feriados-titulo">
      <h2 className="service-title" id="feriados-titulo">
        <ServiceIcon name="feriados" />
        Feriados
      </h2>
      <div className="holiday-next">
        <p className="holiday-count" aria-hidden="true">
          {next.daysLeft > 1 ? (
            <>
              <strong>{next.daysLeft}</strong>
              <span>días</span>
            </>
          ) : (
            <strong className="holiday-count-word">{next.daysLeft === 0 ? 'Hoy' : 'Mañana'}</strong>
          )}
        </p>
        <div>
          <p className="holiday-name">{next.nombre}</p>
          <p className="holiday-date">
            {formatCalendarDate(next.fecha)}
            {next.tipo ? ` · ${next.tipo}` : ''}
          </p>
          <p className="sr-only">{daysLeftLabel(next.daysLeft)}</p>
        </div>
      </div>
      {rest.length > 0 && (
        <ul className="service-list">
          {rest.map((holiday) => (
            <li key={`${holiday.fecha}-${holiday.nombre}`}>
              <span className="service-list-date">{formatCalendarDate(holiday.fecha, 'short')}</span>
              <span>
                {holiday.nombre}
                {holiday.tipo ? <span className="service-list-note"> · {holiday.tipo}</span> : null}
                <span className="service-list-note"> · faltan {holiday.daysLeft} días</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <ServiceMeta source={source} updated={updated} now={now} freshMs={30 * DAY} />
    </section>
  );
}
