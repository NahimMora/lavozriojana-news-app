import type { BannerSlot } from '@prisma/client';
import { getActiveBanner } from '@/lib/banners';

export async function BannerAd({ slot }: { slot: BannerSlot }) {
  const banner = await getActiveBanner(slot);
  if (!banner?.imageUrl) return null;

  const image = (
    <img
      src={banner.imageUrl}
      alt={banner.altText || banner.name}
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <div className="ad-slot" data-slot={slot}>
      {banner.linkUrl ? (
        <a href={`/api/banner-click/${banner.id}?to=${encodeURIComponent(banner.linkUrl)}`} rel="sponsored noopener">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
