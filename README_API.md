# API La Voz Riojana

Base URL producción:

```text
https://lavozriojana.com
```

Los endpoints privados requieren:

```http
x-api-key: TU_PRIVATE_API_KEY
```

Las respuestas JSON usan:

```json
{ "ok": true, "data": {} }
```

o:

```json
{ "ok": false, "error": { "message": "..." } }
```

## Público

### Listar posts publicados

```bash
curl "https://lavozriojana.com/api/public/posts?page=1&perPage=12"
```

Filtrar por categoría:

```bash
curl "https://lavozriojana.com/api/public/posts?category=politica"
```

### Obtener post por slug

```bash
curl "https://lavozriojana.com/api/public/posts/titulo-de-la-noticia"
```

### Listar categorías

```bash
curl "https://lavozriojana.com/api/public/categories"
```

### Enviar comentario

Los comentarios quedan `pending` hasta aprobación.

```bash
curl -X POST "https://lavozriojana.com/api/comments" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": 1,
    "authorName": "Juan",
    "body": "Comentario sin HTML ni links.",
    "website": ""
  }'
```

### Guardar teléfono para WhatsApp futuro

```bash
curl -X POST "https://lavozriojana.com/api/phone-leads" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María",
    "phone": "+54 9 380 0000000",
    "consent": true,
    "source": "home",
    "website": ""
  }'
```

## Posts privados

### Crear noticia

```bash
curl -X POST "https://lavozriojana.com/api/private/posts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{
    "title": "El título completo de la noticia",
    "excerpt": "Bajada o resumen claro para portada, SEO y redes.",
    "contentHtml": "<p class=\"lr-lead\">Primer párrafo destacado.</p><div class=\"lr-key-points\"><strong>Claves</strong><ul><li>Punto uno</li><li>Punto dos</li></ul></div><h2>Subtítulo</h2><p>Contenido de la noticia.</p>",
    "categorySlug": "politica",
    "authorName": "Redacción La Voz Riojana",
    "sourceName": "Fuente opcional",
    "sourceUrl": "https://example.com",
    "sources": [
      { "name": "Ministerio de Gobierno de La Rioja", "url": "https://example.gob.ar/comunicado", "type": "ORGANISMO_PUBLICO" },
      { "name": "Télam", "url": "https://example.com/nota", "type": "MEDIO" }
    ],
    "tags": ["La Rioja", "Gobierno"],
    "video": {
      "url": "https://media.lavozriojana.com/noticias/videos/video.mp4",
      "poster": "https://media.lavozriojana.com/noticias/imagen.webp"
    },
    "mainImage": {
      "url": "https://media.lavozriojana.com/noticias/imagen.webp",
      "width": 1200,
      "height": 675,
      "alt": "Descripción de la imagen",
      "caption": "Epígrafe opcional",
      "credit": "Crédito"
    },
    "status": "published",
    "publishedAt": "2026-06-29T12:00:00.000Z",
    "seoTitle": "Título SEO",
    "seoDescription": "Descripción SEO.",
    "ogTitle": "Título OG",
    "ogDescription": "Descripción OG.",
    "ogImageUrl": "https://media.lavozriojana.com/noticias/imagen-og.webp",
    "isFeatured": true,
    "isBreaking": false,
    "editorialPriority": 100,
    "metadata": {
      "externalId": "auto-123"
    }
  }'
```

El slug se genera automáticamente desde el título si no se envía.

`video` es opcional. Si se envía, el video se sube previamente a R2 (mismo bucket que las imágenes, por ejemplo bajo `noticias/videos/`) y solo se manda la URL pública resultante; también se aceptan los campos planos `videoUrl` / `videoPoster` en vez del objeto `video`. Sin este campo, la noticia se publica normalmente sin reproductor.

`sources` es un array opcional (máx. 10) que reemplaza en la nota la sección "Fuentes consultadas" mostrada al pie del artículo. Cada elemento admite:

- `name` (obligatorio)
- `url` (opcional; si se omite se muestra el nombre sin enlace)
- `type`: uno de `OFICIAL`, `ORGANISMO_PUBLICO`, `MEDIO`, `COMUNICADO`, `ENTREVISTA`, `DOCUMENTO`, `REDES_SOCIALES`, `ELABORACION_PROPIA` (default `MEDIO`)

`sourceName` / `sourceUrl` (campos planos, un solo valor) se mantienen por compatibilidad: si no se envía `sources`, se siguen guardando igual que antes y se muestran como fuente única si tampoco hay `sources` cargado.

### Cajas de contenido editorial en `contentHtml`

Además de `lr-lead`, `lr-key-points`, `lr-fact-box`, `lr-related-box`, `lr-source` y `lr-highlight` (ya soportados), `contentHtml` acepta estas clases para agregar valor editorial dentro de la nota (Fase 5 de la auditoría SEO/E-E-A-T):

```html
<div class="lr-context"><strong>Contexto</strong><p>Texto de contexto adicional.</p></div>
<div class="lr-local-impact"><strong>Impacto en La Rioja</strong><p>Cómo afecta esto a la provincia.</p></div>
<div class="lr-update"><strong>Actualización</strong><p>Qué cambió respecto a la publicación original.</p></div>
```

Cualquier clase con prefijo `lr-` pasa el sanitizador (`lib/sanitize.ts`); estas tres ya tienen estilo visual propio en `app/globals.css`.

### Autores: perfil E-E-A-T

`POST /api/private/authors` y `PATCH /api/private/authors/:id` aceptan ahora, además de `name`/`slug`/`bio`/`avatarUrl`/`isActive`:

```json
{
  "role": "Editor de Política",
  "specialty": "Política provincial",
  "email": "nombre@lavozriojana.com",
  "socialLinks": [{ "platform": "twitter", "url": "https://twitter.com/usuario" }],
  "isInstitutional": false
}
```

`isInstitutional` (default `true`) determina si el autor se marca como firma institucional ("Redacción ...", @type Organization en JSON-LD) o como persona física identificada (@type Person). Cada autor tiene un perfil público en `/autores/[slug]`.

### Listar noticias privadas

```bash
curl "https://lavozriojana.com/api/private/posts?page=1&perPage=20" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Filtrar por estado:

```bash
curl "https://lavozriojana.com/api/private/posts?status=published" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

### Obtener noticia privada por ID

```bash
curl "https://lavozriojana.com/api/private/posts/1" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

### Editar noticia

```bash
curl -X PATCH "https://lavozriojana.com/api/private/posts/1" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{
    "title": "Título corregido",
    "isFeatured": false,
    "status": "published"
  }'
```

Si cambia el slug, se crea un redirect interno desde el slug anterior.

### Archivar noticia

```bash
curl -X DELETE "https://lavozriojana.com/api/private/posts/1" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Eliminar físicamente:

```bash
curl -X DELETE "https://lavozriojana.com/api/private/posts/1?hard=true" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

## Categorías

```bash
curl "https://lavozriojana.com/api/private/categories" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

```bash
curl -X POST "https://lavozriojana.com/api/private/categories" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{
    "name": "Tecnología",
    "description": "Noticias de tecnología.",
    "isActive": true
  }'
```

```bash
curl -X PATCH "https://lavozriojana.com/api/private/categories/1" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{ "description": "Nueva descripción" }'
```

## Autores

```bash
curl "https://lavozriojana.com/api/private/authors" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

```bash
curl -X POST "https://lavozriojana.com/api/private/authors" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{
    "name": "Redacción La Voz Riojana",
    "bio": "Equipo de redacción."
  }'
```

## Banners

Slots disponibles:

```text
HOME_TOP
HOME_MIDDLE
SIDEBAR
ARTICLE_INLINE
ARTICLE_AFTER_CONTENT
FOOTER
CATEGORY_TOP
SEARCH_TOP
```

Crear banner:

```bash
curl -X POST "https://lavozriojana.com/api/private/banners" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{
    "name": "Banner comercio local portada",
    "slot": "HOME_TOP",
    "imageUrl": "https://media.lavozriojana.com/banners/banner-home.webp",
    "linkUrl": "https://anunciante.com",
    "altText": "Anunciante local",
    "isActive": true,
    "priority": 100
  }'
```

Editar banner:

```bash
curl -X PATCH "https://lavozriojana.com/api/private/banners/1" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{ "isActive": false }'
```

Listar banners:

```bash
curl "https://lavozriojana.com/api/private/banners?slot=HOME_TOP" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Si un slot no tiene banner activo con `imageUrl`, no ocupa espacio visual.

## Comentarios privados

Listar pendientes:

```bash
curl "https://lavozriojana.com/api/private/comments?status=pending" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Aprobar:

```bash
curl -X PATCH "https://lavozriojana.com/api/private/comments/1" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{ "status": "approved" }'
```

Rechazar:

```bash
curl -X PATCH "https://lavozriojana.com/api/private/comments/1" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{ "status": "rejected" }'
```

Eliminar:

```bash
curl -X DELETE "https://lavozriojana.com/api/private/comments/1" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

## Estadísticas

Resumen:

```bash
curl "https://lavozriojana.com/api/private/stats" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Ranking de posts:

```bash
curl "https://lavozriojana.com/api/private/stats/posts?page=1&perPage=20" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Detalle por post:

```bash
curl "https://lavozriojana.com/api/private/stats/posts?id=1" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

## Teléfonos

Listar:

```bash
curl "https://lavozriojana.com/api/private/phone-leads" \
  -H "x-api-key: $PRIVATE_API_KEY"
```

Exportar CSV:

```bash
curl "https://lavozriojana.com/api/private/phone-leads?format=csv" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -o phone-leads.csv
```

Marcar inactivo:

```bash
curl -X PATCH "https://lavozriojana.com/api/private/phone-leads/1" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PRIVATE_API_KEY" \
  -d '{ "status": "inactive" }'
```

## HTML permitido en noticias

El contenido se sanitiza. Etiquetas soportadas:

```text
h2, h3, h4, p, strong, b, em, i, blockquote, ul, ol, li, a, img, figure, figcaption, div, span, br, hr
```

Clases editoriales recomendadas:

```text
lr-article
lr-lead
lr-subtitle
lr-section-title
lr-source
lr-key-points
lr-fact-box
lr-quote
lr-highlight
lr-related-box
```
