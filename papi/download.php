<?php
/**
 * 📥 BACKEND DE DESCARGA CON PROGRESO
 * Optimizado para Render con carpeta del sistema /tmp
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
set_time_limit(0); // Sin límite de tiempo
ignore_user_abort(true); // Continuar aunque el usuario cierre la conexión

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Usar carpeta del sistema /tmp (garantizada en Render/Linux)
$tempDir = '/tmp';
if (!file_exists($tempDir)) {
    mkdir($tempDir, 0755, true);
}

// Endpoint para obtener progreso
if (isset($_GET['action']) && $_GET['action'] === 'progress') {
    header('Content-Type: application/json');
    
    $downloadId = $_GET['downloadId'] ?? null;
    if (!$downloadId) {
        echo json_encode(['error' => 'No download ID']);
        exit;
    }
    
    $progressFile = $tempDir . '/download_progress_' . $downloadId . '.json';
    
    if (file_exists($progressFile)) {
        $progress = json_decode(file_get_contents($progressFile), true);
        echo json_encode($progress);
    } else {
        echo json_encode(['percent' => 0, 'status' => 'starting']);
    }
    exit;
}

// Endpoint para SERVIR el archivo descargado
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
    
    // Limpiar cualquier output previo
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    $fileSize = filesize($outputFile);
    
    // Enviar headers
    header('Content-Type: audio/mp4');
    header('Content-Disposition: attachment; filename="' . $videoId . '.m4a"');
    header('Content-Length: ' . $fileSize);
    header('Cache-Control: no-cache');
    header('Pragma: public');
    header('Expires: 0');
    
    // Leer y enviar el archivo
    $handle = fopen($outputFile, 'rb');
    if ($handle) {
        while (!feof($handle)) {
            echo fread($handle, 8192);
            flush();
        }
        fclose($handle);
    }
    
    // Limpiar archivos después de enviarlo
    @unlink($outputFile);
    
    // Limpiar también el archivo de progreso si existe
    $downloadId = $_GET['downloadId'] ?? null;
    if ($downloadId) {
        $progressFile = $tempDir . '/download_progress_' . $downloadId . '.json';
        @unlink($progressFile);
    }
    
    exit;
}

// Endpoint principal - INICIAR descarga
if (!isset($_GET['videoId'])) {
    http_response_code(400);
    die('Error: No video ID');
}

$videoId = $_GET['videoId'];
$downloadId = $_GET['downloadId'] ?? uniqid();
$videoUrl = "https://www.youtube.com/watch?v=" . $videoId;

// Archivos
$progressFile = $tempDir . '/download_progress_' . $downloadId . '.json';
$outputFile = $tempDir . '/' . $videoId . '.m4a';

// Función para actualizar progreso
function updateProgress($file, $percent, $status, $downloaded = '0MB', $total = '0MB', $speed = '0KB/s') {
    @file_put_contents($file, json_encode([
        'percent' => $percent,
        'status' => $status,
        'downloaded' => $downloaded,
        'total' => $total,
        'speed' => $speed
    ]));
}

// Inicializar progreso
updateProgress($progressFile, 0, 'starting');

// Comando yt-dlp optimizado para M4A
$logFile = $tempDir . '/ytdlp_' . $downloadId . '.log';
$cmd = 'yt-dlp -f "140/bestaudio[ext=m4a]" ' .
       '--newline ' .
       '--progress ' .
       '-o ' . escapeshellarg($outputFile) . ' ' .
       escapeshellarg($videoUrl) . ' > ' . escapeshellarg($logFile) . ' 2>&1';

// Ejecutar en segundo plano
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Windows
    pclose(popen('start /B ' . $cmd, 'r'));
} else {
    // Linux/Mac/Render
    exec($cmd . ' > /dev/null 2>&1 &');
}

// Actualizar progreso inicial
updateProgress($progressFile, 5, 'downloading', '0MB', 'Calculando...', 'Iniciando...');

// Monitorear descarga en segundo plano
$startTime = time();
$maxWait = 180; // 3 minutos máximo

while (true) {
    $elapsed = time() - $startTime;
    
    if ($elapsed > $maxWait) {
        updateProgress($progressFile, 0, 'error', '0MB', '0MB', '0KB/s');
        @unlink($progressFile);
        @unlink($logFile);
        http_response_code(500);
        echo json_encode(['error' => 'Timeout']);
        exit;
    }
    
    // Leer log para obtener progreso real
    if (file_exists($logFile)) {
        $log = file_get_contents($logFile);
        
        // Buscar última línea de progreso
        if (preg_match_all('/\[download\]\s+(\d+\.?\d*)%\s+of\s+([\d\.]+[KMG]?i?B)(?:\s+at\s+([\d\.]+[KMG]?i?B\/s))?/m', $log, $matches, PREG_SET_ORDER)) {
            $lastMatch = end($matches);
            $percent = floatval($lastMatch[1]);
            $total = $lastMatch[2] ?? 'Calculando...';
            $speed = $lastMatch[3] ?? 'Calculando...';
            
            $downloaded = round($percent, 1) . '%';
            
            updateProgress($progressFile, $percent, 'downloading', $downloaded, $total, $speed);
        }
    }
    
    // Verificar si terminó
    if (file_exists($outputFile) && filesize($outputFile) > 1000) {
        // Verificar que el archivo no está creciendo (descarga completa)
        clearstatcache();
        $size1 = filesize($outputFile);
        sleep(1);
        clearstatcache();
        $size2 = filesize($outputFile);
        
        if ($size1 === $size2) {
            // Descarga completa
            $fileSize = filesize($outputFile);
            $fileSizeMB = round($fileSize / 1024 / 1024, 2) . 'MB';
            
            updateProgress($progressFile, 100, 'complete', $fileSizeMB, $fileSizeMB, 'Completado');
            
            // Limpiar log
            @unlink($logFile);
            
            // Retornar éxito
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'videoId' => $videoId,
                'message' => 'Descarga completa'
            ]);
            exit;
        }
    }
    
    // Esperar antes de verificar de nuevo
    usleep(500000); // 0.5 segundos
}

exit;
?>
