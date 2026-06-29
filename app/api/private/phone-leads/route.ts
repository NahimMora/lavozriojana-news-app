import { LeadStatus } from '@prisma/client';
import { requireApiKey } from '@/lib/auth';
import { getPagination, jsonOk } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get('format');
  const status = searchParams.get('status')?.toUpperCase() as LeadStatus | undefined;
  const where = status && Object.values(LeadStatus).includes(status) ? { status } : {};

  if (format === 'csv') {
    const items = await prisma.phoneLead.findMany({ where, orderBy: { createdAt: 'desc' } });
    const csv = [
      'id,name,phone,consent,source,status,createdAt',
      ...items.map((item) =>
        [
          item.id,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${item.phone.replace(/"/g, '""')}"`,
          item.consent,
          `"${(item.source || '').replace(/"/g, '""')}"`,
          item.status,
          item.createdAt.toISOString()
        ].join(',')
      )
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="phone-leads.csv"'
      }
    });
  }

  const { page, perPage, skip } = getPagination(request.url, { page: 1, perPage: 50 });
  const [items, total] = await Promise.all([
    prisma.phoneLead.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: perPage }),
    prisma.phoneLead.count({ where })
  ]);

  return jsonOk({ items, pagination: { page, perPage, total } });
}
