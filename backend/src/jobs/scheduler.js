/**
 * In-process daily scheduler (no extra npm package).
 * Enabled when DAILY_ZERO_MISMATCH_CRON=true in .env
 */

const { runDailyZeroMismatchJob } = require('./dailyZeroMismatch.job');
const logger = require('../config/logger');

const parseTime = (value, fallbackHour, fallbackMinute) => {
    const raw = value || `${String(fallbackHour).padStart(2, '0')}:${String(fallbackMinute).padStart(2, '0')}`;
    const [h, m] = String(raw).split(':').map((n) => parseInt(n, 10));
    return {
        hour: Number.isFinite(h) ? h : fallbackHour,
        minute: Number.isFinite(m) ? m : fallbackMinute,
    };
};

const msUntilNextRun = (hour, minute) => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    return next.getTime() - now.getTime();
};

let timer = null;
let running = false;

const scheduleNext = (hour, minute) => {
    const delay = msUntilNextRun(hour, minute);
    const nextAt = new Date(Date.now() + delay);
    logger.info(`[DailyVerify] Next run scheduled at ${nextAt.toLocaleString()} (${Math.round(delay / 60000)} min)`);

    timer = setTimeout(async () => {
        if (running) {
            logger.warn('[DailyVerify] Previous run still in progress — skipping overlap');
        } else {
            running = true;
            try {
                await runDailyZeroMismatchJob();
            } catch (err) {
                logger.error(`[DailyVerify] Scheduled run failed: ${err.message}`);
            } finally {
                running = false;
            }
        }
        scheduleNext(hour, minute);
    }, delay);
};

const startDailyZeroMismatchScheduler = () => {
    const enabled = String(process.env.DAILY_ZERO_MISMATCH_CRON || '').toLowerCase() === 'true';
    if (!enabled) {
        logger.info('[DailyVerify] In-server scheduler disabled (set DAILY_ZERO_MISMATCH_CRON=true to enable)');
        return;
    }

    const { hour, minute } = parseTime(
        process.env.DAILY_ZERO_MISMATCH_TIME,
        6,
        0,
    );

    logger.info(`[DailyVerify] In-server scheduler enabled — daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    scheduleNext(hour, minute);
};

const stopDailyZeroMismatchScheduler = () => {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
};

module.exports = {
    startDailyZeroMismatchScheduler,
    stopDailyZeroMismatchScheduler,
};
