const express      = require('express');
const authenticate = require('../middleware/auth');
const SosAlert     = require('../models/SosAlert');
const User         = require('../models/User');

const router = express.Router();

// ── POST /api/sos/activate  (authenticated) ────────────────────────────────
// Activates a new SOS alert for the logged-in user.
// Body: { latitude, longitude, address, district }
router.post('/activate', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, address, district } = req.body;

    // Cancel any existing active alert for this user
    await SosAlert.updateMany(
      { userId: req.user.id, status: { $in: ['active', 'assigned'] } },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    // Fetch user name
    const user = await User.findById(req.user.id).select('fullName');

    const alert = new SosAlert({
      userId:   req.user.id,
      userName: user?.fullName || 'Unknown',
      location: {
        latitude:  latitude  || null,
        longitude: longitude || null,
        address:   address   || 'Unknown',
        district:  district  || 'Unknown',
      },
    });

    await alert.save();

    console.log(`[SOS] Activated: ${alert.caseId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'SOS alert activated',
      data: {
        caseId:      alert.caseId,
        status:      alert.status,
        activatedAt: alert.activatedAt,
        location:    alert.location,
        userName:    alert.userName,
      },
    });
  } catch (error) {
    console.error('[SOS] Activate error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to activate SOS alert' });
  }
});

// ── PUT /api/sos/cancel/:caseId  (authenticated) ──────────────────────────
// Cancels the user's active SOS alert.
router.put('/cancel/:caseId', authenticate, async (req, res) => {
  try {
    const alert = await SosAlert.findOne({
      caseId: req.params.caseId,
      userId: req.user.id,
    });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'SOS alert not found' });
    }

    if (!['active', 'assigned'].includes(alert.status)) {
      return res.status(400).json({ success: false, message: `Alert is already ${alert.status}` });
    }

    alert.status      = 'cancelled';
    alert.cancelledAt = new Date();
    await alert.save();

    console.log(`[SOS] Cancelled: ${alert.caseId} by user ${req.user.id}`);

    res.json({ success: true, message: 'SOS alert cancelled', caseId: alert.caseId });
  } catch (error) {
    console.error('[SOS] Cancel error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to cancel SOS alert' });
  }
});

// ── GET /api/sos/active  (authenticated) ──────────────────────────────────
// Returns the user's current active SOS alert if any.
router.get('/active', authenticate, async (req, res) => {
  try {
    const alert = await SosAlert.findOne({
      userId: req.user.id,
      status: { $in: ['active', 'assigned'] },
    }).sort({ activatedAt: -1 });

    if (!alert) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: {
        caseId:      alert.caseId,
        status:      alert.status,
        activatedAt: alert.activatedAt,
        location:    alert.location,
      },
    });
  } catch (error) {
    console.error('[SOS] Get active error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch SOS alert' });
  }
});

// ── GET /api/sos/my-sos  (authenticated) ──────────────────────────────────
// Returns all SOS alerts history for the logged-in user (past and active).
router.get('/my-sos', authenticate, async (req, res) => {
  try {
    const alerts = await SosAlert.find({ userId: req.user.id })
      .select('caseId status activatedAt resolvedAt cancelledAt location')
      .sort({ activatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('[SOS] Get my-sos error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch SOS history' });
  }
});

module.exports = router;
