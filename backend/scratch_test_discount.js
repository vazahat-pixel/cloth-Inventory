require('dotenv').config();
const connectDB = require('./src/config/db');
const Sale = require('./src/models/sale.model');

async function testDiscount() {
    await connectDB();
    const sales = await Sale.find().sort({ saleDate: -1 }).limit(10).lean();
    sales.forEach(sale => {
        const invoiceTotal = sale.grandTotal || 0;
        const invoiceSum = (sale.subTotal || 0) + (sale.totalTax || 0);
        const factor = invoiceSum > 0 ? (invoiceTotal / invoiceSum) : 1;

        sale.items.forEach(item => {
            const itemGross = item.total || 0;
            const itemTax = item.taxAmount || 0;
            const itemTaxable = itemGross - itemTax;
            
            const taxable = itemTaxable * factor;
            const tax = itemTax * factor;
            const netAmount = Number((taxable + tax).toFixed(2));

            const originalGross = (item.mrp || item.rate || 0) * item.quantity;
            let itemDiscountPct = 0;
            if (originalGross > 0) {
                const totalDiscountForItem = originalGross - netAmount;
                itemDiscountPct = Math.max(0, (totalDiscountForItem / originalGross) * 100);
            } else if (item.discount) {
                itemDiscountPct = item.discount;
            }
            itemDiscountPct = Number(itemDiscountPct.toFixed(2));
            console.log(`Invoice: ${sale.saleNumber}, MRP: ${item.mrp}, Qty: ${item.quantity}, OriginalGross: ${originalGross}, NetAmount: ${netAmount}, DiscountPct: ${itemDiscountPct}`);
        });
    });
    process.exit(0);
}
testDiscount();
