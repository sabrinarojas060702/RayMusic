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

// Comando yt-dlp - ejecutar en background y guardar log
$cmd = 'yt-dlp -f "140/bestaudio[ext=m4a]" --newline -o ' . 
       escapeshellarg($outputFile) . ' ' . 
       escapeshellarg($videoUrl) . ' > ' . 
       escapeshellarg($logFile) . ' 2>&1 &';

exec($cmd);

// Dar tiempo para que inicie
sleep(1);

// Monitorear el log en un bucle
$startTime = time();
$maxWait = 300;
$lastPercent = 5;
$noProgressCount = 0;

while (true) {
    $elapsed = time() - $startTime;
    
    // Timeout
    if ($elapsed > $maxWait) {
        updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Timeout');
        @unlink($progressFile);
        @unlink($logFile);
        @unlink($outputFile);
        http_response_code(500);
        echo json_encode(['error' => 'Timeout']);
        exit;
    }
    
    // Leer log si existe
    if (file_exists($logFile)) {
        clearstatcache(true, $logFile);
        $log = @file_get_contents($logFile);
        
        if ($log !== false && !empty($log)) {
            // Buscar todas las líneas de progreso
            if (preg_match_all('/\[download\]\s+(\d+\.?\d*)%\s+of\s+([\d\.]+[KMG]?i?B)(?:\s+at\s+([\d\.]+[KMG]?i?B\/s))?/m', $log, $matches, PREG_SET_ORDER)) {
                $lastMatch = end($matches);
                $percent = floatval($lastMatch[1]);
                $total = $lastMatch[2] ?? 'Calculando...';
                $speed = $lastMatch[3] ?? 'Calculando...';
                
                if (abs($percent - $lastPercent) >= 0.5) {
                    updateProgress($progressFile, $percent, 'downloading', round($percent, 1) . '%', $total, $speed);
                    $lastPercent = $percent;
                    $noProgressCount = 0;
                } else {
                    $noProgressCount++;
                }
            }
            
            // Verificar si hay error en el log
            if (stripos($log, 'ERROR') !== false || stripos($log, 'error:') !== false) {
                updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Error en descarga');
                @unlink($progressFile);
                @unlink($logFile);
                @unlink($outputFile);
                http_response_code(500);
                echo json_encode(['error' => 'Error en descarga']);
                exit;
            }
        }
    }
    
    // Verificar si el archivo de salida existe y está completo
    if (file_exists($outputFile)) {
        clearstatcache(true, $outputFile);
        $fileSize = @filesize($outputFile);
        
        if ($fileSize && $fileSize > 10000) {
            // Verificar que no está creciendo (descarga completa)
            $size1 = $fileSize;
            sleep(2);
            clearstatcache(true, $outputFile);
            $size2 = @filesize($outputFile);
            
            if ($size1 === $size2) {
                // Descarga completa
                $fileSizeMB = round($fileSize / 1024 / 1024, 2) . 'MB';
                updateProgress($progressFile, 100, 'complete', $fileSizeMB, $fileSizeMB, 'Completado');
                @unlink($logFile);
                
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'videoId' => $videoId,
                    'downloadId' => $downloadId,
                    'message' => 'Descarga completa'
                ]);
                exit;
            }
        }
    }
    
    // Si no hay progreso por mucho tiempo, verificar si el proceso murió
    if ($noProgressCount > 20) {
        updateProgress($progressFile, 0, 'error', '0MB', '0MB', 'Proceso detenido');
        @unlink($progressFile);
        @unlink($logFile);
        @unlink($outputFile);
        http_response_code(500);
        echo json_encode(['error' => 'Proceso detenido']);
        exit;
    }
    
    usleep(500000); // 0.5 segundos
}

exit;
?>
