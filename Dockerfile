# Usamos una imagen de PHP con Apache
FROM php:8.1-apache

# Instalamos Python y yt-dlp (la fábrica de descargas)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Habilitamos el modo de reescritura de Apache para el .htaccess
RUN a2enmod rewrite

# Copiamos tus archivos al servidor
COPY ./papi/ /var/www/html/

# Damos permisos a la carpeta
RUN chown -R www-data:www-data /var/www/html/

EXPOSE 80
