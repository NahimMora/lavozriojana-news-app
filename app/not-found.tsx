import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container section">
      <h1 className="article-title">Página no encontrada</h1>
      <p className="article-lead">La página solicitada no existe o fue movida.</p>
      <Link className="button" href="/">
        Volver a la portada
      </Link>
    </div>
  );
}
