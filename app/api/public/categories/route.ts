import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { jsonOk } from '@/lib/http';
import { sortCategories } from '@/lib/posts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!isDatabaseConfigured()) return jsonOk({ items: [] });

  const categories = await prisma.category
    .findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    .catch(() => []);

  return jsonOk({ items: sortCategories(categories) });
}
