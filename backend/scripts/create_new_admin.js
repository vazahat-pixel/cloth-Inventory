const mongoose = require('mongoose');
const User = require('../src/models/user.model');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@admin.com';
        const password = 'password1122';
        
        await User.deleteMany({ email }); // Remove if exists
        
        const user = await User.create({
            name: 'New Administrator',
            email,
            passwordHash: password,
            role: 'admin',
            isActive: true
        });
        
        console.log('✅ New Admin Created Successfully!');
        console.log('--- Credentials ---');
        console.log(`Email   : ${email}`);
        console.log(`Password: ${password}`);
        console.log('-------------------');
        process.exit(0);
    } catch (error) {
        console.error('❌ Creation failed:', error.message);
        process.exit(1);
    }
};

createAdmin();
