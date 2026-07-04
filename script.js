// ======================================================
// CONFIGURACIÓN: pega aquí la URL de tu Web App de Apps Script
// (la que termina en /exec, generada al implementar Code.gs)
// ======================================================
const API_URL = "https://script.google.com/macros/s/AKfycbx3zb1rmGLx2V5iuFJaco6cXvQl87XJqfNtdJa0xxnb0A_fdxCOObsqNPlWmvOQIdMe/exec";

// --- VARIABLES DE ESTADO LOCAL ---
let votos = { christian: 0, carol: 0 };
let yaVoto = false;
let asistentes = [];

// --- DICCIONARIO DE EMOJIS PARA LA HOTBAR ---
const MINECRAFT_ICONS = {
    alcohol: "🍺",
    cake: "🍰",
    sword: "⚔️",
    tnt: "🧨",
    compass: "🧭"
};

// 1. RELOJ DE CUENTA REGRESIVA
function inicializarContador() {
    const targetDate = new Date("July 18, 2026 22:00:00").getTime();

    setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById("countdown").innerText = "¡EL PROYECTO X HA COMENZADO!";
            return;
        }

        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById("countdown").innerHTML =
            `${dias}d ${horas}h ${minutos}m ${segundos}s`;
    }, 1000);
}

// 2. SISTEMA DE INVENTARIO (HOTBAR)
function agregarAlInventario(slotIndex, emoji, altText) {
    const slot = document.getElementById(`slot-${slotIndex}`);
    if (slot) {
        slot.innerHTML = `<span class="item-icon animate-item" title="${altText}" style="font-size: 24px; cursor: help;">${emoji}</span>`;
    }
}

// 3. CARGAR DATOS DESDE EL GOOGLE SHEET AL INICIAR
async function cargarDatosDesdeSheet() {
    try {
        const resp = await fetch(API_URL);
        const data = await resp.json();

        votos = data.votos;
        document.getElementById('countChristian').innerText = votos.christian;
        document.getElementById('countCarol').innerText = votos.carol;

        asistentes = data.asistentes;
        actualizarLista();
        if (asistentes.length > 0) {
            agregarAlInventario(1, MINECRAFT_ICONS.sword, "Pase VIP (Espada)");
        }
    } catch (err) {
        console.error("Error cargando datos del Sheet:", err);
    }

    // El "ya voté" y "bando elegido" se mantienen por navegador
    // (para no dejar votar 2 veces desde el mismo dispositivo)
    const estadoVoto = localStorage.getItem('proyectoX_yaVoto');
    if (estadoVoto === 'true') {
        yaVoto = true;
        document.getElementById('btnChristian').disabled = true;
        document.getElementById('btnCarol').disabled = true;

        const bandoElegido = localStorage.getItem('proyectoX_bando');
        if (bandoElegido === 'christian') {
            agregarAlInventario(0, MINECRAFT_ICONS.alcohol, "Poción de Alcohol");
        } else if (bandoElegido === 'carol') {
            agregarAlInventario(0, MINECRAFT_ICONS.cake, "Squishy Cake");
        }
    }
}

// 4. VOTACIÓN DE TEAMS
async function votar(team) {
    if (yaVoto) return;

    votos[team]++;
    document.getElementById('countChristian').innerText = votos.christian;
    document.getElementById('countCarol').innerText = votos.carol;

    document.getElementById('btnChristian').disabled = true;
    document.getElementById('btnCarol').disabled = true;
    yaVoto = true;

    // Bloqueo local (para este navegador) para no votar 2 veces
    localStorage.setItem('proyectoX_yaVoto', 'true');
    localStorage.setItem('proyectoX_bando', team);

    if (team === 'christian') {
        agregarAlInventario(0, MINECRAFT_ICONS.alcohol, "Poción de Alcohol");
    } else {
        agregarAlInventario(0, MINECRAFT_ICONS.cake, "Squishy Cake");
    }

    // Enviar al Sheet
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ accion: 'votar', team: team })
        });
    } catch (err) {
        console.error("Error registrando voto en el Sheet:", err);
    }
}

// 5. ASISTENCIA
async function registrarAsistencia(asiste) {
    const nameInput = document.getElementById('guestName');
    let name = nameInput.value.trim();

    if (name === "") {
        alert("¡Escribe tu Nickname antes de enviar!");
        return;
    }

    // Límite de longitud razonable para un nickname
    if (name.length > 20) {
        name = name.substring(0, 20);
    }

    if (asiste) {
        document.getElementById('yapeAlert').classList.add('hidden');

        if (!asistentes.includes(name)) {
            asistentes.push(name);
            actualizarLista();
            agregarAlInventario(1, MINECRAFT_ICONS.sword, "Pase VIP (Espada)");
        }
    } else {
        document.getElementById('yapeAlert').classList.remove('hidden');
        agregarAlInventario(8, MINECRAFT_ICONS.tnt, "Multa de Yape (TNT)");
    }

    // Enviar al Sheet (se registra tanto el SI como el NO)
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ accion: 'asistencia', nombre: name, asiste: asiste })
        });
    } catch (err) {
        console.error("Error registrando asistencia en el Sheet:", err);
    }

    nameInput.value = "";
}

// Escapa HTML para evitar que un nombre con código se ejecute en la página (XSS)
function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// 6. ACTUALIZAR LA LISTA EN PANTALLA
function actualizarLista() {
    const listaBox = document.getElementById('listaParticipantes');
    listaBox.innerHTML = "";

    if (asistentes.length === 0) {
        listaBox.innerHTML = '<div class="list-empty">Nadie registrado aún...</div>';
        return;
    }

    asistentes.forEach(persona => {
        const item = document.createElement('div');
        item.className = 'list-item';

        const nombreSeguro = escapeHtml(persona);
        const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(persona)}/24`;

        item.innerHTML = `
            <img class="skin-head" src="${avatarUrl}" alt="head" onerror="this.src='https://mc-heads.net/avatar/Steve/24'">
            <div>
                <span style="color: #ffff55;">${nombreSeguro}</span>
                <span style="color: #55ff55; font-size: 9px;"> [CONNECTED]</span>
            </div>
        `;
        listaBox.appendChild(item);
    });
}

// 7. CONTROL DEL MAPA
function toggleMapa() {
    const mapa = document.getElementById('mapaBox');
    mapa.classList.toggle('hidden');
    if (!mapa.classList.contains('hidden')) {
        agregarAlInventario(4, MINECRAFT_ICONS.compass, "Mapa del Spawn (Brújula)");
    }
}

// Inicializar funciones globales al cargar
window.onload = () => {
    inicializarContador();
    cargarDatosDesdeSheet();
};