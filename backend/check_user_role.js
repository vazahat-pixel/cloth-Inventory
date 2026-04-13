const mongoose = require('mongoose');
const User = require('./src/models/user.model');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const user = await User.findOne({ email: 'store2@gmail.com' });
        if (user) {
            console.log('User found:', {
                email: user.email,
                role: user.role,
                shopId: user.shopId,
                shopName: user.shopName
            });
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
