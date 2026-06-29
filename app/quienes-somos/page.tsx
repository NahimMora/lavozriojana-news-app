import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Quiénes somos' };

export default function AboutPage() {
  return <InstitutionalPage slug="quienes-somos" />;
}
