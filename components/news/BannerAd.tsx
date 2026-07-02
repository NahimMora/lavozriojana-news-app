import Image from 'next/image';
import type { BannerSlot } from '@prisma/client';
import { getActiveBanner } from '@/lib/banners';

export async function BannerAd({ slot }: { slot: BannerSlot }) {
  const banner = await getActiveBanner(slot);

  if (!banner?.imageUrl) {
    return (
      <div className="ad-slot ad-slot-empty" data-slot={slot} aria-hidden="true">
        <span>Publicidad</span>
      </div>
    );
  }

  const image = (
    <Image
      src={banner.imageUrl}
      alt={banner.altText || banner.name}
      width={1200}
      height={160}
      sizes="(min-width: 900px) 760px, 100vw"
    />
  );

  return (
    <div className="ad-slot" data-slot={slot} aria-label="Publicidad">
      {banner.linkUrl ? (
        <a
          href={`/api/banner-click/${banner.id}?to=${encodeURIComponent(banner.linkUrl)}`}
          rel="sponsored noopener"
          aria-label={`Publicidad: ${banner.altText || banner.name}`}
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
