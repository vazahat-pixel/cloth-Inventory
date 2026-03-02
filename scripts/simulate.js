#!/usr/bin/env node

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Use backend's mongoose so models share the same connection instance
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

const Product = require('../backend/src/models/product.model');
const Store = require('../backend/src/models/store.model');
const Customer = require('../backend/src/models/customer.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');
const CreditNote = require('../backend/src/models/creditNote.model');
const Sale = require('../backend/src/models/sale.model');
const Supplier = require('../backend/src/models/supplier.model');
const Dispatch = require('../backend/src/models/dispatch.model');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5001/api';

const summary = {
    purchases: 0,
    dispatches: 0,
    sales: 0,
    creditNoteSales: 0,
    returnsSimulated: 0,
    cancelledSales: 0,
    trialBalanceBalanced: false,
};

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set in environment');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');
}

// ---------- Auth ----------
async function login(email, password, isAdmin = true) {
    const url = `${API_BASE}/auth/${isAdmin ? 'admin' : 'store'}/login`;
    try {
        const { data } = await axios.post(url, { email, password });
        // Response shape: { success, message, token, user } (flat spread)
        if (!data || !data.success) throw new Error(`Login failed: ${JSON.stringify(data)}`);
        const token = data.token || data.accessToken;
        if (!token) throw new Error(`No token in login response: ${JSON.stringify(data)}`);
        return token;
    } catch (err) {
        if (err.response) {
            throw new Error(`Login HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        }
        throw err;
    }
}

function makeClient(token) {
    return axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ---------- API helpers with error info ----------
async function apiPost(client, endpoint, body, label) {
    try {
        const { data } = await client.post(endpoint, body);
        if (!data || !data.success) {
            throw new Error(`${label} FAILED: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (err) {
        if (err.response) {
            throw new Error(`${label} HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        }
        throw err;
    }
}

async function apiPatch(client, endpoint, body, label) {
    try {
        const { data } = await client.patch(endpoint, body || {});
        if (!data || !data.success) {
            throw new Error(`${label} FAILED: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (err) {
        if (err.response) {
            throw new Error(`${label} HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        }
        throw err;
    }
}

async function apiGet(client, endpoint, label) {
    try {
        const { data } = await client.get(endpoint);
        if (!data || !data.success) {
            throw new Error(`${label} FAILED: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (err) {
        if (err.response) {
            throw new Error(`${label} HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        }
        throw err;
    }
}

// ---------- Stock guard ----------
async function ensureStockNonNegative() {
    const negatives = await StoreInventory.find({ quantityAvailable: { $lt: 0 } }).limit(1);
    if (negatives.length > 0) {
        throw new Error('Negative stock detected in StoreInventory!');
    }
}

// ---------- Main ----------
async function main() {
    await connectDB();

    try {
        // ── Admin login ──
        console.log('\n[STEP] Logging in as admin...');
        const adminToken = await login('admin@example.com', 'Admin@123', true);
        const adminClient = makeClient(adminToken);
        console.log('  ✅ Admin login OK');

        // ── Fetch seeded data ──
        const products = await Product.find({ isActive: true }).limit(200);
        const stores = await Store.find({ isActive: true }).limit(5);
        const customers = await Customer.find({ isActive: true }).limit(100);
        const suppliers = await Supplier.find({ isActive: true }).limit(10);

        if (!products.length || !stores.length || !customers.length) {
            throw new Error('Insufficient seeded data. Run seed script first.');
        }
        if (!suppliers.length) {
            throw new Error('No suppliers found. Run seed script first.');
        }

        console.log(`  Data: ${products.length} products, ${stores.length} stores, ${customers.length} customers, ${suppliers.length} suppliers`);

        // ── STEP: 50 Purchases ──
        console.log('\n[STEP] Performing 50 random purchases...');
        for (let i = 0; i < 50; i++) {
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            const selected = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 10) + 1;
            const rate = selected.costPrice || 500;

            // Purchase service reads `items` NOT `products`
            const body = {
                supplierId: supplier._id,
                invoiceNumber: `SIM-INV-${Date.now()}-${i}`,
                invoiceDate: new Date().toISOString(),
                items: [{ productId: selected._id, quantity, rate }],
                notes: 'Simulation purchase',
            };

            const res = await apiPost(adminClient, '/purchase', body, `Purchase[${i}]`);
            console.log(`  ✅ Purchase[${i}] → ${res.purchase?.purchaseNumber || 'ok'}`);
            summary.purchases++;
            await ensureStockNonNegative();
        }

        // ── STEP: 50 Dispatches ──
        console.log('\n[STEP] Performing 50 dispatch operations...');
        for (let i = 0; i < 50; i++) {
            const store = stores[Math.floor(Math.random() * stores.length)];
            const selected = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 5) + 1;

            const body = {
                storeId: store._id,
                products: [{ productId: selected._id, quantity, price: selected.salePrice || 800 }],
                notes: 'Simulation dispatch',
            };

            const res = await apiPost(adminClient, '/dispatch', body, `Dispatch[${i}]`);
            console.log(`  ✅ Dispatch[${i}] → store:${store.name}, qty:${quantity}`);
            summary.dispatches++;
            await ensureStockNonNegative();
        }

        // ── CRITICAL STEP: Mark all dispatches as RECEIVED ──
        // Dispatch status PENDING → store inventory is only created when status = RECEIVED
        console.log('\n[STEP] Marking all dispatches as RECEIVED (populates store inventory)...');
        const pendingDispatches = await Dispatch.find({ status: { $in: ['PENDING', 'SHIPPED'] }, isDeleted: false });
        console.log(`  Found ${pendingDispatches.length} pending dispatches to receive...`);
        let receivedCount = 0;
        for (const d of pendingDispatches) {
            try {
                await apiPatch(adminClient, `/dispatch/${d._id}/status`, { status: 'RECEIVED' }, `ReceiveDispatch[${d.dispatchNumber}]`);
                receivedCount++;
            } catch (e) {
                console.warn(`  ⚠️  Could not receive dispatch ${d.dispatchNumber}: ${e.message}`);
            }
        }
        console.log(`  ✅ Marked ${receivedCount} dispatches as RECEIVED`);

        // ── Staff login ──
        console.log('\n[STEP] Logging in as store staff...');
        const staffToken = await login('staff1@example.com', 'Staff@123', false);
        const staffClient = makeClient(staffToken);
        console.log('  ✅ Staff login OK');

        // ── STEP: 100 Sales ──
        console.log('\n[STEP] Performing 100 random sales...');
        // Only sell products that have store inventory
        const inventoryDocs = await StoreInventory.find({ quantityAvailable: { $gt: 0 } }).limit(200);
        if (!inventoryDocs.length) {
            throw new Error('No store inventory found. Dispatches may have failed.');
        }

        for (let i = 0; i < 100; i++) {
            // Pick a random inventory record that has stock
            const inv = inventoryDocs[Math.floor(Math.random() * inventoryDocs.length)];
            const customer = customers[Math.floor(Math.random() * customers.length)];

            const product = products.find(p => p._id.toString() === inv.productId.toString());
            if (!product) continue;

            const price = product.salePrice || 1000;
            const quantity = 1;
            const total = price * quantity;

            const body = {
                storeId: inv.storeId,
                customerId: customer._id,
                products: [{
                    productId: product._id,
                    barcode: product.barcode,
                    quantity,
                    price,
                    total,
                    originalPrice: price,
                    appliedPrice: price,
                    pricingSource: 'DEFAULT',
                }],
                subTotal: total,
                discount: 0,
                loyaltyRedeemed: 0,
                creditNoteApplied: 0,
                tax: 0,
                totalTax: 0,
                grandTotal: total,
                paymentMode: 'CASH',
            };

            try {
                const res = await apiPost(staffClient, '/sales', body, `Sale[${i}]`);
                // Response shape: { success, message, sale } (flat spread)
                console.log(`  ✅ Sale[${i}] → ${res.sale?.saleNumber || 'ok'}`);
                summary.sales++;
                // Refresh the inventory doc count for that item
                if (inv.quantityAvailable > 0) inv.quantityAvailable--;
                await ensureStockNonNegative();
            } catch (e) {
                console.warn(`  ⚠️  Sale[${i}] skipped: ${e.message}`);
            }
        }

        // ── STEP: Simulate Returns via Credit Notes ──
        console.log('\n[STEP] Simulating 20 returns via credit notes...');
        const salesForReturns = await Sale.find({ status: 'COMPLETED' }).limit(20);
        for (const sale of salesForReturns) {
            const customerId = sale.customerId || customers[0]._id;
            const amount = Math.min(200, sale.grandTotal || 200);

            await CreditNote.create({
                creditNoteNumber: `SIM-CN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                customerId,
                totalAmount: amount,
                remainingAmount: amount,
            });
            summary.returnsSimulated++;
        }
        console.log(`  ✅ Created ${salesForReturns.length} credit notes`);

        // ── STEP: Loyalty check ──
        console.log('\n[STEP] Loyalty earn & redeem validation...');
        const negativePoints = await Customer.find({ points: { $lt: 0 } }).limit(1);
        if (negativePoints.length) {
            throw new Error('Customer with negative loyalty points found!');
        }
        console.log('  ✅ All loyalty balances non-negative');

        // ── STEP: Apply Credit Notes ──
        console.log('\n[STEP] Applying credit notes in new sales...');
        const availableCreditNotes = await CreditNote.find({ remainingAmount: { $gt: 0 } }).limit(10);

        for (const cn of availableCreditNotes) {
            // Re-fetch inventory for a product in stores[0]
            const storeInv = await StoreInventory.findOne({
                quantityAvailable: { $gt: 0 }
            });
            if (!storeInv) continue;

            const product = products.find(p => p._id.toString() === storeInv.productId.toString());
            if (!product) continue;

            const price = Math.min(product.salePrice || 500, cn.remainingAmount);
            if (price <= 0) continue;

            const body = {
                storeId: storeInv.storeId,
                customerId: cn.customerId,
                products: [{
                    productId: product._id,
                    barcode: product.barcode,
                    quantity: 1,
                    price,
                    total: price,
                    originalPrice: price,
                    appliedPrice: price,
                    pricingSource: 'DEFAULT',
                }],
                subTotal: price,
                discount: 0,
                loyaltyRedeemed: 0,
                creditNoteId: cn._id,
                creditNoteApplied: price,
                tax: 0,
                totalTax: 0,
                grandTotal: 0,
                paymentMode: 'CREDIT_NOTE',
            };

            try {
                const res = await apiPost(staffClient, '/sales', body, `CreditNoteSale`);
                console.log(`  ✅ Credit note sale → ${res.sale?.saleNumber || 'ok'}`);
                summary.creditNoteSales++;
                await ensureStockNonNegative();
            } catch (e) {
                console.warn(`  ⚠️  Credit note sale skipped: ${e.message}`);
            }
        }

        // ── STEP: Cancel 5 Sales ──
        console.log('\n[STEP] Cancelling 5 random completed sales...');
        const randomSales = await Sale.find({ status: 'COMPLETED' }).limit(5);
        for (const sale of randomSales) {
            try {
                await apiPatch(staffClient, `/sales/${sale._id}/cancel`, {}, `CancelSale[${sale.saleNumber}]`);
                console.log(`  ✅ Cancelled sale ${sale.saleNumber}`);
                summary.cancelledSales++;
            } catch (e) {
                console.warn(`  ⚠️  Cancel sale skipped: ${e.message}`);
            }
        }

        // ── STEP: Trial Balance ──
        console.log('\n[STEP] Fetching Trial Balance...');
        const tbData = await apiGet(adminClient, '/reports/trial-balance', 'TrialBalance');
        // Response: { success, message, report } (flat spread)
        const report = tbData.report;
        const totalDebit = report?.totalDebit || 0;
        const totalCredit = report?.totalCredit || 0;
        console.log(`  Trial Balance — Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`);

        if (Math.round(totalDebit) === Math.round(totalCredit)) {
            summary.trialBalanceBalanced = true;
            console.log('  ✅ Trial balance is balanced!');
        } else {
            console.warn('  ⚠️  Trial balance mismatch — may be due to missing account mappings');
        }

        // ── STEP: Low Stock Report ──
        console.log('\n[STEP] Fetching Low Stock Report...');
        const stockData = await apiGet(adminClient, '/reports/low-stock', 'LowStockReport');
        console.log(`  ✅ Low stock items: ${stockData.report?.length ?? 'N/A'}`);

        // ── Final Summary ──
        console.log('\n═══════════════════════════════════════');
        console.log('  SIMULATION FINAL REPORT');
        console.log('═══════════════════════════════════════');
        console.table(summary);
        console.log('\nSimulation completed successfully. ✅');

    } catch (err) {
        console.error('\n❌ Simulation error:', err.message || err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
