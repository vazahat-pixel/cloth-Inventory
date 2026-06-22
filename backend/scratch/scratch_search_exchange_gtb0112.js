const mongoose = require('mongoose');
require('dotenv').config();

// Register all models to prevent MissingSchemaError
const Sale = require('../src/models/sale.model');
const SalesReturn = require('../src/models/salesReturn.model');
const StockMovement = require('../src/models/stockMovement.model');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const gtbId = '6a2eb308e442d6672d10d246'; // GTB-0112 ID

        // 1. Search for other sales referencing GTB-0112 as parentSaleId
        console.log('1. Searching sales with parentSaleId:', gtbId);
        const linkedSales = await Sale.find({ parentSaleId: gtbId }).lean();
        console.log(`Found ${linkedSales.length} linked sales:`);
        linkedSales.forEach(s => {
            console.log(`  - Sale: ${s.saleNumber}, Total: ${s.grandTotal}, Status: ${s.status}, Type: ${s.type}`);
        });

        // 2. Search for any sales return referencing GTB-0112
        console.log('\n2. Searching SalesReturn for original sale:', gtbId);
        // Let's find fields in SalesReturn schema
        const salesReturns = await SalesReturn.find({
            $or: [
                { saleId: gtbId },
                { saleId: new mongoose.Types.ObjectId(gtbId) },
                { originalSaleId: gtbId },
                { invoiceId: gtbId }
            ]
        }).lean();
        console.log(`Found ${salesReturns.length} sales return records:`);
        salesReturns.forEach(sr => {
            console.log(`  - Return Record: ${sr.returnNumber || sr._id}, Total Amount: ${sr.totalAmount || sr.refundAmount}, Items:`, JSON.stringify(sr.items));
        });

        // If no sales returns found, let's find all returns
        if (salesReturns.length === 0) {
            console.log('Searching all SalesReturns to see if any has sale number GTB-0112...');
            const allSR = await SalesReturn.find().limit(20).lean();
            console.log(`Sample of SalesReturn collections (keys):`, allSR.map(x => ({ _id: x._id, saleId: x.saleId, returnNumber: x.returnNumber })));
        }

        // 3. Search for stock movements referencing GTB-0112
        console.log('\n3. Searching StockMovements for reference:', gtbId);
        const movements = await StockMovement.find({
            $or: [
                { referenceId: gtbId },
                { referenceId: new mongoose.Types.ObjectId(gtbId) }
            ]
        }).lean();
        console.log(`Found ${movements.length} stock movement records:`);
        movements.forEach(m => {
            console.log(`  - Movement: ${m.type}, Barcode: ${m.barcode}, Qty: ${m.qty}, from: ${m.fromLocation}, to: ${m.toLocation}`);
        });

        // Let's check if there is another sale that has saleNumber containing 'GTB' and has exchange items
        console.log('\n4. Checking all sales in GTB Nagar with type containing EXCHANGE or with exchange details...');
        const gtbSales = await Sale.find({
            storeId: '69ecb1d9f04d7249bd11adf4',
            $or: [
                { type: /exchange/i },
                { exchangeDetails: { $exists: true, $ne: null } },
                { parentSaleId: { $exists: true, $ne: null } }
            ]
        }).lean();
        console.log(`Found ${gtbSales.length} GTB sales with exchange/parentSaleId fields:`);
        gtbSales.forEach(s => {
            console.log(`  - Sale: ${s.saleNumber}, Type: ${s.type}, Parent: ${s.parentSaleId}, GrandTotal: ${s.grandTotal}`);
            if (s.exchangeDetails) {
                console.log(`    Exchange details:`, JSON.stringify(s.exchangeDetails));
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
