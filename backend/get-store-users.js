const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
    name: String,
    shopName: String,
});

const User = mongoose.model('User', UserSchema);

async function getUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log(JSON.stringify(users, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

getUsers();
