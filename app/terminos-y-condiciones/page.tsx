import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Términos y condiciones' };

export default function TermsPage() {
  return <InstitutionalPage slug="terminos-y-condiciones" />;
}
