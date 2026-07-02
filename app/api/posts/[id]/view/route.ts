import { NextResponse } from 'next/server';
import { recordPostView } from '@/lib/analytics';
import { parseNumericId } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: { id: string } };

export async function POST(request: Request, { params }: Context) {
  const id = parseNumericId(params.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: { message: 'ID invalido.' } }, { status: 400 });
  }

  await recordPostView(id, request.headers).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
