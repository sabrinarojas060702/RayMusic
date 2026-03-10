<?php
/**
 * 📥 BACKEND DE DESCARGA CON PROGRESO
 * Sistema de descarga con reporte de progreso en tiempo real
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
set_time_limit(300);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Endpoint para obtener progreso
if (isset($_GET['action']) && $_GET['action'] === 'progress') {
    header('Content-Type: application/json');
    
    $downloadId = $_GET['downloadId'] ?? null;
    if (!$downloadId) {
        echo json_encode(['error' => 'No download ID']);
        exit;
    }
    
    $progressFile = sys_get_temp_dir() . '/download_progress_' . $downloadId . '.json';
    
    if (file_exists($progressFile)) {
        $progress = json_decode(file_get_contents($progressFile), true);
        echo json_encode($progress);
    } else {
        echo json_encode(['percent' => 0, 'status' => 'starting']);
    }
    exit;
}

// Endpoint principal de descarga
if (!isset($_GET['videoId'])) {
    http_response_code(400);
    die('Error: No video ID');
}

$videoId = $_GET['videoId'];
$downloadId = $_GET['downloadId'] ?? uniqid();
$videoUrl = "https://www.youtube.com/watch?v=" . $videoId;

// Archivo de progreso
$progressFile = sys_get_temp_dir() . '/download_progress_' . $downloadId . '.json';

// Inicializar progreso
file_put_contents($progressFile, json_encode([
    'percent' => 0,
    'status' => 'starting',
    'downloaded' => '0MB',
    'total' => '0MB',
    'speed' => '0KB/s'
]));

// Nombre de archivo
$filename = $videoId . '.mp3';
$tempFile = sys_get_temp_dir() . '/' . $filename;

// Comando con progreso
$cmd = 'yt-dlp -f "140/bestaudio[ext=m4a]/bestaudio" ' .
       '--newline ' .
       '--progress ' .
       '-o ' . escapeshellarg($tempFile) . ' ' .
       escapeshellarg($videoUrl) . ' 2>&1';

// Ejecutar y capturar progreso
$process = popen($cmd, 'r');

if ($process) {
    while (!feof($process)) {
        $line = fgets($process);
        
        // Parsear línea de progreso de yt-dlp
        if (preg_match('/\[download\]\s+(\d+\.?\d*)%/', $line, $matches)) {
            $percent = floatval($matches[1]);
            
            // Extraer información adicional
            $downloaded = '0MB';
            $total = '0MB';
            $speed = '0KB/s';
            
            if (preg_match('/of\s+([\d\.]+\w+)/', $line, $sizeMatch)) {
                $total = $sizeMatch[1];
            }
            if (preg_match('/([\d\.]+\w+)\s+at\s+([\d\.]+\w+\/s)/', $line, $speedMatch)) {
                $downloaded = $speedMatch[1];
                $speed = $speedMatch[2];
            }
            
            // Actualizar archivo de progreso
            file_put_contents($progressFile, json_encode([
                'percent' => round($percent, 1),
                'status' => 'downloading',
                'downloaded' => $downloaded,
                'total' => $total,
                'speed' => $speed
            ]));
        }
    }
    
    pclose($process);
    
    // Verificar si el archivo se descargó
    if (file_exists($tempFile)) {
        // Actualizar a 100%
        file_put_contents($progressFile, json_encode([
            'percent' => 100,
            'status' => 'complete',
            'downloaded' => filesize($tempFile),
            'total' => filesize($tempFile),
            'speed' => '0KB/s'
        ]));
        
        // Enviar archivo al navegador
        header('Content-Type: audio/mpeg');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($tempFile));
        header('Cache-Control: no-cache');
        
        readfile($tempFile);
        
        // Limpiar archivos temporales
        unlink($tempFile);
        unlink($progressFile);
    } else {
        // Error en descarga
        file_put_contents($progressFile, json_encode([
            'percent' => 0,
            'status' => 'error',
            'error' => 'Download failed'
        ]));
        
        http_response_code(500);
        echo 'Error: Download failed';
    }
} else {
    http_response_code(500);
    echo 'Error: Could not start download';
}

exit;
?>
