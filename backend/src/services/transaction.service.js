/** transaction.service.js — MongoDB session/transaction wrapper */
const mongoose = require('mongoose');

/**
 * withTransaction — Wraps an async function in a MongoDB transaction.
 * @param {Function} fn - Async function receiving a `session` argument
 */
const withTransaction = async (fn) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    session.postCommitCallbacks = [];
    try {
        const result = await fn(session);
        await session.commitTransaction();

        // Run deferred post-commit callbacks after transaction successfully commits
        if (session.postCommitCallbacks && session.postCommitCallbacks.length > 0) {
            for (const cb of session.postCommitCallbacks) {
                cb().catch(err => console.error('[POST-COMMIT-WARN] Deferred post-commit callback failed:', err.message));
            }
        }
        
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = { withTransaction };
