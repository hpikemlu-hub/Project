const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all employee data
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only Admin can access all employee data
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengakses data pegawai.' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, pegawai_id, nama, nip, golongan, jabatan, username, role, is_active, created_at, updated_at')
      .order('nama', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current user's profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, pegawai_id, nama, nip, golongan, jabatan, username, role, is_active, created_at, updated_at')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employee data by ID (only for Admin or self)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user is requesting their own data or is admin
    if (req.user.userId !== id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, pegawai_id, nama, nip, golongan, jabatan, username, role, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add new employee (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat menambah pegawai.' });
  }

  const { nama, nip, golongan, jabatan, username, password, role } = req.body;

  try {
    // Hash the password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate unique employee ID
    const pegawaiId = `PEG_${Date.now()}`;

    const { data, error } = await supabase
      .from('users')
      .insert([{
        pegawai_id: pegawaiId,
        nama,
        nip,
        golongan,
        jabatan,
        username,
        password_hash: passwordHash,
        role: role || 'User',
        is_active: true
      }])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ success: false, message: 'Username atau NIP sudah digunakan.' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Pegawai baru berhasil ditambahkan.', data: data[0] });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update employee data (Admin can update anyone, Users can only update their own)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama, nip, golongan, jabatan, username, password, role, is_active } = req.body;

  try {
    // Check if user can update this employee
    if (req.user.role !== 'Admin' && req.user.userId !== id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Anda hanya bisa mengubah profil sendiri.' });
    }

    // For non-admins, restrict which fields they can update
    let updateFields = {};
    if (req.user.role === 'Admin') {
      // Admin can update all fields
      updateFields = { nama, nip, golongan, jabatan, username, role, is_active };
      if (password && password.trim() !== '') {
        const bcrypt = require('bcryptjs');
        updateFields.password_hash = await bcrypt.hash(password, 10);
      }
    } else {
      // Regular user can only update nama and password
      updateFields = { nama };
      if (password && password.trim() !== '') {
        const bcrypt = require('bcryptjs');
        updateFields.password_hash = await bcrypt.hash(password, 10);
      }
    }

    // Prevent users from changing username (for security)
    if (req.user.role !== 'Admin' && username) {
      return res.status(403).json({ success: false, message: 'Username tidak dapat diubah.' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ success: false, message: 'Username atau NIP sudah digunakan.' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Data pegawai berhasil diperbarui.', data: data[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete employee (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat menghapus pegawai.' });
  }

  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Pegawai berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;