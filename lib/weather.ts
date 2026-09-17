/* La Rioja capital, Argentina */
const LAT = -29.4131;
const LON = -66.8558;

export async function getLaRiojaTemperature(): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m&timezone=America%2FArgentina%2FLa_Rioja`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.current?.temperature_2m;
    return typeof temp === 'number' ? Math.round(temp) : null;
  } catch {
    return null;
  }
}
