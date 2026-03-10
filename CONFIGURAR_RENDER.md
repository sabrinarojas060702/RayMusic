# 🚀 Configurar Variables de Entorno en Render

## Problema
El archivo `.env` no se sube a Render por seguridad, por lo que necesitas configurar las variables de entorno directamente en el panel de Render.

## Solución: Configurar Variable de Entorno en Render

### Paso 1: Acceder a tu servicio en Render
1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Selecciona tu servicio web (raymusic)

### Paso 2: Agregar Variable de Entorno
1. En el menú lateral, haz clic en **"Environment"**
2. Haz clic en **"Add Environment Variable"**
3. Agrega la siguiente variable:
   - **Key:** `YOUTUBE_API_KEY`
   - **Value:** `AIzaSyBDGDk3uFqXYUOFwZYwqGkhNgsE7Z1aoso`
4. Haz clic en **"Save Changes"**

### Paso 3: Redesplegar
Render automáticamente redesplegará tu aplicación con la nueva variable de entorno.

## Verificación
Una vez configurada la variable de entorno, tu aplicación debería funcionar correctamente.

## Nota de Seguridad
⚠️ **IMPORTANTE:** Nunca compartas tu API Key públicamente. La que está en este archivo es solo para tu uso personal.

## Alternativa: Usar archivo .env en Render
Si prefieres, puedes crear el archivo `.env` manualmente en Render usando el Shell:
1. Ve a tu servicio en Render
2. Haz clic en "Shell" en el menú superior
3. Ejecuta:
```bash
echo "YOUTUBE_API_KEY=AIzaSyBDGDk3uFqXYUOFwZYwqGkhNgsE7Z1aoso" > .env
```

Pero la forma recomendada es usar las variables de entorno del panel de Render.
