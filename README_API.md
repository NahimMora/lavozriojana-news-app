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
    "tags": ["La Rioja", "Gobierno"],
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
