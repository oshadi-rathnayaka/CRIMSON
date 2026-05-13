const express      = require('express');
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const authenticate = require('../middleware/auth');
const requireDbConnection = require('../middleware/requireDbConnection');

const router = express.Router();

router.use(requireDbConnection);

// ── Role guard: admin only ───────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  console.log('[ADMIN] Login attempt:', req.body?.email || '(none)');
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include the password field (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Must be an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin accounts only.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    console.log('[ADMIN] Login successful:', user.email);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: _sanitize(user),
    });
  } catch (error) {
    console.error('[ADMIN] Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: _sanitize(user) });
  } catch (error) {
    console.error('[ADMIN] /me error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/auth/profile  (protected)
// Body: { fullName, email, phone, district }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fullName, email, phone, district } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (fullName !== undefined) {
      const trimmed = String(fullName).trim();
      if (trimmed.length < 2) return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters' });
      user.fullName = trimmed;
    }
    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return res.status(400).json({ success: false, message: 'Invalid email address' });
      const conflict = await User.findOne({ email: trimmed, _id: { $ne: user._id } });
      if (conflict) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = trimmed;
    }
    if (phone !== undefined) user.phone = String(phone).trim() || null;
    if (district !== undefined) user.district = String(district).trim() || null;

    await user.save({ validateBeforeSave: true });
    console.log('[ADMIN] Profile updated:', user.email);
    res.status(200).json({ success: true, message: 'Profile updated successfully', user: _sanitize(user) });
  } catch (error) {
    console.error('[ADMIN] profile update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/auth/change-password  (protected)
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/change-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must differ from current password' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    console.log('[ADMIN] Password changed:', user.email);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[ADMIN] change-password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/auth/logout  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, requireAdmin, (req, res) => {
  // JWT is stateless; client should discard the token.
  console.log('[ADMIN] Logout:', req.user?.email);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper — strip password from response
// ─────────────────────────────────────────────────────────────────────────────
function _sanitize(user) {
  return {
    _id:        user._id,
    fullName:   user.fullName,
    email:      user.email,
    role:       user.role,
    phone:      user.phone,
    district:   user.district,
    isVerified: user.isVerified,
    createdAt:  user.createdAt,
    lastLogin:  user.lastLogin,
  };
}

module.exports = router;
