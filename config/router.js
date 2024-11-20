const express = require('express');
const router = express.Router();
const path = require('path');
const verifyToken = require('../middlewares/auth');

// Ruta pública - Página principal
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/index.html'));
});

// Ruta protegida - Dashboard
router.get('/dashboard', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/views/dashboard.html'));
});

module.exports = router;