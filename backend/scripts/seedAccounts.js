require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Account = require('../src/models/account.model');

const accounts = [
    // ASSETS
    { name: 'Cash Account', code: '1001', type: 'ASSET', isSystem: true },
    { name: 'Bank Account', code: '1002', type: 'ASSET', isSystem: true },
    { name: 'Inventory Account', code: '1003', type: 'ASSET', isSystem: true },
    { name: 'Accounts Receivable', code: '1004', type: 'ASSET', isSystem: true },
    { name: 'GST Receivable', code: '1005', type: 'ASSET', isSystem: true },

    // LIABILITIES
    { name: 'Accounts Payable', code: '2001', type: 'LIABILITY', isSystem: true },
    { name: 'GST Payable', code: '2002', type: 'LIABILITY', isSystem: true },
    { name: 'Credit Note Control', code: '2003', type: 'LIABILITY', isSystem: true },

    // INCOME
    { name: 'Sales Account', code: '3001', type: 'INCOME', isSystem: true },

    // EXPENSE
    { name: 'Purchase Account', code: '4001', type: 'EXPENSE', isSystem: true },
    { name: 'Loyalty Expense', code: '4002', type: 'EXPENSE', isSystem: true }
];

const seedAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        for (const account of accounts) {
            const existing = await Account.findOne({ code: account.code });
            if (!existing) {
                await Account.create(account);
                console.log(`🎉 Created account: ${account.name} (${account.code})`);
            } else {
                console.log(`ℹ️  Account already exists: ${account.name} (${account.code})`);
            }
        }

        console.log('\n✅ Chart of Accounts seeding completed.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seedAccounts();
