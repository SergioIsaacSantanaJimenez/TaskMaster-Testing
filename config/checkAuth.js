const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const JWT_SECRET = 's3cr3tk3y___...';

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.redirect('/?error=auth_required');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.redirect('/?error=invalid_session');
    }
};

// Función para registrar usuario
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        setTokenCookie(res, token);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                name: user.name,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

// Función para login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        setTokenCookie(res, token);

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                name: user.name,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

// Función para logout
const logoutUser = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada exitosamente' });
};

// Función para obtener perfil
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil de usuario' });
    }
};

// Función para verificar token
const verifyToken = (req, res) => {
    res.json({
        valid: true,
        user: {
            name: req.user.name,
            email: req.user.email
        }
    });
};

// Función auxiliar para establecer la cookie del token
const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
};

module.exports = {
    authenticateToken,
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    verifyToken
};