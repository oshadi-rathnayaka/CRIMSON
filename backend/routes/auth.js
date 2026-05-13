const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const requireDbConnection = require('../middleware/requireDbConnection');

const router = express.Router();

router.use(requireDbConnection);

// ─────────────────────────────────────────────────
// REGISTER ENDPOINT
// ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  console.log('[AUTH] Register attempt for email:', req.body?.email || '(none)');
  try {
    const { fullName, email, password, confirmPassword, phone, district, nationalId } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (fullName, email, password, confirmPassword)'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const normalizedPhone = String(phone || '').trim().replace(/\s+/g, '');

    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: normalizedPhone || null,
      district: district ? String(district).trim() : null,
      nationalId: nationalId ? String(nationalId).trim() : null,
    });

    await user.save();
    console.log('[AUTH] User saved to DB, id:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      district: user.district,
      nationalId: user.nationalId,
      language: user.language,
      profilePhoto: user.profilePhoto,
      privacySettings: user.privacySettings,
      settings: user.settings,
    };

    console.log('[AUTH] Registration successful for:', user.email);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error.name, '-', error.message);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────
// LOGIN ENDPOINT
// ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  console.log('[AUTH] Login attempt for email:', req.body?.email || '(none)');
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Citizen login endpoint must not authenticate officer/admin accounts.
    if (user.role !== 'citizen') {
      const role = String(user.role || '').toLowerCase();
      if (role === 'officer') {
        return res.status(403).json({
          success: false,
          message: 'Officer account detected. Please use Officer Login.'
        });
      }

      if (role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin account detected. Please use Admin Login.'
        });
      }

      return res.status(403).json({
        success: false,
        message: 'This login portal is for citizen accounts only.'
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      district: user.district,
      nationalId: user.nationalId,
      language: user.language,
      profilePhoto: user.profilePhoto,
      privacySettings: user.privacySettings,
      settings: user.settings,
      lastLogin: user.lastLogin,
    };

    console.log('[AUTH] Login successful for:', user.email);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error.name, '-', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────
// GET CURRENT USER (Protected Route)
// ─────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────
// LOGOUT ENDPOINT (Frontend handles token deletion)
// ─────────────────────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please delete the token from your client.'
  });
});

// ─────────────────────────────────────────────────
// UPDATE PROFILE (Protected)
// ─────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, phone, district, nationalId, language, profilePhoto } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const updateFields = {};
    if (fullName)    updateFields.fullName    = fullName.trim();
    if (phone  !== undefined) updateFields.phone  = phone.trim() || null;
    if (district !== undefined) updateFields.district = district || null;
    if (nationalId !== undefined) updateFields.nationalId = nationalId.trim() || null;
    if (language !== undefined) updateFields.language = language || 'English';
    if (profilePhoto !== undefined) updateFields.profilePhoto = profilePhoto || null;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      district: user.district,
      nationalId: user.nationalId,
      language: user.language,
      profilePhoto: user.profilePhoto,
      isVerified: user.isVerified,
      privacySettings: user.privacySettings,
    };

    console.log('[AUTH] Profile updated for:', user.email);
    res.status(200).json({ success: true, message: 'Profile updated successfully.', user: userResponse });
  } catch (error) {
    console.error('[AUTH] Update profile error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
});

// ─────────────────────────────────────────────────
// CHANGE PASSWORD (Protected)
// ─────────────────────────────────────────────────
router.put('/change-password', authenticate, async (req, res) => {
  try {
    if (req.user?.role === 'officer') {
      return res.status(403).json({ success: false, message: 'Officer password is managed by administrator.' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    console.log('[AUTH] Password changed for:', user.email);
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('[AUTH] Change password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to change password.', error: error.message });
  }
});

// ─────────────────────────────────────────────────
// UPDATE PRIVACY SETTINGS (Protected)
// ─────────────────────────────────────────────────
router.put('/privacy', authenticate, async (req, res) => {
  try {
    const { anonymousReporting, hideIdentity, shareData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { privacySettings: { anonymousReporting, hideIdentity, shareData } } },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    console.log('[AUTH] Privacy settings updated for:', user.email);
    res.status(200).json({ success: true, message: 'Privacy settings updated.', privacySettings: user.privacySettings });
  } catch (error) {
    console.error('[AUTH] Update privacy error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update privacy settings.', error: error.message });
  }
});

// ─────────────────────────────────────────────────
// SAVE APP SETTINGS (Protected)
// ─────────────────────────────────────────────────
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { preferences, notifications, accessibility } = req.body;

    const updateFields = {};
    if (preferences)    updateFields['settings.preferences']    = preferences;
    if (notifications)  updateFields['settings.notifications']  = notifications;
    if (accessibility)  updateFields['settings.accessibility']  = accessibility;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No settings provided.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    console.log('[AUTH] App settings saved for:', user.email);
    res.status(200).json({ success: true, message: 'Settings saved.', settings: user.settings });
  } catch (error) {
    console.error('[AUTH] Save settings error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save settings.', error: error.message });
  }
});

module.exports = router;
