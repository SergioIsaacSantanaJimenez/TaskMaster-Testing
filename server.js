const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');


// Importar módulos
const connectDB = require('./config/database');
const auth = require('./config/checkAuth');
const paymentRouter = require('./routes/payment');

// Ruta para 

// Configuración de Express
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Conectar a la base de datos
connectDB();

// Ruta para Stripe (No mover) 
app.use('/api', paymentRouter);

// Rutas públicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

// Ruta protegida del dashboard
app.get('/dashboard', auth.authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'dashboard.html'));
});

// Rutas de autenticación
app.post('/register', auth.registerUser);
app.post('/login', auth.loginUser);
app.post('/logout', auth.logoutUser);
app.get('/user/profile', auth.authenticateToken, auth.getUserProfile);
app.get('/verify-token', auth.authenticateToken, auth.verifyToken);

// Rutas de tareas
const tasksRouter = require('./routes/tasks');
app.use(tasksRouter);

// Ruta para editar perfil:
const profileRouter = require('./routes/profile');
app.use(profileRouter);

// Manejador de rutas no encontradas - DEBE IR AL FINAL
app.use((req, res) => {
    console.log('Ruta no encontrada:', req.method, req.url);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global - DEBE IR AL FINAL
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[+] Servidor corriendo en http://localhost:${PORT}`);
});