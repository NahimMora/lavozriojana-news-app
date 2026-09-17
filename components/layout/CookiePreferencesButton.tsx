'use client';

import { CONSENT_REOPEN_EVENT } from '@/lib/consent';

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      className="footer-cookie-btn"
      onClick={() => window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT))}
    >
      Preferencias de cookies
    </button>
  );
}
