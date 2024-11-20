const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const { authenticateToken } = require('../config/checkAuth');

// Obtener todas las tareas del usuario
router.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        console.log('Buscando tareas para el usuario:', req.user.userId);
        const tasks = await Task.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });
        console.log('Tareas encontradas:', tasks);
        res.json(tasks);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ error: 'Error al obtener las tareas' });
    }
});

// Obtener una tarea específica
router.get('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.json(task);
    } catch (error) {
        console.error('Error al obtener la tarea:', error);
        res.status(500).json({ error: 'Error al obtener la tarea' });
    }
});

// Crear nueva tarea
router.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        console.log('Usuario:', req.user);

        const { title, description, status, priority, dueDate } = req.body;
        
        const task = new Task({
            userId: req.user.userId,
            title,
            description,
            status,
            priority,
            dueDate: new Date(dueDate)
        });

        console.log('Tarea a guardar:', task);
        
        await task.save();
        console.log('Tarea guardada exitosamente');
        
        res.status(201).json(task);
    } catch (error) {
        console.error('Error al crear la tarea:', error);
        res.status(500).json({ error: 'Error al crear la tarea', details: error.message });
    }
});

// Actualizar tarea
router.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Actualizando tarea:', req.params.id);
        console.log('Datos de actualización:', req.body);

        // Crear objeto de actualización
        const updateData = {};
        
        // Solo incluir los campos que están presentes en req.body
        if (req.body.title) updateData.title = req.body.title;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.status) updateData.status = req.body.status;
        if (req.body.priority) updateData.priority = req.body.priority;
        if (req.body.dueDate) updateData.dueDate = new Date(req.body.dueDate);

        const task = await Task.findOneAndUpdate(
            { 
                _id: req.params.id, 
                userId: req.user.userId 
            },
            updateData,
            { new: true }
        );
        
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        console.log('Tarea actualizada:', task);
        res.json(task);
    } catch (error) {
        console.error('Error al actualizar la tarea:', error);
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});

// Eliminar tarea
router.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Eliminando tarea:', req.params.id);
        
        const task = await Task.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.userId 
        });
        
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        console.log('Tarea eliminada exitosamente');
        res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar la tarea:', error);
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});

// Actualizar fecha de tarea
router.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Actualizando fecha de tarea:', req.params.id);
        console.log('Nueva fecha:', req.body.dueDate);

        const task = await Task.findOneAndUpdate(
            { 
                _id: req.params.id,
                userId: req.user.userId 
            },
            { dueDate: new Date(req.body.dueDate) },
            { new: true }
        );
        
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        console.log('Fecha de tarea actualizada:', task);
        res.json(task);
    } catch (error) {
        console.error('Error al actualizar fecha de tarea:', error);
        res.status(500).json({ error: 'Error al actualizar fecha de tarea' });
    }
});


module.exports = router;

