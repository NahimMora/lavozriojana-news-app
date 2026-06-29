import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Política de privacidad' };

export default function PrivacyPage() {
  return <InstitutionalPage slug="politica-de-privacidad" />;
}
