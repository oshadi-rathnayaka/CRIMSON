const express      = require('express');
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const authenticate = require('../middleware/auth');
const requireDbConnection = require('../middleware/requireDbConnection');

const router = express.Router();

router.use(requireDbConnection);

// ── Role guard: officer only ─────────────────────────────────────────────────
const requireOfficer = (req, res, next) => {
  if (req.user?.role !== 'officer') {
    return res.status(403).json({ success: false, message: 'Access denied. Officer accounts only.' });
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/officer/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  console.log('[OFFICER] Login attempt:', req.body?.email || '(none)');
  try {
    const { email, password, fullName, district } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Must be an officer
    if (user.role !== 'officer') {
      return res.status(403).json({ success: false, message: 'Access denied. Officer accounts only.' });
    }

    // Check if account is suspended
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact your administrator.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify fullName if provided
    if (fullName && user.fullName.toLowerCase() !== fullName.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Full name does not match records' });
    }

    // Verify district if provided
    if (district && user.district && user.district.toLowerCase() !== district.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'District does not match records' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, district: user.district },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    console.log('[OFFICER] Login successful:', user.email);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: _sanitize(user),
    });
  } catch (error) {
    console.error('[OFFICER] Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/officer/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, requireOfficer, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: _sanitize(user) });
  } catch (error) {
    console.error('[OFFICER] /me error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/officer/auth/logout  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, requireOfficer, (req, res) => {
  // JWT is stateless; client should discard the token.
  console.log('[OFFICER] Logout:', req.user?.email);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/officer/auth/profile  (protected)
// Officers can update only name, district, and profile picture.
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', authenticate, requireOfficer, async (req, res) => {
  try {
    const updateFields = {};

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'fullName')) {
      const value = String(req.body.fullName || '').trim();
      if (!value) {
        return res.status(400).json({ success: false, message: 'Full name is required.' });
      }
      updateFields.fullName = value;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'district')) {
      const value = String(req.body.district || '').trim();
      updateFields.district = value || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'profilePhoto')) {
      const value = req.body.profilePhoto;
      updateFields.profilePhoto = value ? String(value) : null;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: _sanitize(user),
    });
  } catch (error) {
    console.error('[OFFICER] /profile update error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper — strip password from response
// ─────────────────────────────────────────────────────────────────────────────
function _sanitize(user) {
  return {
    _id:         user._id,
    fullName:    user.fullName,
    email:       user.email,
    role:        user.role,
    district:    user.district,
    badgeNumber: user.badgeNumber,
    division:    user.division,
    isActive:    user.isActive,
    phone:       user.phone,
    profilePhoto:user.profilePhoto,
    settings:    user.settings,
    isVerified:  user.isVerified,
    createdAt:   user.createdAt,
    lastLogin:   user.lastLogin,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/officer/auth/settings  (Protected)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { preferences, notifications, accessibility } = req.body;
    const updateFields = {};
    if (preferences)   updateFields['settings.preferences']   = preferences;
    if (notifications) updateFields['settings.notifications'] = notifications;
    if (accessibility) updateFields['settings.accessibility'] = accessibility;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No settings provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({ success: true, message: 'Settings saved.', settings: user.settings });
  } catch (error) {
    console.error('[OFFICER] Save settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save settings.', error: error.message });
  }
});

module.exports = router;
