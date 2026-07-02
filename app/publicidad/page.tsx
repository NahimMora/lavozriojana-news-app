import type { Metadata } from 'next';
import { InstitutionalPage } from '@/components/news/InstitutionalPage';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Publicidad' };

export default function AdvertisingPage() {
  return <InstitutionalPage slug="publicidad" />;
}
