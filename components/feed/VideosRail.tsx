import type { VideoCardData } from '@/lib/feed';
import { VideoCard } from './VideoCard';

/** A row (or grid, with className) of light video cards. */
export function VideosRail({ videos, className = '' }: { videos: VideoCardData[]; className?: string }) {
  return (
    <ul className={`videos-rail ${className}`.trim()}>
      {videos.map((video) => (
        <li key={video.key}>
          <VideoCard video={video} />
        </li>
      ))}
    </ul>
  );
}
