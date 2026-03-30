const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
        console.log(`🔌 Attempting MongoDB connection: ${maskedUri}`);
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
