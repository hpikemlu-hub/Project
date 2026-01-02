// Test script khusus untuk menguji perubahan field biaya dari numeric ke text
const fetch = require('node-fetch');

async function testBiayaField() {
    console.log('Testing perubahan field biaya dari numeric ke text...\n');
    
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
            console.log('🔑 Token:', loginData.token);
            const token = loginData.token;
            
            // 2. Test menambah data perjalanan dinas dengan biaya text
            console.log('\n2. Testing add perjalanan dinas dengan biaya text...');
            const testData = {
                nama: 'Admininistrator',
                tujuan: 'Test Tujuan',
                perihal_perjalanan_dinas: 'Test Perihal',
                status: 'Diajukan',
                tanggal_berangkat: '2024-01-01',
                tanggal_kembali: '2024-01-02',
                biaya: 'DIPA Kementerian Kesehatan'
            };
            
            const addResponse = await fetch('http://localhost:3000/api/perjalanan-dinas/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });
            
            const addResult = await addResponse.json();
            if (addResult.success) {
                console.log('✅ Add perjalanan dinas dengan biaya text berhasil');
                console.log('📝 ID:', addResult.data.id);
                
                // 3. Test mengambil data untuk memastikan biaya text tersimpan
                console.log('\n3. Testing get perjalanan dinas data...');
                const getResponse = await fetch('http://localhost:3000/api/perjalanan-dinas/table-data', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const getResult = await getResponse.json();
                if (getResult.success) {
                    console.log('✅ Get data berhasil');
                    console.log('📊 All data:', JSON.stringify(getResult.data, null, 2));
                    const newItem = getResult.data.find(item => item.id === addResult.data.id);
                    if (newItem) {
                        console.log('💰 Biaya tersimpan:', newItem.biaya);
                        if (newItem.biaya === 'DIPA Kementerian Kesehatan') {
                            console.log('✅ Biaya text berhasil disimpan dan diambil');
                        } else {
                            console.log('❌ Biaya text tidak sesuai');
                        }
                    } else {
                        console.log('❌ Data baru tidak ditemukan');
                    }
                } else {
                    console.log('❌ Get data error:', getResult.message);
                }
                
                // 4. Test update data dengan biaya text yang berbeda
                console.log('\n4. Testing update perjalanan dinas dengan biaya text...');
                const updateData = {
                    tujuan: 'Test Tujuan Updated',
                    perihal_perjalanan_dinas: 'Test Perihal Updated',
                    status: 'Disetujui',
                    tanggal_berangkat: '2024-01-01',
                    tanggal_kembali: '2024-01-02',
                    biaya: 'DIPA APBN'
                };
                
                const updateResponse = await fetch(`http://localhost:3000/api/perjalanan-dinas/update/${addResult.data.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });
                
                const updateResult = await updateResponse.json();
                if (updateResult.success) {
                    console.log('✅ Update perjalanan dinas dengan biaya text berhasil');
                    
                    // 5. Test mengambil data lagi untuk memastikan update berhasil
                    console.log('\n5. Testing get updated data...');
                    const getUpdatedResponse = await fetch('http://localhost:3000/api/perjalanan-dinas/table-data', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    const getUpdatedResult = await getUpdatedResponse.json();
                    if (getUpdatedResult.success) {
                        console.log('✅ Get updated data berhasil');
                        console.log('📊 All updated data:', JSON.stringify(getUpdatedResult.data, null, 2));
                        const updatedItem = getUpdatedResult.data.find(item => item.id === addResult.data.id);
                        if (updatedItem) {
                            console.log('💰 Biaya updated:', updatedItem.biaya);
                            if (updatedItem.biaya === 'DIPA APBN') {
                                console.log('✅ Update biaya text berhasil');
                            } else {
                                console.log('❌ Update biaya text tidak sesuai');
                            }
                        } else {
                            console.log('❌ Data updated tidak ditemukan');
                        }
                    } else {
                        console.log('❌ Get updated data error:', getUpdatedResult.message);
                    }
                    
                    // 6. Test delete data
                    console.log('\n6. Testing delete perjalanan dinas...');
                    const deleteResponse = await fetch(`http://localhost:3000/api/perjalanan-dinas/delete/${addResult.data.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    const deleteResult = await deleteResponse.json();
                    if (deleteResult.success) {
                        console.log('✅ Delete perjalanan dinas berhasil');
                    } else {
                        console.log('❌ Delete error:', deleteResult.message);
                    }
                } else {
                    console.log('❌ Update error:', updateResult.message);
                }
            } else {
                console.log('❌ Add error:', addResult.message);
            }
        } else {
            console.log('❌ Login gagal:', loginData.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testBiayaField();