# 🚀 Guía de Despliegue en Render

## 📋 Requisitos Previos

- Cuenta en [Render](https://render.com)
- Repositorio Git con el código (GitHub, GitLab, etc.)
- YouTube Data API v3 Key

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Archivos Necesarios

Asegúrate de que tu repositorio tenga estos archivos:

```
✅ Dockerfile
✅ render.yaml (opcional, pero recomendado)
✅ .htaccess
✅ Todos los archivos PHP
✅ .gitignore (para excluir .env)
```

### 1.2 Actualizar .gitignore

Asegúrate de que `.env` esté en `.gitignore`:

```
.env
.env.local
.env.production
```

### 1.3 Subir a Git

```bash
git add .
git commit -m "Preparar para despliegue en Render"
git push origin main
```

---

## 🌐 Paso 2: Crear Servicio en Render

### 2.1 Conectar Repositorio

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio Git
4. Selecciona el repositorio de RayMusic

### 2.2 Configurar Servicio

**Configuración básica:**

- **Name**: `raymusic` (o el nombre que prefieras)
- **Environment**: `Docker`
- **Region**: Elige la más cercana a tus usuarios
- **Branch**: `main` (o tu rama principal)
- **Plan**: `Free` (o el que necesites)

**Build & Deploy:**

- **Dockerfile Path**: `./Dockerfile` (detectado automáticamente)
- **Docker Command**: (dejar vacío, usa el CMD del Dockerfile)

### 2.3 Configurar Variables de Entorno

En la sección **"Environment"**, añade:

| Key | Value | Descripción |
|-----|-------|-------------|
| `YOUTUBE_API_KEY` | `AIzaSy...` | Tu API Key de YouTube |
| `PHP_MEMORY_LIMIT` | `256M` | Límite de memoria PHP |
| `MAX_EXECUTION_TIME` | `300` | Timeout para descargas |

**⚠️ IMPORTANTE:** No incluyas comillas en los valores.

### 2.4 Desplegar

1. Click en **"Create Web Service"**
2. Render comenzará a construir la imagen Docker
3. Espera 5-10 minutos para el primer despliegue

---

## ✅ Paso 3: Verificar Despliegue

### 3.1 Verificar URL

Render te asignará una URL como:
```
https://raymusic.onrender.com
```

### 3.2 Probar la Aplicación

1. Abre la URL en tu navegador
2. Deberías ver la página principal de RayMusic
3. Intenta buscar una canción
4. Intenta descargar

### 3.3 Verificar Logs

Si hay problemas:

1. Ve a tu servicio en Render
2. Click en **"Logs"**
3. Revisa errores de PHP o Apache

---

## 🔐 Paso 4: Configurar Dominio Personalizado (Opcional)

### 4.1 Añadir Dominio

1. En tu servicio, ve a **"Settings"**
2. Scroll a **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Ingresa tu dominio: `raymusic.tudominio.com`

### 4.2 Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.):

**Tipo A:**
```
Host: raymusic
Value: [IP de Render]
TTL: Auto
```

**O Tipo CNAME:**
```
Host: raymusic
Value: raymusic.onrender.com
TTL: Auto
```

### 4.3 Actualizar Código

En `api.php` y `download.php`, añade tu dominio:

```php
$allowedOrigins = [
    'https://raymusic.tudominio.com',
    'https://www.raymusic.tudominio.com'
];
```

Commit y push los cambios.

---

## 🐛 Solución de Problemas

### Error: "API Key no configurada"

**Causa:** Variable de entorno no configurada

**Solución:**
1. Ve a Settings → Environment
2. Verifica que `YOUTUBE_API_KEY` esté configurada
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Error: "yt-dlp: command not found"

**Causa:** yt-dlp no se instaló correctamente

**Solución:**
1. Verifica que el Dockerfile tenga:
   ```dockerfile
   RUN pip3 install --break-system-packages yt-dlp
   ```
2. Redeploy el servicio

### Error: "Timeout" en descargas

**Causa:** Timeout muy corto

**Solución:**
1. Aumenta `MAX_EXECUTION_TIME` a `600` (10 minutos)
2. Redeploy

### Error: "Origen no permitido"

**Causa:** CORS bloqueando tu dominio

**Solución:**
1. Añade tu dominio de Render a `$allowedOrigins` en `api.php`
2. Commit y push

### Descargas lentas

**Causa:** Plan Free de Render tiene recursos limitados

**Solución:**
- Upgrade a plan Starter ($7/mes)
- O usa un servicio de descarga externo

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Instala Render CLI
npm install -g @render-com/cli

# Login
render login

# Ver logs
render logs -f raymusic
```

### Métricas

En el dashboard de Render puedes ver:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 🔄 Actualizaciones

### Despliegue Automático

Render redespliega automáticamente cuando haces push a tu rama principal:

```bash
git add .
git commit -m "Actualización"
git push origin main
```

### Despliegue Manual

1. Ve a tu servicio en Render
2. Click **"Manual Deploy"**
3. Selecciona **"Deploy latest commit"**

---

## 💰 Costos

### Plan Free
- ✅ Gratis
- ⚠️ Se duerme después de 15 minutos de inactividad
- ⚠️ 750 horas/mes
- ⚠️ Recursos limitados

### Plan Starter ($7/mes)
- ✅ Siempre activo
- ✅ Más recursos
- ✅ Sin límite de horas

---

## 🔒 Seguridad en Producción

### Checklist

- [ ] API Key configurada como variable de entorno
- [ ] Dominio añadido a `$allowedOrigins`
- [ ] HTTPS habilitado (automático en Render)
- [ ] Rate limiting configurado
- [ ] Logs de seguridad activos
- [ ] `.env` en `.gitignore`

---

## 📞 Soporte

### Recursos

- [Documentación de Render](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Status de Render](https://status.render.com)

### Problemas Comunes

Si tienes problemas, revisa:
1. Logs del servicio
2. Variables de entorno
3. Configuración de CORS
4. Estado de Render (status.render.com)

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Aplicación carga correctamente
- [ ] Búsqueda de canciones funciona
- [ ] Descarga funciona
- [ ] Modal de progreso funciona
- [ ] No hay errores en logs
- [ ] Dominio personalizado configurado (opcional)
- [ ] Rate limiting probado
- [ ] Seguridad verificada

---

**¡Listo!** Tu aplicación RayMusic está desplegada en Render 🎉

Para cualquier problema, revisa los logs o contacta al soporte de Render.
