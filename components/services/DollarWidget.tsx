import { formatArs, formatPercent, formatUpdated, type DollarView } from '@/lib/feed-select';
import { ServiceIcon } from './ServiceIcon';
import { ServiceMeta } from './ServiceMeta';

function Price({ value }: { value: number | null }) {
  return value === null ? <span aria-label="sin dato">—</span> : <>{formatArs(value)}</>;
}

/** Quotes exactly as the feed reports them: Oficial and Blue as cards, MEP, CCL and the rest in a table. */
export function DollarWidget({ view, now }: { view: DollarView; now: Date }) {
  const primary = view.quotes.filter((quote) => quote.primary);
  const others = view.quotes.filter((quote) => !quote.primary);

  return (
    <section className="service-section" id="dolar" aria-labelledby="dolar-titulo">
      <h2 className="service-title" id="dolar-titulo">
        <ServiceIcon name="dolar" />
        Dólar
      </h2>
      {primary.length > 0 && (
        <div className="dollar-cards">
          {primary.map((quote) => (
            <div className="dollar-card" key={quote.casa}>
              <p className="dollar-card-name">{quote.nombre}</p>
              <dl>
                <div>
                  <dt>Compra</dt>
                  <dd>
                    <Price value={quote.compra} />
                  </dd>
                </div>
                <div>
                  <dt>Venta</dt>
                  <dd className="dollar-sell">
                    <Price value={quote.venta} />
                  </dd>
                </div>
              </dl>
              <p className={`dollar-time${quote.age.aging ? ' is-aging' : ''}`}>{formatUpdated(quote.actualizado, now)}</p>
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <table className="dollar-table">
          <caption className="sr-only">Otras cotizaciones del dólar en pesos, compra y venta</caption>
          <thead>
            <tr>
              <th scope="col">Cotización</th>
              <th scope="col">Compra</th>
              <th scope="col">Venta</th>
            </tr>
          </thead>
          <tbody>
            {others.map((quote) => (
              <tr key={quote.casa}>
                <th scope="row">
                  {quote.nombre}
                  <span className={`dollar-time${quote.age.aging ? ' is-aging' : ''}`}>{formatUpdated(quote.actualizado, now)}</span>
                </th>
                <td>
                  <Price value={quote.compra} />
                </td>
                <td>
                  <Price value={quote.venta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {view.gap !== null && <p className="dollar-gap">Brecha entre el blue y el oficial: {formatPercent(view.gap)} %</p>}
      <ServiceMeta source={view.source} updated={view.updated} now={now} />
    </section>
  );
}
