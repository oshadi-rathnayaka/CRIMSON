const express = require('express');
const authenticate = require('../middleware/auth');
const RolePermission = require('../models/RolePermission');

const router = express.Router();

const ROLES = ['citizen', 'officer', 'admin'];

const PERMISSIONS = [
  {
    id: 'viewPublicReports',
    defaults: { citizen: true, officer: true, admin: true },
  },
  {
    id: 'editUpdateCases',
    defaults: { citizen: false, officer: true, admin: true },
  },
  {
    id: 'accessCrimeAnalytics',
    defaults: { citizen: false, officer: true, admin: true },
  },
  {
    id: 'exportSystemData',
    defaults: { citizen: false, officer: false, admin: true },
  },
  {
    id: 'manageSystemUsers',
    defaults: { citizen: false, officer: false, admin: true },
  },
  {
    id: 'viewAuditLogs',
    defaults: { citizen: false, officer: false, admin: true },
  },
];

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

const buildDefaultMatrix = () => {
  const matrix = {};
  PERMISSIONS.forEach((p) => {
    matrix[p.id] = { ...p.defaults };
  });
  return matrix;
};

const normalizeMatrix = (rawMatrix = {}) => {
  const normalized = {};

  PERMISSIONS.forEach((permission) => {
    normalized[permission.id] = {};
    ROLES.forEach((role) => {
      const incoming = rawMatrix?.[permission.id]?.[role];
      if (typeof incoming === 'boolean') {
        normalized[permission.id][role] = incoming;
      } else {
        normalized[permission.id][role] = permission.defaults[role];
      }
    });
  });

  return normalized;
};

router.get('/matrix', authenticate, requireAdmin, async (req, res) => {
  try {
    const current = await RolePermission.findOne().sort({ updatedAt: -1 }).lean();
    const matrix = normalizeMatrix(current?.matrix || buildDefaultMatrix());

    return res.status(200).json({
      success: true,
      data: {
        matrix,
        updatedAt: current?.updatedAt || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions matrix' });
  }
});

router.put('/matrix', authenticate, requireAdmin, async (req, res) => {
  try {
    const incomingMatrix = req.body?.matrix;
    if (!incomingMatrix || typeof incomingMatrix !== 'object') {
      return res.status(400).json({ success: false, message: 'A valid matrix object is required.' });
    }

    const matrix = normalizeMatrix(incomingMatrix);
    const updated = await RolePermission.findOneAndUpdate(
      {},
      {
        matrix,
        updatedBy: req.user?.id || null,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully.',
      data: {
        matrix: updated.matrix,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save permissions matrix' });
  }
});

router.post('/matrix/reset', authenticate, requireAdmin, async (req, res) => {
  try {
    const matrix = buildDefaultMatrix();
    const updated = await RolePermission.findOneAndUpdate(
      {},
      {
        matrix,
        updatedBy: req.user?.id || null,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Permissions reset to defaults.',
      data: {
        matrix: updated.matrix,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset permissions matrix' });
  }
});

module.exports = router;
