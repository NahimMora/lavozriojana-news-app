import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';
import { institutionalMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata('terminos-y-condiciones', 'Términos y condiciones');
}

export default function TermsPage() {
  return <InstitutionalPage slug="terminos-y-condiciones" />;
}
