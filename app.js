// 🎵 APLICACIÓN PRINCIPAL - Sistema completo con API + PHP Backend

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
// 📥 DESCARGA CON PROGRESO EN TIEMPO REAL
// ============================================

async function descargarCancion(videoId, title) {
    try {
        console.log('📥 Iniciando descarga:', videoId);
        
        // Generar ID único para esta descarga
        const downloadId = 'dl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Encontrar el botón específico
        const buttons = document.querySelectorAll('.download-btn');
        let targetButton = null;
        buttons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(videoId)) {
                targetButton = btn;
            }
        });
        
        if (targetButton) {
            targetButton.disabled = true;
        }
        
        // Crear modal de progreso
        mostrarModalProgreso(videoId, title, downloadId, targetButton);
        
        // INICIAR descarga en el servidor (sin descargar aún)
        fetch(`download.php?videoId=${videoId}&downloadId=${downloadId}`)
            .then(response => response.json())
            .then(data => {
                console.log('✅ Descarga completada en servidor:', data);
            })
            .catch(error => {
                console.error('❌ Error en descarga:', error);
            });
        
        // Monitorear progreso
        monitorearProgreso(downloadId, videoId, targetButton);
        
        console.log('✅ Descarga iniciada con ID:', downloadId);
        
    } catch (error) {
        console.error('❌ Error en descarga:', error);
        alert('❌ Error al descargar: ' + error.message);
    }
}

// ============================================
// 📊 MODAL DE PROGRESO
// ============================================

function mostrarModalProgreso(videoId, title, downloadId, targetButton) {
    // Crear overlay
    const progressOverlay = document.createElement('div');
    progressOverlay.id = 'progressOverlay_' + downloadId;
    progressOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    // Crear contenedor de progreso
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
        background: white;
        border-radius: 25px;
        padding: 35px 40px;
        width: 90%;
        max-width: 480px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: slideUp 0.4s ease;
    `;
    
    progressContainer.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 15px;">
                <svg style="width: 60px; height: 60px; margin: 0 auto;" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" stroke-width="2">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#8C93F1;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#d26cec;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </div>
            
            <h2 style="margin: 0 0 8px 0; font-size: 1.4rem; color: #333;">Descargando</h2>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 0.85rem; max-height: 40px; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">${title}</p>
            
            <!-- Barra de progreso circular -->
            <div style="position: relative; width: 160px; height: 160px; margin: 0 auto 20px;">
                <svg style="transform: rotate(-90deg);" width="160" height="160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#e0e0e0" stroke-width="10"/>
                    <circle id="progressCircle_${downloadId}" cx="80" cy="80" r="70" fill="none" 
                            stroke="url(#gradient)" stroke-width="10" 
                            stroke-dasharray="439.82" stroke-dashoffset="439.82"
                            style="transition: stroke-dashoffset 0.3s ease;"/>
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <div id="progressPercent_${downloadId}" style="font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #8C93F1, #d26cec); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">0%</div>
                    <div id="progressStatus_${downloadId}" style="font-size: 0.8rem; color: #999; margin-top: 2px;">Iniciando...</div>
                </div>
            </div>
            
            <!-- Información adicional -->
            <div style="background: #f8f9fa; border-radius: 12px; padding: 12px 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #666; font-size: 0.8rem;">Descargado:</span>
                    <span id="progressDownloaded_${downloadId}" style="color: #333; font-weight: 600; font-size: 0.8rem;">0 MB</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #666; font-size: 0.8rem;">Total:</span>
                    <span id="progressTotal_${downloadId}" style="color: #333; font-weight: 600; font-size: 0.8rem;">-- MB</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #666; font-size: 0.8rem;">Velocidad:</span>
                    <span id="progressSpeed_${downloadId}" style="color: #333; font-weight: 600; font-size: 0.8rem;">-- KB/s</span>
                </div>
            </div>
            
            <button id="cancelBtn_${downloadId}" style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
                color: white;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.95rem;
            " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                Cancelar
            </button>
        </div>
    `;
    
    progressOverlay.appendChild(progressContainer);
    document.body.appendChild(progressOverlay);
    
    // Botón cancelar
    document.getElementById('cancelBtn_' + downloadId).addEventListener('click', () => {
        cerrarModalProgreso(downloadId, targetButton);
    });
}

// ============================================
// 📡 MONITOREAR PROGRESO
// ============================================

async function monitorearProgreso(downloadId, videoId, targetButton) {
    const maxIntentos = 300; // 5 minutos máximo
    let intentos = 0;
    let ultimoPorcentaje = 0;
    let sinCambios = 0;
    
    const interval = setInterval(async () => {
        intentos++;
        
        if (intentos > maxIntentos) {
            clearInterval(interval);
            mostrarError(downloadId, 'Tiempo de espera agotado');
            return;
        }
        
        try {
            const response = await fetch(`download.php?action=progress&downloadId=${downloadId}`);
            const data = await response.json();
            
            if (data.error) {
                clearInterval(interval);
                mostrarError(downloadId, data.error);
                return;
            }
            
            // Actualizar UI
            actualizarProgreso(downloadId, data);
            
            // Detectar si el progreso se estancó
            if (data.percent === ultimoPorcentaje && data.percent > 0) {
                sinCambios++;
            } else {
                sinCambios = 0;
                ultimoPorcentaje = data.percent;
            }
            
            // Si completó
            if (data.status === 'complete' || data.percent >= 100) {
                clearInterval(interval);
                
                // Asegurar que muestre 100%
                actualizarProgreso(downloadId, {
                    percent: 100,
                    status: 'complete',
                    downloaded: 'Completado',
                    total: 'Completado',
                    speed: 'Completado'
                });
                
                // Mostrar éxito
                setTimeout(() => {
                    mostrarExito(downloadId);
                    
                    // DESCARGAR el archivo al navegador
                    setTimeout(() => {
                        const downloadLink = document.createElement('a');
                        downloadLink.href = `download.php?action=getfile&videoId=${videoId}`;
                        downloadLink.download = videoId + '.m4a';
                        downloadLink.style.display = 'none';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        
                        // Limpiar después de 1 segundo
                        setTimeout(() => {
                            downloadLink.remove();
                            cerrarModalProgreso(downloadId, targetButton);
                        }, 1000);
                    }, 1500);
                }, 300);
            }
            
            // Si hubo error
            if (data.status === 'error') {
                clearInterval(interval);
                mostrarError(downloadId, data.error || 'Error desconocido');
            }
            
        } catch (error) {
            console.error('Error al obtener progreso:', error);
        }
    }, 1000); // Actualizar cada segundo
}

// ============================================
// 🎨 ACTUALIZAR UI DE PROGRESO
// ============================================

function actualizarProgreso(downloadId, data) {
    const percent = data.percent || 0;
    const circumference = 439.82; // 2 * PI * 70
    const offset = circumference - (percent / 100) * circumference;
    
    // Actualizar círculo
    const circle = document.getElementById('progressCircle_' + downloadId);
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }
    
    // Actualizar porcentaje
    const percentEl = document.getElementById('progressPercent_' + downloadId);
    if (percentEl) {
        percentEl.textContent = Math.round(percent) + '%';
    }
    
    // Actualizar estado
    const statusEl = document.getElementById('progressStatus_' + downloadId);
    if (statusEl) {
        const statusText = {
            'starting': 'Iniciando...',
            'downloading': 'Descargando...',
            'complete': '¡Completado!',
            'error': 'Error'
        };
        statusEl.textContent = statusText[data.status] || 'Procesando...';
    }
    
    // Actualizar información
    const downloadedEl = document.getElementById('progressDownloaded_' + downloadId);
    if (downloadedEl) {
        downloadedEl.textContent = data.downloaded || '0 MB';
    }
    
    const totalEl = document.getElementById('progressTotal_' + downloadId);
    if (totalEl) {
        totalEl.textContent = data.total || '-- MB';
    }
    
    const speedEl = document.getElementById('progressSpeed_' + downloadId);
    if (speedEl) {
        speedEl.textContent = data.speed || '-- KB/s';
    }
}

// ============================================
// ✅ MOSTRAR ÉXITO
// ============================================

function mostrarExito(downloadId) {
    const overlay = document.getElementById('progressOverlay_' + downloadId);
    if (overlay) {
        overlay.querySelector('div > div').innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="margin-bottom: 20px;">
                    <svg style="width: 100px; height: 100px; margin: 0 auto;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                        <circle cx="12" cy="12" r="10" style="animation: scaleIn 0.3s ease;"></circle>
                        <path d="M9 12l2 2 4-4" style="animation: checkmark 0.5s ease 0.2s both;"></path>
                    </svg>
                </div>
                <h2 style="margin: 0 0 10px 0; font-size: 1.8rem; color: #10b981; animation: fadeIn 0.5s ease;">¡Descarga Completa!</h2>
                <p style="margin: 0 0 5px 0; color: #666; font-size: 1rem; animation: fadeIn 0.5s ease 0.1s both;">Tu música está lista</p>
                <p style="margin: 0; color: #999; font-size: 0.85rem; animation: fadeIn 0.5s ease 0.2s both;">Revisa tu carpeta de descargas</p>
            </div>
        `;
        
        // Añadir animaciones CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scaleIn {
                from { transform: scale(0); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes checkmark {
                from { stroke-dasharray: 0, 100; }
                to { stroke-dasharray: 100, 100; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// ❌ MOSTRAR ERROR
// ============================================

function mostrarError(downloadId, mensaje) {
    const overlay = document.getElementById('progressOverlay_' + downloadId);
    if (overlay) {
        overlay.querySelector('div > div').innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
                <svg style="width: 80px; height: 80px; margin: 0 auto 15px;" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h2 style="margin: 0 0 8px 0; font-size: 1.6rem; color: #ef4444;">Error en Descarga</h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 0.9rem;">${mensaje}</p>
                <button onclick="cerrarModalProgreso('${downloadId}')" style="
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #8C93F1, #d26cec);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.95rem;
                ">Cerrar</button>
            </div>
        `;
    }
}

// ============================================
// 🚪 CERRAR MODAL
// ============================================

function cerrarModalProgreso(downloadId, targetButton) {
    const overlay = document.getElementById('progressOverlay_' + downloadId);
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
    
    // Restaurar botón
    if (targetButton) {
        targetButton.disabled = false;
    }
}

// ============================================
// 🛠️ UTILIDADES
// ============================================

function sanitizarNombre(nombre) {
    return nombre
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

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

console.log('🎵 Sistema de descarga de música cargado');
console.log('⚙️ Configuración:');
console.log('  - API Key: 🔐 Cargada de forma segura desde .env');
console.log('  - Backend:', CONFIG.BACKEND_URL);
console.log('💡 Listo para usar!');
