#!/usr/bin/env python3
"""
Servidor de descarga de YouTube con Flask

"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import json
import threading
import time
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Directorio temporal
TEMP_DIR = '/tmp'
Path(TEMP_DIR).mkdir(exist_ok=True)

# Almacenar descargas activas
active_downloads = {}

def update_progress(progress_file, percent, status, downloaded='0MB', total='0MB', speed='0KB/s'):
    """Actualiza el archivo de progreso"""
    data = {
        'percent': percent,
        'status': status,
        'downloaded': downloaded,
        'total': total,
        'speed': speed
    }
    try:
        with open(progress_file, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Error actualizando progreso: {e}")

def progress_hook(d, progress_file):
    """Hook de progreso para yt-dlp"""
    if d['status'] == 'downloading':
        try:
            # Calcular porcentaje
            if 'total_bytes' in d:
                total = d['total_bytes']
            elif 'total_bytes_estimate' in d:
                total = d['total_bytes_estimate']
            else:
                total = 0
            
            downloaded = d.get('downloaded_bytes', 0)
            
            if total > 0:
                percent = (downloaded / total) * 100
            else:
                percent = 0
            
            # Formatear tamaños
            downloaded_mb = downloaded / (1024 * 1024)
            total_mb = total / (1024 * 1024)
            
            # Velocidad
            speed = d.get('speed', 0)
            if speed:
                speed_mb = speed / (1024 * 1024)
                speed_str = f"{speed_mb:.2f}MB/s"
            else:
                speed_str = "Calculando..."
            
            # Actualizar progreso
            update_progress(
                progress_file,
                round(percent, 1),
                'downloading',
                f"{downloaded_mb:.1f}MB",
                f"{total_mb:.1f}MB",
                speed_str
            )
            
        except Exception as e:
            print(f"Error en progress_hook: {e}")
    
    elif d['status'] == 'finished':
        try:
            filename = d.get('filename', '')
            if os.path.exists(filename):
                size = os.path.getsize(filename)
                size_mb = size / (1024 * 1024)
                update_progress(
                    progress_file,
                    100,
                    'complete',
                    f"{size_mb:.2f}MB",
                    f"{size_mb:.2f}MB",
                    'Completado'
                )
        except Exception as e:
            print(f"Error al finalizar: {e}")

def download_video(video_url, output_file, progress_file, download_id):
    """Función que ejecuta la descarga en un thread separado"""
    try:
        # Inicializar progreso
        update_progress(progress_file, 5, 'downloading', '0MB', 'Calculando...', 'Iniciando...')
        
        ydl_opts = {
            'format': '140/bestaudio[ext=m4a]',
            'outtmpl': output_file,
            'progress_hooks': [lambda d: progress_hook(d, progress_file)],
            'quiet': False,
            'no_warnings': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
        
        # Verificar que el archivo existe
        if os.path.exists(output_file):
            size = os.path.getsize(output_file)
            if size > 10000:
                size_mb = size / (1024 * 1024)
                update_progress(
                    progress_file,
                    100,
                    'complete',
                    f"{size_mb:.2f}MB",
                    f"{size_mb:.2f}MB",
                    'Completado'
                )
                active_downloads[download_id] = 'complete'
            else:
                update_progress(progress_file, 0, 'error', '0MB', '0MB', 'Archivo muy pequeño')
                active_downloads[download_id] = 'error'
        else:
            update_progress(progress_file, 0, 'error', '0MB', '0MB', 'Archivo no creado')
            active_downloads[download_id] = 'error'
            
    except Exception as e:
        error_msg = str(e)[:50]
        update_progress(progress_file, 0, 'error', '0MB', '0MB', f'Error: {error_msg}')
        active_downloads[download_id] = 'error'
        print(f"ERROR en descarga: {e}")

@app.route('/download.php', methods=['GET'])
def download():
    """Endpoint principal de descarga"""
    action = request.args.get('action')
    
    # Consultar progreso
    if action == 'progress':
        download_id = request.args.get('downloadId')
        if not download_id:
            return jsonify({'percent': 0, 'status': 'starting'})
        
        progress_file = os.path.join(TEMP_DIR, f'progress_{download_id}.txt')
        
        if os.path.exists(progress_file):
            try:
                with open(progress_file, 'r') as f:
                    data = json.load(f)
                return jsonify(data)
            except:
                return jsonify({'percent': 0, 'status': 'starting'})
        else:
            return jsonify({'percent': 0, 'status': 'starting'})
    
    # Servir archivo descargado
    elif action == 'getfile':
        video_id = request.args.get('videoId')
        if not video_id:
            return jsonify({'error': 'No video ID'}), 400
        
        output_file = os.path.join(TEMP_DIR, f'{video_id}.m4a')
        
        if not os.path.exists(output_file):
            return jsonify({'error': 'Archivo no encontrado'}), 404
        
        # Enviar archivo
        response = send_file(
            output_file,
            mimetype='audio/mp4',
            as_attachment=True,
            download_name=f'{video_id}.m4a'
        )
        
        # Limpiar archivos después de enviar
        @response.call_on_close
        def cleanup():
            try:
                os.remove(output_file)
                download_id = request.args.get('downloadId')
                if download_id:
                    progress_file = os.path.join(TEMP_DIR, f'progress_{download_id}.txt')
                    if os.path.exists(progress_file):
                        os.remove(progress_file)
            except:
                pass
        
        return response
    
    # Iniciar descarga
    else:
        video_id = request.args.get('videoId')
        download_id = request.args.get('downloadId')
        
        if not video_id:
            return jsonify({'error': 'No video ID'}), 400
        
        if not download_id:
            download_id = f"dl_{int(time.time() * 1000)}"
        
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        output_file = os.path.join(TEMP_DIR, f'{video_id}.m4a')
        progress_file = os.path.join(TEMP_DIR, f'progress_{download_id}.txt')
        
        # Iniciar descarga en thread separado
        active_downloads[download_id] = 'downloading'
        thread = threading.Thread(
            target=download_video,
            args=(video_url, output_file, progress_file, download_id)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'videoId': video_id,
            'downloadId': download_id,
            'message': 'Descarga iniciada'
        })

@app.route('/api.php', methods=['GET'])
def api():
    """Endpoint de API (para compatibilidad)"""
    api_key = os.environ.get('YOUTUBE_API_KEY', '')
    if not api_key:
        return jsonify({'error': 'API Key no configurada'}), 500
    return jsonify({'apiKey': api_key})

@app.route('/')
def index():
    """Servir index.html"""
    try:
        return send_file('index.html')
    except:
        return "index.html no encontrado", 404

@app.route('/<path:path>')
def static_files(path):
    """Servir archivos estáticos (CSS, JS, imágenes)"""
    try:
        if os.path.exists(path):
            # Determinar tipo MIME
            if path.endswith('.css'):
                return send_file(path, mimetype='text/css')
            elif path.endswith('.js'):
                return send_file(path, mimetype='application/javascript')
            elif path.endswith('.png'):
                return send_file(path, mimetype='image/png')
            elif path.endswith('.jpg') or path.endswith('.jpeg'):
                return send_file(path, mimetype='image/jpeg')
            else:
                return send_file(path)
        return "Not found", 404
    except Exception as e:
        print(f"Error sirviendo archivo {path}: {e}")
        return "Error", 500

if __name__ == '__main__':
    # Instalar yt-dlp si no está instalado
    try:
        import yt_dlp
    except ImportError:
        print("Instalando yt-dlp...")
        os.system('pip3 install yt-dlp')
    
    # Iniciar servidor
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, threaded=True)
