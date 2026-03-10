<?php
// 🔐 API SEGURA - Carga la API Key desde variables de entorno
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Intentar obtener la API Key de las variables de entorno del sistema primero (Render, Heroku, etc.)
$apiKey = getenv('YOUTUBE_API_KEY') ?: $_ENV['YOUTUBE_API_KEY'] ?? null;

// Si no está en las variables de entorno del sistema, intentar cargar desde .env (desarrollo local)
if (!$apiKey) {
    $envFile = __DIR__ . '/.env';
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                if ($name === 'YOUTUBE_API_KEY') {
                    $apiKey = $value;
                    break;
                }
            }
        }
    }
}

// Verificar si se obtuvo la API Key
if (!$apiKey) {
    http_response_code(500);
    echo json_encode([
        'error' => 'API Key no configurada',
        'message' => 'Por favor configura la variable de entorno YOUTUBE_API_KEY en tu servidor'
    ]);
    exit;
}

// Devolver la API Key
echo json_encode(['apiKey' => $apiKey]);
?>
