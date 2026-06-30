export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'America/Argentina/La_Rioja'
  }).format(new Date(date));
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
