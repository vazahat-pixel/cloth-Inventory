require('dotenv').config();
const mongoose = require('mongoose');

const collectionsToClear = [
  'ledgers', 'counters', 'storepricings', 'schemes', 'coupons', 
  'notifications', 'approvalrequests', 'salesmen'
];

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const collectionName of collectionsToClear) {
      try {
        await mongoose.connection.collection(collectionName).deleteMany({});
        console.log(`Cleared collection: ${collectionName}`);
      } catch (err) {
        console.log(`Skipped or Error in ${collectionName}: ${err.message}`);
      }
    }

    console.log('Second phase of data cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

clearData();
