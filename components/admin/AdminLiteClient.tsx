'use client';

import { useEffect, useState } from 'react';

type Stats = {
  posts: number;
  publishedPosts: number;
  totalViews: number;
  pendingComments: number;
  activeBanners: number;
  phoneLeads: number;
};

export function AdminLiteClient() {
  const [apiKey, setApiKey] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('lvr_api_key');
    if (stored) setApiKey(stored);
  }, []);

  async function privateFetch(path: string, init?: RequestInit) {
    const response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(init?.headers || {})
      }
    });
    if (!response.ok) throw new Error('Request privado rechazado.');
    return response.json();
  }

  async function loadData() {
    setMessage(null);
    try {
      window.localStorage.setItem('lvr_api_key', apiKey);
      const [statsResponse, commentsResponse, postsResponse] = await Promise.all([
        privateFetch('/api/private/stats'),
        privateFetch('/api/private/comments?status=pending'),
        privateFetch('/api/private/posts?perPage=8')
      ]);
      setStats(statsResponse.data);
      setComments(commentsResponse.data.items);
      setPosts(postsResponse.data.items);
    } catch {
      setMessage('No se pudieron cargar los datos. Revisá la API key.');
    }
  }

  async function moderateComment(id: number, status: 'approved' | 'rejected') {
    try {
      await privateFetch(`/api/private/comments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadData();
    } catch {
      setMessage('No se pudo moderar el comentario.');
    }
  }

  return (
    <div>
      <div className="form-panel" style={{ marginBottom: 20 }}>
        <label>
          API key privada
          <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" />
        </label>
        <button className="button" onClick={loadData} type="button" style={{ marginTop: 12 }}>
          Cargar administración
        </button>
        {message && <p>{message}</p>}
      </div>

      {stats && (
        <div className="admin-grid">
          {Object.entries(stats).map(([key, value]) => (
            <div className="admin-card" key={key}>
              <span className="kicker">{key}</span>
              <strong style={{ display: 'block', fontSize: '2rem' }}>{String(value)}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="section">
        <h2 className="section-title">Comentarios pendientes</h2>
        <div className="comment-list">
          {comments.length === 0 && <p className="muted">No hay comentarios pendientes cargados.</p>}
          {comments.map((comment) => (
            <div className="comment-item" key={comment.id}>
              <strong>{comment.authorName}</strong>
              <p>{comment.body}</p>
              <div className="form-row">
                <button className="button" type="button" onClick={() => moderateComment(comment.id, 'approved')}>
                  Aprobar
                </button>
                <button className="share-button" type="button" onClick={() => moderateComment(comment.id, 'rejected')}>
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Posts recientes</h2>
        <div className="comment-list">
          {posts.map((post) => (
            <div className="comment-item" key={post.id}>
              <strong>{post.title}</strong>
              <p className="muted">
                {post.status} · {post.slug}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
