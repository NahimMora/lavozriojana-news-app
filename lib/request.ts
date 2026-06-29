import crypto from 'node:crypto';

export function getRequestIp(headers: Headers) {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function hashValue(value: string) {
  const salt = process.env.ANALYTICS_SALT || process.env.PRIVATE_API_KEY || 'la-voz-riojana';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function isLikelyBot(userAgent: string) {
  return /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|whatsapp|telegrambot|discordbot/i.test(
    userAgent
  );
}
