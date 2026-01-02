// Test script untuk memastikan API perjalanan dinas berfungsi
const fetch = require('node-fetch');

async function testAPI() {
    console.log('Testing API Perjalanan Dinas...\n');
    
    // 1. Test login untuk mendapatkan token
    console.log('1. Testing login...');
    try {
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        if (loginData.success) {
            console.log('✅ Login berhasil');
            console.log('👤 User:', loginData.user.nama);
            const token = loginData.token;
            
            // 2. Test endpoint data dengan token
            console.log('\n2. Testing /api/perjalanan-dinas/data...');
            const dataResponse = await fetch('http://localhost:3000/api/perjalanan-dinas/data', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const dataResult = await dataResponse.json();
            if (dataResult.success) {
                console.log('✅ Data endpoint berhasil');
                console.log('👥 Users found:', dataResult.users.length);
            } else {
                console.log('❌ Data endpoint error:', dataResult.message);
            }
            
            // 3. Test endpoint table-data
            console.log('\n3. Testing /api/perjalanan-dinas/table-data...');
            const tableResponse = await fetch('http://localhost:3000/api/perjalanan-dinas/table-data', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const tableResult = await tableResponse.json();
            if (tableResult.success) {
                console.log('✅ Table data endpoint berhasil');
                console.log('📊 Records found:', tableResult.data.length);
            } else {
                console.log('❌ Table data endpoint error:', tableResult.message);
            }
            
        } else {
            console.log('❌ Login gagal:', loginData.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testAPI();