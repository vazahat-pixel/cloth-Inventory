/**
 * One-time migration script: Seed the BM item code counter at 258
 * so that the very first auto-generated code is BM0259.
 *
 * Run once: node backend/scripts/seed_item_code_counter.js
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Counter = require('../src/models/counter.model');

const COUNTER_NAME = 'itemCode_BM';
const SEED_VALUE = 258; // First generated code will be 259

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cloth-inventory';

  console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/:\/\/.*@/, '://***@')}`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const existing = await Counter.findOne({ name: COUNTER_NAME });

  if (!existing) {
    await Counter.create({ name: COUNTER_NAME, seq: SEED_VALUE });
    console.log(`✅ Counter "${COUNTER_NAME}" seeded at seq=${SEED_VALUE}`);
    console.log(`   → Next auto-generated item code will be: BM${String(SEED_VALUE + 1).padStart(4, '0')}`);
  } else {
    console.log(`ℹ️  Counter "${COUNTER_NAME}" already exists with seq=${existing.seq}`);
    console.log(`   → Next auto-generated item code will be: BM${String(existing.seq + 1).padStart(4, '0')}`);
    console.log('   No changes made.');
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
