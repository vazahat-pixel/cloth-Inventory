const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
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

        console.log("🧾 Loading sales and system logs...");
        const sales = await Sale.find().lean();
        const logs = await SystemLog.find({
            action: 'POST /api/sales',
            'details.body': { $exists: true }
        }).lean();

        console.log(`Loaded ${sales.length} sales from database.`);
        console.log(`Loaded ${logs.length} sales logs from SystemLog.`);

        // Group logs by storeId and rounded grandTotal for fast lookup
        const logsMap = new Map(); // key: storeId_grandTotal -> array of logs
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
        let matchedCount = 0;
        let unmatchedCount = 0;

        sales.forEach(sale => {
            const storeId = String(sale.storeId);
            const total = Math.round(sale.grandTotal * 100) / 100;
            const key = `${storeId}_${total}`;
            
            const possibleLogs = logsMap.get(key) || [];
            
            // Find a log that matches customer info if available, or close date
            let bestLog = null;
            if (possibleLogs.length === 1) {
                bestLog = possibleLogs[0];
            } else if (possibleLogs.length > 1) {
                // Filter by customer mobile/name
                const withMobile = possibleLogs.find(l => {
                    const lMobile = l.details.body.customerMobile;
                    return lMobile && sale.customerMobile && String(lMobile).trim() === String(sale.customerMobile).trim();
                });
                if (withMobile) {
                    bestLog = withMobile;
                } else {
                    const withName = possibleLogs.find(l => {
                        const lName = l.details.body.customerName;
                        return lName && sale.customerName && String(lName).toLowerCase().trim() === String(sale.customerName).toLowerCase().trim();
                    });
                    if (withName) {
                        bestLog = withName;
                    } else {
                        // Fallback to closest saleDate
                        let minDiff = Infinity;
                        possibleLogs.forEach(l => {
                            const lDate = l.details.body.date ? new Date(l.details.body.date) : new Date(l.createdAt);
                            const sDate = new Date(sale.saleDate || sale.createdAt);
                            const diff = Math.abs(lDate - sDate);
                            if (diff < minDiff) {
                                minDiff = diff;
                                bestLog = l;
                            }
                        });
                    }
                }
            }

            if (bestLog) {
                matchedCount++;
                const body = bestLog.details.body;
                
                // Remove the matched log from pool so it's not reused
                const idx = possibleLogs.indexOf(bestLog);
                if (idx !== -1) possibleLogs.splice(idx, 1);

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
                            // Fallback if not found in cache
                            mappedItems.push({
                                itemId: new mongoose.Types.ObjectId(), // placeholder
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

                // Correct sale date
                const correctSaleDate = body.date ? new Date(body.date) : bestLog.createdAt;

                // Payments
                const payments = body.payments && body.payments.length > 0
                    ? body.payments
                    : [{ mode: body.paymentMode || 'CASH', amount: body.amountPaid || body.grandTotal || 0 }];

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

        console.log(`Matching process finished:`);
        console.log(`- Matched & scheduled for fix: ${matchedCount}`);
        console.log(`- Unmatched: ${unmatchedCount}`);

        if (bulkOps.length > 0) {
            console.log(`💾 Executing bulk database updates...`);
            const result = await Sale.bulkWrite(bulkOps);
            console.log(`🎉 Database update completed successfully!`);
            console.log(`- Modified: ${result.modifiedCount}`);
        } else {
            console.log(`⚠️ No updates to execute.`);
        }

    } catch (e) {
        console.error("❌ Error during fix:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.");
    }
}
run();
