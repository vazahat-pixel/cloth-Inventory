const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/user.model');
const { Roles } = require('../src/core/enums');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const users = [
            {
                name: 'System Admin',
                email: 'admin@gmail.com',
                passwordHash: 'admin@123',
                role: Roles.ADMIN,
                isActive: true
            },
            {
                name: 'Store Staff',
                email: 'store@gmail.com',
                passwordHash: 'store@123',
                role: Roles.STORE_STAFF,
                isActive: true
            }
        ];

        for (const userData of users) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                console.log(`User ${userData.email} already exists. Updating password...`);
                existing.passwordHash = userData.passwordHash;
                await existing.save();
            } else {
                console.log(`Creating user ${userData.email}...`);
                await User.create(userData);
            }
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
