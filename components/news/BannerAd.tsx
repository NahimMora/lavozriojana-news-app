import Image from 'next/image';
import type { Banner, BannerSlot } from '@prisma/client';
import { getActiveBanner } from '@/lib/banners';

type Props = { slot: BannerSlot; className?: string };

export async function BannerAd({ slot, className }: Props) {
  const banner = await getActiveBanner(slot);
  return <BannerSquare banner={banner} slot={slot} className={className} />;
}

/**
 * Square ad (1:1). The creative is shown whole (contain) over a neutral
 * frame, so a piece that is not exactly square is never cropped. Takes a
 * banner already fetched when the page needs to know beforehand whether
 * the slot is filled (an ad that takes the place of a card in a grid).
 */
export function BannerSquare({ banner, slot, className }: Props & { banner: Banner | null }) {
  const classes = ['ad-slot', className].filter(Boolean).join(' ');

  if (!banner?.imageUrl) {
    return (
      <div className={`${classes} ad-slot-empty`} data-slot={slot} aria-hidden="true">
        <span>Publicidad</span>
      </div>
    );
  }

  const image = (
    <Image
      src={banner.imageUrl}
      alt={banner.altText || banner.name}
      width={640}
      height={640}
      sizes="320px"
    />
  );

  return (
    <div className={`${classes} ad-square`} data-slot={slot}>
      <span className="ad-label">Publicidad</span>
      <div className="ad-frame">
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
    </div>
  );
}
