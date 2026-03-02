#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Use backend's mongoose so models share the same connection instance
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

const Ledger = require('../backend/src/models/ledger.model');
const Product = require('../backend/src/models/product.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');
const Invoice = require('../backend/src/models/invoice.model');
const Dispatch = require('../backend/src/models/dispatch.model');
const ReturnModel = require('../backend/src/models/return.model');
const CreditNote = require('../backend/src/models/creditNote.model');
const Customer = require('../backend/src/models/customer.model');

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set in environment');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
}

async function validateLedger() {
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
    const balanced = Math.round(totalDebit) === Math.round(totalCredit);

    return {
        ok: balanced,
        totalDebit,
        totalCredit,
    };
}

async function validateStock() {
    const negativeFactoryStock = await Product.find({ factoryStock: { $lt: 0 } }).limit(1);
    const negativeStoreStock = await StoreInventory.find({ quantityAvailable: { $lt: 0 } }).limit(1);

    return {
        ok: !negativeFactoryStock.length && !negativeStoreStock.length,
        negativeFactoryStock: negativeFactoryStock.length,
        negativeStoreStock: negativeStoreStock.length,
    };
}

async function checkDuplicates(model, field) {
    const result = await model.aggregate([
        {
            $group: {
                _id: `$${field}`,
                count: { $sum: 1 },
            },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 1 },
    ]);
    return result.length === 0;
}

async function validateDuplicates() {
    const noDuplicateInvoices = await checkDuplicates(Invoice, 'invoiceNumber');
    const noDuplicateDispatch = await checkDuplicates(Dispatch, 'dispatchNumber');
    const noDuplicateReturns = await checkDuplicates(ReturnModel, 'returnNumber');

    return {
        ok: noDuplicateInvoices && noDuplicateDispatch && noDuplicateReturns,
        noDuplicateInvoices,
        noDuplicateDispatch,
        noDuplicateReturns,
    };
}

async function validateCreditNotes() {
    const negatives = await CreditNote.find({ remainingAmount: { $lt: 0 } }).limit(1);
    return {
        ok: !negatives.length,
        negativeCreditNotes: negatives.length,
    };
}

async function validateLoyalty() {
    const negatives = await Customer.find({ points: { $lt: 0 } }).limit(1);
    return {
        ok: !negatives.length,
        negativeLoyalty: negatives.length,
    };
}

async function run() {
    await connectDB();

    const results = {};
    let allOk = true;

    try {
        results.ledger = await validateLedger();
        results.stock = await validateStock();
        results.duplicates = await validateDuplicates();
        results.creditNotes = await validateCreditNotes();
        results.loyalty = await validateLoyalty();

        allOk =
            results.ledger.ok &&
            results.stock.ok &&
            results.duplicates.ok &&
            results.creditNotes.ok &&
            results.loyalty.ok;

        console.log('SYSTEM INTEGRITY VALIDATION REPORT');
        console.log('---------------------------------');
        console.log('Ledger balanced:', results.ledger.ok, {
            totalDebit: results.ledger.totalDebit,
            totalCredit: results.ledger.totalCredit,
        });
        console.log('Stock non-negative:', results.stock.ok);
        console.log('No duplicate invoice numbers:', results.duplicates.noDuplicateInvoices);
        console.log('No duplicate dispatch numbers:', results.duplicates.noDuplicateDispatch);
        console.log('No duplicate return numbers:', results.duplicates.noDuplicateReturns);
        console.log('Credit notes non-negative:', results.creditNotes.ok);
        console.log('Loyalty balance non-negative:', results.loyalty.ok);

        if (!allOk) {
            console.log('FINAL STATUS: FAIL');
            process.exitCode = 1;
        } else {
            console.log('FINAL STATUS: PASS');
        }
    } catch (err) {
        console.error('Validation error:', err);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        process.exit(process.exitCode || 0);
    }
}

run();

