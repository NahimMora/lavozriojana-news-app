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
    <img
      src={banner.imageUrl}
      alt={banner.altText || banner.name}
      loading="lazy"
      decoding="async"
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
