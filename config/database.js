const mongoose = require('mongoose');

const mongoConnection = "mongodb+srv://admin:e9TUzDoqgsDcJIGH@myapp.qvgme.mongodb.net/usersTaskMaster";

const connectDB = async () => {
    try {
        await mongoose.connect(mongoConnection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('[+] Conexión exitosa a MongoDB');
    } catch (err) {
        console.error('[-] Error al conectar a MongoDB:', err);
        process.exit(1);
    }
};

module.exports = connectDB;