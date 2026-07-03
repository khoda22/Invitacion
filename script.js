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
    // Apuntamos al 18 de Julio a las 22:00 (10:00 PM)[cite: 1]
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

// 3. CARGAR DATOS DESDE LOCALSTORAGE AL INICIAR
function cargarDatosDeLocalStorage() {
    // Recuperar votos
    const votosGuardados = localStorage.getItem('proyectoX_votos');
    if (votosGuardados) {
        votos = JSON.parse(votosGuardados);
        document.getElementById('countChristian').innerText = votos.christian;
        document.getElementById('countCarol').innerText = votos.carol;
    }

    // Verificar si el usuario actual ya votó
    const estadoVoto = localStorage.getItem('proyectoX_yaVoto');
    if (estadoVoto === 'true') {
        yaVoto = true;
        document.getElementById('btnChristian').disabled = true;
        document.getElementById('btnCarol').disabled = true;
        
        // Restaurar el ítem del team en la Hotbar
        const bandoElegido = localStorage.getItem('proyectoX_bando');
        if (bandoElegido === 'christian') {
            agregarAlInventario(0, MINECRAFT_ICONS.alcohol, "Poción de Alcohol");
        } else if (bandoElegido === 'carol') {
            agregarAlInventario(0, MINECRAFT_ICONS.cake, "Squishy Cake");
        }
    }

    // Recuperar lista de asistentes
    const asistentesGuardados = localStorage.getItem('proyectoX_asistentes');
    if (asistentesGuardados) {
        asistentes = JSON.parse(asistentesGuardados);
        actualizarLista();
        
        // Si ya estaba en la lista, le devolvemos su espada a la Hotbar
        if (asistentes.length > 0) {
            agregarAlInventario(1, MINECRAFT_ICONS.sword, "Pase VIP (Espada)");
        }
    }
}

// 4. VOTACIÓN DE TEAMS
function votar(team) {
    if (yaVoto) return;
    
    votos[team]++;
    document.getElementById('countChristian').innerText = votos.christian;
    document.getElementById('countCarol').innerText = votos.carol;
    
    document.getElementById('btnChristian').disabled = true;
    document.getElementById('btnCarol').disabled = true;
    yaVoto = true;

    // Guardar en LocalStorage
    localStorage.setItem('proyectoX_votos', JSON.stringify(votos));
    localStorage.setItem('proyectoX_yaVoto', 'true');
    localStorage.setItem('proyectoX_bando', team);

    if (team === 'christian') {
        agregarAlInventario(0, MINECRAFT_ICONS.alcohol, "Poción de Alcohol");
    } else {
        agregarAlInventario(0, MINECRAFT_ICONS.cake, "Squishy Cake");
    }
}

// 5. ASISTENCIA
function registrarAsistencia(asiste) {
    const nameInput = document.getElementById('guestName');
    const name = nameInput.value.trim();

    if (name === "") {
        alert("¡Escribe tu Nickname antes de enviar!");
        return;
    }

    if (asiste) {
        document.getElementById('yapeAlert').classList.add('hidden');
        
        if (!asistentes.includes(name)) {
            asistentes.push(name);
            
            // Guardar lista actualizada en LocalStorage
            localStorage.setItem('proyectoX_asistentes', JSON.stringify(asistentes));
            
            actualizarLista();
            agregarAlInventario(1, MINECRAFT_ICONS.sword, "Pase VIP (Espada)");
        }
    } else {
        document.getElementById('yapeAlert').classList.remove('hidden');
        agregarAlInventario(8, MINECRAFT_ICONS.tnt, "Multa de Yape (TNT)");
    }
    nameInput.value = "";
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
        
        const avatarUrl = `https://mc-heads.net/avatar/${persona}/24`;

        item.innerHTML = `
            <img class="skin-head" src="${avatarUrl}" alt="head" onerror="this.src='https://mc-heads.net/avatar/Steve/24'">
            <div>
                <span style="color: #ffff55;">${persona}</span> 
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
    cargarDatosDeLocalStorage(); // Levanta el estado guardado al recargar la página
};