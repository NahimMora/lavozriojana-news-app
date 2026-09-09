import type { Author } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { authorInitials, authorProfileUrl, parseSocialLinks } from '@/lib/author';

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  website: 'Sitio web'
};

export function AuthorBox({ author }: { author: Author }) {
  const socialLinks = parseSocialLinks(author.socialLinks);
  const profileUrl = authorProfileUrl(author.slug);

  return (
    <aside className="author-box" aria-label="Sobre quién firma esta nota">
      <Link href={profileUrl} className="author-box-avatar" aria-hidden={!!author.avatarUrl}>
        {author.avatarUrl ? (
          <Image src={author.avatarUrl} alt="" width={56} height={56} sizes="56px" />
        ) : (
          <span className="author-box-initials">{authorInitials(author.name)}</span>
        )}
      </Link>
      <div className="author-box-body">
        <p className="author-box-kicker">{author.isInstitutional ? 'Firma institucional' : 'Autor/a'}</p>
        <Link href={profileUrl} className="author-box-name">
          {author.name}
        </Link>
        {author.role && <p className="author-box-role">{author.role}</p>}
        {author.bio && <p className="author-box-bio">{author.bio}</p>}
        <div className="author-box-links">
          <Link href={profileUrl}>Ver perfil y notas de {author.name}</Link>
          {author.email && <a href={`mailto:${author.email}`}>Contactar</a>}
          {socialLinks.map((link) => (
            <a href={link.url} key={link.platform} target="_blank" rel="noopener noreferrer">
              {SOCIAL_LABELS[link.platform] || link.platform}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
