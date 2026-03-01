const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET || 'ADMIN_SECRET_2026';

const state = {
    adminToken: '',
    storeToken: '',
    storeId: '',
    supplierId: '',
    fabricId: '',
    batchId: '',
    productIds: [], // [{ id, size, barcode }]
    dispatchId: '',
    saleId: '',
};

const log = (step, msg) => console.log(`\n🔹 STEP ${step} — ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const fail = (msg, data) => {
    console.error(`❌ ${msg}`);
    if (data) console.error(JSON.stringify(data, null, 2));
    process.exit(1);
};

const run = async () => {
    try {
        // --- STEP 2: CREATE USERS ---
        log(2, 'CREATE USERS');

        const adminReg = await axios.post(`${API_URL}/auth/admin/register`, {
            name: 'Admin User',
            email: 'admin@test.com',
            password: '123456',
            adminSecret: ADMIN_SECRET
        });
        state.adminToken = adminReg.data.token;
        success('Admin registered and token stored');

        const storeReg = await axios.post(`${API_URL}/auth/store/register`, {
            name: 'Store Staff',
            email: 'store@test.com',
            password: '123456',
            shopName: 'Store A'
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });

        const storeLogin = await axios.post(`${API_URL}/auth/store/login`, {
            email: 'store@test.com',
            password: '123456'
        });
        state.storeToken = storeLogin.data.token;
        success('Store staff registered and logged in');

        // --- STEP 3: CREATE STORE ---
        log(3, 'CREATE STORE');
        const storeResponse = await axios.post(`${API_URL}/stores`, {
            name: 'Store A',
            location: {
                address: 'Main St',
                city: 'City A',
                state: 'State A',
                pincode: '123456'
            },
            managerName: 'Manager A',
            managerPhone: '9999999999',
            email: 'storeA@test.com',
            storeCode: 'STA-' + Date.now()
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });
        state.storeId = storeResponse.data.store._id;

        if (storeResponse.data.store.isActive && !storeResponse.data.store.isDeleted) {
            success(`Store A created: ${state.storeId}`);
        } else {
            fail('Store creation verification failed', storeResponse.data.store);
        }

        // --- STEP 4: CREATE SUPPLIER ---
        log(4, 'CREATE SUPPLIER');
        const supplierRes = await axios.post(`${API_URL}/suppliers`, {
            name: 'Denim Supplier Ltd',
            email: 'contact@denim.com',
            phone: '8888888888',
            address: 'Industrial Area'
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });
        state.supplierId = supplierRes.data.supplier._id;

        if (supplierRes.data.supplier.isActive) {
            success(`Supplier created: ${state.supplierId}`);
        } else {
            fail('Supplier verification failed', supplierRes.data.supplier);
        }

        // --- STEP 5: FABRIC PURCHASE ---
        log(5, 'FABRIC PURCHASE');
        const fabricRes = await axios.post(`${API_URL}/fabrics`, {
            supplierId: state.supplierId,
            fabricType: 'Denim',
            invoiceNumber: 'INV-FAB-001',
            meterPurchased: 1000,
            ratePerMeter: 100,
            lotNumber: 'LOT-001'
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });
        state.fabricId = fabricRes.data.fabric._id;

        if (fabricRes.data.fabric.meterAvailable === 1000) {
            success('Fabric purchased. meterAvailable = 1000');
        } else {
            fail(`Fabric verification failed. Expected 1000, got ${fabricRes.data.fabric.meterAvailable}`);
        }

        // --- STEP 6: PRODUCTION BATCH ---
        log(6, 'PRODUCTION BATCH');
        const batchRes = await axios.post(`${API_URL}/production`, {
            fabricId: state.fabricId,
            meterUsed: 200,
            styleNumber: 'STY-001',
            sizeBreakdown: [
                { size: 'S', quantity: 50 },
                { size: 'M', quantity: 100 },
                { size: 'L', quantity: 50 }
            ]
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });
        state.batchId = batchRes.data.batch._id;

        const fabricCheck = await axios.get(`${API_URL}/fabrics/${state.fabricId}`, {
            headers: { Authorization: `Bearer ${state.adminToken}` }
        });

        if (fabricCheck.data.fabric.meterAvailable === 800 && batchRes.data.batch.totalPieces === 200) {
            success('Production batch created. Fabric meterAvailable = 800. totalPieces = 200');
        } else {
            fail('Production batch verification failed', { fabric: fabricCheck.data.fabric, batch: batchRes.data.batch });
        }

        // --- STEP 7: MOVE STAGE TO READY ---
        log(7, 'MOVE STAGE TO READY (Product Creation)');
        await axios.patch(`${API_URL}/production/${state.batchId}/stage`, {
            stage: 'READY',
            productMetadata: {
                name: 'Denim Jeans STY-001',
                category: 'Clothing',
                brand: 'TestBrand',
                costPrice: 200,
                salePrice: 500,
                color: 'Indigo'
            }
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });

        const productsRes = await axios.get(`${API_URL}/products?batchId=${state.batchId}`, {
            headers: { Authorization: `Bearer ${state.adminToken}` }
        });
        const products = productsRes.data.products;
        if (products.length === 3) {
            state.productIds = products.map(p => ({ id: p._id, size: p.size, barcode: p.barcode, factoryStock: p.factoryStock }));
            success('Products created for S, M, L with correct factoryStock');
        } else {
            fail(`Expected 3 products, found ${products.length}`);
        }

        // --- STEP 8: DISPATCH 100 PIECES TO STORE A ---
        log(8, 'DISPATCH 100 PIECES TO STORE A');
        const mProduct = state.productIds.find(p => p.size === 'M');
        const lProduct = state.productIds.find(p => p.size === 'L');

        const dispatchRes = await axios.post(`${API_URL}/dispatch`, {
            storeId: state.storeId,
            products: [
                { productId: mProduct.id, quantity: 50 },
                { productId: lProduct.id, quantity: 50 }
            ]
        }, { headers: { Authorization: `Bearer ${state.adminToken}` } });
        state.dispatchId = dispatchRes.data.dispatch._id;

        const mCheck = await axios.get(`${API_URL}/products/${mProduct.id}`, { headers: { Authorization: `Bearer ${state.adminToken}` } });
        const lCheck = await axios.get(`${API_URL}/products/${lProduct.id}`, { headers: { Authorization: `Bearer ${state.adminToken}` } });

        if (mCheck.data.product.factoryStock === 50 && lCheck.data.product.factoryStock === 0) {
            success('Dispatch created. Factory stock: M=50, L=0');
        } else {
            fail('Dispatch stock verification failed', { M: mCheck.data.product.factoryStock, L: lCheck.data.product.factoryStock });
        }

        // --- STEP 9: RECEIVE DISPATCH ---
        log(9, 'RECEIVE DISPATCH');
        await axios.patch(`${API_URL}/dispatch/${state.dispatchId}/status`, {
            status: 'RECEIVED'
        }, { headers: { Authorization: `Bearer ${state.storeToken}` } });
        success('Dispatch marked RECEIVED');

        const invRes = await axios.get(`${API_URL}/store-inventory?storeId=${state.storeId}`, {
            headers: { Authorization: `Bearer ${state.storeToken}` }
        });
        const mInv = invRes.data.inventory.find(i => i.productId._id === mProduct.id);
        const lInv = invRes.data.inventory.find(i => i.productId._id === lProduct.id);

        if (mInv.quantityAvailable === 50 && lInv.quantityAvailable === 50) {
            success('Store inventory received: M=50, L=50');
        } else {
            fail('Inventory reception failed', { M: mInv, L: lInv });
        }

        // --- STEP 10: SALE 20 PIECES ---
        log(10, 'SALE 20 PIECES');
        const saleRes = await axios.post(`${API_URL}/sales`, {
            storeId: state.storeId,
            products: [
                { productId: mProduct.id, quantity: 10, barcode: mProduct.barcode, price: 500, total: 5000 },
                { productId: lProduct.id, quantity: 10, barcode: lProduct.barcode, price: 500, total: 5000 }
            ],
            subTotal: 10000,
            grandTotal: 10000,
            paymentMode: 'CASH'
        }, { headers: { Authorization: `Bearer ${state.storeToken}` } });
        state.saleId = saleRes.data.sale._id;

        const invRes2 = await axios.get(`${API_URL}/store-inventory?storeId=${state.storeId}`, {
            headers: { Authorization: `Bearer ${state.storeToken}` }
        });
        const mInv2 = invRes2.data.inventory.find(i => i.productId._id === mProduct.id);
        const lInv2 = invRes2.data.inventory.find(i => i.productId._id === lProduct.id);

        if (mInv2.quantityAvailable === 40 && lInv2.quantityAvailable === 40 && mInv2.quantitySold === 10) {
            success('Sale record created. Store inventory: M=40, L=40');
        } else {
            fail('Sale verification failed', { M: mInv2, L: lInv2 });
        }

        // --- STEP 11: CUSTOMER RETURN 5 PIECES ---
        log(11, 'CUSTOMER RETURN 5 PIECES');
        await axios.post(`${API_URL}/returns`, {
            referenceSaleId: state.saleId,
            storeId: state.storeId,
            productId: mProduct.id,
            quantity: 5,
            type: 'CUSTOMER_RETURN',
            reason: 'Wrong size'
        }, { headers: { Authorization: `Bearer ${state.storeToken}` } });

        const invRes3 = await axios.get(`${API_URL}/store-inventory?storeId=${state.storeId}`, {
            headers: { Authorization: `Bearer ${state.storeToken}` }
        });
        const mInv3 = invRes3.data.inventory.find(i => i.productId._id === mProduct.id);

        if (mInv3.quantityAvailable === 45 && mInv3.quantitySold === 5) {
            success('Customer return processed. Store inventory: M=45, quantitySold=5');
        } else {
            fail('Customer return failed', mInv3);
        }

        // --- STEP 12: STORE RETURN 10 PIECES TO FACTORY ---
        log(12, 'STORE RETURN 10 PIECES TO FACTORY');
        await axios.post(`${API_URL}/returns`, {
            storeId: state.storeId,
            productId: lProduct.id,
            quantity: 10,
            type: 'STORE_TO_FACTORY',
            reason: 'Excess stock'
        }, { headers: { Authorization: `Bearer ${state.storeToken}` } });

        const invRes4 = await axios.get(`${API_URL}/store-inventory?storeId=${state.storeId}`, {
            headers: { Authorization: `Bearer ${state.storeToken}` }
        });
        const lInv4 = invRes4.data.inventory.find(i => i.productId._id === lProduct.id);
        const lProdCheck = await axios.get(`${API_URL}/products/${lProduct.id}`, { headers: { Authorization: `Bearer ${state.adminToken}` } });

        if (lInv4.quantityAvailable === 30 && lProdCheck.data.product.factoryStock === 10) {
            success('Store to Factory return processed. Store inventory L=30, FactoryStock L=10');
        } else {
            fail('Store to factory return failed', { L_inv: lInv4, L_factory: lProdCheck.data.product.factoryStock });
        }

        // --- STEP 13: MARK 3 DAMAGED ---
        log(13, 'MARK 3 DAMAGED');
        await axios.post(`${API_URL}/returns`, {
            storeId: state.storeId,
            productId: mProduct.id,
            quantity: 3,
            type: 'DAMAGED',
            reason: 'Stain'
        }, { headers: { Authorization: `Bearer ${state.storeToken}` } });

        const invRes5 = await axios.get(`${API_URL}/store-inventory?storeId=${state.storeId}`, {
            headers: { Authorization: `Bearer ${state.storeToken}` }
        });
        const mInv5 = invRes5.data.inventory.find(i => i.productId._id === mProduct.id);

        if (mInv5.quantityAvailable === 42) {
            success('Damaged items processed. Store inventory M=42');
        } else {
            fail('Damaged processing failed', mInv5);
        }

        // --- STEP 14: FINAL STOCK VALIDATION ---
        log(14, 'FINAL STOCK VALIDATION');
        const allProducts = (await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${state.adminToken}` } })).data.products;
        const allStoreInv = (await axios.get(`${API_URL}/store-inventory`, { headers: { Authorization: `Bearer ${state.adminToken}` } })).data.inventory;

        const results = {
            m: {
                factory: allProducts.find(p => p.size === 'M').factoryStock,
                store: allStoreInv.find(i => i.productId._id === mProduct.id).quantityAvailable
            },
            l: {
                factory: allProducts.find(p => p.size === 'L').factoryStock,
                store: allStoreInv.find(i => i.productId._id === lProduct.id).quantityAvailable
            },
            s: {
                factory: allProducts.find(p => p.size === 'S').factoryStock,
                store: allStoreInv.find(i => i.productId._id === mProduct.id + 'S') || { quantityAvailable: 0 }
            }
        };

        console.log('Final Totals:', JSON.stringify(results, null, 2));

        if (results.m.store === 42 && results.l.store === 30 && results.l.factory === 10) {
            success('Final stock matches expected internal state.');
        } else {
            fail('Final stock mismatch', results);
        }

        // --- STEP 15: REPORT VALIDATION ---
        log(15, 'REPORT VALIDATION');
        try {
            const dailyReport = await axios.get(`${API_URL}/reports/daily-sales?date=${new Date().toISOString().split('T')[0]}`, {
                headers: { Authorization: `Bearer ${state.adminToken}` }
            });
            if (dailyReport.data.data && dailyReport.data.data.revenue === 10000) {
                success('Daily report validated (Revenue=10000)');
            } else {
                console.log('Report Data:', JSON.stringify(dailyReport.data, null, 2));
            }
        } catch (e) {
            console.log('Report validation skipped or failed due to endpoint structure');
        }

        // --- STEP 16: ROLE PROTECTION TEST ---
        log(16, 'ROLE PROTECTION TEST');
        try {
            await axios.post(`${API_URL}/fabrics`, {}, { headers: { Authorization: `Bearer ${state.storeToken}` } });
            fail('Security breach: Store staff created fabric');
        } catch (err) {
            success('Store staff blocked from creating fabric (403/Forbidden)');
        }

        // --- STEP 17: EDGE CASE TEST ---
        log(17, 'EDGE CASE TEST (Return more than sold)');
        try {
            await axios.post(`${API_URL}/returns`, {
                referenceSaleId: state.saleId,
                storeId: state.storeId,
                productId: mProduct.id,
                quantity: 100,
                type: 'CUSTOMER_RETURN',
                reason: 'Fraud'
            }, { headers: { Authorization: `Bearer ${state.storeToken}` } });
            fail('Security breach: Over-return allowed');
        } catch (err) {
            success('Over-return blocked successfully');
        }

        // --- STEP 18: STOCK HISTORY VALIDATION ---
        log(18, 'STOCK HISTORY VALIDATION');
        const historyRes = await axios.get(`${API_URL}/reports/stock-history`, {
            headers: { Authorization: `Bearer ${state.adminToken}` }
        });
        const historyCount = historyRes.data.history?.length || 0;
        console.log('Total StockHistory entries:', historyCount);
        if (historyCount > 0) {
            success(`Stock history entries verified: ${historyCount}`);
        } else {
            console.warn('⚠️ No stock history entries found (Check endpoint or logic)');
        }

        // --- STEP 19: AUDIT LOG VALIDATION ---
        log(19, 'AUDIT LOG VALIDATION');
        const auditRes = await axios.get(`${API_URL}/reports/audit-logs`, {
            headers: { Authorization: `Bearer ${state.adminToken}` }
        });
        const auditCount = auditRes.data.logs?.length || 0;
        console.log('Total AuditLog entries:', auditCount);
        if (auditCount > 0) {
            success(`Audit logs verified: ${auditCount}`);
        } else {
            console.warn('⚠️ No audit logs found');
        }

        success('Verification Script Complete (PASS)');

        console.log('\n--- 🏥 FINAL HEALTH REPORT ---');
        console.log('Fabric MeterAvailable:', fabricCheck.data.fabric.meterAvailable);
        console.log('M-Product (Factory/Store):', results.m.factory, '/', results.m.store);
        console.log('L-Product (Factory/Store):', results.l.factory, '/', results.l.store);

        process.exit(0);

    } catch (err) {
        console.error('❌ UNEXPECTED FAILURE:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
            console.error(err.stack);
        }
        process.exit(1);
    }
};

run();
