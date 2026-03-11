const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.collections();
    const userColl = collections.find(c => c.collectionName === 'users');
    
    if (userColl) {
      const users = await userColl.find({}).toArray();
      console.log('Current Users in Database:');
      console.log(JSON.stringify(users, null, 2));
    } else {
      console.log('Users collection not found.');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
