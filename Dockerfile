FROM php:8.1-apache

# Instalamos Python, yt-dlp y FFMPEG para el audio
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Bajamos yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

RUN a2enmod rewrite

# Copiamos tus archivos de la carpeta papi
COPY ./papi/ /var/www/html/

# CREAMOS LA CARPETA TEMPORAL CON PERMISOS
RUN mkdir -p /var/www/html/temp \
    && chown -R www-data:www-data /var/www/html/ \
    && chmod -R 777 /var/www/html/temp

EXPOSE 80
