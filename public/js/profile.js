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

                <div class="row"> <!-- Aseguramos que todo esté en la misma fila -->
                    <div class="col-md-4">
                        <div class="card mb-4" style="border: 4px solid #0d6efd; height: 100%;"> <!-- Agregamos height: 100% -->
                            <div class="card-body text-center">
                                <div class="mb-3">
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

                    <div class="col-md-8">
                        <div class="card" style="border: 4px solid #0d6efd; height: 100%;"> <!-- Agregamos height: 100% -->
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

async function updateProfileImage(input) {
    if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append('profileImage', input.files[0]);

        try {
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
            const profileImages = document.querySelectorAll('.profile-image');
            profileImages.forEach(img => {
                img.src = data.imageUrl;
            });

            // Actualizar la imagen en el navbar
            const navbarProfileImg = document.querySelector('.navbar-profile-image');
            if (navbarProfileImg) {
                navbarProfileImg.src = data.imageUrl;
            }

            showAlert('Imagen actualizada con éxito', 'success');
        } catch (error) {
            showAlert('Error al actualizar la imagen', 'danger');
        }
    }
}

function updateNavbarProfile(userData) {
    const userDropdown = document.querySelector('#userDropdown');
    if (userDropdown) {
        userDropdown.innerHTML = `
            <img src="${userData.profileImage || '/images/default-profile.png'}" 
                 class="rounded-circle navbar-profile-image"
                 style="width: 32px; height: 32px; object-fit: cover">
            <span class="ms-2">${userData.name}</span>
        `;
    }
}