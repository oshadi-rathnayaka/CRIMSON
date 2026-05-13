const express = require('express');
const authenticate = require('../middleware/auth');
const Offender = require('../models/Offender');

const router = express.Router();

const requireOfficer = (req, res, next) => {
  if (req.user?.role !== 'officer' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Officer accounts only.' });
  }
  next();
};

// GET /api/offenders
router.get('/', authenticate, requireOfficer, async (req, res) => {
  try {
    const { search = '', district = '', crimeType = '', legalStatus = '', riskLevel = '' } = req.query;

    const query = { isArchived: false };

    if (district) query.district = district;
    if (crimeType) query.primaryCrimeType = crimeType;
    if (legalStatus) query.legalStatus = legalStatus;
    if (riskLevel) query.riskLevel = riskLevel;

    if (search) {
      const s = String(search).trim();
      query.$or = [
        { nic: { $regex: s, $options: 'i' } },
        { fullName: { $regex: s, $options: 'i' } },
        { alias: { $regex: s, $options: 'i' } },
      ];
    }

    const offenders = await Offender.find(query)
      .sort({ updatedAt: -1 })
      .select('-__v');

    res.json({ success: true, data: offenders });
  } catch (error) {
    console.error('[OFFENDER] Fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch offenders' });
  }
});

// POST /api/offenders
router.post('/', authenticate, requireOfficer, async (req, res) => {
  try {
    const {
      nic,
      fullName,
      age,
      alias,
      district,
      primaryCrimeType,
      riskLevel,
      legalStatus,
      convictionCount,
      pendingCaseCount,
      notes,
    } = req.body;

    if (!nic || !fullName || !district || !primaryCrimeType) {
      return res.status(400).json({
        success: false,
        message: 'NIC, full name, district, and primary crime type are required',
      });
    }

    const existing = await Offender.findOne({ nic: nic.toUpperCase().trim(), isArchived: false });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Offender with this NIC already exists' });
    }

    const offender = await Offender.create({
      nic,
      fullName,
      age,
      alias,
      district,
      primaryCrimeType,
      riskLevel,
      legalStatus,
      convictionCount,
      pendingCaseCount,
      notes,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null,
    });

    res.status(201).json({ success: true, data: offender });
  } catch (error) {
    console.error('[OFFENDER] Create error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create offender' });
  }
});

// PUT /api/offenders/:id
router.put('/:id', authenticate, requireOfficer, async (req, res) => {
  try {
    const {
      nic,
      fullName,
      age,
      alias,
      district,
      primaryCrimeType,
      riskLevel,
      legalStatus,
      convictionCount,
      pendingCaseCount,
      notes,
    } = req.body;

    if (!nic || !fullName || !district || !primaryCrimeType) {
      return res.status(400).json({
        success: false,
        message: 'NIC, full name, district, and primary crime type are required',
      });
    }

    const duplicate = await Offender.findOne({
      _id: { $ne: req.params.id },
      nic: nic.toUpperCase().trim(),
      isArchived: false,
    });

    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Another offender already uses this NIC' });
    }

    const offender = await Offender.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      {
        nic,
        fullName,
        age,
        alias,
        district,
        primaryCrimeType,
        riskLevel,
        legalStatus,
        convictionCount,
        pendingCaseCount,
        notes,
        updatedBy: req.user?.id || null,
      },
      { new: true, runValidators: true }
    );

    if (!offender) {
      return res.status(404).json({ success: false, message: 'Offender not found' });
    }

    res.json({ success: true, data: offender });
  } catch (error) {
    console.error('[OFFENDER] Update error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update offender' });
  }
});

// DELETE /api/offenders/:id (soft delete)
router.delete('/:id', authenticate, requireOfficer, async (req, res) => {
  try {
    const offender = await Offender.findOneAndUpdate(
      { _id: req.params.id, isArchived: false },
      { isArchived: true, updatedBy: req.user?.id || null },
      { new: true }
    );

    if (!offender) {
      return res.status(404).json({ success: false, message: 'Offender not found' });
    }

    res.json({ success: true, message: 'Offender archived successfully' });
  } catch (error) {
    console.error('[OFFENDER] Delete error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to archive offender' });
  }
});

module.exports = router;
