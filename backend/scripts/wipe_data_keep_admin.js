const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Ye script saara data delete karegi EXCEPT:
 * 1. Admin account (admin@test.com)
 * 2. Roles collection (permissions)
 * 3. Accounts collection (Accounting system structure)
 */
async function wipeData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();
    
    for (const coll of collections) {
      const name = coll.collectionName;

      // Skip Roles and Accounts structure
      if (name === 'roles' || name === 'accounts') {
        console.log(`⏩ Skipping system collection: ${name}`);
        continue;
      }

      if (name === 'users') {
        // Users mein se sirf admin@test.com ko chhod kar baaki sab delete
        console.log('👤 Cleaning users, keeping admin@test.com...');
        await coll.deleteMany({ email: { $ne: 'admin@test.com' } });
        
        // Ensure admin@test.com exists
        const admin = await coll.findOne({ email: 'admin@test.com' });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            await coll.insertOne({
                name: 'System Admin',
                email: 'admin@test.com',
                passwordHash: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Created Old Admin: admin@test.com / admin123');
        } else {
            console.log('✅ Found existing admin@test.com');
        }
        continue;
      }

      // Baaki sab collections ka sirf data delete karna hai (deleteMany)
      // taaki schema aur indexes bane rahein
      console.log(`🗑️  Cleaning data from: ${name}`);
      await coll.deleteMany({});
    }

    console.log('\n✨ Database clean completed. Only Admin (admin@test.com) remains.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during wipe:', err);
    process.exit(1);
  }
}

wipeData();
