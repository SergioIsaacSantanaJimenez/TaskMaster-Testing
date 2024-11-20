// Añadir event listener cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    const profileLinks = document.querySelectorAll('a[href="#profile"]');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadDynamicProfile();
        });
    });
});

async function loadDynamicProfile() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar perfil');
        const userData = await response.json();
        
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="container-fluid p-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="mb-0">Mi Perfil</h3>
                    <button class="btn btn-primary" onclick="editProfile()">
                        <i class="bi bi-pencil me-2"></i>Editar Perfil
                    </button>
                </div>

                <div class="row">
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <i class="bi bi-person-circle display-1 mb-3"></i>
                                    <h4 id="profileName">${userData.name}</h4>
                                    <p id="profileEmail" class="text-muted">${userData.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title mb-4">Información Personal</h5>
                                <div class="mb-3">
                                    <label class="text-muted">Nombre Completo</label>
                                    <p id="fullName" class="mb-3">${userData.name}</p>
                                    
                                    <label class="text-muted">Email</label>
                                    <p id="email" class="mb-3">${userData.email}</p>
                                    
                                    <label class="text-muted">Fecha de Registro</label>
                                    <p id="registerDate" class="mb-3">${new Date(userData.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de Edición -->
            <div class="modal fade" id="editProfileModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Perfil</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editProfileForm">
                                <div class="mb-3">
                                    <label class="form-label">Nombre Completo</label>
                                    <input type="text" class="form-control" id="editFullName" value="${userData.name}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="editEmail" value="${userData.email}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Nueva Contraseña (opcional)</label>
                                    <input type="password" class="form-control" id="editPassword">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-2"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="saveProfile()">
                                <i class="bi bi-check-circle me-2"></i>Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al cargar el perfil', 'danger');
    }
}

async function saveProfile() {
    try {
        const token = localStorage.getItem('token');
        const data = {
            fullName: document.getElementById('editFullName').value,
            email: document.getElementById('editEmail').value,
            password: document.getElementById('editPassword').value
        };
        
        if (!data.password) delete data.password;
        
        const response = await fetch(`${API_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Error al actualizar el perfil');
        
        bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
        loadDynamicProfile();
        showAlert('Perfil actualizado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al actualizar el perfil', 'danger');
    }
}

function editProfile() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.main-content').insertAdjacentElement('afterbegin', alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}