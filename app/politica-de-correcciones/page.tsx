import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';
import { institutionalMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata('politica-de-correcciones', 'Política de correcciones');
}

export default function CorrectionsPolicyPage() {
  return <InstitutionalPage slug="politica-de-correcciones" />;
}
