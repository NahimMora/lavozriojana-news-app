import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/site';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || SITE_NAME;
  const category = searchParams.get('category') || 'Noticias';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f7f8fb',
          color: '#111827',
          padding: '72px',
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 34,
            fontWeight: 700
          }}
        >
          <span>{SITE_NAME}</span>
          <span style={{ color: '#0b4ea2' }}>{category}</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 74,
            lineHeight: 1.05,
            fontWeight: 800,
            maxWidth: 980
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            color: '#4b5563',
            fontSize: 28
          }}
        >
          <span>lavozriojana.com</span>
          <span style={{ color: '#d71920' }}>Noticias de La Rioja</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
