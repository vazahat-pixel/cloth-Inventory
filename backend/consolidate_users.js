require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function consolidateAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Identify the primary admin
        const primaryAdminEmail = 'admin@test.com';

        // 2. Delete all other admins
        const deleteAdmins = await User.deleteMany({
            role: 'admin',
            email: { $ne: primaryAdminEmail }
        });
        console.log(`🗑️ Deleted ${deleteAdmins.deletedCount} redundant admin accounts.`);

        // 3. Ensure the primary admin exists and is clean
        let admin = await User.findOne({ email: primaryAdminEmail });
        if (!admin) {
            admin = new User({
                name: 'System Admin',
                email: primaryAdminEmail,
                passwordHash: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log(`✅ Created Primary Admin: ${primaryAdminEmail}`);
        } else {
            admin.name = 'System Admin';
            admin.passwordHash = 'admin123'; // Pre-save hook will hash this
            await admin.save();
            console.log(`✅ Refreshed Primary Admin: ${primaryAdminEmail}`);
        }

        // 4. Clean up test store accounts too?
        // Let's keep one store account for testing the flow as requested earlier.
        const primaryStoreEmail = 'store@test.com';
        const deleteStores = await User.deleteMany({
            role: 'store_staff',
            email: { $ne: primaryStoreEmail }
        });
        console.log(`🗑️ Deleted ${deleteStores.deletedCount} redundant store accounts.`);

        console.log('\n--- Final Account Summary ---');
        const finalUsers = await User.find({}, { name: 1, email: 1, role: 1 });
        console.log(finalUsers);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

consolidateAdmin();
