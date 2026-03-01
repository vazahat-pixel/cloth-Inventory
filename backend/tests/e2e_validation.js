
const axios = require('axios');
const path = require('path');

// Load environment variables directly from .env file
const envPath = path.join(process.cwd(), '.env');
require('dotenv').config({ path: envPath });

const BASE_URL = 'http://localhost:5000/api';

const auditReport = {
    phases: [],
    finalAudit: { actual: {}, expected: {}, match: false },
    inconsistencies: [],
    security: [],
    failures: []
};

function logPhase(name, status, details = {}) {
    auditReport.phases.push({ name, status, details });
    console.log(`[${status}] ${name}`);
    if (status === 'FAIL') {
        console.error(`   Error: ${details.error || 'Unknown error'}`);
    }
}

async function runE2E() {
    let adminToken, storeToken;
    let testShopId, testSupplierId, testFabricId, testBatchId;
    let products = {}; // { size: id }
    let dispatchId, saleId;

    try {
        // --- AUTHENTICATION ---
        try {
            const adminLogin = await axios.post(`${BASE_URL}/auth/admin/login`, {
                email: 'admin@clothinventory.com',
                password: 'Admin@1234'
            });
            adminToken = adminLogin.data.token;

            const storeLogin = await axios.post(`${BASE_URL}/auth/store/login`, {
                email: 'store@clothinventory.com',
                password: 'Store@1234'
            });
            storeToken = storeLogin.data.token;
            logPhase('Authentication', 'PASS');
        } catch (err) {
            logPhase('Authentication', 'FAIL', { error: err.message });
            process.exit(1);
        }

        const adminHeader = { headers: { Authorization: `Bearer ${adminToken}` } };
        const storeHeader = { headers: { Authorization: `Bearer ${storeToken}` } };

        // --- MASTER DATA ---
        try {
            // Shop
            try {
                const shopRes = await axios.post(`${BASE_URL}/stores`, {
                    name: 'Urban Style Store',
                    managerName: 'Test Manager',
                    managerPhone: '9876543210',
                    email: `urban-${Date.now()}@test.com`,
                    location: { address: 'Mumbai', city: 'Mumbai', state: 'Maharashtra' }
                }, adminHeader);
                testShopId = shopRes.data.store._id;
            } catch (e) {
                if (e.response?.data?.message?.includes('already exists')) {
                    const existing = await axios.get(`${BASE_URL}/stores?search=Urban Style Store`, adminHeader);
                    testShopId = existing.data.stores[0]._id;
                } else throw e;
            }

            // Supplier
            try {
                const supplierRes = await axios.post(`${BASE_URL}/suppliers`, {
                    name: 'Premium Textile Ltd',
                    phone: '9000000001',
                    email: `premium-${Date.now()}@test.com`,
                    address: 'Surat'
                }, adminHeader);
                testSupplierId = supplierRes.data.supplier._id;
            } catch (e) {
                if (e.response?.data?.message?.includes('already exists')) {
                    const existing = await axios.get(`${BASE_URL}/suppliers?search=Premium Textile Ltd`, adminHeader);
                    testSupplierId = existing.data.suppliers[0]._id;
                } else throw e;
            }

            logPhase('Master Data Seeding', 'PASS', { shopId: testShopId, supplierId: testSupplierId });
        } catch (err) {
            logPhase('Master Data Seeding', 'FAIL', { error: err.response?.data?.message || err.message });
        }

        // --- FABRIC ---
        try {
            const fabricRes = await axios.post(`${BASE_URL}/fabrics`, {
                fabricType: '100% Pima Cotton',
                invoiceNumber: `INV-${Date.now()}`,
                meterPurchased: 1000,
                ratePerMeter: 120,
                supplierId: testSupplierId,
                gsm: 180,
                color: 'White'
            }, adminHeader);
            testFabricId = fabricRes.data.fabric._id;
            logPhase('Fabric Seeding', 'PASS', { meterAvailable: fabricRes.data.fabric.meterAvailable });
        } catch (err) {
            logPhase('Fabric Seeding', 'FAIL', { error: err.response?.data?.message || err.message });
        }

        // --- PRODUCTION ---
        if (testFabricId) {
            try {
                const batchRes = await axios.post(`${BASE_URL}/production`, {
                    fabricId: testFabricId,
                    meterUsed: 200,
                    sizeBreakdown: [
                        { size: 'S', quantity: 50 },
                        { size: 'M', quantity: 100 },
                        { size: 'L', quantity: 50 }
                    ]
                }, adminHeader);
                testBatchId = batchRes.data.batch._id;
                logPhase('Production Seeding', 'PASS', { totalPieces: batchRes.data.batch.totalPieces });
            } catch (err) {
                logPhase('Production Seeding', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- WORKFLOW -> READY ---
        if (testBatchId) {
            try {
                await axios.patch(`${BASE_URL}/production/${testBatchId}/stage`, { stage: 'CUTTING' }, adminHeader);
                await axios.patch(`${BASE_URL}/production/${testBatchId}/stage`, { stage: 'FINISHING' }, adminHeader);
                await axios.patch(`${BASE_URL}/production/${testBatchId}/stage`, {
                    stage: 'READY',
                    productMetadata: {
                        name: `Urban Cotton Shirt ${Date.now()}`,
                        category: 'Cotton Shirts',
                        brand: 'Urban Style',
                        salePrice: 999,
                        color: 'White'
                    }
                }, adminHeader);

                const productsRes = await axios.get(`${BASE_URL}/products?limit=100`, adminHeader);
                const created = productsRes.data.products.filter(p => p.batchId?._id === testBatchId || p.batchId === testBatchId);

                if (created.length === 3) {
                    created.forEach(p => products[p.size] = p);
                    logPhase('Workflow Readiness', 'PASS', { productsCreated: 3 });
                } else {
                    throw new Error(`Expected 3 products, found ${created.length}`);
                }
            } catch (err) {
                logPhase('Workflow Readiness', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- DISPATCH ---
        if (products['M'] && products['L']) {
            try {
                const dispatchRes = await axios.post(`${BASE_URL}/dispatch`, {
                    storeId: testShopId,
                    products: [
                        { productId: products['M']._id, quantity: 50 },
                        { productId: products['L']._id, quantity: 50 }
                    ]
                }, adminHeader);
                dispatchId = dispatchRes.data.dispatch._id;
                logPhase('Dispatch', 'PASS', { dispatchId });
            } catch (err) {
                logPhase('Dispatch', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- STOCK RECEPTION ---
        if (dispatchId) {
            try {
                await axios.patch(`${BASE_URL}/dispatch/${dispatchId}/status`, { status: 'RECEIVED' }, storeHeader);
                logPhase('Stock Reception', 'PASS');
            } catch (err) {
                logPhase('Stock Reception', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- SALE ---
        if (saleId === undefined && products['M'] && dispatchId) {
            try {
                const saleRes = await axios.post(`${BASE_URL}/sales`, {
                    storeId: testShopId,
                    products: [
                        { productId: products['M']._id, barcode: products['M'].barcode, quantity: 10, price: 999, total: 9990 },
                        { productId: products['L']._id, barcode: products['L'].barcode, quantity: 10, price: 999, total: 9990 }
                    ],
                    subTotal: 19980, grandTotal: 19980, paymentMode: 'UPI'
                }, storeHeader);
                saleId = saleRes.data.sale._id;
                logPhase('Sales Transaction', 'PASS');
            } catch (err) {
                logPhase('Sales Transaction', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- CUSTOMER RETURN ---
        if (saleId) {
            try {
                await axios.post(`${BASE_URL}/returns`, {
                    type: 'CUSTOMER_RETURN',
                    storeId: testShopId, productId: products['M']._id, quantity: 5, referenceSaleId: saleId
                }, storeHeader);
                logPhase('Customer Return', 'PASS');
            } catch (err) {
                logPhase('Customer Return', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- STORE RETURN TO FACTORY ---
        if (products['L']) {
            try {
                await axios.post(`${BASE_URL}/returns`, {
                    type: 'STORE_TO_FACTORY',
                    storeId: testShopId, productId: products['L']._id, quantity: 10
                }, storeHeader);
                logPhase('Store Return to Factory', 'PASS');
            } catch (err) {
                logPhase('Store Return to Factory', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- DAMAGED MARKING ---
        if (products['M']) {
            try {
                await axios.post(`${BASE_URL}/returns`, {
                    type: 'DAMAGED',
                    storeId: testShopId, productId: products['M']._id, quantity: 3
                }, storeHeader);
                logPhase('Damaged Marking', 'PASS');
            } catch (err) {
                logPhase('Damaged Marking', 'FAIL', { error: err.response?.data?.message || err.message });
            }
        }

        // --- ROLE VALIDATION (RBAC) ---
        try {
            let pass = true;
            try { await axios.post(`${BASE_URL}/fabrics`, {}, storeHeader); pass = false; } catch (e) { if (e.response?.status !== 403) pass = false; }
            try { await axios.post(`${BASE_URL}/production`, {}, storeHeader); pass = false; } catch (e) { if (e.response?.status !== 403) pass = false; }
            try { await axios.post(`${BASE_URL}/dispatch`, {}, storeHeader); pass = false; } catch (e) { if (e.response?.status !== 403) pass = false; }
            logPhase('RBAC Protection', pass ? 'PASS' : 'FAIL');
        } catch (err) { logPhase('RBAC Protection', 'FAIL', { error: err.message }); }

        // --- EDGE CASE TESTING ---
        try {
            let pass = true;
            // Sell more than stock
            try { await axios.post(`${BASE_URL}/sales`, { storeId: testShopId, products: [{ productId: products['M']._id, quantity: 100, price: 999, total: 99900 }] }, storeHeader); pass = false; } catch (e) { }
            // Dispatch more than factory stock
            if (products['S']) {
                try { await axios.post(`${BASE_URL}/dispatch`, { storeId: testShopId, products: [{ productId: products['S']._id, quantity: 1000 }] }, adminHeader); pass = false; } catch (e) { }
            }
            logPhase('Edge Case Safety', pass ? 'PASS' : 'FAIL');
        } catch (err) { logPhase('Edge Case Safety', 'FAIL', { error: err.message }); }

        // --- FINAL INTEGRITY AUDIT ---
        try {
            const finalFabric = await axios.get(`${BASE_URL}/fabrics/${testFabricId}`, adminHeader);
            const finalM = await axios.get(`${BASE_URL}/products/${products['M']._id}`, adminHeader);
            const finalL = await axios.get(`${BASE_URL}/products/${products['L']._id}`, adminHeader);
            const finalS = await axios.get(`${BASE_URL}/products/${products['S']._id}`, adminHeader);

            const invMRes = await axios.get(`${BASE_URL}/store-inventory/${products['M']._id}?storeId=${testShopId}`, storeHeader);
            const invM = invMRes.data.item;
            const invLRes = await axios.get(`${BASE_URL}/store-inventory/${products['L']._id}?storeId=${testShopId}`, storeHeader);
            const invL = invLRes.data.item;

            auditReport.finalAudit.actual = {
                fabric: finalFabric.data.fabric.meterAvailable,
                factory: finalM.data.product.factoryStock + finalL.data.product.factoryStock + finalS.data.product.factoryStock,
                store: invM.quantityAvailable + invL.quantityAvailable
            };
            auditReport.finalAudit.expected = { fabric: 800, factory: 110, store: 72 };
            auditReport.finalAudit.match = (auditReport.finalAudit.actual.fabric === 800 && auditReport.finalAudit.actual.factory === 110 && auditReport.finalAudit.actual.store === 72);

            logPhase('Final Integrity Audit', auditReport.finalAudit.match ? 'PASS' : 'FAIL', auditReport.finalAudit);
        } catch (err) {
            logPhase('Final Integrity Audit', 'FAIL', { error: err.message });
        }

        // --- REPORT VALIDATION ---
        try {
            const daily = await axios.get(`${BASE_URL}/reports/daily-sales`, adminHeader);
            const lowStock = await axios.get(`${BASE_URL}/reports/low-stock`, adminHeader);
            const returns = await axios.get(`${BASE_URL}/reports/returns`, adminHeader);
            logPhase('Report Validation', 'PASS', {
                dailyRevenue: daily.data[0]?.totalRevenue || 0,
                lowStockCount: (lowStock.data.factoryLow?.length || 0) + (lowStock.data.storeLow?.length || 0)
            });
        } catch (err) {
            logPhase('Report Validation', 'FAIL', { error: err.message });
        }

        console.log('\n=========================================');
        console.log('       FINAL SYSTEM AUDIT REPORT');
        console.log('=========================================');
        console.log(JSON.stringify(auditReport, null, 2));

    } catch (err) {
        console.error('CRITICAL SCRIPT ERROR:', err);
    } finally {
        process.exit(0);
    }
}

runE2E();
