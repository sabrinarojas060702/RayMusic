<?php
/**
 * 📥 BACKEND DE DESCARGA - VERSIÓN PARA RENDER
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
set_time_limit(0);
ignore_user_abort(true);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$tempDir = '/tmp';

// ==========================================
// ENDPOINT: Consultar progreso
// ==========================================
if (isset($_GET['action']) && $_GET['action'] === 'progress') {
    header('Content-Type: application/json');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    $downloadId = $_GET['downloadId'] ?? null;
    if (!$downloadId) {
        echo json_encode(['percent' => 0, 'status' => 'starting']);
        exit;
    }
    
    $progressFile = $tempDir . '/progress_' . $downloadId . '.txt';
    
    clearstatcache(true, $progressFile);
    
    if (file_exists($progressFile)) {
        $content = @file_get_contents($progressFile);
        if ($content !== false && !empty($content)) {
            echo $content;
        } else {
            echo json_encode(['percent' => 0, 'status' => 'starting']);
        }
    } else {
        echo json_encode(['percent' => 0, 'status' => 'starting']);
    }
    exit;
}

// ==========================================
// ENDPOINT: Servir archivo descargado
// ==========================================
if (isset($_GET['action']) && $_GET['action'] === 'getfile') {
    $videoId = $_GET['videoId'] ?? null;
    if (!$videoId) {
        http_response_code(400);
        die('Error: No video ID');
    }
    
    $outputFile = $tempDir . '/' . $videoId . '.m4a';
    
    if (!file_exists($outputFile)) {
        http_response_code(404);
        die('Error: Archivo no encontrado');
    }
    
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    clearstatcache(true, $outputFile);
    $fileSize = filesize($outputFile);
    
    header('Content-Type: audio/mp4');
    header('Content-Disposition: attachment; filename="' . $videoId . '.m4a"');
    header('Content-Length: ' . $fileSize);
    header('Cache-Control: no-cache');
    header('Pragma: public');
    header('Expires: 0');
    
    readfile($outputFile);
    
    @unlink($outputFile);
    
    $downloadId = $_GET['downloadId'] ?? null;
    if ($downloadId) {
        $progressFile = $tempDir . '/progress_' . $downloadId . '.txt';
        @unlink($progressFile);
    }
    
    exit;
}

// ==========================================
// ENDPOINT: Iniciar descarga
// ==========================================
if (!isset($_GET['videoId'])) {
    http_response_code(400);
    die('Error: No video ID');
}

$videoId = $_GET['videoId'];
$downloadId = $_GET['downloadId'] ?? uniqid();
$videoUrl = "https://www.youtube.com/watch?v=" . $videoId;

$progressFile = $tempDir . '/progress_' . $downloadId . '.txt';
$outputFile = $tempDir . '/' . $videoId . '.m4a';
$logFile = $tempDir . '/ytdlp_' . $downloadId . '.log';

// Función para actualizar progreso
function updateProgress($file, $percent, $status, $downloaded = '0MB', $total = '0MB', $speed = '0KB/s') {
    $data = json_encode([
        'percent' => $percent,
        'status' => $status,
        'downloaded' => $downloaded,
        'total' => $total,
        'speed' => $speed
    ]);
    @file_put_contents($file, $data, LOCK_EX);
    clearstatcache(true, $file);
}

// Inicializar progreso
updateProgress($progressFile, 5, 'downloading', '0MB', 'Calculando...', 'Iniciando...');

// Comando yt-dlp - ejecutar de forma síncrona pero con progreso en archivo
$cmd = 'yt-dlp -f "140/bestaudio[ext=m4a]" --newline --progress-template "download:%(progress.downloaded_bytes)s %(progress.total_bytes)s %(progress.speed)s %(progress.eta)s" -o ' . 
       escapeshellarg($outputFile) . ' ' . 
       escapeshellarg($videoUrl) . ' 2>&1';

// Ejecutar y capturar salida completa
$output = shell_exec($cmd);

// Verificar si el archivo existe
if (file_exists($outputFile)) {
    clearstatcache(true, $outputFile);
    $fileSize = @filesize($outputFile);
    
    if ($fileSize && $fileSize > 10000) {
        $fileSizeMB = round($fileSize / 1024 / 1024, 2) . 'MB';
        updateProgress($progressFile, 100, 'complete', $fileSizeMB, $fileSizeMB, 'Completado');
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'videoId' => $videoId,
            'downloadId' => $downloadId,
            'message' => 'Descarga completa'
        ]);
    } else {
        updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Archivo incompleto');
        @unlink($outputFile);
        http_response_code(500);
        echo json_encode(['error' => 'Archivo incompleto']);
    }
} else {
    updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Error en descarga');
    http_response_code(500);
    echo json_encode(['error' => 'Error en descarga: ' . substr($output, 0, 200)]);
}

exit;
?>
