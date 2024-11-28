const API_URL = 'http://localhost:3000';

function showError(elementId, message) {
   const errorDiv = document.getElementById(elementId);
   errorDiv.textContent = message;
   errorDiv.classList.remove('d-none');
   setTimeout(() => {
       errorDiv.classList.add('d-none');
   }, 3000);
}

function updateUIOnAuth() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const authButtons = document.getElementById('authButtons');
    const userButtons = document.getElementById('userButtons');
    const navLinks = document.getElementById('navLinks');
    
    if (token && userName) {
        // Usuario autenticado
        if (authButtons) authButtons.classList.add('d-none');
        if (userButtons) userButtons.classList.remove('d-none');
        if (navLinks) navLinks.classList.add('d-none');
    } else {
        // Usuario no autenticado
        if (authButtons) authButtons.classList.remove('d-none');
        if (userButtons) userButtons.classList.add('d-none');
        if (navLinks) navLinks.classList.remove('d-none');
    }
}

async function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    // Obtener elementos de carga
    const overlay = document.getElementById('loadingOverlay');
    const animation = document.getElementById('loadingAnimation');

    if (!terms) {
        showError('registerError', 'Debes aceptar los términos y condiciones');
        return;
    }

    if (password !== confirmPassword) {
        showError('registerError', 'Las contraseñas no coinciden');
        return;
    }

    try {
        // Mostrar animación de carga
        overlay.style.display = 'flex';
        animation.play();

        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en el registro');
        }

        // Esperar 2 segundos para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', name);
        
        updateUIOnAuth();

        // Mostrar SweetAlert de éxito
        await Swal.fire({
            title: '¡Registro exitoso!',
            text: `¡Bienvenido, ${name}!`,
            icon: 'success',
            confirmButtonText: 'Continuar'
        });

        window.location.href = '/dashboard';
        
    } catch (error) {
        // Ocultar animación en caso de error
        overlay.style.display = 'none';
        animation.stop();

        // Mostrar SweetAlert de error
        await Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Obtener elementos de carga
    const overlay = document.getElementById('loadingOverlay');
    const animation = document.getElementById('loadingAnimation');

    try {
        // Mostrar animación de carga
        overlay.style.display = 'flex';
        animation.play();

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Credenciales inválidas');
        }

        /// Esperar 2 segundos para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);
        
        updateUIOnAuth(); // Actualizar UI después del login exitoso

        // Mostrar mensaje de éxito
        await Swal.fire({
            title: '¡Bienvenido!',
            text: `¡Bienvenido de nuevo, ${data.user.name}!`,
            icon: 'success',
            confirmButtonText: 'Continuar'
        });

        window.location.href = '/dashboard';
        
    } catch (error) {
        /// Esperar 2 segundos para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        // Mostrar error
        await Swal.fire({
            title: 'Error',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });

        localStorage.removeItem('token');
        localStorage.removeItem('userName');
    }
}

async function logout() {
    // Obtener elementos de carga
    const overlay = document.getElementById('loadingOverlay');
    const animation = document.getElementById('loadingAnimation');
    
    try {
        // Mostrar animación de carga
        overlay.style.display = 'flex';
        animation.play();
        
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
       
        // Esperar 2 segundos para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        // Obtener el nombre antes de limpiar el localStorage
        const userName = localStorage.getItem('userName');

        // Limpiar datos de sesión
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('pending_session');
        localStorage.removeItem('userData');
        updateUIOnAuth(); // Actualizar la UI después del logout

        // Mostrar mensaje de despedida
        await Swal.fire({
            title: `¡Hasta pronto ${userName}!`,
            text: 'Has cerrado sesión exitosamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false // Prevenir que el usuario cierre la alerta haciendo clic fuera
        });

        // Garantizar la redirección
        window.location.replace('/');
        
    } catch (error) {
        console.error('Error en logout:', error);
        
        // Esperar 2 segundos para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Ocultar animación
        overlay.style.display = 'none';
        animation.stop();

        // Limpiar datos de sesión incluso si hay error
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        updateUIOnAuth();
        
        // Mostrar mensaje de error
        await Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al cerrar sesión, pero tus datos han sido limpiados',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false // Prevenir que el usuario cierre la alerta haciendo clic fuera
        });

        // Garantizar la redirección
        window.location.replace('/');
    }
}

function verifyAuth() {
   const token = localStorage.getItem('token');
   if (!token) return false;

   return fetch(`${API_URL}/verify-token`, {
       headers: {
           'Authorization': `Bearer ${token}`
       }
   })
   .then(response => {
       if (!response.ok) {
           throw new Error('Token inválido');
       }
       return true;
   })
   .catch(() => {
       localStorage.removeItem('token');
       localStorage.removeItem('userName');
       return false;
   });
}

document.addEventListener('DOMContentLoaded', () => {
   updateUIOnAuth();
   
   // Si estamos en el dashboard, verificar autenticación
   if (window.location.pathname === '/dashboard') {
       verifyAuth().then(isAuthenticated => {
           if (!isAuthenticated) {
               window.location.href = '/?error=auth_required';
           }
       });
   }
});