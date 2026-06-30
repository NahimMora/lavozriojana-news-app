'use client';

import { useState } from 'react';

export function PhoneLeadForm({ source = 'web' }: { source?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    const response = await fetch('/api/phone-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name') || undefined,
        phone: data.get('phone'),
        consent: data.get('consent') === 'on',
        source,
        website: data.get('website')
      })
    });

    if (response.ok) {
      form.reset();
      setStatus('Telefono registrado correctamente.');
    } else {
      setStatus('No se pudo registrar el telefono. Verifica el numero y el consentimiento.');
    }

    setLoading(false);
  }

  return (
    <form className="form-panel" onSubmit={onSubmit}>
      <h2 className="section-title">Avisos por WhatsApp</h2>
      <div className="hidden-field" aria-hidden="true">
        <label>
          Sitio web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="form-row">
        <label style={{ flex: '1 1 180px' }}>
          Nombre
          <input name="name" maxLength={120} />
        </label>
        <label style={{ flex: '1 1 180px' }}>
          Telefono
          <input name="phone" required minLength={7} maxLength={40} placeholder="+54 9..." />
        </label>
      </div>
      <label style={{ display: 'flex', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <input type="checkbox" name="consent" required style={{ width: 'auto' }} />
        Acepto que La Voz Riojana guarde mi telefono para futuros avisos informativos por WhatsApp.
      </label>
      <button className="button" type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Guardando...' : 'Registrarme'}
      </button>
      {status && <p>{status}</p>}
    </form>
  );
}
