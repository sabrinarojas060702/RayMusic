# RayMusic - Descargador de Música de YouTube

Sistema de descarga de música de YouTube con interfaz web moderna y progreso en tiempo real.

## 🚀 Tecnologías

- **Backend**: Python 3.11 + Flask
- **Descarga**: yt-dlp
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Conversión**: FFmpeg
- **Deploy**: Docker + Render

## 📋 Características

- ✅ Búsqueda de videos en YouTube
- ✅ Descarga de audio en formato M4A
- ✅ Barra de progreso en tiempo real
- ✅ Interfaz moderna y responsive
- ✅ Sin necesidad de base de datos

## 🛠️ Instalación Local

### Requisitos
- Python 3.11+
- FFmpeg

### Pasos

1. Clonar el repositorio
```bash
git clone <tu-repo>
cd raymusic
```

2. Instalar dependencias
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno
```bash
export YOUTUBE_API_KEY="tu_api_key_aqui"
export PORT=8080
```

4. Ejecutar servidor
```bash
python3 download_server.py
```

5. Abrir en navegador
```
http://localhost:8080
```

## 🐳 Deploy con Docker

### Build
```bash
docker build -t raymusic .
```

### Run
```bash
docker run -p 8080:8080 -e YOUTUBE_API_KEY="tu_api_key" raymusic
```

## ☁️ Deploy en Render

1. Conecta tu repositorio a Render
2. Render detectará automáticamente el Dockerfile
3. Configura la variable de entorno `YOUTUBE_API_KEY` en el panel de Render
4. Deploy automático

## 📁 Estructura del Proyecto

```
raymusic/
├── download_server.py    # Servidor Flask principal
├── index.html           # Interfaz web
├── app.js              # Lógica del frontend
├── styles.css          # Estilos
├── config.js           # Configuración del frontend
├── Dockerfile          # Configuración Docker
├── render.yaml         # Configuración Render
├── requirements.txt    # Dependencias Python
└── imagenes/          # Recursos gráficos
```

## 🔧 API Endpoints

### GET /download.php
Endpoint principal de descarga (mantiene compatibilidad con frontend)

**Iniciar descarga:**
```
GET /download.php?videoId=VIDEO_ID&downloadId=DOWNLOAD_ID
```

**Consultar progreso:**
```
GET /download.php?action=progress&downloadId=DOWNLOAD_ID
```

**Descargar archivo:**
```
GET /download.php?action=getfile&videoId=VIDEO_ID
```

### GET /api.php
Obtener API Key de YouTube

## 🔐 Variables de Entorno

- `YOUTUBE_API_KEY`: API Key de YouTube Data API v3 (requerida)
- `PORT`: Puerto del servidor (default: 8080)

## 📝 Notas

- Los archivos temporales se almacenan en `/tmp`
- Las descargas se ejecutan en threads separados
- El progreso se actualiza en tiempo real usando hooks de yt-dlp
- Los archivos se eliminan automáticamente después de la descarga

## 🐛 Troubleshooting

### Error: "API Key no configurada"
Asegúrate de configurar la variable de entorno `YOUTUBE_API_KEY`

### Error: "yt-dlp no encontrado"
Instala yt-dlp: `pip install yt-dlp`

### Error: "FFmpeg no encontrado"
Instala FFmpeg según tu sistema operativo

## 📄 Licencia

MIT
