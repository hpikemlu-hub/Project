const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all data for input form
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

    // Get unique types, statuses, and functions for dropdowns
    const { data: workloadData, error: dataError } = await supabase
      .from('workload_data')
      .select('type, status, fungsi');

    if (dataError) {
      return res.status(500).json({ error: dataError.message });
    }

    // Extract unique values
    const types = [...new Set(workloadData.map(item => item.type).filter(Boolean))];
    const statuses = [...new Set(workloadData.map(item => item.status).filter(Boolean))];
    const fungsi = [...new Set(workloadData.map(item => item.fungsi).filter(Boolean))];

    res.json({ 
      users: users.map(user => ({ id: user.id, nama: user.nama })),
      dropdownOptions: {
        Type: types,
        Status: statuses,
        Fungsi: fungsi
      }
    });
  } catch (error) {
    console.error('Error fetching input data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get paginated data for the table
router.get('/table-data', authenticateToken, async (req, res) => {
  const { page = 1, limit = 10, search = '', type = '', status = '', name = '' } = req.query;
  
  try {
    let query = supabase
      .from('workload_data')
      .select(`
        id, type, deskripsi, status, tgl_diterima, fungsi, created_at,
        users!inner(nama)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike('deskripsi', `%${search}%`);
    }
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
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
      type: item.type,
      deskripsi: item.deskripsi,
      status: item.status,
      tgl_diterima: item.tgl_diterima,
      fungsi: item.fungsi
    }));

    res.json({ 
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add new data
router.post('/add', authenticateToken, async (req, res) => {
  const { nama, type, deskripsi, status, tgl_diterima, fungsi } = req.body;
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

    const { data, error } = await supabase
      .from('workload_data')
      .insert([{
        user_id: targetUserId,
        type,
        deskripsi,
        status,
        tgl_diterima,
        fungsi
      }])
      .select();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Data berhasil ditambahkan!', data: data[0] });
  } catch (error) {
    console.error('Error adding data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update existing data
router.put('/update/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, deskripsi, status, tgl_diterima, fungsi } = req.body;
  const userId = req.user.userId;

  try {
    // Check if the current user can update this data
    const { data: workload, error } = await supabase
      .from('workload_data')
      .select('user_id')
      .eq('id', id)
      .single();

    if (error || !workload) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    // Check if user is admin or owner of the data
    if (req.user.role !== 'Admin' && workload.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { data, error: updateError } = await supabase
      .from('workload_data')
      .update({
        type,
        deskripsi,
        status,
        tgl_diterima,
        fungsi,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (updateError) {
      return res.status(500).json({ success: false, message: updateError.message });
    }

    res.json({ success: true, message: 'Data berhasil diperbarui!', data: data[0] });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete data
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Check if the current user can delete this data
    const { data: workload, error } = await supabase
      .from('workload_data')
      .select('user_id')
      .eq('id', id)
      .single();

    if (error || !workload) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    // Check if user is admin or owner of the data
    if (req.user.role !== 'Admin' && workload.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { error: deleteError } = await supabase
      .from('workload_data')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    res.json({ success: true, message: 'Data berhasil dihapus!' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;