const Counter = require('../models/counter.model');

/**
 * getNextSequence — Atomically increments a named counter and returns the new value.
 * @param {String} name - Name of the counter (e.g., 'SALE', 'PURCHASE', 'RETURN')
 * @param {Object} [session] - MongoDB transaction session
 * @returns {Promise<Number>} - The incremented sequence number
 */
const getNextSequence = async (name, session = null) => {
    const options = { new: true, upsert: true };
    if (session) options.session = session;

    const counter = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        options
    );

    return counter.seq;
};

module.exports = { getNextSequence };
