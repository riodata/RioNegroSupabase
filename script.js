// Configuración de Supabase
const SUPABASE_URL = 'https://qxiboffwgzppqkayuzxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aWJvZmZ3Z3pwcHFrYXl1enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTc4NDUsImV4cCI6MjA2NjQzMzg0NX0.BAFrU3IOLz3NRYuAKSwJx2nbZqjsXMVAb9tHAFMpP0o'; // Reemplaza con tu clave anónima de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let map;
let markers = [];
let cooperativas = [];
let departamentos = new Set();
let tipos = new Set();

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchCooperativas();
    
    // Event listeners
    document.getElementById('departamento').addEventListener('change', filterCooperativas);
    document.getElementById('tipo').addEventListener('change', filterCooperativas);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('searchInput').addEventListener('input', filterCooperativas);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('modal')) {
            document.getElementById('modal').style.display = 'none';
        }
    });
});

// Inicializar el mapa
function initMap() {
    map = L.map('map').setView([-40.8, -63.0], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Obtener datos de cooperativas desde Supabase
async function fetchCooperativas() {
    try {
        // Consultar la tabla Cooperativas
        const { data, error } = await supabase
            .from('Cooperativas')
            .select('*');
            
        if (error) throw error;
        
        cooperativas = data || [];
        
        // Procesar los datos
        cooperativas.forEach(coop => {
            if (coop.departamento) departamentos.add(coop.departamento);
            if (coop.tipo) tipos.add(coop.tipo);
        });
        
        // Poblar selectores de filtro
        populateFilters();
        
        // Mostrar cooperativas
        displayCooperativas(cooperativas);
        addMapMarkers(cooperativas);
        
    } catch (error) {
        console.error('Error al obtener datos de cooperativas:', error);
        alert('Hubo un error al cargar los datos. Por favor, intenta nuevamente más tarde.');
    }
}

// Poblar los selectores de filtro
function populateFilters() {
    const depSelector = document.getElementById('departamento');
    const tipoSelector = document.getElementById('tipo');
    
    // Limpiar opciones existentes excepto "Todos"
    while (depSelector.options.length > 1) {
        depSelector.remove(1);
    }
    
    while (tipoSelector.options.length > 1) {
        tipoSelector.remove(1);
    }
    
    // Añadir departamentos
    [...departamentos].sort().forEach(dep => {
        const option = document.createElement('option');
        option.value = dep;
        option.textContent = dep;
        depSelector.appendChild(option);
    });
    
    // Añadir tipos de cooperativas
    [...tipos].sort().forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelector.appendChild(option);
    });
}

// Mostrar cooperativas en la lista
function displayCooperativas(coops) {
    const listElement = document.getElementById('cooperativas');
    listElement.innerHTML = '';
    
    if (coops.length === 0) {
        listElement.innerHTML = '<li class="no-results">No se encontraron cooperativas que coincidan con los filtros.</li>';
        return;
    }
    
    coops.forEach(coop => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h3>${coop.nombre || 'Sin nombre'}</h3>
            <p><strong>Localidad:</strong> ${coop.localidad || 'No especificada'}</p>
            <p><strong>Tipo:</strong> ${coop.tipo || 'No especificado'}</p>
            <button class="ver-mas" data-id="${coop.id}">Ver más</button>
        `;
        
        // Event listener para el botón "Ver más"
        li.querySelector('.ver-mas').addEventListener('click', () => showCooperativaDetails(coop));
        
        listElement.appendChild(li);
    });
}

// Mostrar detalles de cooperativa en modal
function showCooperativaDetails(coop) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = coop.nombre || 'Cooperativa';
    
    modalContent.innerHTML = `
        <p><strong>Matrícula:</strong> ${coop.matricula || 'No especificada'}</p>
        <p><strong>Tipo:</strong> ${coop.tipo || 'No especificado'}</p>
        <p><strong>Localidad:</strong> ${coop.localidad || 'No especificada'}</p>
        <p><strong>Departamento:</strong> ${coop.departamento || 'No especificado'}</p>
        <p><strong>Dirección:</strong> ${coop.direccion || 'No especificada'}</p>
        <p><strong>Teléfono:</strong> ${coop.telefono || 'No especificado'}</p>
        <p><strong>Email:</strong> ${coop.email || 'No especificado'}</p>
        <p><strong>Sitio Web:</strong> ${coop.sitio_web ? `<a href="${coop.sitio_web}" target="_blank">${coop.sitio_web}</a>` : 'No especificado'}</p>
    `;
    
    modal.style.display = 'block';
    
    // Si hay coordenadas, centrar el mapa en la cooperativa
    if (coop.latitud && coop.longitud) {
        map.setView([coop.latitud, coop.longitud], 12);
        
        // Resaltar el marcador
        markers.forEach(marker => {
            if (marker.coopId === coop.id) {
                marker.openPopup();
            }
        });
    }
}

// Añadir marcadores al mapa
function addMapMarkers(coops) {
    // Limpiar marcadores existentes
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    coops.forEach(coop => {
        if (coop.latitud && coop.longitud) {
            const marker = L.marker([coop.latitud, coop.longitud])
                .addTo(map)
                .bindPopup(`
                    <strong>${coop.nombre || 'Cooperativa'}</strong><br>
                    ${coop.tipo || 'No especificado'}<br>
                    ${coop.localidad || 'No especificada'}<br>
                    <button class="popup-button" onclick="showCooperativaFromMap(${coop.id})">Ver detalles</button>
                `);
                
            marker.coopId = coop.id;
            markers.push(marker);
        }
    });
}

// Función para mostrar cooperativa desde el mapa
function showCooperativaFromMap(id) {
    const coop = cooperativas.find(c => c.id === id);
    if (coop) {
        showCooperativaDetails(coop);
    }
}

// Filtrar cooperativas
function filterCooperativas() {
    const departamento = document.getElementById('departamento').value;
    const tipo = document.getElementById('tipo').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = cooperativas.filter(coop => {
        // Filtro por departamento
        const depMatch = departamento === 'all' || (coop.departamento && coop.departamento === departamento);
        
        // Filtro por tipo
        const tipoMatch = tipo === 'all' || (coop.tipo && coop.tipo === tipo);
        
        // Filtro por búsqueda
        const searchMatch = !searchTerm || 
            (coop.nombre && coop.nombre.toLowerCase().includes(searchTerm)) ||
            (coop.localidad && coop.localidad.toLowerCase().includes(searchTerm)) ||
            (coop.matricula && coop.matricula.toLowerCase().includes(searchTerm));
        
        return depMatch && tipoMatch && searchMatch;
    });
    
    displayCooperativas(filtered);
    addMapMarkers(filtered);
}

// Resetear filtros
function resetFilters() {
    document.getElementById('departamento').value = 'all';
    document.getElementById('tipo').value = 'all';
    document.getElementById('searchInput').value = '';
    
    displayCooperativas(cooperativas);
    addMapMarkers(cooperativas);
}

// Hacer accesible la función showCooperativaFromMap globalmente
window.showCooperativaFromMap = showCooperativaFromMap;
