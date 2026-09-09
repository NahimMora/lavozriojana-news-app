import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';
import { institutionalMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata('quienes-somos', 'Quiénes somos');
}

export default function AboutPage() {
  return <InstitutionalPage slug="quienes-somos" />;
}
