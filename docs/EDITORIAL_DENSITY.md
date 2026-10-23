# Densidad editorial — segunda iteración

Fecha: 23 de octubre de 2026. Rama local: `design/editorial-density-v2`, base `d803824`. Sin commit, push, merge ni deploy.

Continúa [el rediseño editorial](EDITORIAL_REDESIGN.md). Un primer intento de compactación (`e0fe079`) se revirtió el mismo día. Esta versión no lo retoma: aquel achicaba la nota principal, recortaba *Ahora* a una línea a mitad de palabra y recuperaba nombres solo desde la bajada.

## Diagnóstico, por impacto

1. **Primer viewport sin noticias.** A 1440 px se veían 2 titulares, y a 390 px, 1. La causa era estructural: la foto principal medía 884 × 552 px debajo del titular. Había además una línea de edición de unos 60 px y la cabecera ocupaba 191 px (112 en móvil), sin cambiar de altura al bajar.
2. **Titulares en mayúsculas.** No los forzaba el CSS: venían así en el contenido. Los 80 titulares más recientes de la API pública estaban en mayúsculas; las bajadas y los cuerpos sí escriben bien los nombres.
3. **Ahora ocupaba 977 px.** Cada entrada repetía la categoría en su propia línea, con un titular de 1,08 rem y 24 px de relleno.
4. **Notas duplicadas.** *Titulares del día* repetía las 9 primeras notas de *Destacados*, porque *Destacados* no se marcaba como usado.
5. **Huecos por distribución, no por márgenes:**
   - *Destacados* (16 ítems) terminaba muy por debajo de la columna principal.
   - *En foco* combinaba una foto de unos 430 px con una lista corta.
   - "Últimas noticias" dejaba un hueco bajo las compactas.
   - Las filas de tarjetas tenían alturas desparejas (hasta 53 px de diferencia).
6. **Categorías.** La cabecera medía 227 px y los breadcrumbs, 55 aparte. La nota principal llevaba una foto de 940 × 588, así que la primera foto aparecía en y=875.
7. **Móvil.** Todo se apilaba como fotos a ancho completo: tres de unos 400 px por bloque de sección, y 16 destacados en vertical.
8. **Último momento.** Era una franja estática, con horas del tipo "03:00 p. m.".

## Criterios adoptados

- **Estructura primero.**
  - Desde 1200 px, la apertura tiene tres columnas: principal, una destacada más dos compactas, y *Ahora*.
  - De 768 a 1199 px, la principal ocupa el ancho con texto y foto lado a lado, y debajo van las secundarias junto a *Ahora*.
  - En móvil, apilado.
  - Las columnas conservan su alto natural y nada se estira para igualar. Cuando *Ahora* cubre dos filas, el excedente va a la fila inferior.
- **Jerarquía por composición.** La nota principal mantiene posición, el texto antes de la foto (estilo de la casa) y la mayor escala: 39,6 px a 1440, unas 1,9 veces la destacada.
- **Escala** (definida en `:root`, `globals.css`):

  | Nivel | Tamaño | Líneas máx. |
  | --- | --- | ---: |
  | Principal | 2,6 rem / 1,65 rem móvil | 4 |
  | Destacada | 1,34 rem | 3 |
  | Estándar | 1,16 rem / 1,04 rem | 3 |
  | Compacta | 1,02 rem | 3 |
  | Cable (*Ahora*) | 0,95 rem | 2 |
  | Etiquetas | 0,7 rem (mínimo 11,2 px) | — |

  Espacios: 4 · 8 · 12 · 16 · 24 · 32. Proporciones: principal 16:9 (16:10 en tres columnas), tarjetas 16:10, miniaturas 4:3.
- **Recorte de titulares.** Se hace con `line-clamp` sobre el enlace, para que el anillo de foco no se corte. El texto completo queda en el DOM y en el artículo.
- **Alturas.** Las tarjetas equivalentes comparten la altura de su fila y la firma se alinea abajo. Si una tarjeta mide menos de 250 px, una container query deja solo la fecha y evita que la firma se parta.
- **Categoría repetida.** Se oculta en las páginas de categoría y en los bloques de sección de la portada, donde todas las notas son de la misma.
- **Móvil.** Las notas secundarias se muestran como filas: miniatura 4:3 de 116 px, titular de 3 líneas y fecha. La primera nota de cada sección conserva su foto. *Destacados* pasa a ser una franja horizontal desplazable. *Ahora* muestra 5 entradas y un botón "Ver N más".

## Cambios

| Área | Escritorio | Móvil |
| --- | --- | --- |
| Cabecera | Fija sobre un espaciador de altura constante. Al bajar quedan la línea roja, la marca y la navegación (sin utilidades ni lema). | Al bajar quedan menú, marca y buscador; la fila de secciones vuelve arriba y sigue en el menú. |
| Último momento | Desplazamiento continuo con dos listas iguales (la copia lleva `aria-hidden` y `tabindex=-1`). Se pausa con hover, foco o botón. Con poco contenido queda fijo. Horas de 24 h o fecha corta. | Igual; con movimiento reducido queda quieto, sin copia ni botón. |
| Ahora | Hora y titular de 2 líneas, sin categoría. 565 px para 9 entradas. | 5 entradas y "Ver 4 más" (`aria-expanded`). |
| Últimas noticias | 1 destacada y 4 compactas de alturas similares, más una grilla de 3 × 3. Destacados con 14 ítems. | Filas. Destacados en franja horizontal. |
| Titulares del día | Textos de 3 líneas como máximo, con una regla por fila, sin espacio reservado para foto. | Una columna. |
| En foco | Nota horizontal (foto 4:3 y texto) junto a 4 titulares de 2 líneas, de alto similar. | Foto 16:10 y lista. |
| Bloques de sección | 4 notas por fila (3 junto al ranking); con 2 notas, un par horizontal. | La primera con foto y el resto en filas. |
| Categoría | Breadcrumb, nombre y descripción en una franja de unos 99 px; principal con foto 3:2 y texto al lado. `CATEGORY_TOP` sigue en su posición. | Franja de 126 px. |
| Titulares | Formato oración en tarjetas, listas, ticker, ranking, lateral del artículo, H1 y feed infinito. | — |

Archivos nuevos:
- `lib/headline.ts`
- `components/news/TickerPause.tsx`
- `components/news/AhoraMore.tsx`
- `scripts/headline.test.mjs`
- `scripts/density-visual-qa.mjs`
- `scripts/density-behavior-qa.mjs`

Archivos modificados:
- `app/globals.css`
- `app/page.tsx`
- `app/categoria/[slug]/page.tsx`
- `app/noticias/[slug]/page.tsx`
- `components/layout/Header.tsx`
- `components/layout/ScrollShrinkEffect.tsx`
- `components/news/PostCard.tsx`
- `components/news/BreakingNewsBar.tsx`
- `components/news/MostRead.tsx`
- `components/news/InfiniteArticleFeed.tsx`
- `lib/format.ts` (agrega `formatWireTime`)
- `scripts/fixtures/editorial-prisma.ts`: titulares ficticios en mayúsculas, solo en la vista aislada.

## Normalización de titulares

`formatHeadline(titulo, bajada, cuerpo)` solo actúa sobre títulos que vienen en mayúsculas; los títulos ya editados no se tocan. No modifica la base, la API, el autopublicador, los metadatos, el JSON-LD, los feeds ni el texto para compartir.

Toma la grafía de cada palabra de la propia nota (bajada y cuerpo). Para nombres que aparecen en el título y no en la nota, se apoya en:
- listas breves de lugares riojanos y siglas;
- mayúsculas intencionales del título original (EDELaR, RN38);
- un nombre de pila junto a un apellido comprobado;
- nombres de pila frecuentes.

Palabras como "Salud" o "Arte" van en mayúscula solo como parte de un nombre institucional ("Ministerio de Salud", "Escuela de Arte").

Sin el texto de la nota, si alguna palabra queda sin resolver, el titular se deja como llegó: puede ser un nombre.

Se probó con los 80 titulares reales más recientes (lectura de la API pública), comparados en [headlines.txt](qa/density/headlines.txt). Revisados uno a uno, quedan errores leves de mayúscula en términos que el cuerpo escribe como nombre propio: "un Congreso internacional", "las mujeres Rurales", "producción de Contenidos". No se encontraron nombres de personas o lugares pasados a minúscula. Pruebas unitarias: `node --test scripts/headline.test.mjs` (6 casos, incluidos La Rioja, Famatina, Aimogasta, UNLaR, DNI, EDELaR y nombres de instituciones).

## Medición antes / después

Hecha con la vista aislada y los mismos fixtures en ambos casos. Para la referencia se usó un worktree de `d803824` con los fixtures nuevos. La cabecera "al bajar" se mide con desplazamiento de 900 px. Los titulares cuentan cuando se ven completos en el primer viewport. Datos: [before](qa/density/before/results.json) y [after](qa/density/after/results.json).

| Página / ancho | Cabecera | Al bajar | 1.ª tarjeta (y) | 1.ª foto (y) | Titulares visibles | Ahora |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Portada 360 | 112 → 98 | 112 → 50 | 230 → 153 | 498 → 358 | 1 → 3 | 977 → 378 |
| Portada 390 | 112 → 98 | 112 → 50 | 230 → 153 | 498 → 329 | 1 → 3 | 955 → 378 |
| Portada 768 | 191 → 160 | 191 → 97 | 325 → 221 | 558 → 221 | 3 → 12 | 1452 → 565 |
| Portada 1024 | 191 → 160 | 191 → 97 | 325 → 221 | 535 → 221 | 2 → 12 | 1171 → 565 |
| Portada 1280 | 191 → 160 | 191 → 97 | 325 → 221 | 552 → 418 | 2 → 13 | 977 → 565 |
| Portada 1440 | 191 → 160 | 191 → 97 | 325 → 221 | 564 → 427 | 2 → 13 | 977 → 565 |
| Categoría 360 | 112 → 98 | 112 → 50 | 449 → 303 | 751 → 454 | 1 → 2 | — |
| Categoría 390 | 112 → 98 | 112 → 50 | 453 → 307 | 721 → 458 | 1 → 2 | — |
| Categoría 768 | 191 → 160 | 191 → 97 | 568 → 381 | 775 → 381 | 1 → 3 | — |
| Categoría 1024 | 191 → 160 | 191 → 97 | 612 → 417 | 822 → 417 | 1 → 4 | — |
| Categoría 1280 | 191 → 160 | 191 → 97 | 628 → 428 | 855 → 428 | 2 → 4 | — |
| Categoría 1440 | 191 → 160 | 191 → 97 | 636 → 429 | 875 → 429 | 2 → 5 | — |

Otras medidas:
- **Cabecera de categoría:** 195–227 → 87–99 px en escritorio y 205 → 126 en móvil.
- **Diferencia máxima de altura entre tarjetas de una misma fila:** hasta 53 → 0 px.
- **Bloques a 1440:** En foco 750 → 394 px; Titulares del día 396 → 297 px.
- **Bloques a 390:** Destacados 1995 → 239 px; apertura completa 2134 → 1211 px.
- **Tamaños a 1440:** titular principal 46,8 → 39,6 px; titulares de grilla 22,4 → 18,6 px; ninguna etiqueta queda por debajo de 11,2 px.
- **Desbordamiento horizontal:** ninguno, antes ni después.

## Pruebas

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Aprobado |
| `npm run lint` | Sin advertencias |
| `git diff --check` | Aprobado (solo los avisos habituales de LF/CRLF en Windows) |
| `node --test scripts/headline.test.mjs` | 6/6 |
| Compilación optimizada aislada (`node scripts/editorial-preview.mjs <puerto> --build`) | Código 0, 32 páginas. La portada pasa de 1,59 a 1,99 kB (pausa y "Ver más"); First Load sigue en 101 kB. Se repite el aviso `EPERM` de standalone en Windows ya documentado. |
| `scripts/density-behavior-qa.mjs` | 22/22 (ver abajo) |
| Matriz visual en 6 anchos × portada/categoría | HTTP 200 y sin desbordes |
| Artículo (texto y video), búsqueda y categoría paginada a 390 y 1440 | HTTP 200, un H1 visible bajo la cabecera, sin desbordes ni errores |
| Contenido escaso (`--sparse`), una sola nota (`--single`) y portada vacía (`--empty`) | Sin desbordes. Con una nota, la principal ocupa todo el ancho, con foto al lado, y el ticker queda fijo. |
| Consola e hidratación | Sin errores en todos los recorridos |

Las 22 comprobaciones de comportamiento:
- **Ticker:** se anima, oculta la copia a lectores y al teclado, se pausa con el botón y con hover, y se detiene al recibir foco dejando visible el enlace enfocado. Con movimiento reducido queda quieto.
- **Cabecera, a 390 y 1280:** se compacta sin mover el contenido, no oscila entre 60 y 90 px de desplazamiento y recupera su altura arriba. El buscador y el menú funcionan compactados.
- **Ahora en móvil:** 5 entradas visibles y despliegue del resto.
- **Titulares recortados:** foco visible con teclado.
- **Tarjetas a 390 y 1440:** misma altura por fila, sin superposiciones ni textos de menos de 11 px.

Revisión según `web-design-guidelines` (reglas obtenidas de su fuente oficial): pausa explícita para movimiento automático, `prefers-reduced-motion`, `transform` en el ticker, `scroll-padding` para que la cabecera fija no tape el foco, números tabulares en horas, `line-clamp` con `min-width: 0` y fechas con `Intl` generadas en el servidor. Revisión según `vercel-react-best-practices` (skill instalada en el proyecto):
- **`server-serialization`:** a los componentes cliente solo cruzan campos mínimos o primitivos. Los únicos componentes cliente nuevos son los dos botones.
- **`client-passive-event-listeners`:** el scroll usa un listener pasivo con `requestAnimationFrame`.
- **`rerender-move-effect-to-event`:** pausa y despliegue se manejan en eventos.
- **Costo en servidor:** la normalización corre en el servidor, salvo en el feed infinito, que ya era cliente. Se corrigió un costo cuadrático (copiaba el texto previo por cada palabra); con los cuerpos reales mide unos 12,5 ms cada 40 titulares en Node local, y la portada se regenera cada 60 s.

## Ajustes posteriores (23-10-2026)

Pedidos tras revisar la vista aislada. Medidos con los mismos fixtures; la vista `--no-ads` reproduce producción, que hoy no tiene anuncios activos.

| Pedido | Cambio | Medición |
|---|---|---|
| Categoría "cortada abajo" | La última fila de tarjetas tocaba el pie: `.category-body` suma `--section-pad` + 16 px abajo. | 0 → 48 px antes del pie (1440) |
| "Seguí informado" no acompaña la nota | En escritorio queda fijo bajo la cabecera compacta hasta el final del artículo (`position: sticky`). Va último en la columna, con 5 notas de dos líneas, para entrar en una ventana de 768 px. "Seguinos" y WhatsApp quedan en una fila compacta arriba. Sin sticky en ventanas de menos de 660 px de alto ni en móvil. | Bloque de 852 → 528 px; queda a 110 px del borde en 1440×900 y 1024×768 |
| Mejorar el pie | Marca a la izquierda y mapa del sitio en tres grupos; las secciones se listan juntas en columnas, en vez del corte "Secciones / Más". Iconos SVG para las redes, listas semánticas y foco blanco sobre el fondo oscuro. Se quitó X, que apuntaba a `twitter.com` sin cuenta. | 436 → 335 px (1440) |
| Titulares del día más chicos | 8 titulares de dos líneas, en 4 columnas desde 1200 px y 2 entre 640 y 1199. | 402 → 238 px (1440) |
| Publicidades cuadradas | Todas las piezas propias son 1:1, de hasta 320 px, con la etiqueta "Publicidad" visible. La pieza se muestra entera (`contain`), sin recortes. `CATEGORY_TOP` pasa a la columna derecha en escritorio (después de la nota principal en móvil). `HOME_MIDDLE` ocupa una celda de la grilla de "Últimas noticias", en lugar de una nota. Con el anuncio lateral activo, Destacados muestra 12 notas; sin él, 14. Así las columnas terminan parejas. | Diferencia entre columnas de la portada: −69 a +100 px, con y sin anuncios |

Los slots, la base y el conteo de impresiones no cambian: la portada consulta `HOME_MIDDLE` y `SIDEBAR` una sola vez y las pasa a `BannerSquare`. Sin anuncios activos, ningún espacio queda reservado. La suite de comportamiento suma cuatro pruebas: sticky en 1440×900 y en 1024×768, anuncios 1:1 y aire antes del pie. Pasa 26 de 26.

## Riesgos y pendientes

- **Datos.** No se probó contra MySQL ni con anuncios reales; los banners productivos pueden tener otras alturas. `CATEGORY_TOP` conserva su posición y su integración.
- **Navegadores.** Solo Chromium. Faltan pruebas en Safari/WebKit, Firefox y dispositivos físicos. El ticker usa unidades de contenedor (`cqw`) y las fichas, container queries, con soporte desde 2023; en navegadores más antiguos, la copia del ticker puede dejar un tramo vacío y la firma puede partirse.
- **Cabecera.** Ahora es `position: fixed` con un espaciador. Su alto depende de alturas de fila explícitas (`--hdr-*`): si se agregan filas o elementos, hay que ajustar esos tokens. Anima `height` y `font-size` durante 200 ms dentro de la cabecera, un subárbol fuera del flujo, para conseguir una transición suave.
- **Titulares.** La conversión es heurística, con errores leves de mayúsculas de más en términos que el cuerpo trata como nombres de programas o eventos. Un nombre ausente de la nota y de las listas puede quedar en minúscula si la nota trae contexto. La solución de fondo sigue siendo que el autopublicador publique en formato oración.
- **Fechas en los fixtures.** Todas son del 22 de octubre, así que la vista aislada muestra "22 oct" en lugar de horas. En producción, las notas del día muestran la hora.
- **Etiquetas chicas previas.** Las insignias de categoría del fallback de imagen, el chip "Video" y el eyebrow del newsletter siguen por debajo de 11 px.
- **Dependencias.** Al reinstalar con `npm ci`, npm advierte que `next@14.2.5` tiene una vulnerabilidad publicada (ver el aviso de seguridad de Next.js del 11-12-2025). No se actualizó, porque cae fuera de este trabajo visual; conviene evaluarlo por separado.

## Para revisar

```powershell
node scripts/editorial-preview.mjs 3101            # con anuncios de prueba
node scripts/editorial-preview.mjs 3102 --no-ads   # como producción hoy
```

Abrir [la galería comparativa](qa/density/index.html). Para volver a medir con un Playwright local (no se instala en el proyecto):

```powershell
$env:PLAYWRIGHT_CORE="<ruta a playwright-core>"; $env:CHROMIUM_PATH="<ruta a chrome.exe>"
node scripts/density-visual-qa.mjs after
node scripts/density-behavior-qa.mjs
```
