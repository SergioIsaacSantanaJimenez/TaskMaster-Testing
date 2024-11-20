async function getUserTasks() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener las tareas');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

function getStatusColor(status) {
    const colors = {
        'pendiente': '#dc3545',    
        'en_progreso': '#ffc107',  
        'completada': '#198754'    
    };
    return colors[status] || '#6c757d';
}

function getPriorityIcon(priority) {
    const icons = {
        'alta': '⚠️',
        'media': '⚡',
        'baja': '📝'
    };
    return icons[priority] || '';
}

function tasksToEvents(tasks) {
    return tasks.map(task => ({
        id: task._id,
        title: `${getPriorityIcon(task.priority)} ${task.title}`,
        start: task.dueDate,
        backgroundColor: getStatusColor(task.status),
        borderColor: getStatusColor(task.status),
        extendedProps: {
            description: task.description,
            status: task.status,
            priority: task.priority
        }
    }));
}

async function updateTaskDate(taskId, newDate) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                dueDate: newDate
            })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar la tarea');
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function loadCalendarContent() {
    try {
        const mainContent = document.querySelector('.main-content');
        
        // Corregir typo en document
        const overlay = document.getElementById('loadingOverlay');
        const animation = document.getElementById('loadingAnimation');

        // Mostrar animación de carga
        overlay.style.display = 'flex';
        animation.play();

        const calendarHTML = `
            <div class="container-fluid p-4">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <div id="calendar" style="min-height: 700px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="taskModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles de la Tarea</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <h6 id="modalTaskTitle"></h6>
                            <p id="modalTaskDescription"></p>
                            <div class="row">
                                <div class="col-6">
                                    <p><strong>Estado:</strong> <span id="modalTaskStatus"></span></p>
                                </div>
                                <div class="col-6">
                                    <p><strong>Prioridad:</strong> <span id="modalTaskPriority"></span></p>
                                </div>
                            </div>
                            <p><strong>Fecha límite:</strong> <span id="modalTaskDate"></span></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = calendarHTML;

        const tasks = await getUserTasks();
        const events = tasksToEvents(tasks);

        // Inicializar el calendario
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            editable: true,
            eventDrop: async function(info) {
                try {
                    const taskId = info.event.id;
                    const newDate = info.event.start;
                    
                    await updateTaskDate(taskId, newDate);
                    showNotification('Tarea actualizada', 'success');
                } catch (error) {
                    info.revert();
                    showNotification('Error al actualizar', 'danger');
                }
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            themeSystem: 'bootstrap5',
            events: events,
            eventClick: function(info) {
                const event = info.event;
                const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
                
                document.getElementById('modalTaskTitle').textContent = event.title;
                document.getElementById('modalTaskDescription').textContent = 
                    event.extendedProps.description || 'Sin descripción';
                document.getElementById('modalTaskStatus').textContent = 
                    event.extendedProps.status.replace('_', ' ');
                document.getElementById('modalTaskPriority').textContent = 
                    event.extendedProps.priority;
                document.getElementById('modalTaskDate').textContent = 
                    new Date(event.start).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                
                taskModal.show();
            },
            height: 'auto',
            aspectRatio: 1.8,
            expandRows: true,
            slotMinTime: '08:00:00',
            slotMaxTime: '20:00:00',
            dayMaxEvents: true,
            weekNumbers: false,
            firstDay: 1, // Lunes como primer día
            buttonText: {
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                list: 'Lista'
            },
            allDayText: 'Todo el día',
            moreLinkText: 'más',
            noEventsText: 'No hay tareas para mostrar'
        });

        // Esperar 2 segundos antes de ocultar la animación
        await new Promise(resolve => setTimeout(resolve, 2000));

        calendar.render();

        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();


    } catch (error) {
        console.error('Error al cargar el calendario:', error);
        
        // Esperar 2 segundos antes de mostrar el error
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mostrar alerta de error
        await Swal.fire({
            title: 'Error',
            text: 'Error al cargar el calendario: ' + error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        
        // Ocultar animación después de la alerta
        overlay.style.display = 'none';
        animation.stop();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const calendarLinks = document.querySelectorAll('a[href="#calendar"]');
    
    calendarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            
            calendarLinks.forEach(calLink => {
                if (calLink.classList.contains('list-group-item')) {
                    calLink.classList.add('active');
                }
                if (calLink.classList.contains('nav-link')) {
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    calLink.classList.add('active');
                }
            });

            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
            
            loadCalendarContent();
        });
    });
});
