/* La Rioja capital, Argentina */
const LAT = -29.4131;
const LON = -66.8558;

/**
 * Open-Meteo, the fallback when the services feed has no recent observation
 * (lib/feed.ts → getCurrentWeather). `observed` is the model time Open-Meteo
 * reports for the value, never the time of our request.
 */
export async function getLaRiojaWeather(): Promise<{ temperature: number; observed: string | null } | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m&timezone=America%2FArgentina%2FLa_Rioja&timeformat=unixtime`;
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.current?.temperature_2m;
    if (typeof temp !== 'number' || !Number.isFinite(temp)) return null;
    const time = data?.current?.time;
    return {
      temperature: Math.round(temp),
      observed: typeof time === 'number' && Number.isFinite(time) ? new Date(time * 1000).toISOString() : null
    };
  } catch {
    return null;
  }
}
