# Rediseño editorial local — La Voz Riojana

Fecha: 23 de octubre de 2026. Rama: `design/editorial-premium-local`. Base: `186ebff`.

Implementación preparada y validada localmente. Durante la fase de rediseño no se hizo commit, push, PR, merge ni deploy. Posteriormente, el usuario autorizó commitear y pushear todos los cambios: el destino es la rama `design/editorial-premium-local` en `origin`, sin merge a `main`. Las limitaciones de validación detalladas abajo continúan vigentes.

El repositorio estaba limpio al comenzar. Se leyeron `CLAUDE.md`, `README_DEPLOY_HOSTINGER.md` y `README_INCIDENTE_2026-09-13_HOME_VACIA.md` antes de ejecutar la aplicación.

## Revisión visual

Abrir [la galería comparativa](qa/editorial/index.html). Incluye portada, artículo y categoría en 360, 390, 768, 1024 y 1440 px. Hay 15 capturas anteriores y 30 posteriores, incluyendo menú, búsqueda, videos, lectura, bloques inferiores y casos de contenido escaso.

Las capturas usan textos ficticios y seis fotografías públicas descargadas para QA. Las fotografías no corresponden necesariamente al texto de prueba. Las fuentes de las imágenes están en `scripts/fixtures/images/SOURCES.json`. No representan publicaciones reales. Los videos y el banner son sintéticos.

La vista de revisión iniciada durante el trabajo está en **http://127.0.0.1:3101**. Rutas útiles:

- `/`
- `/noticias/noticia-de-prueba-1`
- `/noticias/noticia-de-prueba-6` — video horizontal
- `/noticias/noticia-de-prueba-9` — video vertical
- `/categoria/interior`
- `/buscar?q=La%20Rioja`

Para crear otra vista aislada, desde la raíz:

```powershell
node scripts/editorial-preview.mjs 3105
```

El script copia los archivos de la aplicación a una carpeta temporal, reutiliza `node_modules`, reemplaza Prisma por un adaptador en memoria **únicamente en esa copia**, fija el clima y quita los scripts de terceros de esa copia. No copia `.env`; las variables heredadas se limitan a una lista de variables del sistema. Se vincula exclusivamente a `127.0.0.1`.

No es un modo de demostración incorporado al sitio publicado. Los fixtures no son importados por la aplicación del repositorio. La copia no se actualiza automáticamente al editar el repositorio: para revisar cambios posteriores, iniciar otra copia. Las carpetas temporales se conservan para inspección y pueden eliminarse manualmente después de detener sus procesos.

Opciones adicionales:

```powershell
node scripts/editorial-preview.mjs 3106 --empty
node scripts/editorial-preview.mjs 3107 --sparse
node scripts/editorial-preview.mjs 3108 --single
node scripts/editorial-preview.mjs 3109 --build
```

`--build` ejecuta directamente el compilador de Next en una copia aislada con fixtures; no ejecuta `npm run build` ni migraciones. Limita los trabajadores a dos solamente en la configuración temporal. No valida MySQL ni el flujo de despliegue real.

## Problemas detectados y decisiones

| Problema anterior | Cambio |
| --- | --- |
| Inter y Newsreader declaradas, sin carga efectiva | Archivo y Source Serif 4 locales, variables y con licencia OFL |
| Logo cuadrado pequeño dentro de una cabecera alta | Emblema original acompañado del nombre completo; proporciones estables al desplazar |
| Portada dominada por fotos oscurecidas y titulares pequeños superpuestos | Titular principal, bajada y firma antes de la foto; secundarias con texto fuera de las imágenes |
| Tarjetas redondeadas con sombras y desplazamientos al pasar el mouse | Superficie común, radios discretos, reglas finas y jerarquía tipográfica |
| Cambio brusco de tamaño raíz a partir de 768 px | Escalas responsive en los componentes, sin salto global del 110% |
| Navegación de categorías oculta en móvil | Fila desplazable más menú de secciones; objetivos táctiles de 44–48 px en los controles principales |
| Menú sin contención ni retorno de foco | Diálogo nativo, Escape, bloqueo de scroll, cierre visible y retorno explícito al botón |
| Buscador sin foco fiable | Foco inicial en el campo y cierre accesible |
| Cuerpo de lectura largo y fondo tostado | Fondo blanco, cuerpo serif de 18–19,2 px, interlínea 1,8 y ancho máximo de 700 px |
| Imágenes de artículo forzadas a 16:9 | Proporción intrínseca conservada; recortes reservados para miniaturas |
| Videos verticales en contenedor horizontal | Proporción derivada de los metadatos, límite de altura y reproducción inline |
| Titulares forzados a minúsculas por CSS | Se respeta la escritura editorial, incluidos nombres propios y siglas |
| Instagram incorrecto | `https://instagram.com/lavozriojana.ok` en cabecera, pie, portada, artículo, menú y organización JSON-LD |
| Marquesina continua con contenido duplicado | Franja horizontal desplazable, sin animación automática ni enlaces duplicados |

Se mantienen bordó `#8a1024`, azul `#236d8f`, tinta `#111827` y el logo existente. Los colores de Tailwind se conectan con los tokens CSS existentes; no se agregó otro sistema de diseño.

La referencia de redes se verificó en el repositorio hermano disponible: `../AutoPublicador_LaVozRiojana/remotion/src/shared/fonts.ts`, `sectionColors.ts`, `editorial/EditorialMasthead.tsx` y `src/constants.ts`. Allí se usan Archivo y Source Serif 4, junto con rojo, bordó y azul. No se modificó ese repositorio.

La Rioja gana presencia mediante la marca, la leyenda local y la presentación. No se cambió la prioridad geográfica ni el orden editorial de las consultas.

## Correcciones funcionales acotadas

1. **Duplicación en el bloque principal:** el pool combinaba `featured` y `latest` sin registrar los IDs incorporados. Una nota podía ocupar dos posiciones. Se agregó un conjunto independiente para deduplicar ese pool; los artículos no consumidos siguen disponibles para los bloques posteriores.
2. **Una única última noticia:** la condición anterior exigía dos noticias y luego dibujaba la grilla desde la quinta; con una sola nota disponible la sección quedaba vacía. Ahora se muestra esa nota. Verificado con 14 artículos sintéticos, de los cuales el bloque principal consume 13.
3. **Ranking con pocas categorías:** antes dependía del sexto bloque de categorías. Ahora tiene una ubicación alternativa cuando no se llega a seis bloques, usando los mismos datos existentes.
4. **Compartir:** el servidor generaba un enlace relativo y el navegador uno absoluto, produciendo un error real de hidratación. Ahora ambos usan la URL configurada del sitio.
5. **Video ya cargado al hidratar:** se comprueban los metadatos disponibles al montar, además de escuchar `loadedmetadata`. Esto evita perder la proporción de un video obtenido desde caché antes de la hidratación.

## Skills y herramientas efectivamente utilizadas

- **`web-design-guidelines`**, registrada localmente. Se leyó `C:/Users/pc10/.agents/skills/web-design-guidelines/SKILL.md` y se obtuvo su [guía oficial](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Se aplicó a foco, navegación, movimiento, lectura responsive y revisión final.
- **`frontend-design`**, consultada desde su [SKILL.md oficial](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md), sin instalación. Aportó dirección tipográfica, composición basada en contenido y revisión mediante capturas.
- **`vercel-react-best-practices`**, consultada desde su [SKILL.md oficial](https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-best-practices/SKILL.md), sin instalación. Se leyeron las reglas de serialización, eventos e hidratación; se aplicó especialmente la reducción de datos en el límite servidor/cliente.
- Se revisaron el catálogo registrado y los directorios locales de skills. No había skills locales específicas de Playwright, diseño editorial o Next/React. Playwright se utilizó como **herramienta conectada**, no se presenta como una skill instalada.
- También se leyó `find-skills` durante el descubrimiento. No fue necesario instalar paquetes ni nuevas skills. No se añadieron dependencias.

## Rendimiento y accesibilidad

- `CardImage` recibe solamente título, imagen, video y categoría. Antes recibía el objeto completo de la noticia, incluido el HTML de su cuerpo, repetido en numerosas miniaturas.
- Medición de la portada con los mismos fixtures y scripts de terceros desactivados: HTML/RSC de desarrollo sin comprimir **583.774 → 302.860 bytes**, aproximadamente **48% menos**. Gzip calculado sobre esas respuestas: **32.295 → 24.084 bytes**. Son resultados del entorno sintético, no mediciones de transferencia ni Core Web Vitals en producción. Datos en [payload.json](qa/editorial/payload.json).
- Precargas de imagen de portada: **5 → 2**; se conserva prioridad para marca y noticia principal. Se ajustaron `sizes` según variante y espacio disponible.
- Fuentes WOFF2 locales: aproximadamente 287 KB entre los tres archivos; la cursiva no se precarga. Se usa `next/font/local` con `display: swap`, sin solicitudes a Google Fonts durante la navegación.
- La cabecera mantiene sus dimensiones al desplazar; el efecto existente sólo cambia su sombra.
- Se agregó un salto al contenido. Se probaron los diálogos con teclado y se respetan `prefers-reduced-motion` y mayor contraste.
- La lectura usa nombres y siglas originales. No se alteró el HTML periodístico, su separación en párrafos ni su sanitización.

## Validación realizada

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Aprobado |
| `npm run lint` | Aprobado, sin advertencias |
| `git diff --check` | Aprobado; Git informa su normalización habitual LF/CRLF en Windows |
| Compilación optimizada aislada | Exit 0; compila y genera 32 páginas estáticas; advertencia de empaquetado indicada abajo |
| Portada, artículo y categoría × 360/390/768/1024/1440 | 15/15: HTTP 200, un H1, sin overflow ni imágenes visibles rotas |
| Consola e hidratación en la matriz final | Sin errores |
| Menú móvil | Foco contenido, Escape y retorno al botón comprobados |
| Buscador | Foco inicial y navegación con resultados comprobados |
| Instagram | Enlaces renderizados al perfil indicado |
| Deduplicación del bloque principal | 13 posiciones con 13 slugs distintos |
| Portada vacía y contenido escaso | Sin overflow; una última noticia visible cuando corresponde |
| Videos 16:9 y 9:16 | Proporción comprobada; controles y `playsInline` preservados |
| Avances automáticos | Reproducen al entrar en vista y permanecen pausados con movimiento reducido |
| Artículo | Fuentes, comentarios existentes, historia y siguiente artículo cargado comprobados con fixtures |
| Copiar enlace | URL absoluta copiada al portapapeles y confirmación visible |
| Bloques inferiores a 390 y 1024 | Recorridos completos, sin imágenes fallidas, overflow ni intersección de tarjetas hermanas |
| Aislamiento en recorrido final | Ninguna solicitud a dominios externos |

Resultados de la matriz en [results.json](qa/editorial/results.json). El guion reutilizable `scripts/editorial-visual-qa.js` se ejecuta mediante la herramienta conectada `browser_run_code_unsafe`, indicando ese archivo. Requiere la vista aislada en el puerto 3101; no es un comando de Node ni requiere instalar Playwright en el proyecto.

Las capturas de bloques completos ocultan únicamente durante la captura los elementos fijos para que no tapen el contenido. Las capturas comparativas de viewport mantienen la cabecera normal.

## Archivos modificados

Interfaz y presentación:

- `app/globals.css` — tokens, tipografía, componentes, grillas, lectura y responsive.
- `app/layout.tsx` — fuentes locales, salto al contenido, color de interfaz y perfil social en JSON-LD.
- `app/page.tsx` — presentación de portada y tres correcciones acotadas de renderizado/deduplicación.
- `app/noticias/[slug]/page.tsx` — clase editorial, perfil de Instagram y etiqueta de recomendaciones que no presume procedencia local de todos los artículos.
- `app/categoria/[slug]/page.tsx` — cabecera y nota principal de categoría.
- `components/layout/Header.tsx`, `Footer.tsx`, `MobileMenu.tsx`, `SearchOverlay.tsx`.
- `components/layout/OverlayDialog.tsx` — nuevo componente pequeño compartido por los dos diálogos.
- `components/news/PostCard.tsx`, `PostCardMedia.tsx` — variante principal, tamaños y datos mínimos de imagen.
- `components/news/BreakingNewsBar.tsx`, `ShareLinks.tsx`, `ArticleVideo.tsx`.
- `tailwind.config.ts` — colores conectados con tokens existentes.
- `public/fonts/` — tres WOFF2 y licencias OFL de ambas familias.

Soporte local:

- `.gitignore` — excluir registros generados por `.playwright-mcp/`.
- `scripts/editorial-preview.mjs`, `scripts/editorial-visual-qa.js`, `scripts/fixtures/`.
- Este informe y `docs/qa/editorial/`, con galería, resultados y capturas.

Permanecen sin cambios `package.json`, el lockfile, `next.config.mjs`, Prisma, `lib/posts.ts`, `lib/prisma.ts`, los endpoints y la sanitización. No se ejecutaron migraciones ni se abrió una base de producción. No se realizó ninguna acción de escritura en sistemas externos.

## Limitaciones y pendientes

- **Base de datos:** no había una base MySQL de desarrollo aislada verificada. Las pruebas de UI usan un adaptador en memoria; quedan pendientes las integraciones reales de administración, escritura de comentarios, estadísticas, publicidad, API privada y autopublicador contra una base de desarrollo segura.
- **Empaquetado:** Next terminó con código 0, pero `output: standalone` emitió `EPERM` al intentar volver a crear el enlace de `node_modules` en Windows. Compilación, tipos y generación de páginas aprobaron; el paquete standalone no se considera validado. No se cambió la configuración productiva para ocultar esa limitación.
- **Navegadores:** se utilizó el navegador Chromium conectado. No se hicieron pruebas en iPhone/Android físicos ni en Safari/WebKit o Firefox. Los anchos móviles no sustituyen esas comprobaciones.
- **Servicios de terceros:** AdSense real, Consent Mode con Google, clima remoto y anuncios comerciales no se ejecutaron en la copia aislada. Su implementación productiva se conserva. Se revisaron el banner de cookies y los espacios publicitarios con contenido seguro.
- **SEO:** se mantuvieron metadatos y código de feeds/sitemaps; no se afirmó una nueva validación de indexación en producción. Tampoco se midieron LCP, CLS e INP con tráfico real.
- **Contenido:** los titulares que llegan en mayúsculas siguen en mayúsculas, conservando sus nombres y siglas. Una normalización editorial de títulos corresponde al flujo de contenidos y queda fuera del CSS.
- **Enlaces preexistentes:** verificar el número de WhatsApp `+54 9 380 400-0000` y el destino genérico de X antes de promocionarlos. No se inventaron reemplazos ni se modificó el contacto sin datos verificados.
- **Disponibilidad de datos:** continúa el fallback preexistente a portada vacía ante errores de base; el incidente está documentado en el repositorio. No se modificó ese comportamiento del backend como parte de este rediseño.

## Revisión y publicación manual

1. Abrir la galería y la vista local, revisar los tres tipos de página y navegar con el menú/buscador a 360 y 390 px. Para recrear la vista usar el comando aislado indicado arriba; no iniciar el servidor habitual con credenciales productivas.
2. Revisar `git diff` en la rama `design/editorial-premium-local`. Seleccionar los archivos para un commit local; las capturas son artefactos de revisión y su incorporación al historial es opcional.
3. Completar las integraciones contra una base de desarrollo y la comprobación de Safari/Android y empaquetado en un entorno compatible. No usar el `npm run build` habitual hasta confirmar que su `DATABASE_URL` es de desarrollo: ese script conserva `prisma migrate deploy`.
4. Sólo después de aprobar la revisión, integrar y enviar los cambios manualmente mediante el flujo Git habitual, verificando antes qué rama sigue Hostinger. **Un push puede disparar el deploy y sus migraciones.** No se proporciona ni se ejecuta un atajo para enviar esta rama directamente a `main`.
5. Tras la publicación autorizada, comprobar portada con noticias, artículo, búsqueda, categorías, multimedia, publicidad, cookies, API pública y feeds/sitemaps mediante el procedimiento existente. No hace falta una migración nueva para estos cambios visuales.
