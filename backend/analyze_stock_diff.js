const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Sale = require('./src/models/sale.model');
    const Dispatch = require('./src/models/dispatch.model');
    
    // Total Sales from Warehouse (INTERNAL_SALE or RETAIL but storeId is Warehouse)
    const Warehouse = require('./src/models/warehouse.model');
    const warehouses = await Warehouse.find().select('_id');
    const whIds = warehouses.map(w => w._id);
    
    const sales = await Sale.aggregate([
        { $match: { isDeleted: false, storeId: { $in: whIds } } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);
    console.log('Total Sales from Warehouse:', sales[0]?.total || 0);

    const dispatches = await Dispatch.aggregate([
        { $match: { sourceWarehouseId: { $in: whIds } } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.qty' } } }
    ]);
    console.log('Total Dispatches from Warehouse:', dispatches[0]?.total || 0);
    
    const storeSales = await Sale.aggregate([
        { $match: { isDeleted: false, storeId: { $nin: whIds } } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);
    console.log('Total Sales from Store:', storeSales[0]?.total || 0);

    const storeDispatches = await Dispatch.aggregate([
        { $match: { sourceWarehouseId: { $nin: whIds } } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.qty' } } }
    ]);
    console.log('Total Dispatches from Store:', storeDispatches[0]?.total || 0);

    // Let's also check if there are any pending dispatches
    const pendingDispatches = await Dispatch.aggregate([
        { $match: { sourceWarehouseId: { $in: whIds }, status: { $in: ['PENDING', 'PACKED'] } } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.qty' } } }
    ]);
    console.log('Pending Dispatches from Warehouse:', pendingDispatches[0]?.total || 0);

    process.exit(0);
}
run();
