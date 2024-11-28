
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación antes de cargar tareas
    const isAuthenticated = await verifyAuth();
    if (isAuthenticated) {
        loadTasks();
        updateUserNameDisplay();
    }
    
    // Resto del código del event listener...
    const createTaskForm = document.getElementById('createTaskForm');
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', createTask);
    }
    
    const editTaskForm = document.getElementById('editTaskForm');
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', updateTask);
    }
});

function getUserName() {
    const userName = localStorage.getItem('userName');
    if (!userName) {
        return null;
    }
    return userName.split(' ')[0]; //pa que solo me regrese el primer nombre
}

async function updateUserNameDisplay() {
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al obtener datos del usuario');
        
        const userData = await response.json();
        localStorage.setItem('userName', userData.name); // Actualizar localStorage
        
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.name.split(' ')[0];
        }
    } catch (error) {
        console.error('Error al actualizar nombre:', error);
    }
}


async function verifyAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/verify-token`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            await updateUserNameDisplay();
            return true;
        }
        return false;
    } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        return false;
    }
}

// Función para formatear la fecha
function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Actualizar la función loadTasks para asegurarnos de que los botones de editar se generen correctamente
async function loadTasks() {
    try {
        console.log('Iniciando carga de tareas...');
        updateUserNameDisplay();
        
        const response = await fetch(`${API_URL}/api/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar las tareas');
        
        const allTasks = await response.json();
        // Filtrar solo tareas incompletas
        const tasks = allTasks.filter(task => task.status !== 'completada');
        console.log('Tareas recibidas:', tasks);
        
        const tasksContainer = document.querySelector('#tasksContainer');
        if (!tasksContainer) {
            console.error('No se encontró el contenedor de tareas');
            return;
        }
        
        tasksContainer.innerHTML = '';

        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No hay tareas pendientes. ¡Buen trabajo!</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            console.log('Generando tarjeta para tarea:', task._id);
            const taskCard = `
                <div class="col-xl-4 col-lg-6">
                    <div class="card task-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title mb-0">${task.title}</h5>
                                <div class="dropdown">
                                    <button class="btn btn-link" type="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li>
                                            <button 
                                                class="dropdown-item" 
                                                type="button" 
                                                onclick="console.log('Click en editar:', '${task._id}'); editTask('${task._id}');"
                                            >
                                                Editar
                                            </button>
                                        </li>
                                        <li>
                                            <button 
                                                class="dropdown-item text-danger" 
                                                type="button" 
                                                onclick="deleteTask('${task._id}')"
                                            >
                                                Eliminar
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <p class="card-text text-muted">${task.description || 'Sin descripción'}</p>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="badge bg-${task.status === 'pendiente' ? 'secondary' : 'warning'}">
                                    ${task.status === 'pendiente' ? 'Pendiente' : 'En Progreso'}
                                </span>
                                <span class="badge bg-${task.priority === 'baja' ? 'info' : task.priority === 'media' ? 'warning' : 'danger'}">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Prioridad
                                </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">Vence: ${formatDate(task.dueDate)}</small>
                                <button class="btn btn-sm btn-outline-success"
                                        onclick="toggleTaskStatus('${task._id}', '${task.status}')">
                                    Completar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksContainer.insertAdjacentHTML('beforeend', taskCard);
        });
        
        console.log('Tareas cargadas exitosamente');
        
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
        await Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

async function deleteTask(taskId) {
    // Mostrar alerta de confirmación y esperar respuesta
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    // Si el usuario no confirma, salir de la función
    if (!result.isConfirmed) return;

    try {
        // Mostrar animación de carga
        const overlay = document.getElementById('loadingOverlay');
        const animation = document.getElementById('loadingAnimation');
        
        overlay.style.display = 'flex';
        animation.play();

        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar la tarea');

        // Esperar animación
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        // Mostrar mensaje de éxito
        await Swal.fire({
            title: '¡Eliminada!',
            text: 'La tarea ha sido eliminada exitosamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        // Recargar las tareas
        loadTasks();

    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        
        // Esperar animación
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        // Mostrar mensaje de error
        await Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para cambiar el estado de una tarea
async function toggleTaskStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'completada' ? 'pendiente' : 'completada';
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Error al actualizar el estado de la tarea');

        loadTasks();
    } catch (error) {
        showMessage(error.message, true);
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = "9999";
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Función para verificar el plan del usuario y sus límites
async function checkPlanUser() {
    try {
        // para agarrar su plan
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al obtener el perfil del usuario');
        const userData = await response.json();

        // Obtener todas las tareas del usuario, quizá puedo optimizar esto y tomar la lenght de las tareas cuando se cargan inmediatamente pero meh, funciona
        const tasksResponse = await fetch(`${API_URL}/api/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!tasksResponse.ok) throw new Error('Error al obtener las tareas');
        const tasks = await tasksResponse.json();

        // Verificar el plan y el número de tareas
        if (userData.plan === 'free' && tasks.length >= 10) {
            await Swal.fire({
                title: 'Límite de tareas alcanzado',
                html: `
                    <p>Has alcanzado el límite de 10 tareas del plan gratuito.</p>
                    <p>Actualiza a un plan PRO para tener tareas ilimitadas.</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Actualizar Plan',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    /*
                    // Redirigir al modal
                    const actualModal = new bootstrap.Modal(document.getElementById('createTaskModal'));
                    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
                    //actualModal.hide(); -hay que hacer que el modal de createTask se cierre xd
                    paymentModal.show();      */
                    handleProUpgrade()
                }
            });
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error al verificar el plan:', error);
        showNotification('Error al verificar el plan del usuario', 'danger');
        return false;
    }
}

async function createTask() {
    // Verificar el plan y límites antes de crear la tarea
    const validatorTasks = await checkPlanUser();
    if (!validatorTasks) {
        return;
    }

    // Obtener los valores de los campos
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const dueTime = document.getElementById('taskDueTime').value || '23:59';
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;

    // Validar campos requeridos
    if (!title || !dueDate || !priority || !status) {
        showNotification('Por favor, complete todos los campos requeridos', 'danger');
        return;
    }

    const dueDateTimeStr = `${dueDate}T${dueTime}`;

    const taskData = {
        title,
        description,
        dueDate: new Date(dueDateTimeStr),
        priority,
        status
    };

    try {
        const response = await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al crear la tarea');
        }

        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createTaskModal'));
        modal.hide();
        
        // Limpiar los campos
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskDueTime').value = '';
        document.getElementById('taskPriority').value = 'baja';
        document.getElementById('taskStatus').value = 'pendiente';
        
        // Mostrar notificación de éxito
        showNotification('¡Tarea creada exitosamente!');
        
        // Recargar las tareas
        loadTasks();

    } catch (error) {
        // Mostrar notificación de error
        showNotification(error.message, 'danger');
        
        // Mostrar error en el modal si existe el elemento
        const errorDiv = document.getElementById('createTaskError');
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    }
}

// Variable para almacenar el ID de la tarea que se está editando
let currentEditingTaskId = null;

// Función para abrir el modal de edición y cargar los datos de la tarea
// Función para abrir el modal de edición y cargar los datos de la tarea
async function editTask(taskId) {
    try {
        // Obtener los datos de la tarea
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al obtener la tarea');
        
        const task = await response.json();
        currentEditingTaskId = taskId;

        // Primero mostrar el modal
        const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        editTaskModal.show();

        // Convertir la fecha ISO a objeto Date
        const taskDate = new Date(task.dueDate);
        
        // Formatear la fecha para el input date (YYYY-MM-DD)
        const formattedDate = taskDate.toISOString().split('T')[0];
        
        // Formatear la hora para el input time (HH:mm)
        const formattedTime = taskDate.toTimeString().slice(0,5);

        // Después de que el modal esté visible, establecer los valores
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskDueDate').value = formattedDate;
        document.getElementById('editTaskDueTime').value = formattedTime;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskStatus').value = task.status;

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar los datos de la tarea', 'danger');
    }
}

// Y la función updateTask() también necesita ser actualizada:
async function updateTask() {
    if (!currentEditingTaskId) {
        showNotification('Error: No se encontró la tarea a editar', 'danger');
        return;
    }

    // Obtener los valores actualizados
    const title = document.getElementById('editTaskTitle').value;
    const description = document.getElementById('editTaskDescription').value;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const dueTime = document.getElementById('editTaskDueTime').value || '23:59';
    const priority = document.getElementById('editTaskPriority').value;
    const status = document.getElementById('editTaskStatus').value;

    // Validar campos requeridos
    if (!title || !dueDate || !priority || !status) {
        showNotification('Por favor, complete todos los campos requeridos', 'danger');
        return;
    }

    // Combinar fecha y hora
    const dueDateTimeStr = `${dueDate}T${dueTime}`;

    const taskData = {
        title,
        description,
        dueDate: new Date(dueDateTimeStr),
        priority,
        status
    };

    try {
        const response = await fetch(`${API_URL}/api/tasks/${currentEditingTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al actualizar la tarea');
        }

        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        modal.hide();
        
        // Mostrar notificación de éxito
        showNotification('¡Tarea actualizada exitosamente!');
        
        // Recargar las tareas
        loadTasks();
        
        // Limpiar el ID de la tarea actual
        currentEditingTaskId = null;

    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

// Función auxiliar para verificar la estructura del modal
function checkModalStructure() {
    const modalElements = {
        modal: document.getElementById('editTaskModal'),
        title: document.getElementById('editTaskTitle'),
        description: document.getElementById('editTaskDescription'),
        dueDate: document.getElementById('editTaskDueDate'),
        priority: document.getElementById('editTaskPriority'),
        status: document.getElementById('editTaskStatus')
    };

    console.log('Estructura del modal:', {
        modalExists: !!modalElements.modal,
        elements: {
            title: !!modalElements.title,
            description: !!modalElements.description,
            dueDate: !!modalElements.dueDate,
            priority: !!modalElements.priority,
            status: !!modalElements.status
        }
    });

    return modalElements;
}

// Agregar evento para verificar la estructura cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    checkModalStructure();
});

// Función para eliminar una tarea con confirmación usando SweetAlert
async function deleteTask(taskId) {
    // Usar la clase nativa confirm de JavaScript
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al eliminar la tarea');
        }

        // Mostrar notificación de éxito
        showNotification('¡Tarea eliminada exitosamente!');
        
        // Recargar las tareas
        loadTasks();

    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

// Función para cambiar el estado de una tarea
async function toggleTaskStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'completada' ? 'pendiente' : 'completada';
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al actualizar el estado de la tarea');
        }

        // Recargar las tareas
        loadTasks();
        
        // Mostrar notificación
        showNotification(`Tarea marcada como ${newStatus}`);

    } catch (error) {
        showNotification(error.message, 'danger');
    }
}


// Función para eliminar una tarea con confirmación usando SweetAlert
async function deleteTask(taskId) {
    // Usar la clase nativa confirm de JavaScript
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al eliminar la tarea');
        }

        // Mostrar notificación de éxito
        showNotification('¡Tarea eliminada exitosamente!');
        
        // Recargar las tareas
        loadTasks();

    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

// Función para cambiar el estado de una tarea
async function toggleTaskStatus(taskId, currentStatus) {
    const newStatus = currentStatus === 'completada' ? 'pendiente' : 'completada';
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al actualizar el estado de la tarea');
        }

        // Recargar las tareas
        loadTasks();
        
        // Mostrar notificación
        showNotification(`Tarea marcada como ${newStatus}`);

    } catch (error) {
        showNotification(error.message, 'danger');
    }
}


////////////////////////////////////////// FILTROS ///////////////////////////////////////
//variables globales para los filtros
let currentFilters = {
    search: '',
    status: '',
    sortBy: ''
};

// Event listeners para el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Get filter
    const searchInput = document.querySelector('.input-group input[type="text"]');
    const statusSelect = document.querySelector('select:nth-of-type(1)');
    const sortSelect = document.querySelector('select:nth-of-type(2)');

    // Añadir event listeners
    searchInput.addEventListener('input', blocker(function(e) {
        currentFilters.search = e.target.value.toLowerCase();
        applyFilters();
    }, 300));

    statusSelect.addEventListener('change', function(e) {
        currentFilters.status = e.target.value;
        applyFilters();
    });

    sortSelect.addEventListener('change', function(e) {
        currentFilters.sortBy = e.target.value;
        applyFilters();
    });
});

//pa limitar la frecuencia con la que se aplica el filtro de búsquedafunction
function blocker(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// aplay filters
async function applyFilters() {
    try {
        console.log('Iniciando aplicación de filtros...');
        console.log('Filtros actuales:', currentFilters);

        const response = await fetch(`${API_URL}/api/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar las tareas');
        
        let tasks = await response.json();
        console.log('Tareas originales:', tasks);

        // Aplicar búsqueda
        if (currentFilters.search) {
            console.log('Aplicando filtro de búsqueda:', currentFilters.search);
            tasks = tasks.filter(task => 
                task.title.toLowerCase().includes(currentFilters.search) ||
                (task.description && task.description.toLowerCase().includes(currentFilters.search))
            );
            console.log('Tareas después de búsqueda:', tasks);
        }

        // Aplicar filtro de estado
        if (currentFilters.status) {
            console.log('Aplicando filtro de estado:', currentFilters.status);
            tasks = tasks.filter(task => task.status === currentFilters.status);
            console.log('Tareas después de filtro de estado:', tasks);
        }

        // Aplicar ordenamiento con nueva lógica
        if (currentFilters.sortBy) {
            console.log('Aplicando ordenamiento:', currentFilters.sortBy);
            
            const priorityMap = {
                'alta': 3,
                'media': 2,
                'baja': 1
            };

            tasks = tasks.sort((a, b) => {
                switch (currentFilters.sortBy) {
                    case 'date':
                        // Convertir fechas a timestamps y comparar
                        const dateA = new Date(a.dueDate);
                        const dateB = new Date(b.dueDate);
                        return dateA - dateB;
                    
                    case 'priority':
                        // Si las prioridades son diferentes, ordenar por prioridad
                        if (priorityMap[a.priority] !== priorityMap[b.priority]) {
                            return priorityMap[b.priority] - priorityMap[a.priority];
                        }
                        // Si las prioridades son iguales, ordenar por fecha
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    
                    case 'name':
                        // Ordenar por nombre, ignorando mayúsculas/minúsculas
                        const nameA = a.title.toLowerCase();
                        const nameB = b.title.toLowerCase();
                        if (nameA < nameB) return -1;
                        if (nameA > nameB) return 1;
                        return 0;
                    
                    default:
                        // Por defecto, ordenar por fecha
                        return new Date(a.dueDate) - new Date(b.dueDate);
                }
            });

            console.log('Tareas después de ordenar:', tasks);
        }

        // Actualizar UI
        const tasksContainer = document.querySelector('#tasksContainer');
        if (!tasksContainer) {
            console.error('No se encontró el contenedor de tareas');
            return;
        }
        tasksContainer.innerHTML = '';

        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No se encontraron tareas que coincidan con los filtros</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const taskCard = `
                <div class="col-xl-4 col-lg-6">
                    <div class="card task-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title mb-0">${task.title}</h5>
                                <div class="dropdown">
                                    <button class="btn btn-link" type="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li>
                                            <button class="dropdown-item" type="button" onclick="editTask('${task._id}')">
                                                Editar
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item text-danger" type="button" onclick="deleteTask('${task._id}')">
                                                Eliminar
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <p class="card-text text-muted">${task.description || 'Sin descripción'}</p>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="badge bg-${task.status === 'pendiente' ? 'secondary' : task.status === 'en_progreso' ? 'warning' : 'success'}">
                                    ${task.status === 'pendiente' ? 'Pendiente' : 
                                    task.status === 'en_progreso' ? 'En Progreso' : 'Completada'}
                                </span>
                                <span class="badge bg-${task.priority === 'baja' ? 'info' : task.priority === 'media' ? 'warning' : 'danger'}">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Prioridad
                                </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">Vence: ${formatDate(task.dueDate)}</small>
                                <button class="btn btn-sm btn-${task.status === 'completada' ? 'success' : 'outline-success'}"
                                        onclick="toggleTaskStatus('${task._id}', '${task.status}')">
                                    ${task.status === 'completada' ? 'Completada' : 'Completar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            tasksContainer.insertAdjacentHTML('beforeend', taskCard);
        });

    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        showNotification('Error al filtrar las tareas', 'danger');
    }
}

// reseteamos los filtros
function resetFilters() {
    currentFilters = {
        search: '',
        status: '',
        sortBy: ''
    };
    
    // reseteamos elementos
    document.querySelector('.input-group input[type="text"]').value = '';
    document.querySelector('select:nth-of-type(1)').value = '';
    document.querySelector('select:nth-of-type(2)').value = '';
    
    // Reload
    loadTasks();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Cargado, configurando event listeners...');
    
    const searchInput = document.getElementById('searchInput');
    const statusSelect = document.getElementById('statusFilter');
    const sortSelect = document.getElementById('sortBy');

    console.log('Elementos encontrados:', {
        searchInput: !!searchInput,
        statusSelect: !!statusSelect,
        sortSelect: !!sortSelect
    });

    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            console.log('Evento de búsqueda:', e.target.value);
            currentFilters.search = e.target.value.toLowerCase();
            applyFilters();
        }, 300));
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', function(e) {
            console.log('Evento de cambio de estado:', e.target.value);
            currentFilters.status = e.target.value;
            applyFilters();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            currentFilters.sortBy = e.target.value;
            applyFilters();
        });
    }
});
