# La Voz Riojana

Medio digital profesional para `https://lavozriojana.com`, construido con Next.js App Router, TypeScript, Prisma, MySQL y Tailwind CSS.

Dominio canónico: `https://lavozriojana.com`  
Dominio de medios: `https://media.lavozriojana.com`  
Eslogan: `La Rioja habla, La Voz Riojana comunica.`

## Stack

- Next.js App Router con render dinámico en Node.js.
- TypeScript estricto.
- MySQL mediante Prisma ORM.
- Tailwind CSS + CSS editorial propio.
- API privada protegida por `x-api-key`.
- Sanitización de HTML periodístico con `sanitize-html`.
- Banners manuales, comentarios moderados, buscador, estadísticas internas y leads de WhatsApp.
- Preparado para Cloudflare R2 con endpoint S3-compatible.

## Instalación local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

En Windows PowerShell, si `npx` está bloqueado por execution policy, usá `npx.cmd`.

## Variables de entorno

Ver `.env.example`.

Obligatorias para producción:

```env
NEXT_PUBLIC_SITE_URL=https://lavozriojana.com
NEXT_PUBLIC_MEDIA_URL=https://media.lavozriojana.com
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
PRIVATE_API_KEY="clave-larga-y-secreta"
ANALYTICS_SALT="otro-secreto-largo"
ALLOWED_API_ORIGINS="https://lavozriojana.com"
```

R2:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=https://media.lavozriojana.com
R2_ENDPOINT=
R2_REGION=auto
```

## Base de datos MySQL

1. Crear una base MySQL en Hostinger hPanel.
2. Copiar host, usuario, contraseña, puerto y base.
3. Armar `DATABASE_URL`:

```env
DATABASE_URL="mysql://usuario:password@host:3306/base"
```

4. Ejecutar migraciones:

```bash
npm run prisma:deploy
```

5. Cargar datos iniciales:

```bash
npm run prisma:seed
```

El seed crea las 10 categorías iniciales, el autor `Redacción La Voz Riojana`, páginas institucionales y posts demo claramente marcados como demo.

## Desarrollo

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Build

```bash
npm run typecheck
npm run lint
npm run build
```

## Producción

```bash
npm run prisma:deploy
npm run build
npm run start
```

El proyecto usa `output: 'standalone'` en `next.config.mjs`, compatible con despliegues Node.js. En Hostinger podés usar `npm run start` como start command.

## Publicar una noticia por API

Ver ejemplos completos en `README_API.md`.

Ejemplo mínimo:

```bash
curl -X POST "https://lavozriojana.com/api/private/posts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{
    "title": "Título de la noticia",
    "excerpt": "Bajada clara y breve de la noticia para portada y SEO.",
    "contentHtml": "<p class=\"lr-lead\">Contenido principal.</p><h2>Subtítulo</h2><p>Texto de la nota.</p>",
    "categorySlug": "politica",
    "authorName": "Redacción La Voz Riojana",
    "tags": ["La Rioja"],
    "status": "published",
    "publishedAt": "2026-06-29T12:00:00.000Z"
  }'
```

## Imágenes y Cloudflare R2

El sitio consume URLs públicas, por ejemplo:

```text
https://media.lavozriojana.com/noticias/imagen.webp
```

El autopublicador externo debe subir la imagen a R2 y enviar `mainImage.url`, `width`, `height`, `alt`, `caption` y `credit` si los tiene.

La librería `lib/r2.ts` queda preparada para futuros uploads internos usando credenciales S3-compatible.

## Configurar `media.lavozriojana.com`

1. Crear bucket en Cloudflare R2.
2. Configurar dominio público/custom domain `media.lavozriojana.com`.
3. Apuntar DNS según indique Cloudflare.
4. Definir `R2_PUBLIC_BASE_URL=https://media.lavozriojana.com`.
5. Usar ese dominio para todas las imágenes enviadas por API.

## Admin Lite

Ruta:

```text
/admin-lite
```

No muestra datos sin una API key válida. Es una interfaz mínima para estadísticas, posts recientes y comentarios pendientes. La API privada sigue protegida por `x-api-key`.

## SEO

Incluye:

- Metadata global y dinámica por nota.
- Canonical sin `www`.
- Open Graph y Twitter Card.
- JSON-LD `NewsArticle`.
- Breadcrumbs.
- `robots.txt`.
- `sitemap.xml` (incluye posts, categorías y páginas estáticas).
- `sitemap-news.xml` (Google News, últimas 48h).
- Feeds RSS/Atom.

## Reinicio en Hostinger

Desde hPanel, reiniciar la Node.js Web App. Si tenés acceso SSH:

```bash
npm run prisma:deploy
npm run build
npm run start
```

En un despliegue conectado a GitHub, hacer push a la rama configurada y reiniciar/redeploy desde Hostinger si no está automatizado.
