'use client';

import { useEffect, useState } from 'react';
import {
  applyConsentToGtag,
  CONSENT_REOPEN_EVENT,
  readStoredConsent,
  writeStoredConsent,
  type ConsentChoice
} from '@/lib/consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      applyConsentToGtag(stored);
      setAnalytics(stored.analytics);
      setAds(stored.ads);
    } else {
      setVisible(true);
    }

    function openPreferences() {
      const current = readStoredConsent();
      if (current) {
        setAnalytics(current.analytics);
        setAds(current.ads);
      }
      setShowPrefs(true);
      setVisible(true);
    }

    window.addEventListener(CONSENT_REOPEN_EVENT, openPreferences);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, openPreferences);
  }, []);

  function save(choice: Pick<ConsentChoice, 'analytics' | 'ads'>) {
    const decision: ConsentChoice = { ...choice, decidedAt: Date.now() };
    writeStoredConsent(decision);
    applyConsentToGtag(decision);
    setVisible(false);
    setShowPrefs(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Preferencias de cookies">
      <p>
        Usamos cookies propias y de terceros (Google Analytics y Google AdSense) para medir tráfico y mostrar
        publicidad. Podés aceptar todas, rechazar las no esenciales o elegir tus preferencias. Más información en
        nuestra <a href="/politica-de-privacidad">Política de privacidad</a>.
      </p>

      {showPrefs && (
        <div className="cookie-consent-prefs">
          <label>
            <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
            Analítica (Google Analytics) — medición agregada de audiencia.
          </label>
          <label>
            <input type="checkbox" checked={ads} onChange={(event) => setAds(event.target.checked)} />
            Publicidad (Google AdSense) — anuncios y, si lo permitís, personalización.
          </label>
        </div>
      )}

      <div className="cookie-consent-actions">
        <button type="button" className="cookie-accept-all" onClick={() => save({ analytics: true, ads: true })}>
          Aceptar todas
        </button>
        <button type="button" onClick={() => save({ analytics: false, ads: false })}>
          Rechazar no esenciales
        </button>
        {showPrefs ? (
          <button type="button" onClick={() => save({ analytics, ads })}>
            Guardar preferencias
          </button>
        ) : (
          <button type="button" onClick={() => setShowPrefs(true)}>
            Personalizar
          </button>
        )}
      </div>
    </div>
  );
}
