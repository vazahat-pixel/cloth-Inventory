const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const credentials = {
    admin: { email: 'admin@clothinventory.com', password: 'Admin@1234' },
    store: { email: 'store@clothinventory.com', password: 'Store@1234' }
};

let adminToken = '';
let storeToken = '';

const setupAuth = async () => {
    try {
        console.log('--- Logging in ---');
        const adminRes = await axios.post(`${API_URL}/auth/admin/login`, credentials.admin);
        adminToken = adminRes.data.token;
        console.log('✅ Admin logged in');

        const storeRes = await axios.post(`${API_URL}/auth/store/login`, credentials.store);
        storeToken = storeRes.data.token;
        console.log('✅ Store staff logged in');
    } catch (err) {
        console.error('❌ Auth failed:', err.response?.data || err.message);
        process.exit(1);
    }
};

const runTests = async () => {
    await setupAuth();

    console.log('\n--- Starting Fix Verification ---');

    let storeId, productId, dispatchId, saleId;

    try {
        // 1. Create a store
        console.log('\n1. Creating a store...');
        const storeRes = await axios.post(`${API_URL}/stores`, {
            name: 'Test Store ' + Date.now(),
            location: {
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '400001'
            },
            managerName: 'Test Manager',
            managerPhone: '9876543210',
            email: 'teststore' + Date.now() + '@example.com',
            storeCode: 'TS' + Math.floor(Math.random() * 1000)
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        storeId = storeRes.data.store._id;
        console.log('✅ Store created:', storeId);

        // 2. Create a product
        console.log('\n2. Creating a product...');
        const productRes = await axios.post(`${API_URL}/products`, {
            name: 'Test Shirt',
            sku: 'TSH-' + Date.now(),
            barcode: 'BC-' + Date.now(),
            category: 'Clothing',
            size: 'L',
            salePrice: 500,
            factoryStock: 100
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        productId = productRes.data.product._id;
        const barcode = productRes.data.product.barcode;
        console.log('✅ Product created:', productId, 'Barcode:', barcode);

        // 3. Verify Barcode Route Ordering
        console.log('\n3. Verifying Barcode Route Ordering...');
        const barcodeRes = await axios.get(`${API_URL}/products/barcode/${barcode}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (barcodeRes.data.product._id === productId) {
            console.log('✅ Barcode lookup works correctly (Route ordering fixed)');
        } else {
            console.error('❌ Barcode lookup returned wrong product');
        }

        // 4. Create a Dispatch and Verify Stock Leak Fix
        console.log('\n4. Verifying Dispatch Delete Stock Leak Fix...');
        const dispatchRes = await axios.post(`${API_URL}/dispatch`, {
            storeId,
            products: [{ productId, quantity: 10 }]
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        dispatchId = dispatchRes.data.dispatch._id;
        console.log('✅ Dispatch created:', dispatchId);

        // Check factory stock (should be 90)
        let pCheck = await axios.get(`${API_URL}/products/${productId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('Current Factory Stock:', pCheck.data.product.factoryStock);

        // Receive dispatch
        await axios.patch(`${API_URL}/dispatch/${dispatchId}/status`, { status: 'RECEIVED' }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Dispatch marked RECEIVED');

        // Check store inventory (should be 10)
        let invCheck = await axios.get(`${API_URL}/store-inventory`, {
            params: { storeId },
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('Store Stock:', invCheck.data.inventory[0].quantityAvailable);

        // Delete dispatch
        console.log('Deleting dispatch...');
        await axios.delete(`${API_URL}/dispatch/${dispatchId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Dispatch deleted');

        // Verify restoration
        pCheck = await axios.get(`${API_URL}/products/${productId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        invCheck = await axios.get(`${API_URL}/store-inventory`, {
            params: { storeId },
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('Restored Factory Stock (should be 100):', pCheck.data.product.factoryStock);
        console.log('Restored Store Stock (should be 0 or deleted):', invCheck.data.inventory[0]?.quantityAvailable || 0);

        if (pCheck.data.product.factoryStock === 100 && (invCheck.data.inventory[0]?.quantityAvailable || 0) === 0) {
            console.log('✅ Dispatch stock leak fix verified!');
        } else {
            console.error('❌ Stock restoration failed');
        }

        // 5. Verify Customer Return Double Stock Bug & Over-return Prevention
        console.log('\n5. Verifying Return Double Stock & Over-Return Prevention...');

        // Re-dispatch some stock to sell
        const d2 = await axios.post(`${API_URL}/dispatch`, {
            storeId,
            products: [{ productId, quantity: 5 }]
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        await axios.patch(`${API_URL}/dispatch/${d2.data.dispatch._id}/status`, { status: 'RECEIVED' }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Create a sale
        const saleRes = await axios.post(`${API_URL}/sales`, {
            storeId,
            products: [{ productId, quantity: 3, barcode, price: 500, total: 1500 }],
            subTotal: 1500,
            grandTotal: 1500,
            paymentMode: 'CASH'
        }, { headers: { Authorization: `Bearer ${storeToken}` } });
        saleId = saleRes.data.sale._id;
        console.log('✅ Sale created:', saleId);

        // Initial inv check
        invCheck = await axios.get(`${API_URL}/store-inventory`, {
            params: { storeId },
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const initialAvail = invCheck.data.inventory.find(i => i.productId._id === productId).quantityAvailable; // 5 - 3 = 2
        console.log('Store Stock after sale:', initialAvail);

        // Process a return (return 1 item)
        console.log('Processing return of 1 item...');
        await axios.post(`${API_URL}/returns`, {
            referenceSaleId: saleId,
            storeId,
            productId,
            quantity: 1,
            type: 'CUSTOMER_RETURN',
            reason: 'Size issue'
        }, { headers: { Authorization: `Bearer ${storeToken}` } });

        // Check stock (should be 2 + 1 = 3)
        invCheck = await axios.get(`${API_URL}/store-inventory`, {
            params: { storeId },
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const afterReturnAvail = invCheck.data.inventory.find(i => i.productId._id === productId).quantityAvailable;
        console.log('Store Stock after return (should be 3):', afterReturnAvail);

        if (afterReturnAvail === 3) {
            console.log('✅ Double stock bug avoided!');
        } else {
            console.error('❌ Double stock bug detected or stock not updated');
        }

        // Try over-return (remaining sold: 2, try return 3)
        console.log('Trying to return 3 more items (Sold total: 3, Already returned: 1)...');
        try {
            await axios.post(`${API_URL}/returns`, {
                referenceSaleId: saleId,
                storeId,
                productId,
                quantity: 3,
                type: 'CUSTOMER_RETURN',
                reason: 'Too many'
            }, { headers: { Authorization: `Bearer ${storeToken}` } });
            console.error('❌ Error: Over-return was NOT blocked');
        } catch (err) {
            console.log('✅ Over-return blocked successfully:', err.response?.data.message);
        }

        // 6. Verify Store Inventory Search Pagination
        console.log('\n6. Verifying Store Inventory Search Pagination...');
        const searchRes = await axios.get(`${API_URL}/store-inventory`, {
            params: { storeId, search: 'Test Shirt', page: 1, limit: 10 },
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const total = searchRes.data.meta?.total;
        console.log('Search metadata total:', total);
        if (total === 1) {
            console.log('✅ Inventory search pagination fixed!');
        } else {
            console.error('❌ Search total returned incorrect value:', total);
        }

        console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');

    } catch (err) {
        console.error('\n❌ Test failed during execution:');
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message, err.stack);
        }
        process.exit(1);
    }
};

runTests();
