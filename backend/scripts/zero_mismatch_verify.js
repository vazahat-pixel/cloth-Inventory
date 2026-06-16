#!/usr/bin/env node
/**
 * CLI: Run zero-mismatch verification against live database.
 * Usage: node scripts/zero_mismatch_verify.js [--startDate=YYYY-MM-DD] [--endDate=YYYY-MM-DD]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const zeroMismatchService = require('../src/modules/inventory/zeroMismatch.service');

const parseArgs = () => {
    const opts = {};
    process.argv.slice(2).forEach((arg) => {
        const [key, val] = arg.replace(/^--/, '').split('=');
        opts[key] = val || true;
    });
    return opts;
};

async function main() {
    const { startDate, endDate } = parseArgs();
    await mongoose.connect(process.env.MONGODB_URI);
    const report = await zeroMismatchService.verify({ startDate, endDate });
    console.log(JSON.stringify(report, null, 2));
    console.log('\n' + report.status);
    await mongoose.disconnect();
    process.exit(report.passed ? 0 : 1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
