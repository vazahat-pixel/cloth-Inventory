const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { runDailyZeroMismatchJob } = require('../src/jobs/dailyZeroMismatch.job');

/**
 * Standalone daily verification — use with Windows Task Scheduler or Linux cron.
 *
 * Windows Task Scheduler example (daily 6:00 AM):
 *   node C:\path\to\cloth-Inventory\backend\scripts\daily_zero_mismatch_cron.js
 *
 * Linux cron (daily 6:00 AM):
 *   0 6 * * * cd /path/to/backend && node scripts/daily_zero_mismatch_cron.js >> logs/daily-verify.log 2>&1
 */
async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await runDailyZeroMismatchJob();
    console.log('\n=== DAILY ZERO-MISMATCH VERIFY ===');
    console.log('Status:', result.status);
    console.log('Passed:', result.passed);
    console.log('Mismatches:', result.mismatches?.length || 0);
    console.log('Report:', result.job?.reportPath);
    console.log('Admins notified:', result.job?.adminsNotified || 0);
    console.log('Webhook sent:', result.job?.webhookSent || false);
    await mongoose.disconnect();
    process.exit(result.passed ? 0 : 2);
}

main().catch(async (err) => {
    console.error('[DailyVerify] Fatal error:', err);
    try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
    process.exit(1);
});
