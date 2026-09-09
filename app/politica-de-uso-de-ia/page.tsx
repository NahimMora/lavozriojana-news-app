import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';
import { institutionalMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata('politica-de-uso-de-ia', 'Política de uso de inteligencia artificial');
}

export default function AIUsePolicyPage() {
  return <InstitutionalPage slug="politica-de-uso-de-ia" />;
}
