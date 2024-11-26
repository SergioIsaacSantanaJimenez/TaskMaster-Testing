const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/checkAuth');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');

// Actualizar perfil de usuario
router.put('/user/profile', authenticateToken, async (req, res) => {
    try {
        const updateData = {};
        if (req.body.fullName) updateData.name = req.body.fullName;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

function checkFileType(file, cb) {
    // Tipos de archivo permitidos
    const filetypes = /jpeg|jpg|png|gif/;
    // Verificar extensión
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Verificar mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Solo se permiten imágenes!');
    }
}

// Configurar multer para el almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: './public/uploads/profiles/',
    filename: function(req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB límite
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Ruta para actualizar la foto
router.post('/user/profile/image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profileImage: imageUrl },
            { new: true }
        );

        res.json({ imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

module.exports = router;