const Ledger = require("../models/ledger.model");

/**
 * Creates journal entries within a transaction session.
 * Ensures that total debit matches total credit for balanced double-entry accounting.
 * 
 * @param {Array} entries - List of ledger entry objects
 * @param {Object} session - Mongoose transaction session
 */
async function createJournalEntries(entries, session) {
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach((e) => {
        totalDebit += Number(e.debit || 0);
        totalCredit += Number(e.credit || 0);
    });

    // Using a small tolerance for floating point precision issues if needed,
    // but for currency-like values, exact comparison or rounding is usually better.
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new Error(`Journal entry not balanced: Total Debit (${totalDebit}) !== Total Credit (${totalCredit})`);
    }

    return Ledger.insertMany(entries, { session });
}

module.exports = { createJournalEntries };
