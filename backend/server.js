// MongoDB Atlas SRV lookups require working DNS.
// On some networks the system DNS blocks SRV records — use Cloudflare/Google instead.
const dns = require('dns');
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes         = require('./routes/auth');
const chatbotRoutes      = require('./routes/chatbot');
const sosRoutes          = require('./routes/sos');
const reportRoutes       = require('./routes/reports');
const adminAuthRoutes    = require('./routes/adminAuth');
const officerAuthRoutes  = require('./routes/officerAuth');
const analyticsRoutes    = require('./routes/analytics');
const aboutRoutes        = require('./routes/about');
const alertsRoutes       = require('./routes/alerts');
const contactRoutes      = require('./routes/contact');
const adminDashboardRoutes = require('./routes/adminDashboard');
const userManagementRoutes = require('./routes/userManagement');
const adminPermissionsRoutes = require('./routes/adminPermissions');
const adminAuditRoutes = require('./routes/adminAudit');
const adminDataManagementRoutes = require('./routes/adminDataManagement');
const adminSystemHealthRoutes = require('./routes/adminSystemHealth');
const supportRoutes      = require('./routes/support');
const offenderRoutes     = require('./routes/offenders');
const officerChatRoutes  = require('./routes/officerChat');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (isLocalhost) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Request Logger ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const safeBody = { ...req.body };
  if (safeBody.password) safeBody.password = '[REDACTED]';
  if (safeBody.confirmPassword) safeBody.confirmPassword = '[REDACTED]';
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (Object.keys(safeBody).length > 0) {
    console.log('  Body:', JSON.stringify(safeBody));
  }
  next();
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
const connectDB = async () => {
  const delays = [2000, 4000, 8000, 15000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: true,
      });
      console.log('✅  MongoDB Connected Successfully');
      return;
    } catch (err) {
      if (attempt < delays.length) {
        console.warn(`⚠️  MongoDB attempt ${attempt + 1} failed: ${err.message}`);
        console.warn(`    Retrying in ${delays[attempt] / 1000}s...`);
        await new Promise(r => setTimeout(r, delays[attempt]));
      } else {
        console.error('❌  MongoDB failed after all retries:', err.message);
        console.error('    API calls requiring DB will return 503 until connection is established.');
      }
    }
  }
};

connectDB();

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/chatbot',      chatbotRoutes);
app.use('/api/sos',          sosRoutes);
app.use('/api/reports',      reportRoutes);
app.use('/api/admin/auth',   adminAuthRoutes);
app.use('/api/officer/auth', officerAuthRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/about',        aboutRoutes);
app.use('/api/alerts',       alertsRoutes);
app.use('/api/contact',      contactRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/users', userManagementRoutes);
app.use('/api/admin/permissions', adminPermissionsRoutes);
app.use('/api/admin/audit', adminAuditRoutes);
app.use('/api/admin/data-management', adminDataManagementRoutes);
app.use('/api/admin/system-health', adminSystemHealthRoutes);
app.use('/api/support',      supportRoutes);
app.use('/api/offenders',    offenderRoutes);
app.use('/api/officer-chat', officerChatRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CRIMSON API Server', status: 'online', version: '1.0.0' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥  Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  CRIMSON Server running → http://localhost:${PORT}`);
});