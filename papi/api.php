<?php
/**
 * 🔐 API SIMPLE - Compatible con .env y variables de entorno
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Cargar variables de entorno (opcional)
function cargarEnv() {
    $envFile = __DIR__ . '/.env';
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $key = trim($name);
                $val = trim($value);
                if (!isset($_ENV[$key]) && !getenv($key)) {
                    $_ENV[$key] = $val;
                    putenv("$key=$val");
                }
            }
        }
    }
}

cargarEnv();

// Obtener API Key (desde .env o variables de entorno del sistema)
$apiKey = $_ENV['YOUTUBE_API_KEY'] ?? getenv('YOUTUBE_API_KEY') ?? null;

if (!$apiKey) {
    http_response_code(500);
    echo json_encode([
        'error' => 'API Key no configurada',
        'hint' => 'Configura YOUTUBE_API_KEY en .env o variables de entorno'
    ]);
    exit;
}

// Devolver API Key
echo json_encode(['apiKey' => $apiKey]);
?>
