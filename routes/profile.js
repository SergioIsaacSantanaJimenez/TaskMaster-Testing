const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../config/checkAuth');
const bcrypt = require('bcrypt');
const User = require('../models/user');

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

module.exports = router;