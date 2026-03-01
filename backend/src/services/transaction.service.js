/** transaction.service.js — MongoDB session/transaction wrapper */
const mongoose = require('mongoose');

/**
 * withTransaction — Wraps an async function in a MongoDB transaction.
 * @param {Function} fn - Async function receiving a `session` argument
 */
const withTransaction = async (fn) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await fn(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = { withTransaction };
