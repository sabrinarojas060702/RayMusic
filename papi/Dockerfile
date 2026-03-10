FROM python:3.11-slim

# Instalamos dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Instalamos dependencias de Python
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de la aplicación
COPY . /app/

# Crear carpeta temporal
RUN mkdir -p /tmp && chmod 777 /tmp

# Dar permisos de ejecución al servidor
RUN chmod +x download_server.py

EXPOSE 8080

# Iniciar servidor Python
CMD ["python3", "download_server.py"]
