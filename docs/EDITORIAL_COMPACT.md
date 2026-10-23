# Ajustes de densidad editorial

23 de octubre de 2026. Rama de trabajo: `design/compact-editorial`, base `29f5dd7`.

Correcciones posteriores al rediseño inicial, solicitadas para PC y móvil. La publicación fue autorizada previamente por el usuario.

## Cambios

- Ahora ocupa 288 px en escritorio y 240 px en móvil, con filas breves.
- Los títulos importados en mayúsculas se presentan en formato oración. Se recuperan nombres y siglas desde la bajada y un vocabulario local. Es una conversión de presentación heurística: nombres desconocidos ausentes de la bajada pueden necesitar una excepción. No cambia textos almacenados, metadatos ni HTML del artículo.
- Las tarjetas de cada formato tienen alturas e imágenes uniformes. Los títulos largos usan puntos suspensivos; el texto completo sigue en el enlace y en la noticia.
- Titulares del día, más leídas, destacados y secciones reducen alturas, márgenes y tamaños. En foco usa titulares de una línea.
- La cabecera se contrae al bajar y vuelve a expandirse al regresar al inicio, sin alternar repetidamente por el cambio de altura.
- Último momento se desplaza continuamente, con pausa manual, al enfocar o al pasar el cursor. Respeta movimiento reducido.
- Las categorías muestran primero la noticia principal. Se conserva CATEGORY_TOP después de esa noticia y antes de la grilla. No cambia la selección editorial ni las consultas.

## Comparación con los mismos datos sintéticos

| Medida | Antes | Después |
| --- | ---: | ---: |
| Ahora, escritorio 1440 | 911 px | 288 px |
| Ahora, móvil 390 | 911 px | 240 px |
| Primera imagen de portada, 1440 | y=564 | y=193 |
| Primera imagen de portada, 390 | y=532 | y=137 |
| Primera imagen de categoría, 1440 | y=875 | y=277 |
| Primera imagen de categoría, 390 | y=753 | y=202 |
| Cabecera escritorio | 146 px | 88 px al bajar |
| Cabecera móvil | 92 px | 47 px al bajar |

[Galería comparativa](qa/compact/index.html). Las fotografías y noticias son datos de prueba, no publicaciones reales. Los banners productivos pueden tener otras dimensiones.

## Validación

- Playwright real: portada, categoría y artículo a 360, 390, 768, 1024 y 1440 px; 15 casos HTTP 200, sin desbordamiento horizontal ni errores JavaScript en el entorno aislado.
- Grillas con alturas e imágenes alineadas, sin fechas superpuestas; En foco en una línea; cabecera contraída y restaurada.
- Ticker animado, pausa y movimiento reducido; menú y buscador móvil operativos.
- `npm run typecheck`, `npm run lint`, cuatro pruebas de titulares y `git diff --check`: correctos.
- Build optimizado mediante `node scripts/editorial-preview.mjs 3122 --build`: correcto, con fixtures en carpeta temporal y sin credenciales productivas. No se ejecutó el script de migraciones localmente. Windows informa una advertencia de symlink standalone EPERM, documentada previamente.
- Sin modificaciones del esquema, consultas, sanitización, selección de noticias, dependencias ni script de build.

La revisión usa `web-design-guidelines`; se mantienen los criterios editoriales y React del rediseño anterior. La CSP productiva que bloquea videos R2, detectada previamente, sigue pendiente fuera de este ajuste visual.

Para reproducir: `node scripts/editorial-preview.mjs 3121` y ejecutar `scripts/compact-visual-qa.js` con el navegador Playwright conectado. La aplicación de prueba no usa la base productiva.
