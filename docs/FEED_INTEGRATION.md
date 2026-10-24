# Integración de feeds del AutoPublicador

Rama `feature/feed-integration`, sobre `main` en `31a678b` (densidad editorial v2 ya integrada).
Toda la implementación está en este repositorio. No se tocaron el AutoPublicador, la API, Prisma,
el esquema ni el pipeline de publicación.

## Estado de los feeds al 23-10-2026

- Los siete archivos de `https://media.lavozriojana.com/feed/v1/` respondían **404 (HTML)**.
  Revisé el origen solo con lecturas GET.
- En el `main` remoto del AutoPublicador (`b57d8f3`) todavía no hay código que genere los feeds;
  lo comprobé con `git grep` sin modificar ese repositorio.
- Por eso la implementación sigue los contratos de la consigna y se validó **con fixtures**. No
  se validaron datos reales ni fuentes reales.
- El 23-10 se probó el embed con **un post público real** de @lavozriojana.ok
  (`https://www.instagram.com/p/De2pKcEjffC/`), pero la vista aislada no copiaba `middleware.ts`
  y por eso no tenía la CSP de producción. En producción, esa CSP bloqueaba `embed.js`, el
  iframe y las miniaturas, así que los videos no se veían. Corregido el 24-10 (ver "Reproductor
  de video y CSP"). Desde entonces la vista aislada aplica la misma CSP que producción.
- `index.json` no tiene un contrato definido y no estaba publicado: **no se consume**. No se
  inventaron campos ni dependencias.

## Diagnóstico de compatibilidad

La portada ya tenía apertura (principal, secundarias y Ahora), ticker accesible, bloques de
categoría, "Titulares del día", "En foco", "Más leídas", Destacados equilibrado con la grilla y
publicidad cuadrada. Los riesgos de sumar siete módulos eran concretos:

- empujar la apertura con widgets de clima o dólar;
- una segunda franja de urgentes encima del ticker;
- dos rankings parecidos ("Más leídas" y lo más visto en Instagram) presentados como si midieran
  lo mismo;
- desbalancear el lateral, que ya estaba ajustado al alto de la grilla;
- cargar scripts de Instagram en cada visita.

## Decisiones de ubicación

| Contenido | Dónde | Por qué |
|---|---|---|
| Alerta meteorológica | Banda compacta al tope del contenido, en todas las páginas (layout) | Es la única excepción justificada al primer viewport. Se oculta en `/servicios`, que la muestra completa. |
| Último momento (`nota`) | **Portada**: fija al comienzo del ticker existente, sin moverse y sin repetirse en la lista animada. **Resto**: franja estática de una línea. | No se agrega una segunda franja sobre el ticker. No se muestra en su propia nota, y en la portada no se fija si ya es la nota principal, para no repetir el titular en la misma pantalla. |
| Servicios (resumen) | Una línea después de la apertura, antes de "Últimas noticias" | Fuera del primer viewport (y≈894 px a 1440×900). Hasta 4 datos en escritorio y 2 en teléfonos, elegidos por relevancia. Sin datos, o con uno solo, no se muestra. |
| Servicios (completo) | `/servicios` | Página propia con secciones, fuente y hora en cada bloque. |
| Videos | **Portada**: banda oscura "Videos" justo después de la línea de servicios, antes de "Últimas noticias" (5 tarjetas; en pantallas menores, una fila deslizable). **Nota**: el video propio de la nota (`url_nota`) va dentro del cuerpo, con el reproductor en el lugar, y un carril "Videos" antes del autor. **`/videos`**: el último video encabeza la página. | Pedido del 23-10: más protagonismo y presencia dentro de las notas. Queda fuera del primer viewport (y≈971 px a 1440×900), así que la apertura no cambia. |
| Lo más visto en Instagram | Segunda pestaña del ranking de la portada: "Más leídas" (sitio) y "En Instagram" (alcance), con Hoy/Semana dentro de la segunda | Sale de la banda de videos al quitar el título "En Instagram". Como pestaña no agrega alto ni un módulo más, y cada fuente lleva su nombre y su nota. |
| Tendencias de la sección | Lateral de la categoría, debajo de "Más leídas", que pasa de 10 a 6 notas | No desplaza la nota principal ni desbalancea el lateral. Sin tendencias, "Más leídas" queda completa. |
| Aviso de actualización | Final del encabezado de la nota, antes de la foto | Cerca del inicio de la lectura, sin desplazar el cuerpo. |
| Cronología | Lugar actual de "Seguí esta historia", después del cuerpo | Es narrativa de contexto. Excluye a "En contexto". |
| Navegación | "Servicios" y "Videos" en la barra utilitaria (escritorio), el menú móvil y el pie. El clima de la cabecera enlaza a `/servicios#clima`. | No agranda la cabecera ni crea categorías falsas. |

## Arquitectura

```
lib/feed-url.ts     URLs: http(s) sin credenciales, slug de notas propias, permalinks y CDN de Instagram
lib/feed-types.ts   Contratos zod (zod ya era dependencia) y tipos
lib/feed-core.ts    Cliente sin Next: fetch, timeout, versión, validación, último válido, espera tras fallas
lib/feed.ts         Una función tipada por feed + cruces con el CMS (servidor)
lib/feed-select.ts  Selección editorial pura con `now`: vigencia, orden, deduplicación, textos
components/feed/    SiteNotices, ServicesSummary, SocialBand (+ VideosRail), SectionTrends,
                    TrendingTabs, VideoCard, InstagramEmbed (clientes solo para interacción)
components/services/ Widgets de /servicios
components/news/    UpdateNotice, StoryTimeline (reescrito)
app/servicios, app/videos
```

- **Solo en el servidor.** `FEED_BASE_URL` (sin `NEXT_PUBLIC_`) tiene por defecto
  `https://media.lavozriojana.com/feed/v1`. Los componentes cliente reciben datos ya
  seleccionados y nunca consultan los JSON.
- **Caché.** `fetch(..., { next: { revalidate: 300 } })` con timeout de 3 s (`AbortController`).
- **Comportamiento de Next 14.2.5, verificado en `node_modules`:**
  - La caché de datos guarda **solo respuestas 200**, y su clave no incluye `signal`, así que el
    timeout no la fragmenta.
  - React **no deduplica** un `fetch` que trae su propio `signal` (`cachedFetch`). Por eso el
    cliente deduplica por su cuenta: comparte la solicitud en vuelo y memoriza el resultado
    5 s, también entre renders concurrentes. `getUrgentStory` usa además `cache()` de React
    para compartir la consulta al CMS entre el layout y la portada.
  - Una entrada vencida se sirve al instante y se refresca en segundo plano **sin** el `signal`:
    solo una caché fría espera la red.
- **Fallas.** Un 404, 500, timeout, JSON inválido, versión distinta de 1, estructura inválida o
  `actualizado` en el futuro devuelven la última copia válida, si sigue dentro de la antigüedad
  máxima del feed, o `null`. Nunca lanzan errores. Tras una falla, el feed no se vuelve a pedir
  durante 60 s: un feed caído cuesta a lo sumo un timeout por minuto, no uno por render. En la
  compilación aislada, con los feeds caídos, cada feed registró una sola falla en 34 páginas.
- **Render desacoplado.** Avisos, clima de la cabecera, franja de servicios y banda de Instagram
  van en límites `Suspense` propios con `fallback={null}`. Las páginas ISR se generan completas;
  en las dinámicas, un feed lento no retiene las noticias.

## Validación

- **Feed completo.** Se rechaza si `version` no es exactamente `1` o si `actualizado` no es ISO
  8601 **con zona horaria** (sin zona, el instante dependería del servidor).
- **Entradas y bloques.** Uno inválido se descarta solo, sin perder el resto (`lenientArray`,
  `optionalPart`).
- **Texto plano.** Se recorta, se colapsan espacios y se quitan caracteres de control. No hay
  `dangerouslySetInnerHTML` para datos del feed: React escapa todo.
- **URLs.**
  - Notas propias: solo `lavozriojana.com/noticias/<slug>` (con o sin `www`), reducidas a slug;
    el sitio enlaza su propia ruta.
  - Instagram: solo permalinks `/p/` y `/reel/`, normalizados.
  - Miniaturas: solo https desde `*.cdninstagram.com` o `*.fbcdn.net`.
  - Resto: http(s) sin credenciales. Un `javascript:` en un campo opcional se vuelve `null`.
- **Números.** Un número desconocido queda `null` y nunca pasa a cero; un `0` real se muestra.
- **"En contexto".** También endurecido: sus enlaces de `metadata` solo aceptan rutas internas o
  http(s).

### Supuestos a confirmar con el AutoPublicador

- Cada bloque de `servicios.json` trae `fuente` (texto) y `actualizado` (ISO). Sin esos campos,
  el bloque se descarta.
- `clima.viento`: el texto se muestra tal cual y un número se lee como km/h.
  `pronostico[].lluvia`: un número se lee como probabilidad en %. El contrato no fija unidades;
  si son otras, alcanza con cambiar dos funciones de `WeatherWidget.tsx`.
- `dolar.cotizaciones[].casa`: se ordenan `oficial`, `blue`, `bolsa`/`mep` y
  `contadoconliqui`/`ccl`. Se muestra el `nombre` que trae el feed.
- `actualizaciones.json` no trae fecha de `actualiza`. Para elegir la más reciente se usa la
  fecha de publicación del CMS, que es verificable; el orden del array no se considera.

## Vigencia por tipo de información

| Información | Regla |
|---|---|
| Alerta | `estado` = activa, `vence` futuro, alerta actualizada hace menos de 24 h y su feed hace menos de 3 h. Con la página abierta desaparece en `min(vence, actualizado del feed + 3 h)`. |
| Último momento | `vigente === true`, feed de menos de 3 h y activada hace menos de 12 h. Además, la nota debe estar publicada en el CMS. |
| Clima | Observación de hasta 3 h: actual. De 3 a 12 h: se muestra con su antigüedad. Más vieja: no hay "condiciones actuales". La cabecera solo usa la del feed si tiene menos de 3 h; si no, Open-Meteo. |
| Dólar | Hasta 3 h: normal. Hasta 4 días (fin de semana largo): con fecha y hora resaltadas. Más vieja: se descarta. La portada solo muestra cotizaciones de menos de 24 h. Nunca se dice "en vivo". |
| Feriados | Por fecha de calendario en La Rioja, desde hoy. El bloque vale 120 días. |
| Pagos | "Hoy" sale de la fecha de cada pago, no del array `hoy`. El bloque vale 31 días. |
| Sismos | Últimos 7 días. El bloque vale 72 h. Los automáticos se marcan como preliminares. |
| Cortes | Avisos de las últimas 72 h, presentados como avisos con su fecha y no como estado del servicio. |
| Lo más visto | Feed de menos de 72 h. |
| Videos | Feed de menos de 14 días. Se excluye lo programado a futuro. |
| Actualizaciones e historias | Feed de menos de 30 días: son relaciones entre notas y no vencen en horas. |

Los datos que superan su ventana fresca se muestran con "hace N h" y su fuente. La hora de
observación nunca se toma de la hora de consulta: Open-Meteo informa la suya (`current.time`).

## Reproductor de video y CSP

`videos.json` trae en `instagram` dos campos agregados, opcionales:
- `video`: el mp4 del Reel, es decir el `media_url` de la Graph API de nuestra cuenta, servido
  desde el CDN de Instagram. Es una URL firmada que vence.
- `video_vence`: cuándo vence esa firma.

La web acepta `video` solo si es https sobre `*.cdninstagram.com` o `*.fbcdn.net`. Lo ofrece solo
si `video_vence` es válido y supera `ahora + 15 min`; sin vencimiento no lo usa, porque no puede
saber cuánto dura. Un valor inválido queda `null` sin descartar la entrada. La URL nunca se copia,
se descarga ni pasa por un proxy, y las páginas que la usan se regeneran cada 60 a 300 s, por
debajo de la hora que dura la firma.

`components/feed/InstagramPlayer.tsx` se monta recién cuando el lector toca "Ver video". Antes,
nada de Instagram se pide salvo la miniatura. Tiene tres niveles:

1. **mp4 en `<video>` nativo**: con poster, controles, `playsInline` y autoplay (permitido tras el
   gesto; si el navegador lo rechaza, quedan los controles). La proporción sale del propio video
   (9:16), hasta 80% del alto de la ventana. No lleva `crossOrigin` ni `referrerPolicy`. Un
   `error`, por ejemplo una firma vencida con la página abierta, pasa al nivel 2.
2. **Iframe de la página oficial `/<p|reel>/<código>/embed/`**: sin `embed.js`. Su alto lo dan los
   mensajes `MEASURE` que Instagram envía por `postMessage`. Se considera que funciona cuando
   llega el primer mensaje de `https://www.instagram.com`, no por el evento `load`: un iframe
   bloqueado también dispara `load` (verificado en Chromium). Sin mensajes en 8 s, pasa al nivel 3.
3. **Mensaje con el enlace al post**.

El texto de privacidad, igual en los niveles 1 y 2: «El video se reproduce desde los servidores
de Instagram (Meta) y se carga solo cuando lo reproducís.»

La CSP vive en `lib/csp.ts` (pura y probada) y la aplica `middleware.ts`:
- `img-src`: suma `https://*.cdninstagram.com https://*.fbcdn.net`, para las miniaturas.
- `media-src` (nueva): `'self' blob: <mediaUrl> https://*.cdninstagram.com https://*.fbcdn.net`.
  También arregla los mp4 propios del CMS (`ArticleVideo`), que hasta ahora caían en
  `default-src 'self'` y quedaban bloqueados.
- `frame-src`: suma `https://www.instagram.com`.
- `script-src`: no cambia. No se carga ningún script de Instagram.

## Reglas editoriales por módulo

- **Alertas.**
  - El texto sale del feed: «Alerta naranja por viento · Vinchina y General Lamadrid · Vigente
    hasta las 02:59 del sábado 24».
  - Para un aviso a muy corto plazo dice «Aviso». Si el vencimiento cae otro día, se nombra el día.
  - La fuente se abrevia «SMN» solo si el feed dice Servicio Meteorológico Nacional.
  - La misma alerta en los dos feeds se muestra una vez. Si hay varias, va primero la más grave y
    las demás quedan en `/servicios`.
  - Colores:
    - Amarilla `#F2C200` y naranja `#F07C00`: texto oscuro (10,6:1 y 6,4:1; el blanco sobre la
      naranja daría 2,8:1).
    - Roja `#D0021B`: banda completa con texto blanco (5,7:1).
  - El detalle se abre con un botón con `aria-expanded` y `aria-controls`.
- **Último momento.** La ruta actual se lee con `usePathname`, que también conoce el render del
  servidor: no hay hacks de cabeceras ni errores de hidratación. La comparación normaliza
  mayúsculas, barra final y codificación.
- **Actualizaciones.**
  - Van de `nota` (la original) a `actualiza` (la que trae la novedad). Así lo confirman los
    fixtures y las pruebas.
  - Se siguen cadenas A→B→C, sin ciclos ni autorreferencias.
  - Se descartan las actualizaciones que el CMS no publica o que son anteriores a la nota actual
    (relación invertida).
- **Cronologías.**
  - Solo con claves `event:`, tanto en `getStoryTimeline` (CMS) como en la presentación. Las
    claves `story:` u otras no muestran nada, y la base no se modificó.
  - `historias.json` complementa la cronología solo si su `storyKey` coincide **y** su lista
    incluye la URL de la nota actual. Aporta notas que el CMS publica con la misma clave o sin
    clave, y su `novedad`; nunca una nota con otra clave.
  - Orden de la más antigua a la más reciente, con la nota actual incluida y marcada
    (`aria-current`). Se muestra con dos notas como mínimo, contando la actual.
  - Excluye a "En contexto".
- **Instagram.**
  - Se muestra solo si `metrica` menciona Instagram.
  - Orden por alcance (luego interacciones), no por el orden del archivo. **No se muestran
    cifras.**
  - Títulos, categorías y rutas salen del CMS en una sola consulta agrupada. Si una nota no está
    en el CMS, queda el título del feed, sin imagen inventada.
- **Videos.**
  - Tarjeta liviana con miniatura temporal (`<img>` común, `referrerPolicy="no-referrer"`, sin
    `next/image` ni dominios nuevos).
  - Si la miniatura falla, aparece un panel neutro, sin foto inventada.
  - El video se carga **solo al reproducirlo**: en un diálogo accesible desde las tarjetas, o en
    el lugar dentro de la nota y en `/videos`.
  - El reproductor tiene tres niveles: mp4 nativo, iframe oficial y enlace (ver "Reproductor de
    video y CSP").
  - Para `origen: x`, el crédito «Video: X» enlaza a `fuente_video` si es válido.
  - oEmbed no se usó: requiere un token de aplicación de Meta que no está disponible.

## Privacidad y rendimiento

- **Video.** No se carga ningún script de Instagram. El mp4 o el iframe se piden solo al
  reproducir; antes, la QA verifica cero solicitudes de reproducción. El texto de privacidad lo
  aclara.
- **Miniaturas.** Las imágenes de la tarjeta se piden al CDN de Instagram en el navegador del
  lector, igual que cualquier imagen de terceros. No usan cookies del sitio ni el sistema de
  consentimiento (que cubre analítica y publicidad). Si se quiere evitar esa solicitud, la
  alternativa es que el AutoPublicador copie la miniatura a R2.
- **Peso.** El First Load JS de la portada pasa de 101 a **104 kB**: pestañas, tarjeta de video
  y avisos son clientes. La nota pasa de 108 a **111 kB** por el bloque de video;
  `/servicios` queda en 94,1 kB y `/videos` en 96,6 kB.
- **Layout.** Los módulos sin datos no reservan espacio. Las imágenes de video tienen relación de
  aspecto fija.

## Sin feeds

Con los siete feeds en 404 (`--no-feeds`), la portada, las notas, las categorías,
`/servicios` y `/videos` responden 200, sin errores de consola ni de hidratación.

- **Primer viewport:** idéntico a la línea de base (mismas posiciones y titulares visibles).
- **Módulos ausentes:** no aparecen banda de avisos, franja de servicios, banda de Instagram,
  aviso de actualización ni novedades de cronología.
- **Cronologías:** las de notas con clave `event:` siguen saliendo del CMS.
- **Clima:** la cabecera usa Open-Meteo, como antes.
- **`/servicios`:** muestra esa temperatura con su fuente.
- **`/videos`:** muestra un estado vacío con el enlace a Instagram.

## Antes / después (vista aislada, mismos datos)

Primer viewport de la portada. El "antes" es `main` (`31a678b`). "Con feeds" incluye una alerta
naranja y una nota urgente activas.

| Ancho | Titulares visibles (antes → con feeds → sin feeds) | 1.ª tarjeta y (px) |
|---|---|---|
| 360 | 3 → 2 → 3 | 153 → 241 → 153 |
| 390 | 3 → 3 → 3 | 153 → 241 → 153 |
| 768 | 12 → 11 → 12 | 221 → 277 → 221 |
| 1024 | 12 → 12 → 12 | 221 → 268 → 221 |
| 1280 | 13 → 11 → 13 | 221 → 268 → 221 |
| 1440 | 13 → 13 → 13 | 221 → 268 → 221 |

- **Costo de los avisos.** Con una alerta activa, la banda ocupa 47 px en escritorio y 72 px en
  teléfonos. Fuera de la portada, la franja de último momento suma 41 px (53 px en teléfonos).
- **Categoría.** Con alerta y último momento a la vez, la primera tarjeta baja 88 px en escritorio
  (279 → 367 a 1440) y 124 px en teléfonos (240 → 364).
- **Sin avisos.** Las páginas no pierden nada.
- **Ubicación de los módulos.** La franja de servicios aparece en y≈894 px a 1440×900, debajo
  del primer viewport, y la banda "Videos" en y≈971 px (526 px de alto); antes del pedido estaba
  en y≈4386 px.

Capturas en [`qa/feeds/index.html`](qa/feeds/index.html): 7 páginas por 6 anchos con feeds,
sin feeds a 390 y 1440 px, y el antes/después del primer viewport.

## Pruebas

| Prueba | Resultado |
|---|---|
| `npm test` (`tests/feed.test.mjs` + titulares) | **69/69**: suma mp4 y vencimiento en el contrato, margen de 15 min, URL de embed para `/p/` y `/reel/`, transiciones del reproductor, mensajes `MEASURE` y CSP; 56 de feeds (cargador ante 404, 500, timeout, JSON inválido, versión, campo ausente, fecha inválida o sin zona, feed viejo o futuro, último válido, espera, deduplicación; validación; alertas; último momento; actualizaciones; cronologías; Instagram; servicios con fechas, nulos, ceros y vigencia; videos) y 6 de titulares |
| `scripts/feed-behavior-qa.mjs` | **79/79**: nivel 1 con `<video>` 9:16; firma vencida → iframe del mismo post; sin mp4 → iframe directo con su alto; Instagram bloqueado o no incrustable → mensaje con enlace; CSP servida con los dominios correctos; ninguna violación de CSP en consola; banda "Videos" después de servicios y sin el título "En Instagram"; ranking con pestañas "Más leídas" / "En Instagram"; video propio dentro de la nota con reproductor en el lugar y carril sin repetirlo; nota sin video propio con carril; `/videos` encabezado por el último video; ticker con nota fija sin duplicar; franja en otras notas y no en la propia; alerta única, color, teclado y vencimiento con la página abierta (reloj simulado); actualización en el sentido correcto y sin aviso en la propia, autorreferencia, invertida o sin datos; cronología ordenada, sin duplicados ni otro hecho, sin "En contexto"; `story:` sin cronología; pestañas con flechas; sin cifras de alcance; `embed.js` nunca se pide; miniaturas vencidas; categorías con y sin tendencias; sin feeds en 6 rutas; 360-1440 px sin scroll horizontal ni textos < 11 px; sin errores de consola |
| `scripts/density-behavior-qa.mjs` | **26/26** con feeds y **26/26** sin feeds. Se ajustaron dos pruebas del ticker para contar solo las listas móviles, ya que la nota fija no se duplica. |
| typecheck, lint, `git diff --check` | sin errores |
| Compilación aislada (`editorial-preview.mjs --build`) | correcta, **34 páginas**. Persiste el aviso EPERM de `standalone` en Windows, previo a este trabajo. |

Instagram nunca se contactó en las pruebas automáticas: su CDN (miniaturas y mp4) y su página de embed se respondieron localmente.

### Cómo repetir

```powershell
npm test
node scripts/editorial-preview.mjs 3101              # fixtures desplazados al momento de arranque
node scripts/editorial-preview.mjs 3102 --no-feeds   # los siete feeds en 404
$env:PLAYWRIGHT_CORE="<playwright-core>"; $env:CHROMIUM_PATH="<chrome.exe>"
node scripts/feed-behavior-qa.mjs http://127.0.0.1:3101 http://127.0.0.1:3102
node scripts/feed-visual-qa.mjs after http://127.0.0.1:3101
```

## Limitaciones y riesgos pendientes

- **Contratos sin datos reales.** Al publicarse los feeds hay que revisar los primeros archivos
  contra los "Supuestos a confirmar". Los fallos de validación quedan en el log como
  `[feed] <nombre>: schema (<campo>)`.
- **Instagram real.** El iframe oficial del post real se vio funcionar con la CSP de producción
  aplicada (captura `qa/feeds/player/real-iframe-1440.png`). El nivel 1 se probó con un mp4 local
  servido como si fuera el CDN: el `media_url` real lo genera el AutoPublicador y todavía no está
  publicado. Las pruebas automáticas simulan Instagram. Falta un caso real de post que no permita
  incrustación (cubierto por la espera de 8 s y el enlace).
- **Miniaturas de terceros.** Ver "Privacidad". Si se prefiere no exponer al lector a ese CDN,
  hay que copiarlas a R2 desde el AutoPublicador.
- **Navegadores.** Solo Chromium. Faltan Safari/WebKit y Firefox.
- **Instancias en desarrollo.** En `next dev` cada ruta compila su propia copia del cliente, por
  eso el log repite fallas. En la compilación optimizada se comparte, como se vio en el build.
- **Páginas estáticas e ISR.** Fechas relativas como "Faltan N días" o "hace N h" se calculan
  al regenerar: hasta 60 s de desfase en la portada y 300 s en `/servicios`. Las alertas también
  se ocultan en el cliente al vencer.
- **X en la cabecera.** Sigue apuntando a `twitter.com` sin cuenta: es un pendiente anterior.
