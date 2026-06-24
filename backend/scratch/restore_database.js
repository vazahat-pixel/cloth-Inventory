require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const Item = require('../src/models/item.model');
const StoreInventory = require('../src/models/storeInventory.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Sale = require('../src/models/sale.model');
const Dispatch = require('../src/models/dispatch.model');
const Grn = require('../src/models/grn.model');
const StockMovement = require('../src/models/stockMovement.model');
const StockLedger = require('../src/models/stockLedger.model');
const Brand = require('../src/models/brand.model');
const Counter = require('../src/models/counter.model');
const SystemLog = require('../src/models/systemLog.model');
const User = require('../src/models/user.model');
const Warehouse = require('../src/models/warehouse.model');
const Store = require('../src/models/store.model');

async function restore() {
    console.log("🚀 Starting database recovery process...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    const defaultUser = await User.findOne({ role: 'admin' }) || await User.findOne({});
    const defaultCashierId = defaultUser ? defaultUser._id : new mongoose.Types.ObjectId();
    console.log(`👤 Using default cashier ID: ${defaultCashierId} (${defaultUser?.name || 'Generated'})`);

    const defaultWarehouse = await Warehouse.findOne({});
    const defaultWarehouseId = defaultWarehouse ? defaultWarehouse._id : new mongoose.Types.ObjectId();
    console.log(`🏭 Using default warehouse ID: ${defaultWarehouseId} (${defaultWarehouse?.name || 'Generated'})`);

    const defaultStore = await Store.findOne({});
    const defaultStoreId = defaultStore ? defaultStore._id : new mongoose.Types.ObjectId();
    console.log(`🏪 Using default store ID: ${defaultStoreId} (${defaultStore?.name || 'Generated'})`);

    // Load Stock Report
    const reportPath = path.join(__dirname, '../reports/full/complete-report-2026-06-19.json');
    if (!fs.existsSync(reportPath)) {
        console.error("❌ Stock report complete-report-2026-06-19.json not found!");
        process.exit(1);
    }
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // --- PHASE 1: WIPE COLLECTIONS ---
    console.log("🧹 Clearing collections to prevent duplicates...");
    await Promise.all([
        Item.deleteMany({}),
        StoreInventory.deleteMany({}),
        WarehouseInventory.deleteMany({}),
        Sale.deleteMany({}),
        Dispatch.deleteMany({}),
        Grn.deleteMany({}),
        StockMovement.deleteMany({}),
        StockLedger.deleteMany({})
    ]);
    console.log("✅ Collections cleared.");

    // --- PHASE 2: EXTRACT PRICES & DETAILS FROM SYSTEM LOGS ---
    console.log("🔍 Extracting item details and prices from SystemLog...");
    const skuPriceMap = new Map();     // sku -> mrp
    const skuNameMap = new Map();      // sku -> itemName

    const saleLogs = await SystemLog.find({ action: 'POST /api/sales', 'details.body': { $exists: true } }).lean();
    saleLogs.forEach(log => {
        const body = log.details.body;
        if (body && Array.isArray(body.products)) {
            body.products.forEach(p => {
                const sku = p.barcode || p.sku;
                const mrp = p.mrp || p.price || p.rate;
                if (sku && mrp) {
                    skuPriceMap.set(sku, mrp);
                }
                if (sku && p.itemName) {
                    skuNameMap.set(sku, p.itemName);
                }
            });
        }
    });

    const grnLogs = await SystemLog.find({ action: 'POST /api/grn', 'details.body': { $exists: true } }).lean();
    grnLogs.forEach(log => {
        const body = log.details.body;
        if (body && Array.isArray(body.items)) {
            body.items.forEach(item => {
                const sku = item.barcode || item.sku;
                const mrp = item.mrp;
                if (sku && mrp) {
                    skuPriceMap.set(sku, mrp);
                }
                if (sku && item.itemName) {
                    skuNameMap.set(sku, item.itemName);
                }
            });
        }
    });
    console.log(`✅ Extracted info for ${skuPriceMap.size} unique SKUs/barcodes.`);

    let defaultBrand = await Brand.findOne({ name: 'GENERIC' });
    if (!defaultBrand) {
        defaultBrand = await Brand.findOne({});
    }
    const defaultBrandId = defaultBrand ? defaultBrand._id : null;

    // --- PHASE 3: REGISTER ALL STYLES & VARIANTS IN MEMORY ---
    console.log("📦 Reconstructing Item Master catalog in memory...");
    const itemsMap = new Map(); // itemCode -> { itemCode, itemName, sizes: Map(cleanSku -> sizeObject) }

    function registerItem(itemName, sku, sizeVal, colorVal) {
        const parts = sku.split('-');
        const itemCode = parts[0].toUpperCase();
        const size = sizeVal || parts[1] || 'FREE';
        const color = colorVal || '';

        const sizeSuffix = size.replace(/\s+/g, '');
        const cleanSku = `${itemCode}-${sizeSuffix}`;
        const cleanBarcode = `${itemCode}-${sizeSuffix}`;

        if (!itemsMap.has(itemCode)) {
            itemsMap.set(itemCode, {
                itemCode,
                itemName: itemName.replace(/\s+N\/A$/, '').trim(),
                sizes: new Map()
            });
        }

        const item = itemsMap.get(itemCode);
        if (!item.sizes.has(cleanSku)) {
            const mrp = skuPriceMap.get(cleanSku) || skuPriceMap.get(sku) || 999;
            item.sizes.set(cleanSku, {
                size,
                color,
                sku: cleanSku,
                barcode: cleanBarcode,
                mrp,
                stock: 0,
                isActive: true
            });
        }
        return cleanSku;
    }

    // --- PHASE 4: INITIALIZE INVENTORY MAPS FROM REPORT ---
    console.log("🏪 Initializing inventories from stock report...");
    const storeInvMap = new Map(); // key: storeId_cleanSku -> invObject
    const whInvMap = new Map();    // key: warehouseId_cleanSku -> invObject

    // Parse store stock
    reportData.storeStockByStore.forEach(store => {
        const storeId = store.storeId;
        store.lines.forEach(line => {
            const cleanSku = registerItem(line.itemName, line.sku, line.size, line.color);
            const key = `${storeId}_${cleanSku}`;
            
            if (!storeInvMap.has(key)) {
                storeInvMap.set(key, {
                    storeId: new mongoose.Types.ObjectId(storeId),
                    cleanSku,
                    quantity: 0,
                    quantityAvailable: 0,
                    quantityInTransit: 0,
                    damagedQuantity: 0,
                    quantitySold: 0,
                    quantityReturned: 0,
                    itemName: line.itemName
                });
            }
            const inv = storeInvMap.get(key);
            inv.quantity += (line.closingStock || 0);
            inv.quantityAvailable += (line.closingStock || 0);
            inv.quantityInTransit += (line.inTransit || 0);
            inv.damagedQuantity += (line.damaged || 0);
            inv.quantitySold += (line.sold || 0);
            inv.quantityReturned += (line.returned || 0);
        });
    });

    // Parse warehouse stock
    reportData.warehouseStockByLocation.forEach(wh => {
        const warehouseId = wh.warehouseId;
        wh.lines.forEach(line => {
            const cleanSku = registerItem(line.itemName, line.sku, line.size, line.color);
            const key = `${warehouseId}_${cleanSku}`;
            
            if (!whInvMap.has(key)) {
                whInvMap.set(key, {
                    warehouseId: new mongoose.Types.ObjectId(warehouseId),
                    cleanSku,
                    quantity: 0,
                    reservedQuantity: 0,
                    damagedQuantity: 0,
                    quantityInTransit: 0
                });
            }
            const inv = whInvMap.get(key);
            inv.quantity += (line.closingStock || 0);
            inv.reservedQuantity += (line.reserved || 0);
            inv.damagedQuantity += (line.damaged || 0);
            inv.quantityInTransit += (line.inTransit || 0);
        });
    });

    // Register items from sale logs to itemsMap
    saleLogs.forEach(log => {
        const body = log.details.body;
        if (body && Array.isArray(body.products)) {
            body.products.forEach(p => {
                const sku = p.barcode || p.sku;
                registerItem(p.itemName || 'Restored Item', sku, '', '');
            });
        }
    });

    // --- PHASE 5: APPLY POST-JUNE 19 TRANSACTIONS TO INVENTORY MAPS ---
    console.log("📈 Processing sales for post-June 19 adjustments...");
    
    // Identify post-June 19 sales and apply them to in-memory storeInvMap
    saleLogs.forEach(log => {
        const body = log.details.body;
        const storeId = String(body.storeId);
        const saleDate = body.date ? new Date(body.date) : log.createdAt;
        const isPostJune19 = saleDate > new Date('2026-06-19T23:59:59Z');

        if (isPostJune19 && Array.isArray(body.products)) {
            body.products.forEach(p => {
                const sku = p.barcode || p.sku;
                const parts = sku.split('-');
                const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                const key = `${storeId}_${cleanSku}`;

                if (!storeInvMap.has(key)) {
                    storeInvMap.set(key, {
                        storeId: new mongoose.Types.ObjectId(storeId),
                        cleanSku,
                        quantity: 0,
                        quantityAvailable: 0,
                        quantityInTransit: 0,
                        damagedQuantity: 0,
                        quantitySold: 0,
                        quantityReturned: 0,
                        itemName: p.itemName || 'Restored Item'
                    });
                }
                const inv = storeInvMap.get(key);
                inv.quantity -= p.quantity;
                inv.quantityAvailable -= p.quantity;
                inv.quantitySold += p.quantity;
            });
        }
    });

    // Process dispatches for post-June 19 adjustments
    const dispatchLogs = await SystemLog.find({ action: 'POST /api/dispatch', 'details.body': { $exists: true } }).lean();
    console.log(`📈 Processing dispatches for post-June 19 adjustments... Total logs: ${dispatchLogs.length}`);

    dispatchLogs.forEach(log => {
        const body = log.details.body;
        const date = log.createdAt;
        const isPostJune19 = new Date(date) > new Date('2026-06-19T23:59:59Z');

        if (isPostJune19 && Array.isArray(body.items)) {
            body.items.forEach(item => {
                const sku = item.barcode || item.sku;
                const parts = sku.split('-');
                const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                const qty = item.qty || item.quantity || 1;

                // Source Warehouse Out
                const sourceWarehouseId = body.sourceWarehouseId || body.sourceId || defaultWarehouseId;
                if (sourceWarehouseId) {
                    const key = `${sourceWarehouseId}_${cleanSku}`;
                    if (!whInvMap.has(key)) {
                        whInvMap.set(key, {
                            warehouseId: new mongoose.Types.ObjectId(sourceWarehouseId),
                            cleanSku,
                            quantity: 0,
                            reservedQuantity: 0,
                            damagedQuantity: 0,
                            quantityInTransit: 0
                        });
                    }
                    const inv = whInvMap.get(key);
                    inv.quantity -= qty;
                }

                // Destination Store In (if received)
                const destinationStoreId = body.destinationStoreId || body.destinationId || defaultStoreId;
                if (body.status === 'RECEIVED' && destinationStoreId) {
                    const key = `${destinationStoreId}_${cleanSku}`;
                    if (!storeInvMap.has(key)) {
                        storeInvMap.set(key, {
                            storeId: new mongoose.Types.ObjectId(destinationStoreId),
                            cleanSku,
                            quantity: 0,
                            quantityAvailable: 0,
                            quantityInTransit: 0,
                            damagedQuantity: 0,
                            quantitySold: 0,
                            quantityReturned: 0,
                            itemName: item.itemName || 'Restored Item'
                        });
                    }
                    const inv = storeInvMap.get(key);
                    inv.quantity += qty;
                    inv.quantityAvailable += qty;
                }
            });
        }
    });

    // Process GRNs for post-June 19 adjustments
    const grnLogsList = await SystemLog.find({ action: 'POST /api/grn', 'details.body': { $exists: true } }).lean();
    console.log(`📈 Processing GRNs for post-June 19 adjustments... Total logs: ${grnLogsList.length}`);

    grnLogsList.forEach(log => {
        const body = log.details.body;
        const date = log.createdAt;
        const isPostJune19 = new Date(date) > new Date('2026-06-19T23:59:59Z');

        if (isPostJune19 && Array.isArray(body.items)) {
            body.items.forEach(item => {
                const sku = item.barcode || item.sku;
                const parts = sku.split('-');
                const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                const qty = item.quantityReceived || item.qty || 1;

                const warehouseId = body.warehouseId || defaultWarehouseId;
                if (warehouseId) {
                    const key = `${warehouseId}_${cleanSku}`;
                    if (!whInvMap.has(key)) {
                        whInvMap.set(key, {
                            warehouseId: new mongoose.Types.ObjectId(warehouseId),
                            cleanSku,
                            quantity: 0,
                            reservedQuantity: 0,
                            damagedQuantity: 0,
                            quantityInTransit: 0
                        });
                    }
                    const inv = whInvMap.get(key);
                    inv.quantity += qty;
                }
            });
        }
    });

    // --- PHASE 6: CALCULATE VARIANT STOCKS & INSERT ITEM MASTER ---
    console.log("🔢 Calculating final variant stock levels...");
    const skuTotalStockMap = new Map();
    for (const inv of storeInvMap.values()) {
        skuTotalStockMap.set(inv.cleanSku, (skuTotalStockMap.get(inv.cleanSku) || 0) + inv.quantity);
    }
    for (const inv of whInvMap.values()) {
        skuTotalStockMap.set(inv.cleanSku, (skuTotalStockMap.get(inv.cleanSku) || 0) + inv.quantity);
    }

    // Set stock values in itemsMap sizes
    for (const item of itemsMap.values()) {
        for (const [cleanSku, sizeObj] of item.sizes.entries()) {
            sizeObj.stock = skuTotalStockMap.get(cleanSku) || 0;
        }
    }

    console.log("📥 Inserting Item Master catalog into DB...");
    const itemsToInsert = [];
    for (const [itemCode, data] of itemsMap.entries()) {
        itemsToInsert.push({
            itemCode,
            itemName: data.itemName,
            brand: defaultBrandId,
            brandName: 'GENERIC',
            type: 'GARMENT',
            gstPercent: 5,
            sizes: Array.from(data.sizes.values()),
            isActive: true
        });
    }

    const insertedItems = [];
    const batchSize = 1000;
    for (let i = 0; i < itemsToInsert.length; i += batchSize) {
        const batch = itemsToInsert.slice(i, i + batchSize);
        const res = await Item.insertMany(batch);
        insertedItems.push(...res);
    }
    console.log(`✅ Item Master populated. Total items: ${insertedItems.length}`);

    // Build SKU cache to map variant SKU -> { itemId, variantId, barcode, mrp }
    const skuCache = new Map();
    insertedItems.forEach(item => {
        item.sizes.forEach(v => {
            skuCache.set(v.sku, {
                itemId: item._id,
                variantId: v._id,
                barcode: v.barcode,
                mrp: v.mrp
            });
        });
    });

    // --- PHASE 7: INSERT STORE & WAREHOUSE INVENTORIES WITH DB IDs ---
    console.log("🏪 Mapping and inserting Store Inventories...");
    const storeInventoriesToInsert = [];
    for (const inv of storeInvMap.values()) {
        const cached = skuCache.get(inv.cleanSku);
        if (cached) {
            storeInventoriesToInsert.push({
                storeId: inv.storeId,
                itemId: cached.itemId,
                variantId: String(cached.variantId),
                barcode: cached.barcode,
                quantity: inv.quantity,
                quantityAvailable: inv.quantityAvailable,
                quantityInTransit: inv.quantityInTransit,
                damagedQuantity: inv.damagedQuantity,
                quantitySold: inv.quantitySold,
                quantityReturned: inv.quantityReturned,
                lastUpdated: new Date()
            });
        }
    }

    for (let i = 0; i < storeInventoriesToInsert.length; i += batchSize) {
        await StoreInventory.insertMany(storeInventoriesToInsert.slice(i, i + batchSize));
    }
    console.log(`✅ Store Inventories inserted. Total records: ${storeInventoriesToInsert.length}`);

    console.log("🏭 Mapping and inserting Warehouse Inventories...");
    const whInventoriesToInsert = [];
    for (const inv of whInvMap.values()) {
        const cached = skuCache.get(inv.cleanSku);
        if (cached) {
            whInventoriesToInsert.push({
                warehouseId: inv.warehouseId,
                itemId: cached.itemId,
                variantId: String(cached.variantId),
                barcode: cached.barcode,
                quantity: inv.quantity,
                reservedQuantity: inv.reservedQuantity,
                damagedQuantity: inv.damagedQuantity,
                quantityInTransit: inv.quantityInTransit,
                lastUpdated: new Date()
            });
        }
    }

    for (let i = 0; i < whInventoriesToInsert.length; i += batchSize) {
        await WarehouseInventory.insertMany(whInventoriesToInsert.slice(i, i + batchSize));
    }
    console.log(`✅ Warehouse Inventories inserted. Total records: ${whInventoriesToInsert.length}`);

    // --- PHASE 8: RESTORE SALES, DISPATCHES, GRNS AND BUILD MOVEMENTS / LEDGERS ---
    console.log("🧾 Preparing transaction documents to restore...");

    const salesToInsert = [];
    const stockMovements = [];
    const rawLedgerEntries = []; // will calculate balanceAfter later!

    // Build invoices reference from report
    const reportPool = new Map(); // storeId -> Array of invoices
    reportData.salesByStore.forEach(store => {
        const invoices = store.invoices.map(inv => ({ ...inv, matched: false }));
        reportPool.set(String(store.storeId), invoices);
    });

    const storeCounters = new Map(); // storeId -> current highest invoice number integer
    reportPool.forEach((invs, sid) => {
        let maxNum = 0;
        invs.forEach(inv => {
            const numPart = parseInt(inv.saleNumber.split('-')[1]);
            if (numPart > maxNum) maxNum = numPart;
        });
        storeCounters.set(sid, maxNum);
    });

    // 1. Process Sales Invoices
    saleLogs.forEach(log => {
        const body = log.details.body;
        const storeId = String(body.storeId);
        const saleDate = body.date ? new Date(body.date) : log.createdAt;
        const dateStr = saleDate.toISOString().split('T')[0];
        const grandTotal = Math.round(body.grandTotal * 100) / 100;
        const quantity = body.products ? body.products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) : 0;

        let saleNumber = '';
        const storeInvoices = reportPool.get(storeId);
        if (storeInvoices) {
            const matchIndex = storeInvoices.findIndex(inv => {
                if (inv.matched) return false;
                const invDateStr = inv.date;
                const invNet = Math.round(inv.net * 100) / 100;
                const invQty = Number(inv.quantity) || 0;
                return (invDateStr === dateStr) && (Math.abs(invNet - grandTotal) < 0.1) && (invQty === quantity);
            });

            if (matchIndex !== -1) {
                storeInvoices[matchIndex].matched = true;
                saleNumber = storeInvoices[matchIndex].saleNumber;
            }
        }

        if (!saleNumber) {
            const isPostJune19 = saleDate > new Date('2026-06-19T23:59:59Z');
            if (isPostJune19) {
                const lastCount = storeCounters.get(storeId) || 0;
                const newCount = lastCount + 1;
                storeCounters.set(storeId, newCount);

                let prefix = 'STR';
                if (storeId === '69e89f8e5df4170210683876') prefix = 'SNP';
                else if (storeId === '69ecb1d9f04d7249bd11adf4') prefix = 'GTB';
                else if (storeId === '69ecbe2cf04d7249bd11ae45') prefix = 'SHB';
                else if (storeId === '69ecbbb4f04d7249bd11ae31') prefix = 'MUK';
                else if (storeId === '69ecbcdbf04d7249bd11ae3b') prefix = 'BHP';
                else if (storeId === '69ecbefdf04d7249bd11ae4f') prefix = 'SJP';
                else if (storeId === '69e86a235df4170210683604') prefix = 'PIT';
                else if (storeId === '69ecb5a0f04d7249bd11ae1d') prefix = 'HNG';

                saleNumber = `${prefix}-${String(newCount).padStart(4, '0')}`;
            } else {
                return; // skip unmatched historical sales
            }
        }

        const mappedProducts = [];
        body.products.forEach(p => {
            const sku = p.barcode || p.sku;
            const parts = sku.split('-');
            const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
            const cached = skuCache.get(cleanSku);

            if (cached) {
                mappedProducts.push({
                    productId: cached.itemId,
                    variantId: cached.variantId,
                    itemId: cached.itemId,
                    barcode: cached.barcode,
                    itemName: p.itemName,
                    sku: cleanSku,
                    quantity: p.quantity,
                    price: p.price,
                    discount: p.discount || 0,
                    discountAmount: p.discountAmount || 0,
                    taxPercentage: p.taxPercentage || 0,
                    taxAmount: p.taxAmount || 0,
                    total: p.total,
                    mrp: cached.mrp,
                    rate: p.rate || cached.mrp
                });
            }
        });

        if (mappedProducts.length > 0) {
            const saleId = new mongoose.Types.ObjectId();
            
            salesToInsert.push({
                _id: saleId,
                saleNumber,
                storeId: new mongoose.Types.ObjectId(storeId),
                saleDate: saleDate,
                cashierId: defaultCashierId,
                isInclusiveTax: body.isInclusiveTax ?? true,
                customerId: body.customerId ? new mongoose.Types.ObjectId(body.customerId) : null,
                customerName: body.customerName || 'Walk-in Customer',
                customerMobile: body.customerMobile,
                items: mappedProducts,
                payments: body.payments && body.payments.length > 0 ? body.payments : [{ mode: body.paymentMode || 'CASH', amount: body.amountPaid || body.grandTotal || 0 }],
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
                createdAt: saleDate,
                updatedAt: saleDate
            });

            // Stock Movements
            mappedProducts.forEach(p => {
                stockMovements.push({
                    variantId: new mongoose.Types.ObjectId(p.variantId),
                    qty: -p.quantity, // Sale reduces stock
                    type: 'SALE',
                    referenceId: saleId,
                    referenceType: 'Sale',
                    fromLocation: new mongoose.Types.ObjectId(storeId),
                    performedBy: defaultCashierId,
                    createdAt: saleDate,
                    itemName: p.itemName,
                    sku: p.sku,
                    barcode: p.barcode
                });

                // Raw Ledger Entry
                rawLedgerEntries.push({
                    itemId: p.productId,
                    variantId: p.variantId,
                    barcode: p.barcode,
                    locationId: new mongoose.Types.ObjectId(storeId),
                    locationType: 'STORE',
                    type: 'OUT',
                    quantity: p.quantity,
                    source: 'SALE',
                    referenceId: saleId.toString(),
                    userId: defaultCashierId,
                    createdAt: saleDate
                });
            });
        }
    });

    // 2. Process Dispatches
    const dispatchesToInsert = [];
    dispatchLogs.forEach(log => {
        const body = log.details.body;
        const date = log.createdAt;
        const mappedItems = [];

        if (body && Array.isArray(body.items)) {
            body.items.forEach(item => {
                const sku = item.barcode || item.sku;
                const parts = sku.split('-');
                const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                const cached = skuCache.get(cleanSku);

                if (cached) {
                    mappedItems.push({
                        itemId: cached.itemId,
                        variantId: cached.variantId,
                        barcode: cached.barcode,
                        qty: item.qty || item.quantity || 1,
                        price: item.price || item.rate || cached.mrp,
                        rate: item.rate || cached.mrp,
                        mrp: item.mrp || cached.mrp,
                        discountPercent: item.discountPercent || 0,
                        taxPercentage: item.gstPercent || item.taxPercentage || 0,
                        tax: item.tax || 0,
                        total: item.total || ((item.qty || item.quantity || 1) * (item.rate || cached.mrp)) || cached.mrp
                    });
                }
            });
        }

        const sourceWarehouseId = body.sourceWarehouseId || body.sourceId || defaultWarehouseId;
        const destinationStoreId = body.destinationStoreId || body.destinationId || defaultStoreId;
        const createdBy = log.userId || body.createdBy || defaultCashierId;

        if (mappedItems.length > 0 && sourceWarehouseId && destinationStoreId) {
            const dispatchId = new mongoose.Types.ObjectId();
            const dispatchDate = body.dispatchDate ? new Date(body.dispatchDate) : date;

            const prefix = (body.status || 'RECEIVED') === 'PENDING' ? 'SCH' : 'DSP';
            dispatchesToInsert.push({
                _id: dispatchId,
                dispatchNumber: body.dispatchNumber || `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                sourceWarehouseId: new mongoose.Types.ObjectId(sourceWarehouseId),
                destinationStoreId: new mongoose.Types.ObjectId(destinationStoreId),
                items: mappedItems,
                status: body.status || 'RECEIVED',
                vehicleNumber: body.vehicleNumber,
                driverName: body.driverName,
                dispatchDate: dispatchDate,
                createdBy: new mongoose.Types.ObjectId(createdBy),
                totalMRP: body.totalMRP || 0,
                totalDiscount: body.totalDiscount || 0,
                taxableAmount: body.taxableAmount || 0,
                gstAmount: body.gstAmount || 0,
                finalAmount: body.finalAmount || 0,
                hsnSummary: body.hsnSummary || [],
                createdAt: date,
                updatedAt: date
            });

            if (body.status === 'RECEIVED' || body.status === 'DISPATCHED') {
                mappedItems.forEach(item => {
                    // Source Warehouse Out Movement
                    if (sourceWarehouseId) {
                        stockMovements.push({
                            variantId: new mongoose.Types.ObjectId(item.variantId),
                            qty: -item.qty,
                            type: 'DISPATCH',
                            referenceId: dispatchId,
                            referenceType: 'Dispatch',
                            fromLocation: new mongoose.Types.ObjectId(sourceWarehouseId),
                            performedBy: createdBy,
                            createdAt: date,
                            sku: item.barcode,
                            barcode: item.barcode
                        });

                        rawLedgerEntries.push({
                            itemId: item.itemId,
                            variantId: item.variantId,
                            barcode: item.barcode,
                            locationId: new mongoose.Types.ObjectId(sourceWarehouseId),
                            locationType: 'WAREHOUSE',
                            type: 'OUT',
                            quantity: item.qty,
                            source: 'DISPATCH',
                            referenceId: dispatchId.toString(),
                            userId: createdBy,
                            createdAt: date
                        });
                    }

                    // Store In Movement (if RECEIVED)
                    if (body.status === 'RECEIVED' && destinationStoreId) {
                        stockMovements.push({
                            variantId: new mongoose.Types.ObjectId(item.variantId),
                            qty: item.qty,
                            type: 'RECEIVE',
                            referenceId: dispatchId,
                            referenceType: 'Dispatch',
                            toLocation: new mongoose.Types.ObjectId(destinationStoreId),
                            performedBy: createdBy,
                            createdAt: date,
                            sku: item.barcode,
                            barcode: item.barcode
                        });

                        rawLedgerEntries.push({
                            itemId: item.itemId,
                            variantId: item.variantId,
                            barcode: item.barcode,
                            locationId: new mongoose.Types.ObjectId(destinationStoreId),
                            locationType: 'STORE',
                            type: 'IN',
                            quantity: item.qty,
                            source: 'TRANSFER',
                            referenceId: dispatchId.toString(),
                            userId: createdBy,
                            createdAt: date
                        });
                    }
                });
            }
        }
    });

    // 3. Process GRNs
    const grnsToInsert = [];
    grnLogsList.forEach(log => {
        const body = log.details.body;
        const mappedItems = [];
        const date = log.createdAt;

        if (body && Array.isArray(body.items)) {
            body.items.forEach(item => {
                const sku = item.barcode || item.sku;
                const parts = sku.split('-');
                const cleanSku = `${parts[0].toUpperCase()}-${(parts[1] || 'FREE').replace(/\s+/g, '')}`;
                const cached = skuCache.get(cleanSku);

                if (cached) {
                    const receivedQty = item.quantityReceived || item.qty || item.receivedQty || 1;
                    const costPrice = item.purchaseRate || item.rate || item.costPrice || 0;
                    mappedItems.push({
                        itemId: cached.itemId,
                        variantId: String(cached.variantId),
                        sku: cached.barcode,
                        itemName: item.itemName || cached.barcode,
                        size: item.size || parts[1] || 'FREE',
                        color: item.color || '',
                        receivedQty: receivedQty,
                        costPrice: costPrice,
                        taxPercent: item.gstPercent || item.taxPercent || 0,
                        taxAmount: item.taxAmount || 0,
                        totalWithTax: item.totalWithTax || (receivedQty * costPrice),
                        discount: item.discount || 0,
                        batchNumber: item.batchNumber || 'DEFAULT'
                    });
                }
            });
        }

        const warehouseId = body.warehouseId || defaultWarehouseId;

        if (mappedItems.length > 0 && warehouseId) {
            const grnId = new mongoose.Types.ObjectId();
            const totalQty = mappedItems.reduce((sum, i) => sum + i.receivedQty, 0);
            const totalValue = mappedItems.reduce((sum, i) => sum + (i.receivedQty * i.costPrice), 0);

            grnsToInsert.push({
                _id: grnId,
                grnNumber: body.grnNumber || `GRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                grnType: body.grnType || 'GARMENT',
                warehouseId: new mongoose.Types.ObjectId(warehouseId),
                items: mappedItems,
                remarks: body.remarks,
                status: 'COMPLETED',
                totalQty: totalQty,
                totalValue: totalValue,
                grandTotal: totalValue,
                receivedBy: log.userId || defaultCashierId,
                receivedAt: date,
                createdAt: date,
                updatedAt: date
            });

            // Generate Stock Movements & Ledgers for GRN
            mappedItems.forEach(item => {
                stockMovements.push({
                    variantId: new mongoose.Types.ObjectId(item.variantId),
                    qty: item.receivedQty,
                    type: 'GRN_RECEIPT',
                    referenceId: grnId,
                    referenceType: 'GRN',
                    toLocation: new mongoose.Types.ObjectId(warehouseId),
                    performedBy: defaultCashierId,
                    createdAt: date,
                    sku: item.sku,
                    barcode: item.sku
                });

                rawLedgerEntries.push({
                    itemId: item.itemId,
                    variantId: item.variantId,
                    barcode: item.sku,
                    locationId: new mongoose.Types.ObjectId(warehouseId),
                    locationType: 'WAREHOUSE',
                    type: 'IN',
                    quantity: item.receivedQty,
                    source: 'GRN',
                    referenceId: grnId.toString(),
                    userId: defaultCashierId,
                    createdAt: date
                });
            });
        }
    });

    // --- PHASE 9: MATHEMATICALLY CORRECT LEDGER BALANCE CALCULATION ---
    console.log("🔢 Calculating ledger balanceAfter fields sequentially backwards...");
    
    // Sort all raw ledger entries descending by date (latest first)
    rawLedgerEntries.sort((a, b) => b.createdAt - a.createdAt);

    // Initialize running balance with final quantities
    const runningBalanceMap = new Map(); // key: locationId_barcode -> balance
    for (const inv of storeInventoriesToInsert) {
        runningBalanceMap.set(`${inv.storeId}_${inv.barcode}`, inv.quantity);
    }
    for (const inv of whInventoriesToInsert) {
        runningBalanceMap.set(`${inv.warehouseId}_${inv.barcode}`, inv.quantity);
    }

    // Work backwards through ledger entries
    const ledgerEntriesToInsert = rawLedgerEntries.map(entry => {
        const key = `${entry.locationId}_${entry.barcode}`;
        const currentBalance = runningBalanceMap.get(key) || 0;
        
        entry.balanceAfter = currentBalance;
        
        // Reverse transaction's effect for the running balance (going backward in time)
        if (entry.type === 'OUT') {
            runningBalanceMap.set(key, currentBalance + entry.quantity);
        } else if (entry.type === 'IN') {
            runningBalanceMap.set(key, currentBalance - entry.quantity);
        }

        return {
            itemId: entry.itemId,
            barcode: entry.barcode,
            locationId: entry.locationId,
            locationType: entry.locationType,
            type: entry.type,
            quantity: entry.quantity,
            source: entry.source,
            referenceId: entry.referenceId,
            balanceAfter: entry.balanceAfter,
            userId: entry.userId,
            batchNo: 'DEFAULT',
            createdAt: entry.createdAt,
            updatedAt: entry.createdAt
        };
    });

    // --- PHASE 10: PERFORM ALL DB INSERTS ---
    console.log("💾 Inserting transaction documents into DB...");

    if (salesToInsert.length > 0) {
        for (let i = 0; i < salesToInsert.length; i += batchSize) {
            await Sale.insertMany(salesToInsert.slice(i, i + batchSize));
        }
        console.log(`✅ Sales restored: ${salesToInsert.length}`);
    }

    if (dispatchesToInsert.length > 0) {
        await Dispatch.insertMany(dispatchesToInsert);
        console.log(`✅ Dispatches restored: ${dispatchesToInsert.length}`);
    }

    if (grnsToInsert.length > 0) {
        await Grn.insertMany(grnsToInsert);
        console.log(`✅ GRNs restored: ${grnsToInsert.length}`);
    }

    if (stockMovements.length > 0) {
        for (let i = 0; i < stockMovements.length; i += batchSize) {
            await StockMovement.insertMany(stockMovements.slice(i, i + batchSize));
        }
        console.log(`✅ Stock Movements restored: ${stockMovements.length}`);
    }

    if (ledgerEntriesToInsert.length > 0) {
        for (let i = 0; i < ledgerEntriesToInsert.length; i += batchSize) {
            await StockLedger.insertMany(ledgerEntriesToInsert.slice(i, i + batchSize));
        }
        console.log(`✅ Stock Ledger entries restored: ${ledgerEntriesToInsert.length}`);
    }

    // --- PHASE 11: RESET BM COUNTER ---
    console.log("🔢 Resetting itemCode_BM sequential counter...");
    let maxBM = 258; // fallback
    for (const itemCode of itemsMap.keys()) {
        if (itemCode.startsWith('BM')) {
            const num = parseInt(itemCode.replace('BM', ''));
            if (num > maxBM) maxBM = num;
        }
    }
    console.log(`Highest restored BM code found: BM${String(maxBM).padStart(4, '0')}`);

    const counterRes = await Counter.findOneAndUpdate(
        { name: 'itemCode_BM' },
        { $set: { seq: maxBM } },
        { upsert: true, new: true }
    );
    console.log(`✅ Sequential counter itemCode_BM set to: ${counterRes.seq}`);

    console.log("\n✨ DATABASE RESTORATION SUCCESSFULLY COMPLETED!");
    console.log("--------------------------------------------------");
    console.log(`- Recreated Styles (Items): ${insertedItems.length}`);
    console.log(`- Recreated Variants (SKUs): ${skuCache.size}`);
    console.log(`- Restored Store Stocks: ${storeInventoriesToInsert.length} rows`);
    console.log(`- Restored Warehouse Stocks: ${whInventoriesToInsert.length} rows`);
    console.log(`- Restored Sales Invoices: ${salesToInsert.length}`);
    console.log(`- Restored Dispatches: ${dispatchesToInsert.length}`);
    console.log(`- Restored GRNs: ${grnsToInsert.length}`);
    console.log("--------------------------------------------------");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
}

restore().catch(err => {
    console.error("❌ Recovery failed:", err);
    process.exit(1);
});
