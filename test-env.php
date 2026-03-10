<?php
// 🔍 TEST - Verificar variables de entorno
header('Content-Type: application/json');

$resultado = [
    'servidor' => $_SERVER['SERVER_NAME'] ?? 'desconocido',
    'metodo_getenv' => getenv('YOUTUBE_API_KEY') ? 'ENCONTRADA ✅' : 'NO ENCONTRADA ❌',
    'metodo_env' => isset($_ENV['YOUTUBE_API_KEY']) ? 'ENCONTRADA ✅' : 'NO ENCONTRADA ❌',
    'archivo_env_existe' => file_exists(__DIR__ . '/.env') ? 'SÍ ✅' : 'NO ❌',
    'directorio_actual' => __DIR__
];

// Intentar leer .env si existe
if (file_exists(__DIR__ . '/.env')) {
    $envContent = file_get_contents(__DIR__ . '/.env');
    $resultado['contenido_env'] = substr($envContent, 0, 50) . '...';
}

// Mostrar valor parcial de la API Key (solo primeros y últimos caracteres por seguridad)
$apiKey = getenv('YOUTUBE_API_KEY') ?: $_ENV['YOUTUBE_API_KEY'] ?? null;
if ($apiKey) {
    $resultado['api_key_preview'] = substr($apiKey, 0, 10) . '...' . substr($apiKey, -5);
}

echo json_encode($resultado, JSON_PRETTY_PRINT);
?>
