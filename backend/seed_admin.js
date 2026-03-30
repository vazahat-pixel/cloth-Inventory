require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'admin@clotherp.com';
    const password = 'Password@123';
    
    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists.');
    } else {
      user = await User.create({
        name: 'Super Admin',
        email,
        passwordHash: password,
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created successfully.');
    }
    console.log('Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
