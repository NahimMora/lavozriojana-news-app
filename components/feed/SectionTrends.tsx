import Link from 'next/link';
import type { TrendingStory } from '@/lib/feed';

/**
 * A section's stories with the most Instagram reach over the last 7 days.
 * It sits next to "Más leídas" (visits to the site), so its title and note
 * name the source and the period.
 */
export function SectionTrends({ stories, sectionName }: { stories: TrendingStory[]; sectionName: string }) {
  if (!stories.length) return null;
  return (
    <section className="trending trending-section" aria-labelledby="section-trends-title">
      <h2 className="section-title blue" id="section-trends-title">
        Tendencias en Instagram
      </h2>
      <p className="trending-note">
        {sectionName}, últimos 7 días, según el alcance de nuestras publicaciones en Instagram.
      </p>
      <ol className="trending-list">
        {stories.map((story, index) => (
          <li key={story.slug}>
            <span className="trending-rank" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <Link className="trending-title" href={story.path}>
                {story.title}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
