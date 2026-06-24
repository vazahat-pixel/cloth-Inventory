const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/user.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("Fetching users...");
        const users = await User.find().lean();
        users.forEach(u => {
            console.log(`- Username: ${u.username || u.email}, Name: ${u.name}, Role: ${u.role}, Password (hashed): ${u.password}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
