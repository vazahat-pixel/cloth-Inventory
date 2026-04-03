const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user.model');
const { Roles } = require('../core/enums');

async function createUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingUser = await User.findOne({ email: 'store@gmail.com' });
        if (existingUser) {
            console.log('User already exists. Updating password...');
            existingUser.passwordHash = 'store@123';
            await existingUser.save();
            console.log('User updated successfully');
        } else {
            const newUser = new User({
                name: 'Store Staff',
                email: 'store@gmail.com',
                passwordHash: 'store@123',
                role: Roles.STORE_STAFF,
                isActive: true
            });
            await newUser.save();
            console.log('Store staff user created successfully');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
}

createUser();
