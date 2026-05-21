const mongoose = require('mongoose');
require('dotenv').config();
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const StoreInventory = require('./src/models/storeInventory.model');
const StockLedger = require('./src/models/stockLedger.model');
const Item = require('./src/models/item.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const ledgerWh = await StockLedger.aggregate([
        { $match: { locationType: 'WAREHOUSE' } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$barcode', balance: { $last: '$balanceAfter' } } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    const ledgerStore = await StockLedger.aggregate([
        { $match: { locationType: 'STORE' } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$barcode', balance: { $last: '$balanceAfter' } } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    const itemStock = await Item.aggregate([
        { $unwind: '$sizes' },
        { $group: { _id: null, total: { $sum: '$sizes.stock' } } }
    ]);
    
    console.log('Ledger WH:', ledgerWh[0]?.total);
    console.log('Ledger Store:', ledgerStore[0]?.total);
    console.log('Item Master Total:', itemStock[0]?.total);
    
    // find dispatches total items qty
    const Dispatch = require('./src/models/dispatch.model');
    const dispatches = await Dispatch.aggregate([
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.qty' } } }
    ]);
    console.log('Total Dispatched Qty:', dispatches[0]?.total);
    
    process.exit(0);
}
run();
