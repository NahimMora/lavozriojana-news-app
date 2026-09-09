export const CONSENT_STORAGE_KEY = 'lvr_cookie_consent_v1';
export const CONSENT_REOPEN_EVENT = 'lvr:open-cookie-preferences';

export type ConsentChoice = {
  analytics: boolean;
  ads: boolean;
  /* Epoch ms de cuándo se guardó la decisión. */
  decidedAt: number;
};

export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics !== 'boolean' || typeof parsed?.ads !== 'boolean') return null;
    return parsed as ConsentChoice;
  } catch {
    return null;
  }
}

export function writeStoredConsent(choice: ConsentChoice) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // localStorage no disponible (modo privado, etc.): la decisión no persiste entre visitas.
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Envía la decisión de consentimiento a Google Consent Mode v2 (GA + AdSense leen esta señal). */
export function applyConsentToGtag(choice: Pick<ConsentChoice, 'analytics' | 'ads'>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('consent', 'update', {
    analytics_storage: choice.analytics ? 'granted' : 'denied',
    ad_storage: choice.ads ? 'granted' : 'denied',
    ad_user_data: choice.ads ? 'granted' : 'denied',
    ad_personalization: choice.ads ? 'granted' : 'denied'
  });
}
