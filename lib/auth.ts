import crypto from 'node:crypto';
import { jsonError } from '@/lib/http';

export function isValidApiKey(request: Request) {
  const expected = process.env.PRIVATE_API_KEY;
  const actual = request.headers.get('x-api-key') || '';

  if (!expected || !actual) return false;

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function requireApiKey(request: Request) {
  if (isValidApiKey(request)) return null;
  return jsonError('API key inválida o ausente.', 401);
}
