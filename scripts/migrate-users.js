const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Mock data from Google Sheets PEGAWAI_DB
const usersToMigrate = [
  {
    pegawai_id: 'PEG_ADMIN001',
    nama: 'Admin',
    nip: 'ADMIN001',
    golongan: 'IV/a',
    jabatan: 'Administrator',
    username: 'admin',
    password: 'admin123', // Will be hashed
    role: 'Admin'
  },
  {
    pegawai_id: 'PEG_USER001', 
    nama: 'John Doe',
    nip: '123456789',
    golongan: 'III/a',
    jabatan: 'Staff',
    username: 'johndoe',
    password: 'user123',
    role: 'User'
  }
  // ... add more users
];

async function migrateUsers() {
  for (const user of usersToMigrate) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    
    const { data, error } = await supabase.from('users').insert({
      pegawai_id: user.pegawai_id,
      nama: user.nama,
      nip: user.nip,
      golongan: user.golongan,
      jabatan: user.jabatan,
      username: user.username,
      password_hash: passwordHash,
      role: user.role
    });
    
    if (error) {
      console.error(`Error migrating ${user.username}:`, error);
    } else {
      console.log(`Successfully migrated ${user.username}`);
    }
  }
}

migrateUsers();