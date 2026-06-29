import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

function getR2Endpoint() {
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT;
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  return undefined;
}

export function getR2Client() {
  const endpoint = getR2Endpoint();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Credenciales R2 incompletas.');
  }

  return new S3Client({
    endpoint,
    region: process.env.R2_REGION || 'auto',
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

export async function uploadBufferToR2(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}) {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || 'https://media.lavozriojana.com').replace(/\/+$/, '');

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME no está configurado.');
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl || 'public, max-age=31536000, immutable'
    })
  );

  return `${publicBaseUrl}/${input.key.replace(/^\/+/, '')}`;
}
