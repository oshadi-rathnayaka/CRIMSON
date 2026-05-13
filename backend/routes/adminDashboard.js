const express = require('express');
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

const relativeTime = (value) => {
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return 'just now';

  const diffMs = Date.now() - ts;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const initialsFromName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const colorFromRole = (role) => {
  const normalized = String(role || 'system').toLowerCase();
  if (normalized === 'admin') return '#2563eb';
  if (normalized === 'officer') return '#10b981';
  if (normalized === 'citizen') return '#6b7280';
  return '#9ca3af';
};

const classifyAlert = (log) => {
  const text = `${log.action || ''} ${log.detail || ''}`.toLowerCase();
  if (text.includes('failed') || text.includes('unauthorized') || text.includes('blocked')) {
    return {
      level: 'critical',
      tag: 'CRITICAL WARNING',
      icon: 'lock',
    };
  }

  return {
    level: 'warning',
    tag: 'SUSPICIOUS ACTIVITY',
    icon: 'warning',
  };
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, activeOfficers, totalReports, auditLogs] = await Promise.all([
      User.countDocuments({ role: 'citizen', isActive: true }),
      User.countDocuments({ role: 'officer', isActive: true }),
      Report.countDocuments({}),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    const systemUptime = 99.98;

    const securityAlerts = auditLogs
      .filter((log) => log.status === 'error')
      .slice(0, 3)
      .map((log, index) => {
        const alertMeta = classifyAlert(log);
        return {
          id: index + 1,
          level: alertMeta.level,
          tag: alertMeta.tag,
          title: log.action || 'Security Event',
          desc: log.detail || (log.ipAddress ? `Source IP: ${log.ipAddress}` : 'Security event detected.'),
          icon: alertMeta.icon,
        };
      });

    const activityLog = auditLogs
      .filter((log) => log.status === 'success')
      .slice(0, 4)
      .map((log, index) => ({
        id: index + 1,
        avatar: initialsFromName(log.actorName),
        avatarColor: colorFromRole(log.actorRole),
        name: log.actorName || 'System',
        action: String(log.action || 'performed an update').toLowerCase(),
        time: relativeTime(log.createdAt),
        category: log.actorRole ? String(log.actorRole).toUpperCase() : 'SYSTEM',
      }));

    return res.status(200).json({
      success: true,
      data: {
        stats: [
          {
            icon: 'users',
            label: 'Total Registered Users',
            value: totalUsers.toLocaleString('en-US'),
            delta: '+2.4%',
            positive: true,
          },
          {
            icon: 'shield',
            label: 'Active Police Officers',
            value: activeOfficers.toLocaleString('en-US'),
            delta: '+1.2%',
            positive: true,
          },
          {
            icon: 'alert',
            label: 'Total Crime Reports',
            value: totalReports.toLocaleString('en-US'),
            delta: '+0.8%',
            positive: false,
          },
          {
            icon: 'server',
            label: 'System Uptime',
            value: `${systemUptime}%`,
            delta: '+0.01%',
            positive: true,
          },
        ],
        securityAlerts,
        activityLog,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: {
        stats: [
          {
            icon: 'users',
            label: 'Total Registered Users',
            value: '0',
            delta: '+0%',
            positive: true,
          },
          {
            icon: 'shield',
            label: 'Active Police Officers',
            value: '0',
            delta: '+0%',
            positive: true,
          },
          {
            icon: 'alert',
            label: 'Total Crime Reports',
            value: '0',
            delta: '+0%',
            positive: false,
          },
          {
            icon: 'server',
            label: 'System Uptime',
            value: '99.98%',
            delta: '+0.01%',
            positive: true,
          },
        ],
        securityAlerts: [],
        activityLog: [],
      },
      fallback: true,
      updatedAt: new Date().toISOString(),
    });
  }
});

module.exports = router;
