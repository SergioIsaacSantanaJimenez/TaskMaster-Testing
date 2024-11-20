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

function processTasksData(tasks) {
    const statusCount = {
        pendiente: tasks.filter(task => task.status === 'pendiente').length,
        en_progreso: tasks.filter(task => task.status === 'en_progreso').length,
        completada: tasks.filter(task => task.status === 'completada').length
    };

    const tasksByDate = tasks.reduce((acc, task) => {
        const date = new Date(task.createdAt).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { total: 0, completed: 0 };
        }
        acc[date].total++;
        if (task.status === 'completada') {
            acc[date].completed++;
        }
        return acc;
    }, {});

    const priorityCount = {
        alta: tasks.filter(task => task.priority === 'alta').length,
        media: tasks.filter(task => task.priority === 'media').length,
        baja: tasks.filter(task => task.priority === 'baja').length
    };

    return {
        statusCount,
        tasksByDate,
        priorityCount,
        totalTasks: tasks.length
    };
}

async function loadStatisticsContent() {
    const mainContent = document.querySelector('.main-content');
    const tasks = await getUserTasks();
    const stats = processTasksData(tasks);

    const overlay = document.getElementById('loadingOverlay');
    const animation = document.getElementById('loadingAnimation');

    overlay.style.display = 'flex';
    animation.play();

    // Esperar 1 segundo para mostrar la animación
    await new Promise(resolve => setTimeout(resolve, 2000));

    overlay.style.display = 'none';

    
    const statisticsHTML = `
        <div class="container-fluid p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="mb-0">Estadísticas</h3>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Tareas Totales</h5>
                            <h2 class="card-text">${stats.totalTasks}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Tareas Pendientes</h5>
                            <h2 class="card-text">${stats.statusCount.pendiente}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Tareas Completadas</h5>
                            <h2 class="card-text">${stats.statusCount.completada}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title text-center">Estado de Tareas</h5>
                            <div style="height: 250px; position: relative;">
                                <canvas id="statusChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title text-center">Prioridades</h5>
                            <div style="height: 250px; position: relative;">
                                <canvas id="priorityChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title text-center">Progreso Semanal</h5>
                            <div style="height: 250px; position: relative;">
                                <canvas id="tasksChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = statisticsHTML;

    const dates = Object.keys(stats.tasksByDate).slice(-7);
    const completedTasks = dates.map(date => stats.tasksByDate[date].completed);
    const totalTasks = dates.map(date => stats.tasksByDate[date].total);

    // Gráfico de estado de tareas
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: ['Pendiente', 'En Progreso', 'Completada'],
            datasets: [{
                data: [
                    stats.statusCount.pendiente,
                    stats.statusCount.en_progreso,
                    stats.statusCount.completada
                ],
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Gráfico de prioridades
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    new Chart(priorityCtx, {
        type: 'pie',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                data: [
                    stats.priorityCount.alta,
                    stats.priorityCount.media,
                    stats.priorityCount.baja
                ],
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Gráfico de progreso semanal
    const tasksCtx = document.getElementById('tasksChart').getContext('2d');
    new Chart(tasksCtx, {
        type: 'pie',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Tareas Completadas',
                    data: completedTasks,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Total Tareas',
                    data: totalTasks,
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ... (mantener todo el código anterior igual hasta la parte del DOMContentLoaded)

document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar todos los enlaces de estadísticas (tanto en navbar como en sidebar)
    const statisticsLinks = document.querySelectorAll('a[href="#statistics"]');
    
    statisticsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Actualizar estado activo en la barra lateral
            document.querySelectorAll('.list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Actualizar estado activo en ambas navegaciones
            statisticsLinks.forEach(statLink => {
                if (statLink.classList.contains('list-group-item')) {
                    statLink.classList.add('active');
                }
                if (statLink.classList.contains('nav-link')) {
                    document.querySelectorAll('.nav-link').forEach(navLink => {
                        navLink.classList.remove('active');
                    });
                    statLink.classList.add('active');
                }
            });

            // Cerrar el menú de navegación móvil si está abierto
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
            
            // Cargar el contenido de estadísticas
            loadStatisticsContent();
        });
    });
});