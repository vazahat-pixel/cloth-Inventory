require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const jwt = require('jsonwebtoken');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ role: 'Admin' });
    if (!user) { console.log("No admin found"); process.exit(1); }

    // sign token
    const token = jwt.sign({ id: user._id, role: user.role, shopId: user.shopId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log("Token:", token);

    const endpoints = [
        '/api/products',
        '/api/stores',
        '/api/fabrics',
        '/api/suppliers',
        '/api/production',
        '/api/dispatch',
        '/api/categories',
        '/api/staff',
        '/api/dashboard',
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(`http://localhost:5000${ep}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`${ep}: ${res.status}`);
            if (res.status === 500) {
                console.log(await res.text());
            }
        } catch (e) {
            console.error(ep, e);
        }
    }
    await mongoose.disconnect();
})();
