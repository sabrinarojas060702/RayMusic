// 🎵 RayMusic - Aplicación principal

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
            const response = await fetch('/api/key');
            const data = await response.json();
            
            if (data.error) {
                alert('⚠️ Error: ' + data.error);
                console.error('❌ Error al cargar API Key');
                return null;
            }
            
            apiKey = data.apiKey;
        } catch (error) {
            alert('⚠️ Error: No se pudo cargar la configuración de API.');
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
            <div style="display: flex; gap: 8px;">
                <button class="y2mate-btn" onclick="abrirEnY2Mate('${videoId}')" title="Abrir en Y2Mate">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </button>
            </div>
        `;
        
        modalContent.appendChild(videoCard);
    });
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

// ============================================
// 🛠️ UTILIDADES
// ============================================

function extraerVideoId(texto) {
    const patrones = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const patron of patrones) {
        const match = texto.match(patron);
        if (match) return match[1];
    }
    return null;
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
            agregarAlHistorial(input);
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
    
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// ============================================
// ✅ INICIALIZACIÓN
// ============================================

renderizarHistorial();
setInterval(renderizarHistorial, 60000);


// ============================================
// 🔗 INTEGRACIÓN CON Y2MATE
// ============================================

function abrirEnY2Mate(videoId) {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Copiar link al portapapeles
    navigator.clipboard.writeText(youtubeUrl).then(() => {
        mostrarToast('🔗 Link copiado al portapapeles');
    }).catch(() => {
        // Fallback por si el navegador bloquea clipboard
        const ta = document.createElement('textarea');
        ta.value = youtubeUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        mostrarToast('🔗 Link copiado al portapapeles');
    });

    // Abrir Y2Mate con el link
    const url = `https://y2mate.nu/es/?url=${encodeURIComponent(youtubeUrl)}`;
    window.open(url, '_blank');
}

function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, #8C93F1, #d26cec);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 99999;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(140,147,241,0.4);
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}


// ============================================
// 🕓 HISTORIAL DE BÚSQUEDAS (localStorage)
// ============================================

const HISTORIAL_KEY = 'raymusic_historial';
const MAX_HISTORIAL = 20;

function cargarHistorial() {
    try {
        return JSON.parse(localStorage.getItem(HISTORIAL_KEY)) || [];
    } catch {
        return [];
    }
}

function guardarHistorial(lista) {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(lista));
}

function agregarAlHistorial(query) {
    let lista = cargarHistorial();
    // Evitar duplicados (mover al frente si ya existe)
    lista = lista.filter(item => item.texto.toLowerCase() !== query.toLowerCase());
    lista.unshift({ texto: query, fecha: Date.now() });
    if (lista.length > MAX_HISTORIAL) lista = lista.slice(0, MAX_HISTORIAL);
    guardarHistorial(lista);
    renderizarHistorial();
}

function eliminarDelHistorial(index) {
    const lista = cargarHistorial();
    lista.splice(index, 1);
    guardarHistorial(lista);
    renderizarHistorial();
}

function tiempoRelativo(timestamp) {
    const diff = Date.now() - timestamp;
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (min < 1)  return 'ahora';
    if (min < 60) return `hace ${min}m`;
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${dias}d`;
}

function renderizarHistorial() {
    const lista = cargarHistorial();
    const contenedor = document.getElementById('historialLista');

    if (!lista.length) {
        contenedor.innerHTML = '<p class="historial-vacio">Aún no has buscado nada. ¡Empieza buscando tu canción favorita!</p>';
        return;
    }

    contenedor.innerHTML = lista.map((item, i) => `
        <div class="historial-item" data-index="${i}">
            <svg class="hist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span class="hist-texto" title="${item.texto}">${item.texto}</span>
            <span class="hist-tiempo">${tiempoRelativo(item.fecha)}</span>
            <button class="hist-delete" title="Eliminar" onclick="event.stopPropagation(); eliminarDelHistorial(${i})">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');

    // Click en item → rellenar búsqueda y buscar
    contenedor.querySelectorAll('.historial-item').forEach(el => {
        el.addEventListener('click', () => {
            const texto = lista[parseInt(el.dataset.index)].texto;
            searchInput.value = texto;
            handleSearch();
        });
    });
}

// Limpiar todo
document.getElementById('clearHistory').addEventListener('click', () => {
    guardarHistorial([]);
    renderizarHistorial();
});

// Inicializar historial al cargar
renderizarHistorial();

// Actualizar tiempos cada minuto
setInterval(renderizarHistorial, 60000);
