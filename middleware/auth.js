const { verifyToken } = require('../config/auth');
const { supabase } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    // Check if token is in revoked_tokens table
    const { data: revokedToken, error } = await supabase
      .from('revoked_tokens')
      .select('id')
      .eq('token_hash', hashToken(token))
      .single();

    if (revokedToken) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const hashToken = (token) => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = { authenticateToken, hashToken };