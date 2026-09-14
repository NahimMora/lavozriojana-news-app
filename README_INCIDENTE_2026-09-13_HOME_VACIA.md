# Incidente 2026-09-13: home y API públicas sin noticias

## Síntoma

Después de un `push` a `main` (deploy automático de Hostinger), `https://lavozriojana.com/`
y `GET /api/public/posts` dejaron de mostrar notas (`total: 0` / "No hay noticias"),
a pesar de que la base de datos tenía las 3993+ notas reales intactas.

## Diagnóstico

Se confirmó por phpMyAdmin y por consultas directas que **la base nunca perdió datos**
(posts, categorías, autores, foreign keys, todo íntegro). El problema eran dos fallas
independientes en la infraestructura de deploy de Hostinger, no en los datos ni en el
código de la app:

### 1. `DATABASE_URL` con TCP en vez de socket Unix

La variable de entorno usaba:

```
mysql://user:pass@127.0.0.1:3306/db?connection_limit=5&pool_timeout=10
```

El proceso Node de la app (y el build de Next en Hostinger) **no podía alcanzar
`127.0.0.1:3306`** — se confirmó viendo el log de deploy
(`hbuilds/logs/<uuid>/*.log`), que mostraba `Can't reach database server at
127.0.0.1:3306` repetidas veces durante la generación estática, aunque el build
igual terminaba "bien" porque esos errores quedaban silenciados por el código de la
app (fallback a "sin noticias" en vez de fallar el build). Una shell SSH interactiva
sí podía conectar por TCP — por eso `mysql -h 127.0.0.1 ... SELECT 1` daba `1` y
parecía que la base andaba bien.

**Fix**: cambiar `DATABASE_URL` en hPanel (variables de entorno del Node.js Web App)
para usar el socket Unix de MySQL:

```
mysql://user:pass@localhost/db?socket=/var/lib/mysql/mysql.sock&connection_limit=5&pool_timeout=10
```

El socket se ubica con `mysql_config --socket` por SSH si el path cambia.

### 2. La migración `storyKey` nunca se aplicó en producción

La migración `prisma/migrations/20260910130000_add_post_story_key/` (agrega la
columna `storyKey` a `posts`, usada por el Story Engine del autopublicador) nunca se
corrió contra la base de producción. `SHOW COLUMNS` confirmó que la columna no
existía y `_prisma_migrations` solo tenía 3 migraciones viejas.

**Causa raíz**: el pipeline de auto-deploy de Hostinger (`hbuilds/`, deploy por Git)
**no tiene un campo de "build command" configurable** — corre siempre y únicamente
`npm install && npm run build`. El comando `npm run prisma:deploy` documentado en
`README_DEPLOY_HOSTINGER.md` (sección 3, para el flujo manual de "Node.js Web App")
**nunca se ejecutaba** en este pipeline real, así que las migraciones nuevas se
quedaban pendientes en cada deploy hasta que alguien entraba por SSH a correrlas a
mano.

**Fix inmediato**: aplicar la migración manualmente por SSH.

**Fix permanente**: `package.json` → el script `build` ahora corre la migración
antes de compilar:

```json
"build": "prisma migrate deploy && prisma generate && next build"
```

Así, cualquier migración pendiente se aplica sola en cada push a `main`, sin
depender de un campo de build command que este plan de Hostinger no ofrece ni de
entrar por SSH.

## Cómo se corrió la migración manualmente (referencia, no debería hacer falta de nuevo)

Los binarios de Node en este Hostinger no están en el `PATH` por defecto (son
paquetes CloudLinux `alt-nodejs`, no un `nodevenv` con `activate`). El CLI de
`prisma` tampoco está instalado en `node_modules/.bin` del build de producción
(`current`), así que hay que correrlo con `npx` desde `last-source` (que sí tiene el
árbol fuente completo):

```bash
cd ~/domains/lavozriojana.com/hbuilds/last-source
set -a; source ../config/.env; set +a
PATH="/opt/alt/alt-nodejs20/root/usr/bin:$PATH" npx -y prisma@5.18.0 migrate status
PATH="/opt/alt/alt-nodejs20/root/usr/bin:$PATH" npx -y prisma@5.18.0 migrate deploy
```

## Verificación

- `GET /api/public/posts?perPage=1` responde `ok:true` con `pagination.total` > 0 y
  contenido real.
- Homepage sin "No hay noticias".
- `_prisma_migrations` con las 4 migraciones aplicadas.

## Pendiente / seguimiento

- **Contraseña de la base rotada**: durante el diagnóstico se pegó la contraseña
  real de MySQL en texto plano en un chat. Debe rotarse (hPanel → Bases de datos →
  MySQL Databases) y actualizarse en `DATABASE_URL` (conservando el parámetro
  `?socket=...`) si todavía no se hizo.
- `README_DEPLOY_HOSTINGER.md` documenta el flujo manual de "Node.js Web App"
  (con build command configurable), que **no es el pipeline realmente usado**
  (deploy automático por Git, sin build command configurable). Ver nota agregada
  en ese archivo.
