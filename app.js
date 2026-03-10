// 🎵 APLICACIÓN PRINCIPAL - Búsqueda en YouTube + Redirección a Y2Mate

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const modal = document.getElementById('resultsModal');
const modalContent = document.getElementById('modalResults');
const closeModal = document.getElementById('closeModal');

// Variables globales
let apiKey = null;

// ============================================
// 🎨 ANIMACIONES Y UI
// ============================================

searchInput.addEventListener('input', (e) => {
    searchInput.style.borderColor = e.target.value.length > 0 ? '#5B9FFF' : 'transparent';
});

function animarBoton() {
    searchButton.style.transform = 'translateY(-50%) scale(0.9)';
    setTimeout(() => {
        searchButton.style.transform = 'translateY(-50%) scale(1)';
    }, 150);
}

function animarError() {
    searchInput.style.animation = 'shake 0.5s';
    setTimeout(() => searchInput.style.animation = '', 500);
}

function mostrarCargando(mostrar) {
    if (mostrar) {
        searchButton.innerHTML = `
            <svg class="search-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
            </svg>
        `;
    } else {
        searchButton.innerHTML = `
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
        `;
    }
}

// ============================================
// 🔍 BÚSQUEDA EN YOUTUBE
// ============================================

async function buscarEnYouTube(query) {
    // Cargar API Key de forma segura si no está cargada
    if (!apiKey) {
        try {
            const response = await fetch('api.php');
            const data = await response.json();
            
            if (data.error) {
                alert('⚠️ Error: ' + data.error);
                console.error('❌ Error al cargar API Key');
                return null;
            }
            
            apiKey = data.apiKey;
        } catch (error) {
            alert('⚠️ Error: No se pudo cargar la configuración de API.\n\nVerifica que el servidor PHP esté funcionando.');
            console.error('❌ Error al cargar API Key:', error);
            return null;
        }
    }
    
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet` +
            `&q=${encodeURIComponent(query)}` +
            `&type=video` +
            `&videoCategoryId=${CONFIG.VIDEO_CATEGORY}` +
            `&maxResults=${CONFIG.MAX_RESULTS}` +
            `&key=${apiKey}`;
        
        console.log('🔍 Buscando en YouTube:', query);
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Verificar errores de la API
        if (data.error) {
            console.error('❌ Error de YouTube API:', data.error);
            
            if (data.error.code === 403) {
                alert('⚠️ Error de API Key:\n\n' + data.error.message + '\n\nVerifica que:\n1. La API Key sea correcta\n2. YouTube Data API v3 esté habilitada\n3. No hayas excedido la cuota diaria');
            } else {
                alert('❌ Error: ' + data.error.message);
            }
            
            return null;
        }
        
        // Verificar resultados
        if (!data.items || data.items.length === 0) {
            alert('😕 No se encontró la canción.\n\nIntenta con:\n- Nombre más específico\n- Incluir el artista\n- Verificar la ortografía');
            return null;
        }
        
        console.log('✅ Encontrados:', data.items.length, 'resultados');
        
        return data.items;
        
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        alert('❌ Error de conexión.\n\nVerifica tu internet e intenta de nuevo.');
        return null;
    }
}

// ============================================
// 📺 MOSTRAR RESULTADOS EN MODAL
// ============================================

function mostrarResultados(videos) {
    modalContent.innerHTML = '';
    
    videos.forEach(video => {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const thumbnail = video.snippet.thumbnails.medium.url;
        const channel = video.snippet.channelTitle;
        
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <img src="${thumbnail}" alt="${title}">
            <div class="video-info">
                <h3>${title}</h3>
                <p>${channel}</p>
            </div>
            <button class="download-btn" onclick="descargarCancion('${videoId}', '${title.replace(/'/g, "\\'")}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Descargar
            </button>
        `;
        
        modalContent.appendChild(videoCard);
    });
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

// ============================================
// 📥 REDIRIGIR A Y2MATE PARA DESCARGA
// ============================================

// Función para mostrar notificaciones
function mostrarNotificacion(titulo, mensaje, tipo = 'success') {
    // Crear notificación
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10001;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.4s ease, fadeOut 0.4s ease 3.6s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    notificacion.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
            <div style="font-size: 24px; line-height: 1;">${tipo === 'success' ? '✅' : '⚠️'}</div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 1rem; margin-bottom: 5px;">${titulo}</div>
                <div style="font-size: 0.85rem; opacity: 0.95; line-height: 1.4;">${mensaje}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 4000);
}

async function descargarCancion(videoId, title) {
    try {
        console.log('🔗 Preparando descarga:', videoId);

        // Construir URL de YouTube
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Copiar URL al portapapeles
        try {
            await navigator.clipboard.writeText(youtubeUrl);
            console.log('✅ URL copiada al portapapeles');
            
            // Mostrar notificación de éxito
            mostrarNotificacion('✅ Enlace copiado', 'Pega el enlace en Y2Mate (Ctrl+V)', 'success');
        } catch (clipboardError) {
            console.error('⚠️ No se pudo copiar al portapapeles:', clipboardError);
            mostrarNotificacion('⚠️ Copia manualmente', youtubeUrl, 'warning');
        }

        // Abrir Y2Mate en nueva pestaña
        setTimeout(() => {
            window.open('https://v1.y2mate.nu/es/', '_blank');
            console.log('✅ Y2Mate abierto');
        }, 500);

    } catch (error) {
        console.error('❌ Error al redirigir:', error);
        alert('❌ Error al abrir Y2Mate: ' + error.message);
    }
}




// ============================================
// 🎯 MANEJADOR PRINCIPAL
// ============================================

async function handleSearch() {
    const input = searchInput.value.trim();
    
    if (!input) {
        animarError();
        return;
    }
    
    animarBoton();
    mostrarCargando(true);
    
    try {
        const videos = await buscarEnYouTube(input);
        
        if (videos && videos.length > 0) {
            mostrarResultados(videos);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Ocurrió un error. Intenta de nuevo.');
    } finally {
        mostrarCargando(false);
    }
}

// ============================================
// 🎧 EVENT LISTENERS
// ============================================

searchButton.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
});

// ============================================
// 🎨 ESTILOS ADICIONALES
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// ============================================
// ✅ INICIALIZACIÓN
// ============================================

console.log('🎵 Sistema de búsqueda de música cargado');
console.log('⚙️ Configuración:');
console.log('  - API Key: 🔐 Cargada de forma segura desde .env');
console.log('  - Descarga: Redirige a Y2Mate');
console.log('💡 Listo para usar!');
