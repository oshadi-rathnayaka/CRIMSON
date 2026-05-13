const mongoose = require('mongoose');

function requireDbConnection(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }
  next();
}

module.exports = requireDbConnection;
