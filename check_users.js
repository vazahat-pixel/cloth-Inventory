const mongoose = require('mongoose');
const User = require('./backend/src/models/user.model');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, Active: ${u.isActive}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
