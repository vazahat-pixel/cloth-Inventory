const mongoose = require('mongoose');
const User = require('./src/models/user.model');
require('dotenv').config();

async function updateRole() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const result = await User.updateOne(
            { email: 'store2@gmail.com' },
            { $set: { role: 'store_staff' } }
        );
        
        if (result.modifiedCount > 0) {
            console.log('SUCCESS: Role updated to store_staff for store2@gmail.com');
        } else {
            console.log('No changes made (User not found or already store_staff)');
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

updateRole();
