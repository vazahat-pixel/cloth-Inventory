const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing Admin Login...');
        const adminRes = await axios.post('http://localhost:5000/api/auth/admin/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        console.log('✅ Admin Login Success! Token:', adminRes.data.token.substring(0, 10) + '...');

        console.log('\nTesting Store Login...');
        const storeRes = await axios.post('http://localhost:5000/api/auth/store/login', {
            email: 'store@test.com',
            password: 'store123'
        });
        console.log('✅ Store Login Success! Token:', storeRes.data.token.substring(0, 10) + '...');

    } catch (err) {
        console.error('❌ Login Failed:', err.response?.data?.message || err.message);
    }
}

testLogin();
