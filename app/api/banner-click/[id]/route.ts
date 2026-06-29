import { NextResponse } from 'next/server';
import { absoluteUrl } from '@/lib/site';
import { parseNumericId } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Context = { params: { id: string } };

export async function GET(request: Request, { params }: Context) {
  const id = parseNumericId(params.id);
  const fallback = absoluteUrl('/');
  if (!id) return NextResponse.redirect(fallback);

  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner?.linkUrl) return NextResponse.redirect(fallback);

  await prisma.banner.update({
    where: { id },
    data: { clickCount: { increment: 1 } }
  });

  const requestedTarget = new URL(request.url).searchParams.get('to');
  const target = requestedTarget && requestedTarget === banner.linkUrl ? requestedTarget : banner.linkUrl;
  return NextResponse.redirect(target);
}
