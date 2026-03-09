<?php
// 🔐 API SEGURA - Carga la API Key desde variables de entorno
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Cargar variables de entorno desde .env
function cargarEnv() {
    $envFile = __DIR__ . '/.env';
    
    if (!file_exists($envFile)) {
        http_response_code(500);
        echo json_encode(['error' => 'Archivo .env no encontrado']);
        exit;
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

cargarEnv();

// Obtener la API Key de forma segura
$apiKey = $_ENV['YOUTUBE_API_KEY'] ?? null;

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'API Key no configurada']);
    exit;
}

// Devolver la API Key solo a solicitudes del mismo dominio
echo json_encode(['apiKey' => $apiKey]);
?>
