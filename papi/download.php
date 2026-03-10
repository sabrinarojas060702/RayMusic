<?php
/**
 * 📥 BACKEND DE DESCARGA - VERSIÓN SIMPLIFICADA
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
set_time_limit(0);
ignore_user_abort(true);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
$tempDir = $isWindows ? sys_get_temp_dir() : '/tmp';

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
    
    $progressFile = $tempDir . DIRECTORY_SEPARATOR . 'progress_' . $downloadId . '.txt';
    
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
    
    $outputFile = $tempDir . DIRECTORY_SEPARATOR . $videoId . '.m4a';
    
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
        $progressFile = $tempDir . DIRECTORY_SEPARATOR . 'progress_' . $downloadId . '.txt';
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

$progressFile = $tempDir . DIRECTORY_SEPARATOR . 'progress_' . $downloadId . '.txt';
$outputFile = $tempDir . DIRECTORY_SEPARATOR . $videoId . '.m4a';
$logFile = $tempDir . DIRECTORY_SEPARATOR . 'ytdlp_' . $downloadId . '.log';

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

// Comando yt-dlp con progreso
$cmd = 'yt-dlp -f "140/bestaudio[ext=m4a]" --newline -o ' . 
       escapeshellarg($outputFile) . ' ' . 
       escapeshellarg($videoUrl) . ' 2>&1';

// Ejecutar comando y capturar salida en tiempo real
if ($isWindows) {
    $process = popen($cmd, 'r');
} else {
    $process = popen($cmd, 'r');
}

if (!$process) {
    updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Error al iniciar');
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo iniciar la descarga']);
    exit;
}

$lastPercent = 5;
$startTime = time();
$maxWait = 300;

// Leer salida línea por línea
while (!feof($process)) {
    $line = fgets($process);
    
    if ($line === false) {
        break;
    }
    
    // Timeout
    if ((time() - $startTime) > $maxWait) {
        pclose($process);
        updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Timeout');
        @unlink($progressFile);
        @unlink($outputFile);
        http_response_code(500);
        echo json_encode(['error' => 'Timeout']);
        exit;
    }
    
    // Buscar líneas de progreso
    if (preg_match('/\[download\]\s+(\d+\.?\d*)%\s+of\s+([\d\.]+[KMG]?i?B)(?:\s+at\s+([\d\.]+[KMG]?i?B\/s))?/', $line, $matches)) {
        $percent = floatval($matches[1]);
        $total = $matches[2] ?? 'Calculando...';
        $speed = $matches[3] ?? 'Calculando...';
        
        if (abs($percent - $lastPercent) >= 1) {
            updateProgress($progressFile, $percent, 'downloading', round($percent, 1) . '%', $total, $speed);
            $lastPercent = $percent;
        }
    }
}

pclose($process);

// Verificar si el archivo existe y está completo
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
    echo json_encode(['error' => 'Error en descarga']);
}

exit;
?>
