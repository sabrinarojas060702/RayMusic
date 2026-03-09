# Usamos una imagen de PHP con Apache
FROM php:8.1-apache

# 1. Instalamos Python, yt-dlp y FFMPEG (indispensable para extraer audio MP3)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-setuptools \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 2. Instalamos la última versión de yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Habilitamos el modo de reescritura de Apache
RUN a2enmod rewrite

# 3. Copiamos tus archivos de la carpeta 'papi'
COPY ./papi/ /var/www/html/

# 4. CREAMOS LA CARPETA DE DESCARGAS (Cámbiale el nombre si tu código usa otro)
# Esto evita el Error 500 porque le da permiso al servidor de escribir archivos
RUN mkdir -p /var/www/html/downloads \
    && chown -R www-data:www-data /var/www/html/ \
    && chmod -R 777 /var/www/html/downloads

EXPOSE 80
