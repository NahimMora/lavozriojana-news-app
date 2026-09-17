export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date(date));
}

/** Fecha corta ("16 sept 2026") para espacios angostos como StoryTimeline,
 * donde la fecha larga desborda su columna y se superpone al título. */
export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date(date));
}

/** Fecha completa con día de semana, para la barra utilitaria del header. */
export function formatTodayLabel(date: Date = new Date()) {
  const formatted = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date(date));
}

export function formatTime(date: Date | string | null | undefined) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date(date));
}

export function estimateReadingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 210));
}
