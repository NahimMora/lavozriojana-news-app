import Image from 'next/image';
import Link from 'next/link';
import { INITIAL_CATEGORIES, SITE_NAME, SITE_SLOGAN } from '@/lib/site';
import { getCategoriesSafe } from '@/lib/posts';
import { slugify } from '@/lib/slug';
import { BannerAd } from '@/components/news/BannerAd';

export async function Footer() {
  const dbCategories = await getCategoriesSafe();
  const categories =
    dbCategories.length > 0
      ? dbCategories.map((category) => ({ name: category.name, slug: category.slug }))
      : INITIAL_CATEGORIES.map((name) => ({ name, slug: slugify(name, 'categoria') }));

  return (
    <footer className="site-footer">
      <div className="container">
        <BannerAd slot="FOOTER" />
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" aria-label="Inicio de La Voz Riojana">
              <Image src="/brand-logo.svg" alt="La Voz Riojana" width={52} height={52} className="brand-mark" />
              <span>
                <strong className="brand-name" style={{ color: '#fff' }}>
                  {SITE_NAME}
                </strong>
                <span className="brand-slogan" style={{ color: 'rgba(255,255,255,.75)' }}>
                  {SITE_SLOGAN}
                </span>
              </span>
            </Link>
          </div>
          <div>
            <h3>Categorias</h3>
            <div className="footer-links">
              {categories.slice(0, 10).map((category) => (
                <Link href={`/categoria/${category.slug}`} key={category.slug}>
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3>Institucional</h3>
            <div className="footer-links">
              <Link href="/quienes-somos">Quienes somos</Link>
              <Link href="/contacto">Contacto</Link>
              <Link href="/publicidad">Publicidad</Link>
              <Link href="/politica-de-privacidad">Politica de privacidad</Link>
              <Link href="/terminos-y-condiciones">Terminos y condiciones</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          Copyright {new Date().getFullYear()} La Voz Riojana. Todos los derechos reservados. lavozriojana.com
        </div>
      </div>
    </footer>
  );
}
