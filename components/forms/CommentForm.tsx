'use client';

import { useState } from 'react';

export function CommentForm({ postId }: { postId: number }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        authorName: data.get('authorName'),
        body: data.get('body'),
        website: data.get('website')
      })
    });

    if (response.ok) {
      form.reset();
      setStatus('Comentario enviado. Quedara visible cuando sea aprobado.');
    } else {
      setStatus('No se pudo enviar el comentario. Revisa los datos e intenta nuevamente.');
    }

    setLoading(false);
  }

  return (
    <form className="form-panel" onSubmit={onSubmit}>
      <div className="hidden-field" aria-hidden="true">
        <label>
          Sitio web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="form-row">
        <label style={{ flex: '1 1 220px' }}>
          Nombre visible
          <input name="authorName" required minLength={2} maxLength={120} />
        </label>
      </div>
      <label style={{ marginTop: 12 }}>
        Comentario
        <textarea name="body" required minLength={5} maxLength={1200} />
      </label>
      <p className="muted" style={{ fontSize: '.86rem' }}>
        Los comentarios se moderan. No se permiten links, insultos ni datos sensibles.
      </p>
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar comentario'}
      </button>
      {status && <p>{status}</p>}
    </form>
  );
}
