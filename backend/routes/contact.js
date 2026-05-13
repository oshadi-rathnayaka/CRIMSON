const express = require('express');
const ContactMessage = require('../models/ContactMessage');

const router = express.Router();

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

router.get('/content', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      title: 'Contact Us',
      subtitle: 'Reach the CRIMSON safety team for platform issues, urgent concerns, or follow-up support.',
      districts: DISTRICTS,
    },
    updatedAt: new Date().toISOString(),
  });
});

router.post('/submit', async (req, res) => {
  try {
    const {
      name = '',
      email = '',
      phone = '',
      district = '',
      subject = '',
      message = '',
    } = req.body || {};

    const cleaned = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      district: String(district).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
    };

    if (!cleaned.name || !cleaned.email || !cleaned.phone || !cleaned.district || !cleaned.subject || !cleaned.message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!DISTRICTS.includes(cleaned.district)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid district selected',
      });
    }

    const entry = await ContactMessage.create(cleaned);

    return res.status(201).json({
      success: true,
      message: 'Message submitted successfully',
      data: {
        messageId: entry.messageId,
        status: entry.status,
        submittedAt: entry.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact message',
    });
  }
});

module.exports = router;