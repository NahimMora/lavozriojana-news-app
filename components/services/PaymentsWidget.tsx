import type { Payment } from '@/lib/feed-types';
import { DAY, formatCalendarDate, type PaymentsView } from '@/lib/feed-select';
import { ServiceIcon } from './ServiceIcon';
import { ServiceMeta } from './ServiceMeta';

function PaymentItem({ payment, showDate }: { payment: Payment; showDate: boolean }) {
  return (
    <li className="payment-item">
      {showDate && <span className="service-list-date">{formatCalendarDate(payment.fecha, 'short')}</span>}
      <div>
        <p className="payment-concept">{payment.concepto}</p>
        {payment.organismos.length > 0 && (
          <details className="payment-details">
            <summary>Bancos y grupos</summary>
            {payment.organismos.map((organismo) => (
              <div className="payment-bank" key={organismo.banco}>
                <p>{organismo.banco}</p>
                {organismo.items.length > 0 && (
                  <ul>
                    {organismo.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </details>
        )}
        {payment.url && (
          <a className="service-source-link" href={payment.url} target="_blank" rel="noopener noreferrer">
            Fuente oficial
          </a>
        )}
      </div>
    </li>
  );
}

/** Today's payments, by each payment's own date in La Rioja, then the next ones. */
export function PaymentsWidget({ view, now }: { view: PaymentsView; now: Date }) {
  return (
    <section className="service-section" id="pagos" aria-labelledby="pagos-titulo">
      <h2 className="service-title" id="pagos-titulo">
        <ServiceIcon name="pagos" />
        Pagos
      </h2>
      {view.today.length > 0 && (
        <div className="payments-today">
          <h3 className="service-subtitle">Hoy</h3>
          <ul className="service-list payments-list">
            {view.today.map((payment) => (
              <PaymentItem key={`${payment.fecha}-${payment.concepto}`} payment={payment} showDate={false} />
            ))}
          </ul>
        </div>
      )}
      {view.upcoming.length > 0 && (
        <>
          <h3 className="service-subtitle">Próximos</h3>
          <ul className="service-list payments-list">
            {view.upcoming.map((payment) => (
              <PaymentItem key={`${payment.fecha}-${payment.concepto}`} payment={payment} showDate />
            ))}
          </ul>
        </>
      )}
      <ServiceMeta source={view.source} updated={view.updated} now={now} freshMs={DAY} />
    </section>
  );
}
