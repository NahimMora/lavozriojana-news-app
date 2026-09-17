# La Voz Riojana (web) — contexto para Claude

Medio digital para `https://lavozriojana.com`: Next.js App Router,
TypeScript, Prisma sobre **MySQL**, Tailwind. Ver `README.md` para stack e
instalación completos, `README_API.md` para la API pública/privada, y
`README_DEPLOY_HOSTINGER.md` para el flujo de deploy.

## Cómo encaja en el sistema completo

Este repo es el **sitio destino**: recibe noticias vía la API privada
(`x-api-key`, ver `README_API.md`) desde el autopublicador externo
(`news-auto-publisher-lavozriojana`), que scrapea, reescribe y publica acá y
en redes. Este repo nunca scrapea ni publica en Facebook/Instagram — solo
sirve el sitio, la API y el admin lite.

- Imágenes: el autopublicador sube a Cloudflare R2 y manda `mainImage.url`
  ya pública (`media.lavozriojana.com`). Este repo no procesa imágenes,
  salvo lo que ya prepara `lib/r2.ts` para uploads internos futuros.
- Autor: desde 2026-09, todas las notas nuevas se firman
  `Fernando Nahim Mora` (ver "Política de firma de autor" en `README_API.md`)
  — no reintroducir el esquema viejo de autor institucional por sección.

## Build y deploy — leer antes de tocar el flujo de CI/deploy

**Regla dura, motivada por un incidente real** (`README_INCIDENTE_2026-09-13_HOME_VACIA.md`):
el deploy real en Hostinger es auto-deploy por Git (`hbuilds/`) y corre
siempre `npm install && npm run build` sin campo de build command
configurable. Por eso `package.json` → `"build"` ya incluye
`prisma migrate deploy && prisma generate && next build`. **No quitar
`prisma migrate deploy` de ese script** — si una migración nueva no se
aplica en el build, el sitio sirve "sin noticias" en vez de fallar
ruidosamente (la app tiene fallback silencioso a lista vacía ante errores
de conexión a la base, lo cual fue precisamente lo que ocultó el incidente).

También por ese incidente: `DATABASE_URL` en producción debe usar el
**socket Unix de MySQL** (`mysql://user:pass@localhost/db?socket=/var/lib/mysql/mysql.sock`),
no `127.0.0.1:3306` — Hostinger permite TCP desde una shell SSH interactiva
pero no siempre desde el proceso Node del build/runtime.

## Comandos

```bash
npm run typecheck && npm run lint && npm run build
npm run prisma:migrate    # nueva migración en desarrollo
npm run prisma:deploy     # aplicar migraciones (obligatorio tras cada migración nueva antes de que el sitio ande bien)
```

Los scripts `institutional:upsert` y `team:upsert` son upsert, no
destructivos — se pueden correr las veces que haga falta. `content-audit`
es de solo lectura.

## Segundo Cerebro (gestión de conocimiento)

Este repo está trackeado por el "Segundo Cerebro" personal (app aparte,
`AutoPublicadores/2doCerebro`) bajo el proyecto **LVR** (La Voz Riojana),
módulo **Web**.

- **Documentación**: `README.md`, `README_API.md`,
  `README_DEPLOY_HOSTINGER.md`, `README_INCIDENTE_*.md` y este archivo se
  sincronizan de **solo lectura** hacia el Segundo Cerebro.
- **Bug real que queda pendiente**: si no hay ya un archivo de incidente
  como `README_INCIDENTE_*.md` para documentarlo, agregalo como captura en
  el Segundo Cerebro (tipo `BUG` o `INCIDENT` según corresponda) en vez de
  dejarlo sin registrar.
- **IDs**: si un ítem del Segundo Cerebro ya existe para lo que estás
  resolviendo (formato `LVR-BUG-0007`), referencialo en el commit:
  `fix: ... [LVR-BUG-0007]`.
