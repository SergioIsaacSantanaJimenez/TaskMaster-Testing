const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pendiente', 'en_progreso', 'completada'],
        default: 'pendiente'
    },
    priority: {
        type: String,
        enum: ['baja', 'media', 'alta'],
        default: 'media'
    },
    dueDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'tasks' });

module.exports = mongoose.model('Task', taskSchema);