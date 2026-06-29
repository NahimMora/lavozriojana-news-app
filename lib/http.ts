import { NextResponse } from 'next/server';

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        message,
        details
      }
    },
    { status }
  );
}

export function getPagination(url: string, defaults = { page: 1, perPage: 12 }) {
  const searchParams = new URL(url).searchParams;
  const page = Math.max(1, Number(searchParams.get('page') || defaults.page));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('perPage') || defaults.perPage)));

  return {
    page,
    perPage,
    skip: (page - 1) * perPage
  };
}

export function parseNumericId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
