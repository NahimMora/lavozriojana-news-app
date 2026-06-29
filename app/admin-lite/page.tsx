import type { Metadata } from 'next';
import { AdminLiteClient } from '@/components/admin/AdminLiteClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Admin Lite',
  robots: { index: false, follow: false }
};

export default function AdminLitePage() {
  return (
    <div className="container section">
      <h1 className="section-title">Admin Lite</h1>
      <p className="muted">
        Zona mínima para ver estadísticas, posts recientes y moderar comentarios. Los datos privados solo cargan con
        una API key válida.
      </p>
      <AdminLiteClient />
    </div>
  );
}
