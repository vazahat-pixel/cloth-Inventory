const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Sale = require('../src/models/sale.model');
const Item = require('../src/models/item.model');
const SystemLog = require('../src/models/systemLog.model');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log("📦 Loading items from database to build SKU cache...");
        const items = await Item.find().lean();
        const skuCache = new Map();
        items.forEach(item => {
            (item.sizes || []).forEach(v => {
                const skuUpper = String(v.sku).toUpperCase().trim();
                skuCache.set(skuUpper, {
                    itemId: item._id,
                    variantId: v._id || v.id,
                    barcode: v.barcode,
                    mrp: v.mrp,
                    color: v.color || item.color || '',
                    size: v.size || ''
                });
            });
        });
        console.log(`✅ SKU Cache built with ${skuCache.size} SKUs.`);

        console.log("🧾 Loading report data...");
        const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        // Group report invoices by storeId
        const reportPool = new Map(); // storeId -> Array of invoices
        reportData.salesByStore.forEach(store => {
            const invoices = store.invoices.map(inv => ({ ...inv, matched: false }));
            reportPool.set(String(store.storeId), invoices);
        });

        console.log("🧾 Loading sales and system logs...");
        const sales = await Sale.find().lean();
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).lean();

        console.log(`Loaded ${sales.length} sales from database.`);
        console.log(`Loaded ${logs.length} sales logs from SystemLog.`);

        // Step 1: Align existing sales using sale.createdAt (which contains correct report date)
        const logsMap = new Map(); // storeId_grandTotal -> array of logs
        logs.forEach(log => {
            const body = log.details.body;
            if (!body) return;
            const storeId = String(body.storeId);
            const total = Math.round(body.grandTotal * 100) / 100;
            const key = `${storeId}_${total}`;
            if (!logsMap.has(key)) {
                logsMap.set(key, []);
            }
            logsMap.get(key).push(log);
        });

        const bulkOps = [];
        const usedLogIds = new Set();
        let matchedCount = 0;
        let unmatchedCount = 0;

        sales.forEach(sale => {
            const storeId = String(sale.storeId);
            const total = Math.round(sale.grandTotal * 100) / 100;
            const key = `${storeId}_${total}`;
            
            const possibleLogs = logsMap.get(key) || [];
            
            // Find a log closest to sale.createdAt
            let bestLog = null;
            let minDiff = Infinity;
            possibleLogs.forEach(l => {
                if (usedLogIds.has(l._id.toString())) return;
                
                const lDate = l.details.body.date ? new Date(l.details.body.date) : new Date(l.createdAt);
                // ALWAYS use sale.createdAt since sale.saleDate was corrupted to restoration date
                const sDate = new Date(sale.createdAt); 
                const diff = Math.abs(lDate - sDate);

                if (diff < minDiff) {
                    minDiff = diff;
                    bestLog = l;
                }
            });

            if (bestLog && minDiff < (30 * 24 * 60 * 60 * 1000)) { // within 30 days
                matchedCount++;
                usedLogIds.add(bestLog._id.toString());
                const body = bestLog.details.body;

                // Map products to items using cache
                const mappedItems = [];
                if (Array.isArray(body.products)) {
                    body.products.forEach(p => {
                        const sku = p.barcode || p.sku;
                        const parts = sku.split('-');
                        const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                        const cached = skuCache.get(cleanSku);

                        if (cached) {
                            mappedItems.push({
                                itemId: cached.itemId,
                                variantId: String(cached.variantId),
                                barcode: cached.barcode,
                                itemName: p.itemName,
                                sku: cleanSku,
                                hsnCode: p.hsnCode || 'N/A',
                                category: p.category || 'N/A',
                                brand: p.brand || '',
                                size: cached.size || p.size || '',
                                color: cached.color || p.color || '',
                                promoDiscount: p.promoDiscount || 0,
                                quantity: p.quantity,
                                mrp: cached.mrp,
                                rate: p.rate || cached.mrp,
                                discount: p.discount || 0,
                                extraDiscount: p.extraDiscount || 0,
                                discountAmount: p.discountAmount || 0,
                                taxAmount: p.taxAmount || 0,
                                taxPercentage: p.taxPercentage || 0,
                                total: p.total
                            });
                        } else {
                            mappedItems.push({
                                itemId: new mongoose.Types.ObjectId(),
                                variantId: p.variantId || 'UNKNOWN',
                                barcode: p.barcode || sku,
                                itemName: p.itemName,
                                sku: sku,
                                hsnCode: p.hsnCode || 'N/A',
                                category: p.category || 'N/A',
                                brand: p.brand || '',
                                size: p.size || '',
                                color: p.color || '',
                                promoDiscount: p.promoDiscount || 0,
                                quantity: p.quantity,
                                mrp: p.mrp || p.price || 0,
                                rate: p.rate || p.price || 0,
                                discount: p.discount || 0,
                                extraDiscount: p.extraDiscount || 0,
                                discountAmount: p.discountAmount || 0,
                                taxAmount: p.taxAmount || 0,
                                taxPercentage: p.taxPercentage || 0,
                                total: p.total
                            });
                        }
                    });
                }

                const correctSaleDate = body.date ? new Date(body.date) : bestLog.createdAt;
                const payments = body.payments && body.payments.length > 0
                    ? body.payments
                    : [{ mode: body.paymentMode || 'CASH', amount: body.amountPaid || body.grandTotal || 0 }];

                // Mark report invoice matched (to track unmatched ones)
                const storeInvoices = reportPool.get(storeId);
                if (storeInvoices) {
                    const rInv = storeInvoices.find(inv => inv.saleNumber === sale.saleNumber);
                    if (rInv) rInv.matched = true;
                }

                bulkOps.push({
                    updateOne: {
                        filter: { _id: sale._id },
                        update: {
                            $set: {
                                items: mappedItems,
                                saleDate: correctSaleDate,
                                payments: payments,
                                hsnSummary: body.hsnSummary || []
                            }
                        }
                    }
                });
            } else {
                unmatchedCount++;
            }
        });

        console.log(`Step 1: Alignment finished.`);
        console.log(`- Aligned & scheduled: ${matchedCount}`);
        console.log(`- Unmatched: ${unmatchedCount}`);

        // Step 2: Insert completely missing sales
        // Find logs that were NOT used, and check if they match unmatched report invoices
        let insertedCount = 0;
        const salesToInsert = [];

        logs.forEach(log => {
            if (usedLogIds.has(log._id.toString())) return;

            const body = log.details.body;
            const storeId = String(body.storeId);
            const logDate = new Date(body.date || log.createdAt);
            const grandTotal = Math.round(body.grandTotal * 100) / 100;
            const quantity = body.products ? body.products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) : 0;

            const storeInvoices = reportPool.get(storeId);
            if (!storeInvoices) return;

            const matchIndex = storeInvoices.findIndex(inv => {
                if (inv.matched) return false;
                const invDate = new Date(inv.date);
                const invNet = Math.round(inv.net * 100) / 100;
                const invQty = Number(inv.quantity) || 0;

                const daysDiff = Math.abs(invDate - logDate) / (1000 * 60 * 60 * 24);
                return (daysDiff <= 3.1) && (Math.abs(invNet - grandTotal) < 0.1) && (invQty === quantity);
            });

            if (matchIndex !== -1) {
                const reportInv = storeInvoices[matchIndex];
                reportInv.matched = true;
                usedLogIds.add(log._id.toString());
                insertedCount++;

                // Map products
                const mappedItems = [];
                if (Array.isArray(body.products)) {
                    body.products.forEach(p => {
                        const sku = p.barcode || p.sku;
                        const parts = sku.split('-');
                        const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                        const cached = skuCache.get(cleanSku);

                        if (cached) {
                            mappedItems.push({
                                itemId: cached.itemId,
                                variantId: String(cached.variantId),
                                barcode: cached.barcode,
                                itemName: p.itemName,
                                sku: cleanSku,
                                hsnCode: p.hsnCode || 'N/A',
                                category: p.category || 'N/A',
                                brand: p.brand || '',
                                size: cached.size || p.size || '',
                                color: cached.color || p.color || '',
                                promoDiscount: p.promoDiscount || 0,
                                quantity: p.quantity,
                                mrp: cached.mrp,
                                rate: p.rate || cached.mrp,
                                discount: p.discount || 0,
                                extraDiscount: p.extraDiscount || 0,
                                discountAmount: p.discountAmount || 0,
                                taxAmount: p.taxAmount || 0,
                                taxPercentage: p.taxPercentage || 0,
                                total: p.total
                            });
                        } else {
                            mappedItems.push({
                                itemId: new mongoose.Types.ObjectId(),
                                variantId: p.variantId || 'UNKNOWN',
                                barcode: p.barcode || sku,
                                itemName: p.itemName,
                                sku: sku,
                                hsnCode: p.hsnCode || 'N/A',
                                category: p.category || 'N/A',
                                brand: p.brand || '',
                                size: p.size || '',
                                color: p.color || '',
                                promoDiscount: p.promoDiscount || 0,
                                quantity: p.quantity,
                                mrp: p.mrp || p.price || 0,
                                rate: p.rate || p.price || 0,
                                discount: p.discount || 0,
                                extraDiscount: p.extraDiscount || 0,
                                discountAmount: p.discountAmount || 0,
                                taxAmount: p.taxAmount || 0,
                                taxPercentage: p.taxPercentage || 0,
                                total: p.total
                            });
                        }
                    });
                }

                const correctSaleDate = new Date(reportInv.date);
                const payments = body.payments && body.payments.length > 0
                    ? body.payments
                    : [{ mode: body.paymentMode || 'CASH', amount: body.amountPaid || body.grandTotal || 0 }];

                salesToInsert.push({
                    saleNumber: reportInv.saleNumber,
                    storeId: new mongoose.Types.ObjectId(storeId),
                    saleDate: correctSaleDate,
                    cashierId: new mongoose.Types.ObjectId('69e8618c67327ba256258276'), // default cashier
                    isInclusiveTax: body.isInclusiveTax ?? true,
                    customerId: body.customerId ? new mongoose.Types.ObjectId(body.customerId) : null,
                    customerName: body.customerName || 'Walk-in Customer',
                    customerMobile: body.customerMobile,
                    items: mappedItems,
                    payments: payments,
                    hsnSummary: body.hsnSummary || [],
                    subTotal: body.subTotal,
                    discount: body.discount || 0,
                    tax: body.tax || 0,
                    grandTotal: body.grandTotal,
                    amountPaid: body.amountPaid,
                    dueAmount: body.dueAmount || 0,
                    paymentMode: body.paymentMode || 'CASH',
                    type: body.type || 'RETAIL',
                    status: 'COMPLETED',
                    createdAt: correctSaleDate,
                    updatedAt: correctSaleDate
                });
            }
        });

        console.log(`Step 2: Missing sales matching finished.`);
        console.log(`- Missing sales found to insert: ${insertedCount}`);

        // Perform updates
        if (bulkOps.length > 0) {
            console.log(`💾 Executing bulk alignment updates...`);
            const result = await Sale.bulkWrite(bulkOps);
            console.log(`🎉 Database alignment completed: Modified ${result.modifiedCount} records.`);
        }

        // Perform inserts
        if (salesToInsert.length > 0) {
            console.log(`💾 Inserting missing sales...`);
            const insertResult = await Sale.insertMany(salesToInsert);
            console.log(`🎉 Inserted ${insertResult.length} missing sales!`);
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
}
run();
