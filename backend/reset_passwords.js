require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const userData = [
            { email: 'admin@test.com', password: 'admin123', role: 'admin', name: 'Admin User' },
            { email: 'store@test.com', password: 'store123', role: 'store_staff', name: 'Store Staff' }
        ];

        for (const data of userData) {
            let user = await User.findOne({ email: data.email });
            if (user) {
                user.passwordHash = data.password; // Pre-save hook will hash this
                await user.save();
                console.log(`✅ Updated ${data.role}: ${data.email} with password: ${data.password}`);
            } else {
                user = new User({
                    name: data.name,
                    email: data.email,
                    passwordHash: data.password,
                    role: data.role
                });
                await user.save();
                console.log(`✅ Created ${data.role}: ${data.email} with password: ${data.password}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reset();
