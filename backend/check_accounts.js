require('dotenv').config();
const mongoose = require('mongoose');
const Account = require('./src/models/account.model');

async function checkAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Account.countDocuments();
    console.log(`Found ${count} accounts in database.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAccounts();
