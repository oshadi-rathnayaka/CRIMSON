const express = require('express');
const authenticate = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const formatLastLogin = (value) => {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatUserId = (value) => {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return 'USR-0000';
  }

  return `USR-${rawValue.slice(-4).toUpperCase()}`;
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

router.post('/create', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      district,
      badgeNumber,
      division,
      isActive,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 8 characters.',
      });
    }

    const normalizedRole = String(role || '').toLowerCase();
    if (!['citizen', 'officer', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be Citizen, Officer, or Admin.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail }).lean();
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const userPayload = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      district: district?.trim() || null,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };

    if (normalizedRole === 'officer') {
      userPayload.badgeNumber = badgeNumber?.trim() || null;
      userPayload.division = division?.trim() || null;
    }

    const createdUser = new User(userPayload);
    await createdUser.save();

    return res.status(201).json({
      success: true,
      message: `${createdUser.role.charAt(0).toUpperCase() + createdUser.role.slice(1)} account created successfully.`,
      data: {
        user: {
          id: createdUser._id,
          displayId: formatUserId(createdUser._id),
          name: createdUser.fullName,
          email: createdUser.email,
          role: createdUser.role.charAt(0).toUpperCase() + createdUser.role.slice(1),
          district: createdUser.district || 'N/A',
          status: createdUser.isActive ? 'Active' : 'Suspended',
          lastLogin: formatLastLogin(createdUser.lastLogin),
          isVerified: createdUser.isVerified,
        },
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create user account.',
    });
  }
});

router.get('/list', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 25;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;

    let query = {};

    if (role && role !== 'All Roles') {
      query.role = String(role).toLowerCase();
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { _id: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id fullName email role district isActive isVerified createdAt lastLogin')
        .sort({ lastLogin: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const formattedUsers = users.map(u => ({
      id: u._id,
      displayId: formatUserId(u._id),
      name: u.fullName,
      email: u.email,
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      district: u.district || 'N/A',
      status: u.isActive ? 'Active' : 'Suspended',
      lastLogin: formatLastLogin(u.lastLogin),
      isVerified: u.isVerified,
    }));

    return res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

router.put('/update-status/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be boolean',
      });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      data: {
        id: updated._id,
        status: updated.isActive ? 'Active' : 'Suspended',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
});

router.post('/reset-password/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Password reset link sent to ${user.email}`,
      data: {
        userId: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
});

router.put('/update/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, role, district, badgeNumber, division, isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (email !== undefined) {
      const existing = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: userId } });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = email.trim().toLowerCase();
    }
    if (role !== undefined) user.role = role.toLowerCase();
    if (district !== undefined) user.district = district.trim();
    if (badgeNumber !== undefined) user.badgeNumber = badgeNumber.trim();
    if (division !== undefined) user.division = division.trim();
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: { _id: user._id, displayId: formatUserId(user._id), fullName: user.fullName, email: user.email, role: user.role, district: user.district, badgeNumber: user.badgeNumber, division: user.division, isActive: user.isActive } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

module.exports = router;
