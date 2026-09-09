import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';
import { institutionalMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return institutionalMetadata('contacto', 'Contacto');
}

export default function ContactPage() {
  return <InstitutionalPage slug="contacto" />;
}
