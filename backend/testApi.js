require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        let user = await User.findOne({ role: 'admin' });

        // If no user exists, let's create a temporary admin
        if (!user) {
            console.log("Creating temp admin");
            user = await User.create({
                name: "Temp Admin",
                email: "temp@admin.com",
                passwordHash: "123456",
                role: 'admin'
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log("Token acquired.");

        const res = await fetch(`http://localhost:5000/api/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Status:", res.status);
        if (res.status === 500) {
            console.log("Body:", await res.text());
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await mongoose.disconnect();
    }
})();
