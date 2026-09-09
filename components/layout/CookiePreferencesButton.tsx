'use client';

import { CONSENT_REOPEN_EVENT } from '@/lib/consent';

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT))}
      style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }}
    >
      Preferencias de cookies
    </button>
  );
}
