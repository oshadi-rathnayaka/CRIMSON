/**
 * Seed script — creates the default CRIMSON admin account.
 * Run once with:  node scripts/createAdmin.js
 */

const dns  = require('dns');
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User     = require('../models/User');

const ADMIN = {
  fullName: 'System Administrator',
  email:    'admin@crimson.gov.lk',
  password: 'Admin@1234',
  role:     'admin',
};

async function createAdmin() {
  try {
    // ── Connect ───────────────────────────────────────────────────────────
    console.log('Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅  Connected');

    // ── Check for existing admin ──────────────────────────────────────────
    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log(`ℹ️   Admin already exists: ${ADMIN.email}`);
      process.exit(0);
    }

    // ── Create ────────────────────────────────────────────────────────────
    const admin = new User(ADMIN);
    await admin.save();          // pre-save hook hashes the password

    console.log('✅  Admin created successfully');
    console.log(`    Email   : ${ADMIN.email}`);
    console.log(`    Password: ${ADMIN.password}`);
    console.log(`    Role    : ${admin.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Failed to create admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
