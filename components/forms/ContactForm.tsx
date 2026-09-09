'use client';

import { useState } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: data.get('subject'),
          message: data.get('message'),
          website: data.get('website')
        })
      });

      if (response.ok) {
        form.reset();
        setStatus({ ok: true, text: 'Mensaje enviado. Te responderemos por email a la brevedad.' });
      } else {
        const body = await response.json().catch(() => null);
        setStatus({
          ok: false,
          text: body?.error?.message || 'No se pudo enviar el mensaje. Revisá los datos e intentá nuevamente.'
        });
      }
    } catch {
      setStatus({ ok: false, text: 'No se pudo enviar el mensaje. Probá nuevamente en unos minutos.' });
    }

    setLoading(false);
  }

  return (
    <form className="form-panel" style={{ maxWidth: 720, marginTop: 24 }} onSubmit={onSubmit}>
      {/* Honeypot anti-spam: invisible para personas, los bots lo completan. */}
      <div className="hidden-field" aria-hidden="true">
        <label>
          Sitio web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form-row">
        <label style={{ flex: '1 1 220px' }}>
          Nombre
          <input name="name" required minLength={2} maxLength={160} autoComplete="name" />
        </label>
        <label style={{ flex: '1 1 220px' }}>
          Email
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
      </div>
      <label style={{ marginTop: 12 }}>
        Asunto
        <input name="subject" maxLength={200} placeholder="Consulta, comunicado, publicidad, corrección…" />
      </label>
      <label style={{ marginTop: 12 }}>
        Mensaje
        <textarea name="message" required minLength={10} maxLength={4000} />
      </label>
      <button className="button" type="submit" disabled={loading} style={{ marginTop: 14 }}>
        {loading ? 'Enviando...' : 'Enviar mensaje'}
      </button>
      {status && (
        <p className={status.ok ? undefined : 'muted'} style={{ marginTop: 10 }}>
          {status.text}
        </p>
      )}
    </form>
  );
}
