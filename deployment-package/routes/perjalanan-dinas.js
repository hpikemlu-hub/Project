const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all data for dropdowns
router.get('/data', authenticateToken, async (req, res) => {
  try {
    // Get all users for the dropdown
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nama')
      .order('nama', { ascending: true });

    if (usersError) {
      return res.status(500).json({ error: usersError.message });
    }

    res.json({
      success: true,
      users: users.map(user => ({ id: user.id, nama: user.nama }))
    });
  } catch (error) {
    console.error('Error fetching perjalanan dinas data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get paginated data for the table
router.get('/table-data', authenticateToken, async (req, res) => {
  const { page = 1, limit = 10, search = '', status = '', transportasi = '', name = '' } = req.query;
  
  try {
    let query = supabase
      .from('perjalanan_dinas')
      .select(`
          id, nama_pegawai, tujuan, tanggal_berangkat, tanggal_kembali, status,
          jenis_transportasi, biaya, keterangan, created_at,
          users!inner(nama)
        `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`tujuan.ilike.%${search}%,keterangan.ilike.%${search}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (transportasi && transportasi !== 'all') {
      query = query.eq('jenis_transportasi', transportasi);
    }
    if (name && name !== 'all') {
      query = query.eq('users.nama', name);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formattedData = data.map(item => ({
      id: item.id,
      nama: item.users.nama,
      nama_pegawai: item.nama_pegawai,
      tujuan: item.tujuan,
      perihal_perjalanan_dinas: item.tujuan, // Use tujuan as perihal_perjalanan_dinas for compatibility
      tanggal_berangkat: item.tanggal_berangkat,
      tanggal_kembali: item.tanggal_kembali,
      status: item.status,
      jenis_transportasi: item.jenis_transportasi,
      biaya: item.biaya,
      keterangan: item.keterangan
    }));

    res.json({ 
      success: true,
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching perjalanan dinas table data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add new data
router.post('/add', authenticateToken, async (req, res) => {
  const { nama, tujuan, perihal_perjalanan_dinas, status, tanggal_berangkat, tanggal_kembali, biaya } = req.body;
  const userId = req.user.userId; // From JWT token

  try {
    // Get user ID from nama if admin, otherwise use current user ID
    let targetUserId = userId;
    if (req.user.role === 'Admin' && nama) {
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('nama', nama)
        .single();
      
      if (error) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }
      targetUserId = user.id;
    } else if (req.user.role === 'User') {
      // For regular users, ensure they're only adding data for themselves
      const { data: currentUser, error } = await supabase
        .from('users')
        .select('id, nama')
        .eq('id', userId)
        .single();
      
      if (error || !currentUser) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      // Override nama to be the current user's name
      nama = currentUser.nama;
      targetUserId = currentUser.id;
    }

    console.log('Insert data:', {
      user_id: targetUserId,
      nama_pegawai: nama,
      tujuan: tujuan || perihal_perjalanan_dinas,
      status,
      tanggal_berangkat,
      tanggal_kembali,
      biaya: biaya || null
    });

    const { data, error } = await supabase
      .from('perjalanan_dinas')
      .insert([{
        user_id: targetUserId,
        nama_pegawai: nama,
        tujuan: tujuan || perihal_perjalanan_dinas,
        status,
        tanggal_berangkat,
        tanggal_kembali,
        biaya: biaya || null
      }])
      .select();

    console.log('Insert result:', { data, error });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Data perjalanan dinas berhasil ditambahkan!', data: data[0] });
  } catch (error) {
    console.error('Error adding perjalanan dinas data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update existing data
router.put('/update/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tujuan, perihal_perjalanan_dinas, status, tanggal_berangkat, tanggal_kembali, biaya } = req.body;
  const userId = req.user.userId;

  try {
    // Check if the current user can update this data
    const { data: perjalanan, error } = await supabase
      .from('perjalanan_dinas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (error || !perjalanan) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    // Check if user is admin or owner of the data
    if (req.user.role !== 'Admin' && perjalanan.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { data, error: updateError } = await supabase
      .from('perjalanan_dinas')
      .update({
        tujuan: tujuan || perihal_perjalanan_dinas,
        status,
        tanggal_berangkat,
        tanggal_kembali,
        biaya: biaya || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    res.json({ success: true, message: 'Data perjalanan dinas berhasil diperbarui!', data: data[0] });
  } catch (error) {
    console.error('Error updating perjalanan dinas data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete data
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Check if the current user can delete this data
    const { data: perjalanan, error } = await supabase
      .from('perjalanan_dinas')
      .select('user_id')
      .eq('id', id)
      .single();

    if (error || !perjalanan) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    // Check if user is admin or owner of the data
    if (req.user.role !== 'Admin' && perjalanan.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { error: deleteError } = await supabase
      .from('perjalanan_dinas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    res.json({ success: true, message: 'Data perjalanan dinas berhasil dihapus!' });
  } catch (error) {
    console.error('Error deleting perjalanan dinas data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;