const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');
const { generateToken, comparePassword } = require('../config/auth');
const { authenticateToken, hashToken } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();
      
    if (error || !user || !await comparePassword(password, user.password_hash)) {
      return res.json({ success: false, message: 'Username atau password salah' });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id, 
      username: user.username, 
      role: user.role 
    });
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        nama: user.nama, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Add token to blacklist
    const { error } = await supabase.from('revoked_tokens').insert({
      token_hash: hashToken(req.token),
      expires_at: new Date(Date.now() + 24*60*60*1000) // 24 hours
    });
    
    if (error) {
      console.error('Logout error:', error);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;