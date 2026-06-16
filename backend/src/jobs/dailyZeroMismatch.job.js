const fs = require('fs');
const path = require('path');
const axios = require('axios');
const zeroMismatchService = require('../modules/inventory/zeroMismatch.service');
const Notification = require('../models/notification.model');
const SystemLog = require('../models/systemLog.model');
const User = require('../models/user.model');
const { Roles } = require('../core/enums');
const logger = require('../config/logger');

const REPORTS_DIR = path.join(__dirname, '../../reports/daily');

const ensureReportsDir = () => {
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
};

const summarizeMismatches = (mismatches = []) => {
    const byType = {};
    mismatches.forEach((m) => {
        byType[m.type] = (byType[m.type] || 0) + 1;
    });
    return byType;
};

const buildAlertMessage = (report) => {
    if (report.passed) {
        return 'All inventory, sales, and dispatch checks passed with zero mismatch.';
    }

    const byType = summarizeMismatches(report.mismatches);
    const parts = Object.entries(byType).map(([type, count]) => `${type}: ${count}`);
    const top = (report.mismatches || []).slice(0, 3).map((m) => m.rootCause).filter(Boolean);
    let msg = `Found ${report.mismatches.length} mismatch(es). Types: ${parts.join(', ')}.`;
    if (top.length) {
        msg += ` Top issues: ${top.join(' | ')}`;
    }
    return msg.slice(0, 2000);
};

const saveDailyReport = (report) => {
    ensureReportsDir();
    const dateKey = new Date().toISOString().slice(0, 10);
    const filePath = path.join(REPORTS_DIR, `${dateKey}.json`);
    const payload = {
        ...report,
        mismatches: report.mismatches || [],
        mismatchSample: (report.mismatches || []).slice(0, 25),
        mismatchTypes: summarizeMismatches(report.mismatches),
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    fs.writeFileSync(path.join(REPORTS_DIR, 'latest.json'), JSON.stringify(payload, null, 2));
    return filePath;
};

const notifyAdmins = async (report) => {
    const admins = await User.find({
        role: Roles.ADMIN,
        isActive: { $ne: false },
    }).select('_id email name').lean();

    if (!admins.length) return 0;

    const title = report.passed
        ? '✅ Daily Verify: ZERO MISMATCH'
        : `⚠️ Daily Verify: ${report.mismatches.length} MISMATCH(ES)`;

    const message = buildAlertMessage(report);

    await Notification.insertMany(
        admins.map((admin) => ({
            userId: admin._id,
            title,
            message,
            type: 'SYSTEM',
            metadata: {
                job: 'daily_zero_mismatch',
                passed: report.passed,
                status: report.status,
                mismatchCount: report.mismatches?.length || 0,
                verifiedAt: report.verifiedAt,
            },
        })),
    );

    return admins.length;
};

const writeSystemLog = async (report) => {
    await SystemLog.create({
        action: report.passed ? 'DAILY_VERIFY_PASSED' : 'DAILY_VERIFY_FAILED',
        module: 'Inventory',
        details: {
            status: report.status,
            passed: report.passed,
            mismatchCount: report.mismatches?.length || 0,
            summary: report.summary,
            mismatchTypes: summarizeMismatches(report.mismatches),
        },
    });
};

const sendWebhookAlert = async (report) => {
    const webhookUrl = process.env.ZERO_MISMATCH_ALERT_WEBHOOK;
    if (!webhookUrl) return false;

    await axios.post(
        webhookUrl,
        {
            text: report.passed
                ? `✅ *Daily Zero-Mismatch Verify PASSED*\n${report.status}`
                : `⚠️ *Daily Zero-Mismatch Verify FAILED*\n${report.status}\nMismatches: ${report.mismatches?.length || 0}\n${buildAlertMessage(report)}`,
            report: {
                passed: report.passed,
                status: report.status,
                mismatchCount: report.mismatches?.length || 0,
                verifiedAt: report.verifiedAt,
                mismatchTypes: summarizeMismatches(report.mismatches),
            },
        },
        { timeout: 15000 },
    );
    return true;
};

/**
 * Run daily zero-mismatch verification + alerts.
 * @returns {Promise<object>} verification report with job metadata
 */
async function runDailyZeroMismatchJob(options = {}) {
    const startedAt = Date.now();
    logger.info('[DailyVerify] Starting zero-mismatch verification...');

    const report = await zeroMismatchService.verify(options);
    const reportPath = saveDailyReport(report);

    const [adminCount, webhookSent] = await Promise.all([
        notifyAdmins(report).catch((err) => {
            logger.error(`[DailyVerify] Admin notification failed: ${err.message}`);
            return 0;
        }),
        sendWebhookAlert(report).catch((err) => {
            logger.error(`[DailyVerify] Webhook alert failed: ${err.message}`);
            return false;
        }),
        writeSystemLog(report).catch((err) => {
            logger.error(`[DailyVerify] System log failed: ${err.message}`);
        }),
    ]);

    const result = {
        ...report,
        job: {
            durationMs: Date.now() - startedAt,
            reportPath,
            adminsNotified: adminCount,
            webhookSent,
        },
    };

    if (report.passed) {
        logger.info(`[DailyVerify] PASSED — ${report.status} (${result.job.durationMs}ms)`);
    } else {
        logger.warn(`[DailyVerify] FAILED — ${report.mismatches?.length || 0} mismatch(es) (${result.job.durationMs}ms)`);
    }

    return result;
}

module.exports = {
    runDailyZeroMismatchJob,
    saveDailyReport,
    buildAlertMessage,
    notifyAdmins,
    writeSystemLog,
};
