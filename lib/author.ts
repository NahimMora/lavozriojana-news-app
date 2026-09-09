const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'website'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type SocialLink = { platform: SocialPlatform; url: string };

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is SocialLink => {
    if (!item || typeof item !== 'object') return false;
    const platform = (item as Record<string, unknown>).platform;
    const url = (item as Record<string, unknown>).url;
    return typeof url === 'string' && SOCIAL_PLATFORMS.includes(platform as SocialPlatform);
  });
}

export function authorInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function authorProfileUrl(slug: string) {
  return `/autores/${slug}`;
}
