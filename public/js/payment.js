async function handleProUpgrade() {
    const overlay = document.getElementById('loadingOverlay');
    const animation = document.getElementById('loadingAnimation');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }

    try {
        overlay.style.display = 'flex';
        animation.play();

        // Primero verificamos el plan actual del usuario
        const profileResponse = await fetch(`${API_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Error al obtener información del usuario');
        }

        const userData = await profileResponse.json();

        if (userData.plan === 'pro') {
            overlay.style.display = 'none';
            animation.stop();
            
            await Swal.fire({
                title: '¡Ya tienes Plan Pro!',
                text: 'Ya estás disfrutando de todos los beneficios premium',
                icon: 'info',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        // Si no es pro, procedemos con la creación del pago
        const response = await fetch('http://localhost:3000/api/create-payment', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al procesar el pago');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        
        localStorage.setItem('pending_session', data.sessionId);
        
        if (data.url) window.location.href = data.url;
        
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error'
        });
    } finally {
        overlay.style.display = 'none';
        animation.stop();
    }
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
        
        // Actualizar nombre de usuario
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.name.split(' ')[0];
        }

        // Manejar elementos del plan PRO
        const proUpgradeElement = document.getElementById('proUpgrade');
        const proCrownElement = document.getElementById('proCrown');
        
        if (userData.plan === 'pro') {
            // Si es usuario PRO, ocultar botón de upgrade y mostrar corona
            if (proUpgradeElement) {
                proUpgradeElement.classList.add('d-none');
            }
            if (proCrownElement) {
                proCrownElement.classList.remove('d-none');
            }
        } else {
            // Si no es PRO, mostrar botón de upgrade y ocultar corona
            if (proUpgradeElement) {
                proUpgradeElement.classList.remove('d-none');
            }
            if (proCrownElement) {
                proCrownElement.classList.add('d-none');
            }
        }
    } catch (error) {
        console.error('Error al actualizar nombre:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const upgradeButton = document.querySelector('[data-action="upgrade"]');
    if (upgradeButton) {
        upgradeButton.addEventListener('click', handleProUpgrade);
    }
});