require('dotenv').config();
const connectDB = require('./src/config/db');
const mongoose = require('mongoose');

async function checkSchemes() {
  await connectDB();
  
  const db = mongoose.connection.db;
  const rawSchemes = await db.collection('schemes').find({}).toArray();
  console.log(`Raw MongoDB 'schemes' collection has ${rawSchemes.length} documents:`);
  for (const s of rawSchemes) {
    console.log(`- ID: ${s._id}, Name: "${s.name}", IsActive: ${s.isActive}, Products count: ${s.applicableProducts?.length}`);
  }

  const byId = await db.collection('schemes').findOne({ _id: new mongoose.Types.ObjectId('6a3bcd62692f293df02a3999') });
  console.log(`\nScheme by ID 6a3bcd62692f293df02a3999:`, byId);

  process.exit(0);
}

checkSchemes().catch(err => {
  console.error(err);
  process.exit(1);
});
