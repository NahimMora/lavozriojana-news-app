# Fixtures de los feeds del AutoPublicador

Datos **ficticios** para pruebas y para la vista aislada. No son noticias, cotizaciones, alertas ni
pagos reales. Las URLs de notas apuntan a las notas sintéticas `noticia-de-prueba-N` del mock de
Prisma (`scripts/fixtures/editorial-prisma.ts`).

- `valid/`: un archivo por feed con el contrato de `docs/FEED_INTEGRATION.md`. Están fechados
  alrededor de `2026-10-23T16:30:00-03:00`, el "ahora" de `tests/feed.test.mjs`. Incluyen a
  propósito entradas que deben descartarse: URLs inválidas, duplicados, fechas pasadas o futuras,
  estados desconocidos y claves de historia `story:`.
- `valid/videos.json` incluye un post público real de @lavozriojana.ok
  (`https://www.instagram.com/p/De2pKcEjffC/`) para ver el reproductor real en la vista aislada. Su
  miniatura es una URL firmada de Instagram que vence a los pocos días: después se ve el panel neutro.
  Su `video` es una ruta ficticia del CDN de Instagram, con `video_vence`: la QA la responde con
  `scripts/fixtures/images/vertical.mp4` y, abierta a mano, falla y pasa al iframe del post real.
  Las demás entradas no traen `video`.
- `invalid/`: archivos completos que deben rechazarse (versión, JSON, fecha, campos).

`scripts/feed-preview-fixtures.mjs` copia `valid/` a la vista aislada desplazando todas las fechas al
momento de arranque, para que los vencimientos y "hoy" se comporten como en producción.
