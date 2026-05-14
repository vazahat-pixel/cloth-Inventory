const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Store = require('../src/models/store.model');
const User = require('../src/models/user.model');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory');
        const users = await User.find({}).populate('shopId');
        console.log('Users:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
