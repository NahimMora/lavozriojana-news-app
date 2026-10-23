# Incidente 2026-10-23: build de Hostinger sin procesos disponibles

Al publicar el rediseño `b1098fd` en `main`, el auto-deploy de Hostinger falló
durante `Collecting page data`. La compilación y el chequeo de tipos habían
terminado correctamente. Prisma confirmó que no había migraciones pendientes.

El log del build `01a166f8-99c0-73dd-a55d-b5b4d286d286` registró:

```text
Static worker exited with code: null and signal: SIGABRT
Sending SIGTERM signal to static worker due to timeout of 60 seconds
Error: spawn /opt/alt/alt-nodejs20/root/usr/bin/node EAGAIN
ERROR: Failed to build the application
```

La web devolvió temporalmente HTTP 503 y luego volvió a servir la versión
anterior. La API pública continuó respondiendo con noticias después del reinicio.
No se perdió contenido ni se modificó la base manualmente.

## Corrección

El host informa 64 procesadores lógicos. Next 14.2.5 calcula por defecto el
paralelismo a partir de los procesadores visibles, que no representan el cupo
de recursos de la cuenta compartida de Hostinger. El error `EAGAIN` indica que
el proceso no pudo crear otro trabajador.

Se configura `experimental.cpus: 1` en `next.config.mjs` para limitar los
trabajadores del build. Esto puede prolongar la generación estática, pero evita
crear decenas de procesos simultáneos. No cambia el número de procesos de
runtime administrados por Hostinger ni el script `npm run build`.

Se conserva `prisma migrate deploy && prisma generate && next build`. No se
actualizan dependencias, no se cambia el esquema y no se ejecutan migraciones
manuales como parte de esta corrección.

El comando de preview aislado respeta ahora el límite configurado del proyecto,
para comprobar esta configuración sin credenciales ni base de producción.

## Verificación

Antes de publicar: tipos, lint y compilación optimizada con datos sintéticos en
una copia aislada. Después del push: revisar el nuevo log de Hostinger y confirmar
HTTP 200, presencia de `masthead-wordmark` en la portada, fuentes locales
disponibles y noticias en `/api/public/posts?perPage=1`.
