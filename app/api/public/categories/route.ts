import { prisma } from '@/lib/prisma';
import { jsonOk } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return jsonOk({ items: categories });
}
