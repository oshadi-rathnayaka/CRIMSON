/**
 * Seed script — creates the default CRIMSON officer account.
 * Run once with:  node scripts/createOfficer.js
 */

const dns = require('dns');
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User     = require('../models/User');

const OFFICER = {
  fullName:    'Officer Silva',
  email:       'officer@crimson.gov.lk',
  password:    'Officer@1234',
  role:        'officer',
  district:    'Colombo',
  badgeNumber: 'SLC-8821',
  division:    'Western Province',
  isActive:    true,
};

async function createOfficer() {
  try {
    console.log('Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅  Connected');

    const existing = await User.findOne({ email: OFFICER.email });
    if (existing) {
      console.log(`ℹ️   Officer already exists: ${OFFICER.email}`);
      process.exit(0);
    }

    const officer = new User(OFFICER);
    await officer.save(); // pre-save hook hashes the password

    console.log('✅  Officer created successfully');
    console.log(`    Email      : ${OFFICER.email}`);
    console.log(`    Password   : ${OFFICER.password}`);
    console.log(`    Badge No.  : ${OFFICER.badgeNumber}`);
    console.log(`    District   : ${OFFICER.district}`);
    console.log(`    Role       : ${officer.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Failed to create officer:', err.message);
    process.exit(1);
  }
}

createOfficer();
