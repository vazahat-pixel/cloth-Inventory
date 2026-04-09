const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user.model');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@vazahat.com';
        const password = 'admin@123';
        const name = 'Master Admin';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Admin already exists. Updating password...');
            existingUser.passwordHash = password;
            existingUser.role = 'admin';
            existingUser.isActive = true;
            await existingUser.save();
            console.log(`Admin account [${email}] updated and unlocked.`);
        } else {
            const newUser = new User({
                name,
                email,
                passwordHash: password,
                role: 'admin',
                isActive: true
            });
            await newUser.save();
            console.log(`Master Admin [${email}] created successfully.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
