FROM python:3.11-slim

# Instalamos dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements.txt primero (para cache de Docker)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar todos los archivos de la aplicación
COPY . /app/

# Crear carpeta temporal con permisos
RUN mkdir -p /tmp && chmod 777 /tmp

# Dar permisos de ejecución al servidor
RUN chmod +x download_server.py

EXPOSE 8080

# Iniciar servidor Python
CMD ["python3", "download_server.py"]
