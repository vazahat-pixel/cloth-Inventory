const mongoose = require('mongoose');
require('dotenv').config();
const Account = require('../models/account.model');

const REQUIRED_ACCOUNTS = [
    { name: 'Sales Account', type: 'INCOME', code: 'SALES', isSystem: true },
    { name: 'Accounts Receivable', type: 'ASSET', code: 'AR', isSystem: true },
    { name: 'GST Payable', type: 'LIABILITY', code: 'GST_PAY', isSystem: true },
    { name: 'Discount Expense', type: 'EXPENSE', code: 'DISCOUNT_EXP', isSystem: true },
    { name: 'Loyalty Expense', type: 'EXPENSE', code: 'LOYALTY_EXP', isSystem: true },
    { name: 'Credit Note Control', type: 'LIABILITY', code: 'CN_CTRL', isSystem: true },
    { name: 'Inventory Account', type: 'ASSET', code: 'INV', isSystem: true },
    { name: 'GST Receivable', type: 'ASSET', code: 'GST_REC', isSystem: true },
    { name: 'Accounts Payable', type: 'LIABILITY', code: 'AP', isSystem: true },
    { name: 'Cash in Hand', type: 'ASSET', code: 'CASH', isSystem: true },
    { name: 'Bank Account', type: 'ASSET', code: 'BANK', isSystem: true }
];

const seedAccounts = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI not found in environment');

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        for (const acc of REQUIRED_ACCOUNTS) {
            const exists = await Account.findOne({ name: acc.name });
            if (!exists) {
                await Account.create(acc);
                console.log(`Created account: ${acc.name}`);
            } else {
                console.log(`Account exists: ${acc.name}`);
            }
        }

        console.log('Seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
};

seedAccounts();
