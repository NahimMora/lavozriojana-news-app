import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Contacto' };

export default function ContactPage() {
  return <InstitutionalPage slug="contacto" />;
}
