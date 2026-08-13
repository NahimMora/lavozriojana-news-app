'use client';

import { useEffect, useId } from 'react';
import { ADSENSE_CLIENT_ID } from '@/lib/adsense';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export function AdSenseUnit({
  slot,
  format = 'auto',
  className
}: {
  /** Ad unit ID from the AdSense dashboard. Space stays empty/hidden until set. */
  slot?: string;
  format?: string;
  className?: string;
}) {
  const insId = useId();

  useEffect(() => {
    if (!slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* adsbygoogle script blocked or not yet loaded */
    }
  }, [slot]);

  if (!slot) {
    return <div className={`ad-slot ad-slot-empty ${className ?? ''}`} aria-hidden="true" />;
  }

  return (
    <div className={`ad-slot ${className ?? ''}`} aria-label="Publicidad">
      <ins
        key={insId}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
