import { Suspense } from 'react';
import { getActiveAlerts } from '@/lib/feed';
import { formatAge, formatUpdated, formatZones, HOUR } from '@/lib/feed-select';
import { SiteNoticesClient, type NoticeAlert } from './SiteNoticesClient';

/**
 * Weather alert at the top of the home page only (the urgent story travels
 * in the ticker). /servicios lists every alert in full. Rendered apart from
 * the page content so a slow feed never holds the news.
 */
export function SiteNotices() {
  return (
    <Suspense fallback={null}>
      <SiteNoticesData />
    </Suspense>
  );
}

async function SiteNoticesData() {
  const now = new Date();
  const alerts = await getActiveAlerts(now);
  if (!alerts.length) return null;

  const notices: NoticeAlert[] = alerts.map((alert) => ({
    key: alert.key,
    level: alert.level,
    label: alert.label,
    cause: alert.cause,
    zones: formatZones(alert.zones),
    allZones: alert.zones.join(', '),
    until: alert.until,
    description: alert.description,
    source: alert.source,
    sourceShort: alert.sourceShort,
    updated: `${formatUpdated(alert.updated, now)}${now.getTime() - Date.parse(alert.updated) > 3 * HOUR ? ` (${formatAge(alert.updated, now)})` : ''}`,
    hideAt: alert.hideAt
  }));

  return <SiteNoticesClient alerts={notices} />;
}
