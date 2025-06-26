// Configuración de Supabase
const SUPABASE_URL = 'https://qxiboffwgzppqkayuzxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aWJvZmZ3Z3pwcHFrYXl1enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTc4NDUsImV4cCI6MjA2NjQzMzg0NX0.BAFrU3IOLz3NRYuAKSwJx2nbZqjsXMVAb9tHAFMpP0o'; // Reemplaza con tu clave anónima de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let currentTab = 'create';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Configurar navegación por pestañas
    setupTabs();
    
    // Configurar los formularios
    setupForms();
    
    // Configurar notificaciones
    setupNotifications();
});

// Configurar navegación por pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Quitar clase active de todas las pestañas y contenidos
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Añadir clase active a la pestaña seleccionada
            tab.classList.add('active');
            
            // Mostrar contenido correspondiente
            const targetId = tab.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
            
            // Actualizar pestaña actual
            currentTab = targetId;
        });
    });
}

// Configurar formularios
function setupForms() {
    // Formulario de creación
    const createForm = document.getElementById('createForm');
    createForm.addEventListener('submit', handleCreateSubmit);
    
    // Formulario de búsqueda
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleSearchSubmit);
    
    // Formulario de búsqueda para editar
    const editSearchForm = document.getElementById('editSearchForm');
    editSearchForm.addEventListener('submit', handleEditSearchSubmit);
    
    // Formulario de búsqueda para eliminar
    const deleteSearchForm = document.getElementById('deleteSearchForm');
    deleteSearchForm.addEventListener('submit', handleDeleteSearchSubmit);
}

// Manejar envío del formulario de creación
async function handleCreateSubmit(e) {
    e.preventDefault();
    
    try {
        // Recopilar datos del formulario
        const formData = new FormData(e.target);
        const cooperativaData = {};
        
        // Convertir FormData a objeto
        for (const [key, value] of formData.entries()) {
            // Manejar campos numéricos
            if (key === 'Latitud' || key === 'Longitud') {
                cooperativaData[key] = value ? parseFloat(value) : null;
            }
            // Manejar fechas
            else if (key === 'EmisMat' || key === 'EstadoEntid' || key === 'FechaAsamb') {
                cooperativaData[key] = value || null;
            }
            // Manejar otros campos
            else {
                cooperativaData[key] = value || null;
            }
        }
        
        // Enviar datos a Supabase
        const { data, error } = await supabase
            .from('Cooperativas')
            .insert([cooperativaData]);
            
        if (error) throw error;
        
        // Mostrar notificación de éxito
        showNotification('Cooperativa creada con éxito', 'success');
        
        // Limpiar formulario
        e.target.reset();
        
    } catch (error) {
        console.error('Error al crear cooperativa:', error);
        showNotification('Error al crear cooperativa: ' + error.message, 'error');
    }
}

// Manejar envío del formulario de búsqueda
async function handleSearchSubmit(e) {
    e.preventDefault();
    
    const searchTerm = document.getElementById('searchTerm').value;
    const departamento = document.getElementById('searchDepartamento').value;
    const tipo = document.getElementById('searchTipo').value;
    
    try {
        // Construir consulta a Supabase
        let query = supabase.from('Cooperativas').select('*');
        
        // Aplicar filtros si se proporcionan
        if (searchTerm) {
            query = query.or(`Cooperativa.ilike.%${searchTerm}%,Matrícula.ilike.%${searchTerm}%,Legajo.ilike.%${searchTerm}%`);
        }
        
        if (departamento) {
            query = query.eq('Departamento', departamento);
        }
        
        if (tipo) {
            query = query.eq('Tipo', tipo);
        }
        
        // Ejecutar consulta
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Mostrar resultados
        displaySearchResults(data, 'searchResults');
        
    } catch (error) {
        console.error('Error al buscar cooperativas:', error);
        showNotification('Error al buscar cooperativas: ' + error.message, 'error');
    }
}

// Función para mostrar resultados de búsqueda
function displaySearchResults(data, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="no-results">No se encontraron cooperativas con los criterios de búsqueda.</p>';
        return;
    }
    
    // Crear tabla para mostrar resultados
    const table = document.createElement('table');
    table.classList.add('results-table');
    
    // Crear encabezados
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Legajo</th>
            <th>Cooperativa</th>
            <th>Matrícula</th>
            <th>Departamento</th>
            <th>Tipo</th>
            <th>Acciones</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    data.forEach(coop => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${coop.Legajo || '-'}</td>
            <td>${coop.Cooperativa || '-'}</td>
            <td>${coop.Matrícula || '-'}</td>
            <td>${coop.Departamento || '-'}</td>
            <td>${coop.Tipo || '-'}</td>
            <td class="actions">
                <button class="btn-view" data-id="${coop.id}">Ver</button>
                <button class="btn-edit" data-id="${coop.id}">Editar</button>
                <button class="btn-delete" data-id="${coop.id}">Eliminar</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // Agregar event listeners a los botones
    container.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => viewCooperativa(btn.dataset.id));
    });
    
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editCooperativa(btn.dataset.id));
    });
    
    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteCooperativa(btn.dataset.id));
    });
}

// Manejar envío del formulario de búsqueda para editar
async function handleEditSearchSubmit(e) {
    e.preventDefault();
    
    const searchTerm = document.getElementById('editSearchTerm').value;
    
    try {
        // Construir consulta a Supabase
        const { data, error } = await supabase
            .from('Cooperativas')
            .select('*')
            .or(`Cooperativa.ilike.%${searchTerm}%,Matrícula.ilike.%${searchTerm}%,Legajo.ilike.%${searchTerm}%`);
            
        if (error) throw error;
        
        // Mostrar resultados
        displaySearchResults(data, 'editSearchResults');
        
    } catch (error) {
        console.error('Error al buscar cooperativas para editar:', error);
        showNotification('Error al buscar cooperativas: ' + error.message, 'error');
    }
}

// Manejar envío del formulario de búsqueda para eliminar
async function handleDeleteSearchSubmit(e) {
    e.preventDefault();
    
    const searchTerm = document.getElementById('deleteSearchTerm').value;
    
    try {
        // Construir consulta a Supabase
        const { data, error } = await supabase
            .from('Cooperativas')
            .select('*')
            .or(`Cooperativa.ilike.%${searchTerm}%,Matrícula.ilike.%${searchTerm}%,Legajo.ilike.%${searchTerm}%`);
            
        if (error) throw error;
        
        // Mostrar resultados
        displaySearchResults(data, 'deleteSearchResults');
        
    } catch (error) {
        console.error('Error al buscar cooperativas para eliminar:', error);
        showNotification('Error al buscar cooperativas: ' + error.message, 'error');
    }
}

// Ver detalles de cooperativa
async function viewCooperativa(id) {
    try {
        // Obtener datos de la cooperativa
        const { data, error } = await supabase
            .from('Cooperativas')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Mostrar modal o detalles
        alert(`Detalles de Cooperativa: ${data.Cooperativa}\n` + 
              `Legajo: ${data.Legajo || '-'}\n` +
              `Matrícula: ${data.Matrícula || '-'}\n` +
              `Tipo: ${data.Tipo || '-'}\n` +
              `Departamento: ${data.Departamento || '-'}\n` +
              `Localidad: ${data.Localidad || '-'}`);
        
    } catch (error) {
        console.error('Error al obtener detalles de la cooperativa:', error);
        showNotification('Error al obtener detalles: ' + error.message, 'error');
    }
}

// Editar cooperativa
async function editCooperativa(id) {
    try {
        // Obtener datos de la cooperativa
        const { data, error } = await supabase
            .from('Cooperativas')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Ir a la pestaña de edición
        document.querySelector('a[href="#edit"]').click();
        
        // Generar y mostrar formulario de edición
        const editFormContainer = document.getElementById('editFormContainer');
        
        // Clonar el formulario de creación y adaptarlo para edición
        const createForm = document.getElementById('createForm');
        const editForm = createForm.cloneNode(true);
        editForm.id = 'editForm';
        
        // Cambiar el texto del botón
        const submitButton = editForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Actualizar Registro';
        
        // Agregar ID oculto
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = id;
        editForm.appendChild(idInput);
        
        // Llenar formulario con datos existentes
        for (const key in data) {
            const input = editForm.elements[key];
            if (input) {
                input.value = data[key] || '';
            }
        }
        
        // Reemplazar evento submit
        editForm.addEventListener('submit', handleEditSubmit);
        
        // Mostrar formulario
        editFormContainer.innerHTML = '';
        editFormContainer.appendChild(editForm);
        editFormContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar datos para editar:', error);
        showNotification('Error al cargar datos: ' + error.message, 'error');
    }
}

// Manejar envío del formulario de edición
async function handleEditSubmit(e) {
    e.preventDefault();
    
    try {
        // Recopilar datos del formulario
        const formData = new FormData(e.target);
        const cooperativaData = {};
        let id;
        
        // Convertir FormData a objeto
        for (const [key, value] of formData.entries()) {
            if (key === 'id') {
                id = value;
                continue;
            }
            
            // Manejar campos numéricos
            if (key === 'Latitud' || key === 'Longitud') {
                cooperativaData[key] = value ? parseFloat(value) : null;
            }
            // Manejar fechas
            else if (key === 'EmisMat' || key === 'EstadoEntid' || key === 'FechaAsamb') {
                cooperativaData[key] = value || null;
            }
            // Manejar otros campos
            else {
                cooperativaData[key] = value || null;
            }
        }
        
        // Enviar datos a Supabase
        const { data, error } = await supabase
            .from('Cooperativas')
            .update(cooperativaData)
            .eq('id', id);
            
        if (error) throw error;
        
        // Mostrar notificación de éxito
        showNotification('Cooperativa actualizada con éxito', 'success');
        
        // Ocultar formulario
        document.getElementById('editFormContainer').style.display = 'none';
        
        // Limpiar resultados de búsqueda
        document.getElementById('editSearchResults').innerHTML = '';
        
        // Limpiar campo de búsqueda
        document.getElementById('editSearchTerm').value = '';
        
    } catch (error) {
        console.error('Error al actualizar cooperativa:', error);
        showNotification('Error al actualizar cooperativa: ' + error.message, 'error');
    }
}

// Eliminar cooperativa
async function deleteCooperativa(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cooperativa? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        // Eliminar cooperativa de Supabase
        const { error } = await supabase
            .from('Cooperativas')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        // Mostrar notificación de éxito
        showNotification('Cooperativa eliminada con éxito', 'success');
        
        // Actualizar resultados de búsqueda
        if (currentTab === 'search') {
            document.getElementById('searchForm').dispatchEvent(new Event('submit'));
        } else if (currentTab === 'delete') {
            document.getElementById('deleteSearchForm').dispatchEvent(new Event('submit'));
        }
        
    } catch (error) {
        console.error('Error al eliminar cooperativa:', error);
        showNotification('Error al eliminar cooperativa: ' + error.message, 'error');
    }
}

// Configurar notificaciones
function setupNotifications() {
    const notification = document.getElementById('notification');
    const closeButton = document.querySelector('.close-notification');
    
    closeButton.addEventListener('click', () => {
        notification.classList.remove('visible');
    });
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    // Establecer mensaje
    messageElement.textContent = message;
    
    // Establecer tipo
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('visible');
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('visible');
    }, 5000);
}
