import { Suspense } from 'react';
import { getActiveAlerts, getUrgentStory } from '@/lib/feed';
import { formatAge, formatUpdated, formatZones, HOUR } from '@/lib/feed-select';
import { SiteNoticesClient, type NoticeAlert } from './SiteNoticesClient';

/**
 * Site-wide notices under the header: an active weather alert and, outside
 * the home page (where the ticker carries it), the feed's urgent story.
 * Rendered apart from the page content so a slow feed never holds the news.
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
  const [alerts, urgent] = await Promise.all([getActiveAlerts(now), getUrgentStory()]);
  if (!alerts.length && !urgent) return null;

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

  return <SiteNoticesClient alerts={notices} urgent={urgent} />;
}
