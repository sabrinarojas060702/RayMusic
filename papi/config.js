// 🔑 CONFIGURACIÓN - La API Key se carga desde variables de entorno
const CONFIG = {
    // La API Key se carga de forma segura (no expongas tu clave aquí)
    YOUTUBE_API_KEY: 'CARGADA_DESDE_SERVIDOR',
    
    // Backend PHP para descargas
    BACKEND_URL: 'download.php',
    
    // Configuración de búsqueda
    MAX_RESULTS: 5,
    VIDEO_CATEGORY: '10' // Categoría de música en YouTube
};

// No modifiques esto
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
