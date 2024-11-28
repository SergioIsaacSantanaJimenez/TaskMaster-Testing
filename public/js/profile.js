// Añadir event listener cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar las imágenes de perfil al cargar la página
    initializeProfileImages();
    
    // Configurar los event listeners para los enlaces de perfil
    const profileLinks = document.querySelectorAll('a[href="#profile"]');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadDynamicProfile();
        });
    });
});

async function loadDynamicProfile() {
    // Obtener el token de autenticación del almacenamiento local
    const token = localStorage.getItem('token');
    
    try {
        // Realizar la petición al servidor para obtener los datos del perfil
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Si la respuesta no es exitosa, lanzar un error
        if (!response.ok) throw new Error('Error al cargar perfil');
        
        // Convertir la respuesta a JSON
        const userData = await response.json();

        // Actualizar la información del perfil en la barra de navegación
        updateNavbarProfile(userData);
        
        // Guardar los datos del usuario en el almacenamiento local para uso futuro
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Obtener el contenedor principal y actualizar su contenido
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="container-fluid p-4">
                <!-- Encabezado del perfil con botón de edición -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="mb-0">Mi Perfil</h3>
                    <button class="btn btn-primary" onclick="editProfile()">
                        <i class="bi bi-pencil me-2"></i>Editar Perfil
                    </button>
                </div>

                <!-- Contenedor principal con dos columnas -->
                <div class="row">
                    <!-- Columna izquierda - Foto de perfil -->
                    <div class="col-md-4">
                        <div class="card mb-4" style="border: 4px solid #0d6efd; height: 100%;">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <!-- Contenedor de la imagen de perfil con botón de cambio -->
                                    <div class="position-relative d-inline-block">
                                        <img src="${userData.profileImage || '/images/default-profile.png'}" 
                                             class="rounded-circle mb-3 profile-image" 
                                             style="width: 150px; height: 150px; object-fit: cover"
                                             id="profileImage">
                                        <label for="imageInput" 
                                               class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
                                               style="cursor: pointer">
                                            <i class="bi bi-camera"></i>
                                        </label>
                                        <input type="file" 
                                               id="imageInput" 
                                               hidden 
                                               accept="image/*"
                                               onchange="updateProfileImage(this)">
                                    </div>
                                    <h4 id="profileName">${userData.name}</h4>
                                    <p id="profileEmail" class="text-muted">${userData.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna derecha - Información del perfil -->
                    <div class="col-md-8">
                        <div class="card" style="border: 4px solid #0d6efd; height: 100%;">
                            <div class="card-body">
                                <h5 class="card-title mb-4 fw-bold fs-4">Información Personal</h5>
                                <div class="mb-3">
                                    <label class="text-primary fw-bold">Nombre Completo</label>
                                    <p id="fullName" class="mb-3">${userData.name}</p>
                                    
                                    <label class="text-primary fw-bold">Email</label>
                                    <p id="email" class="mb-3">${userData.email}</p>
                                    
                                    <label class="text-primary fw-bold">Fecha de Registro</label>
                                    <p id="registerDate" class="mb-3">${new Date(userData.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal para editar perfil -->
            <div class="modal fade" id="editProfileModal" tabindex="-1" aria-labelledby="editProfileModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editProfileModalLabel">Editar Perfil</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editProfileForm">
                                <div class="mb-3">
                                    <label for="editFullName" class="form-label">Nombre Completo</label>
                                    <input type="text" class="form-control" id="editFullName" value="${userData.name || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="editEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="editEmail" value="${userData.email || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="editPassword" class="form-label">Nueva Contraseña (opcional)</label>
                                    <input type="password" class="form-control" id="editPassword">
                                    <small class="form-text text-muted">Dejar en blanco para mantener la contraseña actual</small>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="saveProfile()">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        // Manejo de errores
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

async function updateProfileImage(input) {
    if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append('profileImage', input.files[0]);

        try {
            // Mostrar estado de carga
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) loadingOverlay.style.display = 'flex';

            const response = await fetch(`${API_URL}/user/profile/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error al actualizar imagen');

            const data = await response.json();
            
            // Actualizar todas las imágenes de perfil en la página
            const allProfileImages = document.querySelectorAll('.profile-image, .navbar-profile-image');
            allProfileImages.forEach(img => {
                img.src = data.imageUrl;
            });

            // Actualizar específicamente la barra de navegación
            const navbarImage = document.querySelector('#userDropdown img');
            if (navbarImage) {
                navbarImage.src = data.imageUrl;
                navbarImage.className = 'rounded-circle navbar-profile-image';
                navbarImage.style.width = '32px';
                navbarImage.style.height = '32px';
                navbarImage.style.objectFit = 'cover';
            }

            // Actualizar localStorage para mantener un registro de la imagen de perfil actual
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.profileImage = data.imageUrl;
            localStorage.setItem('userData', JSON.stringify(userData));

            showAlert('Imagen actualizada con éxito', 'success');
        } catch (error) {
            console.error('Error al actualizar la imagen de perfil:', error);
            showAlert('Error al actualizar la imagen', 'danger');
        } finally {
            // Ocultar estado de carga
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    }
}

function updateNavbarProfile(userData) {
    if (!userData) return;
    
    const userDropdown = document.querySelector('#userDropdown');
    const navbarProfileImage = document.querySelector('#userDropdown img');
    
    if (userDropdown) {
        if (navbarProfileImage) {
            // Si la imagen ya existe, solo actualizamos su src
            navbarProfileImage.src = userData.profileImage || '/images/default-profile.png';
        } else {
            // Si no existe la imagen, actualizamos todo el contenido
            userDropdown.innerHTML = `
                <img src="${userData.profileImage || '/images/default-profile.png'}" 
                     class="rounded-circle navbar-profile-image"
                     style="width: 32px; height: 32px; object-fit: cover">
                <span class="ms-2">${userData.name || 'Usuario'}</span>
            `;
        }
    }
}

// Agregar esta función para inicializar las imágenes de perfil cuando la página carga
async function initializeProfileImages() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar perfil');
        const userData = await response.json();

        // Actualizar todas las imágenes de perfil
        const allProfileImages = document.querySelectorAll('.profile-image, .navbar-profile-image');
        allProfileImages.forEach(img => {
            img.src = userData.profileImage || '/images/default-profile.png';
        });

        // Actualizar específicamente el navbar
        updateNavbarProfile(userData);

        // Guardar en localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
        console.error('Error al inicializar imágenes:', error);
    }
}

