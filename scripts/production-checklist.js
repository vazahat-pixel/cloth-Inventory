#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Ledger = require('../backend/src/models/ledger.model');

async function checkJwtAndRateLimiting() {
  const authMiddlewarePath = path.resolve(__dirname, '../backend/src/middlewares/auth.middleware.js');
  const rateLimitPath = path.resolve(__dirname, '../backend/src/middlewares/rateLimit.middleware.js');

  let jwtActive = false;
  let rateLimitActive = false;

  if (fs.existsSync(authMiddlewarePath)) {
    const content = fs.readFileSync(authMiddlewarePath, 'utf8');
    jwtActive = content.includes('jwt') || content.includes('Authorization');
  }

  if (fs.existsSync(rateLimitPath)) {
    const content = fs.readFileSync(rateLimitPath, 'utf8');
    rateLimitActive = content.includes('express-rate-limit') || content.includes('rateLimit');
  }

  return { jwtActive, rateLimitActive };
}

async function checkEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    return { ok: false, error: 'MONGODB_URI not set' };
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return { ok: true };
}

async function checkLedgerBalance() {
  const result = await Ledger.aggregate([
    {
      $group: {
        _id: null,
        totalDebit: { $sum: '$debit' },
        totalCredit: { $sum: '$credit' },
      },
    },
  ]);
  const { totalDebit = 0, totalCredit = 0 } = result[0] || {};
  return {
    ok: Math.round(totalDebit) === Math.round(totalCredit),
    totalDebit,
    totalCredit,
  };
}

async function run() {
  const report = {
    jwtAndRateLimit: null,
    env: null,
    db: null,
    ledger: null,
    seederSimValidator: null,
  };

  let allOk = true;

  try {
    report.jwtAndRateLimit = await checkJwtAndRateLimiting();
    if (!report.jwtAndRateLimit.jwtActive || !report.jwtAndRateLimit.rateLimitActive) {
      allOk = false;
    }

    report.env = await checkEnv();
    if (!report.env.ok) allOk = false;

    report.db = await connectDB();
    if (!report.db.ok) allOk = false;

    if (report.db.ok) {
      report.ledger = await checkLedgerBalance();
      if (!report.ledger.ok) allOk = false;
    }

    // Seeder + Simulation + Validation manual flags
    const resultsFile = path.resolve(__dirname, './qa-results.json');
    if (fs.existsSync(resultsFile)) {
      try {
        report.seederSimValidator = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      } catch {
        report.seederSimValidator = null;
      }
    }

    console.log('PRODUCTION READINESS CHECKLIST');
    console.log('------------------------------');
    console.log('JWT middleware active:', report.jwtAndRateLimit.jwtActive);
    console.log('Rate limiting active:', report.jwtAndRateLimit.rateLimitActive);
    console.log('Environment variables present:', report.env.ok, report.env.missing || []);
    console.log('MongoDB connection:', report.db.ok);
    if (report.ledger) {
      console.log('Ledger balanced:', report.ledger.ok, {
        totalDebit: report.ledger.totalDebit,
        totalCredit: report.ledger.totalCredit,
      });
    }
    console.log('Seeder + Simulation + Validation status (if provided):', report.seederSimValidator);

    if (!allOk) {
      console.log('FINAL PRODUCTION STATUS: FAIL');
      process.exit(1);
    } else {
      console.log('FINAL PRODUCTION STATUS: PASS');
      process.exit(0);
    }
  } catch (err) {
    console.error('Production checklist error:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

run();

