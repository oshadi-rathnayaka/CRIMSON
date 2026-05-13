const express        = require('express');
const authenticate   = require('../middleware/auth');
const SupportRequest = require('../models/SupportRequest');

const router = express.Router();

const requireOfficer = (req, res, next) => {
  if (req.user?.role !== 'officer' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Officer accounts only.' });
  }
  next();
};

// POST /api/support/request  (authenticated)
router.post('/request', authenticate, async (req, res) => {
  try {
    const { serviceType, serviceLabel, victimAge, victimGender, crimeType, district, description, priority } = req.body;

    if (!serviceType || !description || victimAge === undefined || !victimGender || !crimeType || !district) {
      return res.status(400).json({ success: false, message: 'Service type, age, gender, crime type, district and description are required' });
    }

    const request = new SupportRequest({
      userId:       req.user.id,
      serviceType,
      serviceLabel: serviceLabel || serviceType,
      victimAge:    Number(victimAge),
      victimGender,
      crimeType,
      district,
      description,
      priority:     priority || 'normal',
    });

    await request.save();
    console.log(`[SUPPORT] Request submitted: ${request.ticketId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Support request submitted successfully',
      data: {
        ticketId:    request.ticketId,
        serviceType: request.serviceType,
        serviceLabel: request.serviceLabel,
        victimAge:   request.victimAge,
        victimGender: request.victimGender,
        crimeType:   request.crimeType,
        district:    request.district,
        priority:    request.priority,
        status:      request.status,
        createdAt:   request.createdAt,
      },
    });
  } catch (err) {
    console.error('[SUPPORT] Submit error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit support request' });
  }
});

// GET /api/support/my-requests  (authenticated)
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const requests = await SupportRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('[SUPPORT] Fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch support requests' });
  }
});

// GET /api/support/requests  (officer/admin)
router.get('/requests', authenticate, requireOfficer, async (req, res) => {
  try {
    const requests = await SupportRequest.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email phone district')
      .select('-__v');

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('[SUPPORT] Officer fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch officer support requests' });
  }
});

// POST /api/support/officer-entry  (officer/admin — manual victim entry)
router.post('/officer-entry', authenticate, requireOfficer, async (req, res) => {
  try {
    const { victimName, serviceType, serviceLabel, victimAge, victimGender, crimeType, district, description, priority } = req.body;

    if (!serviceType || !victimAge || !victimGender || !crimeType || !district) {
      return res.status(400).json({ success: false, message: 'serviceType, victimAge, victimGender, crimeType and district are required' });
    }

    const entry = new SupportRequest({
      userId:       req.user.id,
      victimName:   victimName || '',
      serviceType,
      serviceLabel: serviceLabel || serviceType,
      victimAge:    Number(victimAge),
      victimGender,
      crimeType,
      district,
      description:  description || 'Manually entered by officer',
      priority:     priority || 'normal',
    });

    await entry.save();
    res.status(201).json({ success: true, message: 'Entry created', data: entry });
  } catch (err) {
    console.error('[SUPPORT] Officer entry error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create entry' });
  }
});

// DELETE /api/support/requests/:id  (officer/admin)
router.delete('/requests/:id', authenticate, requireOfficer, async (req, res) => {
  try {
    const deleted = await SupportRequest.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Support request not found' });
    }

    res.json({ success: true, message: 'Support request deleted successfully' });
  } catch (err) {
    console.error('[SUPPORT] Delete error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete support request' });
  }
});

module.exports = router;
