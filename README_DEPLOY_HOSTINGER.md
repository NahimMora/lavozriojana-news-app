# Deploy en Hostinger Node.js Web App

Guía para desplegar `La Voz Riojana` en Hostinger Business/Cloud con MySQL.

## 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial La Voz Riojana app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/la-voz-riojana.git
git push -u origin main
```

Si ya existe repo remoto, usar el remoto correspondiente.

## 2. Crear base MySQL en hPanel

En Hostinger:

1. hPanel → Databases → MySQL Databases.
2. Crear base, usuario y contraseña.
3. Guardar host, puerto, usuario, nombre de base y contraseña.
4. Construir:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```

## 3. Configurar Node.js Web App

Recomendado:

- Node.js: `20.x` o superior.
- App root: raíz del repositorio.
- Build command:

```bash
npm install && npm run prisma:deploy && npm run build
```

- Start command:

```bash
npm run start
```

Si Hostinger define `PORT`, el script `start` lo usa. Si necesitás fijar puerto, usá la configuración del panel.

## 4. Variables de entorno

Configurar en Hostinger:

```env
NEXT_PUBLIC_SITE_URL=https://lavozriojana.com
NEXT_PUBLIC_MEDIA_URL=https://media.lavozriojana.com
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
PRIVATE_API_KEY="clave-larga-y-secreta"
ANALYTICS_SALT="otro-secreto-largo"
ALLOWED_API_ORIGINS="https://lavozriojana.com"
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=https://media.lavozriojana.com
R2_ENDPOINT=
R2_REGION=auto
```

No subir `.env` a GitHub.

## 5. Seed inicial

Ejecutar una vez después de migrar:

```bash
npm run prisma:seed
```

El seed agrega categorías, autor principal, páginas institucionales y posts demo. Antes del lanzamiento, reemplazar o archivar las notas demo.

## 6. Dominio principal

Configurar el dominio principal como:

```text
lavozriojana.com
```

No usar `www` como dominio principal. Si se configura `www`, redirigirlo a `https://lavozriojana.com`.

## 7. Cloudflare R2 y media domain

1. Crear bucket R2.
2. Crear credenciales S3-compatible.
3. Activar dominio público `media.lavozriojana.com`.
4. Cargar imágenes desde el autopublicador externo.
5. Enviar al sitio URLs públicas bajo `https://media.lavozriojana.com`.

## 8. Verificaciones post deploy

```text
https://lavozriojana.com/
https://lavozriojana.com/robots.txt
https://lavozriojana.com/sitemap.xml
https://lavozriojana.com/sitemap-noticias.xml
https://lavozriojana.com/api/public/categories
```

Probar endpoint privado sin key debe responder `401`. Con key debe responder datos.

## 9. Logs y mantenimiento

Revisar logs desde hPanel Node.js Web App.

Comandos útiles por SSH:

```bash
npm run prisma:deploy
npm run build
npm run start
```

Para cambios de base:

```bash
npx prisma migrate dev --name nombre_cambio
git add prisma
git commit -m "Add migration nombre_cambio"
```

En producción:

```bash
npm run prisma:deploy
```
