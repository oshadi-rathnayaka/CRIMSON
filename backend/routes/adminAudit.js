const express = require('express');
const authenticate = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

const hashToColor = (value = '') => {
  const palette = ['#2563eb', '#0ea5e9', '#10b981', '#f97316', '#6366f1', '#f43f5e', '#14b8a6', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
};

const initialsFromName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const formatTimestamp = (dateValue) => {
  const date = new Date(dateValue);
  const dateText = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const timeText = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  }).format(date);

  return { dateText, timeText };
};

const roleLabel = (role) => {
  const normalized = String(role || 'system').toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'officer') return 'OFFICER';
  if (normalized === 'citizen') return 'CITIZEN';
  return 'SYSTEM';
};

const roleClass = (role) => {
  const normalized = String(role || 'system').toLowerCase();
  if (normalized === 'admin') return 'role--admin';
  if (normalized === 'officer') return 'role--officer';
  if (normalized === 'citizen') return 'role--citizen';
  return 'role--system';
};

const actionClass = (status) => (status === 'error' ? 'action--error' : '');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureSeedLogs = async () => {
  const count = await AuditLog.countDocuments();
  if (count > 0) return;

  await AuditLog.insertMany([
    {
      actorName: 'System Administrator',
      actorRole: 'admin',
      action: 'Modified Case File',
      detail: "Field updated: 'Evidence Description'",
      caseRef: '#4402-CMB',
      ipAddress: '192.168.1.45',
      status: 'success',
    },
    {
      actorName: 'Sgt. Silva A.',
      actorRole: 'officer',
      action: 'Accessed Evidence Locker',
      detail: "Item: 'Electronic Device Locker B-4'",
      ipAddress: '10.0.4.122',
      status: 'success',
    },
    {
      actorName: 'System (Automated)',
      actorRole: 'system',
      action: 'Failed Login Attempt',
      detail: "Target User: 'lt_admin_01'. Max attempts reached",
      ipAddress: '202.45.1.88',
      status: 'error',
    },
  ]);
};

router.get('/list', authenticate, requireAdmin, async (req, res) => {
  try {
    await ensureSeedLogs();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const role = String(req.query.role || '').toLowerCase();
    const actionType = String(req.query.actionType || '').trim();
    const status = String(req.query.status || '').toLowerCase();
    const search = String(req.query.search || '').trim();
    const from = req.query.from;
    const to = req.query.to;

    const query = {};

    if (role && role !== 'all roles') {
      query.actorRole = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (actionType && actionType.toLowerCase() !== 'all action types') {
      query.action = new RegExp(`^${escapeRegex(actionType)}$`, 'i');
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { actorName: searchRegex },
        { action: searchRegex },
        { detail: searchRegex },
        { caseRef: searchRegex },
        { ipAddress: searchRegex },
      ];
    }

    const [logs, total, actionTypes] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
      AuditLog.distinct('action', {}),
    ]);

    const formattedLogs = logs.map((log) => {
      const { dateText, timeText } = formatTimestamp(log.createdAt);
      const label = roleLabel(log.actorRole);
      return {
        id: String(log._id),
        timestamp: dateText,
        time: timeText,
        initials: initialsFromName(log.actorName),
        color: hashToColor(`${log.actorName}:${log.actorRole}`),
        user: log.actorName,
        role: label,
        roleClass: roleClass(log.actorRole),
        action: log.action,
        caseRef: log.caseRef,
        detail: log.detail,
        ip: log.ipAddress || 'N/A',
        status: log.status,
        actionClass: actionClass(log.status),
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        logs: formattedLogs,
        actionTypes: actionTypes.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
