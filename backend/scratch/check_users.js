const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/user.model');
const Store = require('../src/models/store.model');

async function checkUsers() {
    await connectDB();
    try {
        const users = await User.find().populate('shopId').lean();
        console.log(`ℹ️ Total Users in DB: ${users.length}`);
        users.forEach(user => {
            console.log(`   - Name: "${user.name}" | Email: "${user.email}" | Role: "${user.role}" | Linked Shop: "${user.shopId?.name || 'None'}" (ID: ${user.shopId?._id || 'None'})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

checkUsers();
