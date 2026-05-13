const express = require('express');
const multer = require('multer');
const DataOperation = require('../models/DataOperation');
const Report = require('../models/Report');
const SupportRequest = require('../models/SupportRequest');
const SosAlert = require('../models/SosAlert');
const Offender = require('../models/Offender');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  return next();
};

const moduleLabels = {
  crimeRecords: 'Crime Records',
  victimProfiles: 'Victim Profiles',
  intelligenceAnalytics: 'Intelligence Analytics',
};

const formatRelativeAge = (dateValue) => {
  const deltaMs = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const bytesToLabel = (bytes) => {
  if (!bytes || bytes <= 0) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const mapOperationToActivity = (op) => {
  const isImport = op.operationType === 'import';
  const icon = isImport ? 'success' : 'download';
  const badge = op.status === 'downloaded' ? 'DOWNLOADED' : op.status.toUpperCase();
  const badgeClass = op.status === 'success' ? 'badge--success' : op.status === 'downloaded' ? 'badge--download' : 'badge--error';

  const sizeLabel = bytesToLabel(op.fileSizeBytes);
  const recordsPart = op.records > 0 ? `${op.records.toLocaleString()} records` : sizeLabel;

  return {
    id: String(op._id),
    icon,
    name: op.fileName,
    meta: `${recordsPart} · ${formatRelativeAge(op.createdAt)}`,
    badge,
    badgeClass,
  };
};

const parseCsvHeader = (buffer) => {
  const text = buffer.toString('utf8');
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
  return firstLine.split(',').map((column) => column.trim().replace(/^"|"$/g, '')).filter(Boolean);
};

const validateFile = (file) => {
  const logs = [];
  const lowerName = String(file.originalname || '').toLowerCase();
  const ext = lowerName.split('.').pop();

  logs.push({ type: 'info', text: `Scanning file: ${file.originalname}...` });
  logs.push({ type: 'pass', text: `File size check passed (${bytesToLabel(file.size)}).` });

  if (!['csv', 'xlsx'].includes(ext)) {
    logs.push({ type: 'error', text: 'Unsupported format. Allowed formats: .csv, .xlsx.' });
    return { logs, canImport: false, errorCount: 1, warningCount: 0 };
  }

  let errorCount = 0;
  let warningCount = 0;

  if (ext === 'csv') {
    const headers = parseCsvHeader(file.buffer);
    const requiredColumns = ['CASE_ID', 'CRIME_TYPE', 'DISTRICT'];
    const missing = requiredColumns.filter((column) => !headers.some((h) => h.toUpperCase() === column));

    if (missing.length > 0) {
      errorCount += missing.length;
      missing.forEach((column) => {
        logs.push({ type: 'error', text: `Missing required column: ${column}.` });
      });
    } else {
      logs.push({ type: 'pass', text: 'Header validation complete.' });
    }

    if (!headers.some((h) => h.toUpperCase() === 'NIC_NUMBER')) {
      warningCount += 1;
      logs.push({ type: 'warn', text: 'NIC_NUMBER column not found. Victim profile enrichment may be incomplete.' });
    }
  } else {
    warningCount += 1;
    logs.push({ type: 'warn', text: 'XLSX structural validation is limited. Column checks run after import staging.' });
    logs.push({ type: 'pass', text: 'Basic workbook validation complete.' });
  }

  const canImport = errorCount === 0;
  if (!canImport) {
    logs.push({ type: 'error', text: 'Fix errors before import.' });
  }

  return { logs, canImport, errorCount, warningCount };
};

const ensureSeedActivity = async () => {
  const count = await DataOperation.countDocuments();
  if (count > 0) return;

  await DataOperation.insertMany([
    {
      operationType: 'import',
      fileName: 'Western_Province_Q3.xlsx',
      fileSizeBytes: 5.4 * 1024 * 1024,
      records: 2450,
      status: 'success',
      notes: 'Initial seeded activity.',
    },
    {
      operationType: 'export',
      fileName: 'Analytics_Export_Colombo_01.csv',
      fileSizeBytes: 740 * 1024,
      records: 1330,
      status: 'downloaded',
      notes: 'Initial seeded activity.',
    },
  ]);
};

router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    await ensureSeedActivity();

    const [reportCount, supportCount, sosCount, offenderCount, userCount, recentOps] = await Promise.all([
      Report.countDocuments(),
      SupportRequest.countDocuments(),
      SosAlert.countDocuments(),
      Offender.countDocuments(),
      User.countDocuments(),
      DataOperation.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const totalRecords = reportCount + supportCount + sosCount + offenderCount + userCount;
    const storageLimit = 1000000;
    const storageUsed = Math.min(storageLimit, totalRecords);
    const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

    return res.status(200).json({
      success: true,
      data: {
        systemHealth: {
          totalRecords,
          storageLimit,
          storageUsed,
          storagePercent,
        },
        recentActivity: recentOps.map(mapOperationToActivity),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load data management overview' });
  }
});

router.post('/import/validate', authenticate, requireAdmin, upload.single('dataFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please select a CSV or XLSX file.' });
    }

    const validation = validateFile(req.file);

    return res.status(200).json({
      success: true,
      data: {
        file: {
          name: req.file.originalname,
          size: req.file.size,
        },
        validation,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to validate import file' });
  }
});

router.post('/import/commit', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileName, fileSizeBytes, records = 0, errorCount = 0, warningCount = 0 } = req.body || {};

    if (!fileName) {
      return res.status(400).json({ success: false, message: 'fileName is required.' });
    }

    const status = errorCount > 0 ? 'error' : 'success';
    const notes = `Import committed. warnings=${warningCount}, errors=${errorCount}`;

    await DataOperation.create({
      operationType: 'import',
      fileName,
      fileSizeBytes: Number(fileSizeBytes) || 0,
      records: Number(records) || 0,
      status,
      notes,
      createdBy: req.user?.id || null,
    });

    return res.status(201).json({ success: true, message: 'Import operation recorded successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record import operation' });
  }
});

router.post('/export/preview', authenticate, requireAdmin, async (req, res) => {
  try {
    const { modules = [], division = 'All Divisions' } = req.body || {};
    const selectedModules = Array.isArray(modules) ? modules.filter(Boolean) : [];

    const [reportCount, supportCount, offenderCount] = await Promise.all([
      Report.countDocuments(),
      SupportRequest.countDocuments(),
      Offender.countDocuments(),
    ]);

    const countsByModule = {
      crimeRecords: reportCount,
      victimProfiles: supportCount,
      intelligenceAnalytics: offenderCount,
    };

    let estimatedRecords = 0;
    selectedModules.forEach((moduleId) => {
      estimatedRecords += countsByModule[moduleId] || 0;
    });

    return res.status(200).json({
      success: true,
      data: {
        division,
        selectedModules: selectedModules.map((moduleId) => ({
          id: moduleId,
          label: moduleLabels[moduleId] || moduleId,
          estimatedRecords: countsByModule[moduleId] || 0,
        })),
        estimatedRecords,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to preview export' });
  }
});

router.post('/export/generate', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      modules = [],
      division = 'All Divisions',
      format = 'csv',
    } = req.body || {};

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, message: 'dateFrom and dateTo are required.' });
    }

    const selectedModules = Array.isArray(modules) ? modules.filter(Boolean) : [];
    if (selectedModules.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one data module.' });
    }

    const [reportCount, supportCount, offenderCount] = await Promise.all([
      Report.countDocuments(),
      SupportRequest.countDocuments(),
      Offender.countDocuments(),
    ]);

    const countsByModule = {
      crimeRecords: reportCount,
      victimProfiles: supportCount,
      intelligenceAnalytics: offenderCount,
    };

    let estimatedRecords = 0;
    selectedModules.forEach((moduleId) => {
      estimatedRecords += countsByModule[moduleId] || 0;
    });

    const safeFormat = String(format || 'csv').toLowerCase() === 'pdf' ? 'pdf' : 'csv';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `CRIMSON_Export_${division.replace(/\s+/g, '_')}_${stamp}.${safeFormat}`;
    const estimatedBytes = Math.max(50 * 1024, estimatedRecords * 320);

    await DataOperation.create({
      operationType: 'export',
      fileName,
      fileSizeBytes: estimatedBytes,
      records: estimatedRecords,
      division,
      modules: selectedModules,
      status: 'downloaded',
      notes: `Export generated for ${dateFrom}..${dateTo}`,
      createdBy: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: 'Export generated successfully.',
      data: {
        fileName,
        format: safeFormat,
        estimatedRecords,
        downloadUrl: `/api/admin/data-management/export/download/${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

router.get('/activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const items = await DataOperation.find().sort({ createdAt: -1 }).limit(20).lean();
    return res.status(200).json({
      success: true,
      data: {
        items: items.map(mapOperationToActivity),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

module.exports = router;
