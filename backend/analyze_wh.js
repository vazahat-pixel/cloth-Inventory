require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const StockMovement = require('./src/models/stockMovement.model');
        const movements = await StockMovement.find({}).lean();
        
        let initialWarehouseStock = 96287.2;
        console.log(`Initial Warehouse Stock (Single GRN): ${initialWarehouseStock}`);
        
        let salesFromWH = 0;
        let returnsToWH = 0;
        let dispatchFromWH = 0;
        let manualAdjWH = 0;
        
        // I want to see ONLY what happened that wasn't the duplicate 5 GRNs or the massive 496k fix.
        // Wait, the 496k fix just wiped the duplicates and restored it to the current physical count.
        // Let's assume the starting point was 96287.2.
        
        // Find all SALES from Warehouse
        const sales = await StockMovement.find({ type: 'SALE', fromLocation: { $exists: true } }).populate('fromLocation').lean();
        // Since fromLocation could be Store or Warehouse, we need to check the type.
        // Actually, referenceType is 'Sale'. What is fromLocationType? It's not in StockMovement model.
        
        const saleDeductions = movements.filter(m => m.type === 'SALE' && m.qty < 0);
        const totalSalesQty = saleDeductions.reduce((sum, m) => sum + Math.abs(m.qty), 0);
        
        const dispatchDeductions = movements.filter(m => m.type === 'TRANSFER' && m.qty < 0);
        const totalDispatchQty = dispatchDeductions.reduce((sum, m) => sum + Math.abs(m.qty), 0);
        
        const returnAdditions = movements.filter(m => m.type === 'RETURN' && m.qty > 0);
        const totalReturnQty = returnAdditions.reduce((sum, m) => sum + m.qty, 0);

        console.log(`Total Sales Deductions: ${totalSalesQty}`);
        console.log(`Total Dispatch Deductions: ${totalDispatchQty}`);
        console.log(`Total Returns Additions: ${totalReturnQty}`);
        
        // Let's do the math
        const finalCalculated = initialWarehouseStock - totalSalesQty - totalDispatchQty + totalReturnQty;
        console.log(`Calculated Warehouse Stock: ${finalCalculated}`);
        console.log(`Actual Warehouse Stock is: 95324.2`);
        console.log(`Difference: ${finalCalculated - 95324.2}`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

run();
