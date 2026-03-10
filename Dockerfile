# Dockerfile para RayMusic en Render
FROM php:8.1-apache

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp
RUN pip3 install --break-system-packages yt-dlp

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite headers

# Copiar archivos de la aplicación
COPY . /var/www/html/

# Configurar permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Configurar Apache para permitir .htaccess
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/raymusic.conf \
    && a2enconf raymusic

# Exponer puerto 80
EXPOSE 80

# Comando de inicio
CMD ["apache2-foreground"]
