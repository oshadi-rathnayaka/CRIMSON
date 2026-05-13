const express    = require('express');
const authenticate = require('../middleware/auth');
const Report     = require('../models/Report');
const SosAlert   = require('../models/SosAlert');

const router = express.Router();

const KNOWN_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha',
  'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala',
  'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const inferDistrict = (address) => {
  const raw = String(address || '').trim();
  if (!raw) return 'Unknown';
  const normalized = raw.replace(/\bdistrict\b/ig, '').trim().toLowerCase();
  const direct = KNOWN_DISTRICTS.find((d) => d.toLowerCase() === normalized);
  if (direct) return direct;
  const partial = KNOWN_DISTRICTS.find((d) => normalized.includes(d.toLowerCase()));
  if (partial) return partial;
  const first = raw.split(',')[0]?.trim();
  return first || 'Unknown';
};

const riskFromIncidents = (n) => {
  if (n >= 20) return 'CRITICAL';
  if (n >= 10) return 'HIGH';
  if (n >= 5) return 'MEDIUM';
  return 'LOW';
};

const formatRelativeTime = (date) => {
  const ts = new Date(date).getTime();
  if (!ts) return 'Updated recently';
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 60) return `Updated: ${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Updated: ${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `Updated: ${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
};

const mapSosToReportStatus = (sosStatus) => {
  if (sosStatus === 'assigned') return 'assigned';
  if (sosStatus === 'resolved') return 'resolved';
  if (sosStatus === 'cancelled') return 'closed';
  return 'submitted';
};

const mapReportToSosStatus = (reportStatus) => {
  if (reportStatus === 'assigned') return 'assigned';
  if (reportStatus === 'resolved') return 'resolved';
  if (reportStatus === 'closed') return 'cancelled';
  return 'active';
};

const buildSosStatusUpdate = (reportStatus) => {
  const sosStatus = mapReportToSosStatus(reportStatus);
  return {
    status: sosStatus,
    ...(sosStatus === 'cancelled' ? { cancelledAt: new Date() } : {}),
    ...(sosStatus === 'resolved' ? { resolvedAt: new Date() } : {}),
  };
};

const toSosReportShape = (alert) => ({
  _id: alert._id,
  caseId: alert.caseId,
  userId: alert.userId,
  category: 'SOS',
  description: 'Emergency SOS alert from citizen',
  location: {
    address: alert.location?.address || 'Unknown',
    latitude: alert.location?.latitude || null,
    longitude: alert.location?.longitude || null,
  },
  files: [],
  status: mapSosToReportStatus(alert.status),
  submittedAt: alert.activatedAt || alert.createdAt || new Date(),
  createdAt: alert.createdAt,
  updatedAt: alert.updatedAt,
});

// ── Role guard: officer/admin only ───────────────────────────────────────────
const requireOfficer = (req, res, next) => {
  if (req.user?.role !== 'officer' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Officer accounts only.' });
  }
  next();
};

// GET /api/reports/officer-stats  (officer/admin — dashboard summary cards)
router.get('/officer-stats', authenticate, requireOfficer, async (req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalReports,
      assignedCases,
      submittedCount,
      underReviewCount,
      resolvedCount,
      closedCount,
      solvedThisMonth,
      sosTotal,
      sosActive,
      sosAssigned,
      sosResolvedThisMonth,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'assigned' }),
      Report.countDocuments({ status: 'submitted' }),
      Report.countDocuments({ status: 'under_review' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'closed' }),
      Report.countDocuments({
        status: { $in: ['resolved', 'closed'] },
        updatedAt: { $gte: monthStart },
      }),
      SosAlert.countDocuments(),
      SosAlert.countDocuments({ status: 'active' }),
      SosAlert.countDocuments({ status: 'assigned' }),
      SosAlert.countDocuments({
        status: { $in: ['resolved', 'cancelled'] },
        updatedAt: { $gte: monthStart },
      }),
    ]);

    const totalCombined = totalReports + sosTotal;

    const pendingReports = submittedCount + underReviewCount + sosActive + sosAssigned;
    const solvedReports = resolvedCount + closedCount;
    const underInvestigation = underReviewCount + assignedCases + sosActive + sosAssigned;
    const highPriorityCount = submittedCount + underReviewCount + assignedCases + sosActive + sosAssigned;
    const clearanceRate = totalCombined > 0
      ? Math.round(((solvedReports + sosResolvedThisMonth) / totalCombined) * 100)
      : 0;

    // Simple operational risk heuristic based on unresolved workload ratio.
    const unresolvedRatio = totalCombined > 0
      ? Math.round(((pendingReports + assignedCases) / totalCombined) * 100)
      : 0;

    const patrolRisk = unresolvedRatio >= 60
      ? 'High'
      : unresolvedRatio >= 30
        ? 'Medium'
        : 'Low';

    res.json({
      success: true,
      data: {
        assignedCases: assignedCases + sosAssigned,
        pendingReports,
        patrolRisk,
        clearanceRate,
        totalReports: totalCombined,
        underInvestigation,
        solvedThisMonth: solvedThisMonth + sosResolvedThisMonth,
        highPriorityCount,
      },
    });
  } catch (error) {
    console.error('[REPORT] Officer stats error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch officer dashboard stats' });
  }
});

// GET /api/reports/officer-dashboard-feed (officer/admin — banner/tasks/intel)
router.get('/officer-dashboard-feed', authenticate, requireOfficer, async (req, res) => {
  try {
    const [recentReports, sosActiveCount] = await Promise.all([
      Report.find()
        .sort({ submittedAt: -1 })
        .limit(200)
        .select('category status submittedAt location.address'),
      SosAlert.countDocuments({ status: 'active' }),
    ]);

    const districtCount = new Map();
    const categoryCount = new Map();
    const statusCount = { submitted: 0, under_review: 0, assigned: 0, resolved: 0, closed: 0 };

    let latestTimestamp = Date.now();
    if (recentReports.length > 0) {
      latestTimestamp = new Date(recentReports[0].submittedAt || Date.now()).getTime();
    }

    for (const report of recentReports) {
      const district = inferDistrict(report.location?.address);
      const category = String(report.category || 'General Incident').trim();
      const status = String(report.status || 'submitted').trim().toLowerCase();

      districtCount.set(district, (districtCount.get(district) || 0) + 1);
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      if (statusCount[status] !== undefined) statusCount[status] += 1;
    }

    const topDistrict = [...districtCount.entries()].sort((a, b) => b[1] - a[1])[0] || ['Colombo', 0];
    const topCategory = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0] || ['House Breaking', 0];
    const incidents = topDistrict[1];
    const riskLevel = riskFromIncidents(incidents);

    const clusterAlert = {
      riskLevel,
      title: `High-risk zone: ${topCategory[0]} cluster detected in ${topDistrict[0]}`,
      message: incidents > 0
        ? `Backend incident analysis found ${incidents} recent reports concentrated in ${topDistrict[0]}. Dominant category: ${topCategory[0]}. Recommended action: increase patrol visibility and rapid response coverage.`
        : 'No concentrated hotspot cluster detected in the latest report window. Continue routine patrol coverage and monitor incoming reports.',
      district: topDistrict[0],
      crimeType: topCategory[0],
      incidents,
      updatedAt: new Date(latestTimestamp).toISOString(),
    };

    const tasks = [];
    if (statusCount.submitted > 0) {
      tasks.push({ id: 'task-submitted', label: `Review ${statusCount.submitted} newly submitted report(s)`, sub: 'Due Today, 17:00', done: false, urgent: true });
    }
    if (statusCount.under_review > 0 || statusCount.assigned > 0) {
      tasks.push({ id: 'task-investigation', label: `Follow up ${statusCount.under_review + statusCount.assigned} investigation case(s)`, sub: 'Due Tomorrow, 09:00', done: false, urgent: false });
    }
    if (sosActiveCount > 0) {
      tasks.push({ id: 'task-sos', label: `Respond to ${sosActiveCount} active SOS alert(s)`, sub: 'Immediate priority', done: false, urgent: true });
    }
    if (tasks.length === 0) {
      tasks.push({ id: 'task-routine', label: 'Run routine patrol readiness checklist', sub: 'Due Today, 18:00', done: false, urgent: false });
    }

    const unresolved = statusCount.submitted + statusCount.under_review + statusCount.assigned + sosActiveCount;
    const sectorIntel = {
      updatedLabel: formatRelativeTime(latestTimestamp),
      unitLabel: `Unit ${Math.max(1, Math.min(9, unresolved || 4))} Active`,
      summary: `${topDistrict[0]} focus • ${unresolved} open operational item(s)`,
    };

    res.json({
      success: true,
      data: {
        clusterAlert,
        tasks,
        sectorIntel,
      },
    });
  } catch (error) {
    console.error('[REPORT] Officer dashboard feed error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch officer dashboard feed' });
  }
});

// GET /api/reports/all  (officer/admin — returns ALL citizen reports)
router.get('/all', authenticate, requireOfficer, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [reports, sosAlerts] = await Promise.all([
      Report.find()
      .sort({ submittedAt: -1 })
      .populate('userId', 'fullName email')
      .select('-__v'),
      SosAlert.find()
        .sort({ activatedAt: -1 })
        .populate('userId', 'fullName email')
        .select('-__v'),
    ]);

    const merged = [
      ...reports,
      ...sosAlerts.map(toSosReportShape),
    ]
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, limit);

    res.json({ success: true, data: merged });
  } catch (error) {
    console.error('[REPORT] Fetch all error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// GET /api/reports/detail/:caseId  (officer/admin — fetch any single report)
router.get('/detail/:caseId', authenticate, requireOfficer, async (req, res) => {
  try {
    const report = await Report.findOne({ caseId: req.params.caseId })
      .populate('userId', 'fullName email phone')
      .select('-__v');
    if (report) {
      return res.json({ success: true, data: report });
    }

    const alert = await SosAlert.findOne({ caseId: req.params.caseId })
      .populate('userId', 'fullName email phone')
      .select('-__v');

    if (!alert) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: toSosReportShape(alert) });
  } catch (error) {
    console.error('[REPORT] Detail fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
});

// POST /api/reports/submit  (authenticated)
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { category, description, location, files } = req.body;

    if (!category || !description) {
      return res.status(400).json({ success: false, message: 'Category and description are required' });
    }

    const report = new Report({
      userId:      req.user.id,
      category,
      description,
      location: {
        address:   location?.address   || 'Unknown',
        latitude:  location?.coords?.lat || null,
        longitude: location?.coords?.lng || null,
      },
      files: (files || []).map((f) => ({ name: f.name, size: f.size, type: f.type })),
    });

    await report.save();

    console.log(`[REPORT] Submitted: ${report.caseId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        caseId:      report.caseId,
        status:      report.status,
        submittedAt: report.submittedAt,
        category:    report.category,
        location:    report.location,
      },
    });
  } catch (error) {
    console.error('[REPORT] Submit error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
});

// PATCH /api/reports/detail/:caseId/status  (officer/admin — update report status)
router.patch('/detail/:caseId/status', authenticate, requireOfficer, async (req, res) => {
  try {
    const rawStatus = String(req.body?.status || '').trim().toLowerCase();
    const normalizedStatus = {
      submitted: 'submitted',
      'under_review': 'under_review',
      'under review': 'under_review',
      assigned: 'assigned',
      asssigned: 'assigned',
      resolved: 'resolved',
      closed: 'closed',
    }[rawStatus];

    const allowed = ['submitted', 'under_review', 'assigned', 'resolved', 'closed'];
    if (!normalizedStatus || !allowed.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const report = await Report.findOneAndUpdate(
      { caseId: req.params.caseId },
      { status: normalizedStatus },
      { new: true }
    ).select('-__v');
    if (report) {
      const sosUpdate = buildSosStatusUpdate(normalizedStatus);
      const alert = await SosAlert.findOneAndUpdate(
        { caseId: req.params.caseId },
        sosUpdate,
        { new: true }
      ).select('-__v');

      return res.json({
        success: true,
        data: report,
        ...(alert ? { sosAlert: toSosReportShape(alert) } : {}),
      });
    }

    const alert = await SosAlert.findOneAndUpdate(
      { caseId: req.params.caseId },
      buildSosStatusUpdate(normalizedStatus),
      { new: true }
    ).select('-__v');

    if (!alert) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: toSosReportShape(alert) });
  } catch (error) {
    console.error('[REPORT] Status update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// GET /api/reports/my-reports  (authenticated)
router.get('/my-reports', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .sort({ submittedAt: -1 })
      .select('-__v');
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('[REPORT] Fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// DELETE /api/reports/:id  (officer/admin — delete by MongoDB _id)
router.delete('/:id', authenticate, requireOfficer, async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (deleted) {
      return res.json({ success: true, message: 'Report deleted successfully' });
    }

    const deletedSos = await SosAlert.findByIdAndDelete(req.params.id);
    if (!deletedSos) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, message: 'SOS alert deleted successfully' });
  } catch (error) {
    console.error('[REPORT] Delete error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
});

// GET /api/reports/:caseId  (authenticated)
router.get('/:caseId', authenticate, async (req, res) => {
  try {
    const report = await Report.findOne({ caseId: req.params.caseId, userId: req.user.id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
});

module.exports = router;
