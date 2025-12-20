const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard data
router.get('/data', authenticateToken, async (req, res) => {
  const { name } = req.query;
  
  try {
    let query = supabase
      .from('workload_data')
      .select(`
        id, type, deskripsi, status, tgl_diterima, fungsi, created_at,
        users!inner(nama)
      `)
      .neq('status', 'Done')
      .order('created_at', { ascending: false });
      
    if (name && name !== 'all') {
      query = query.eq('users.nama', name);
    }
    
    const { data, error } = await query;
    
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
    
    res.json({ data: formattedData });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;