const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const authenticate = require('../middleware/auth');
const User = require('../models/User');
const OfficerConversation = require('../models/OfficerConversation');
const OfficerMessage = require('../models/OfficerMessage');

const router = express.Router();

const requireOfficer = (req, res, next) => {
  if (req.user?.role !== 'officer') {
    return res.status(403).json({ success: false, message: 'Access denied. Officer accounts only.' });
  }
  next();
};

const uploadDir = path.join(__dirname, '..', 'uploads', 'officer-chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});

const classifyAttachment = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
};

const mapMessage = (msg, myId) => ({
  id: msg._id,
  mine: String(msg.senderId?._id || msg.senderId) === String(myId),
  sender: {
    id: msg.senderId?._id || msg.senderId,
    fullName: msg.senderId?.fullName || 'Unknown Officer',
    email: msg.senderId?.email || '',
  },
  text: msg.text || '',
  attachment: msg.attachment || null,
  createdAt: msg.createdAt,
});

router.get('/officers', authenticate, requireOfficer, async (req, res) => {
  try {
    const officers = await User.find({
      role: 'officer',
      isActive: true,
      _id: { $ne: req.user.id },
    })
      .select('fullName email district division badgeNumber')
      .sort({ fullName: 1 })
      .lean();

    res.json({ success: true, data: officers });
  } catch (error) {
    console.error('[OCHAT] Officers fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load officers' });
  }
});

router.get('/conversations', authenticate, requireOfficer, async (req, res) => {
  try {
    const conversations = await OfficerConversation.find({ participants: req.user.id })
      .populate('participants', 'fullName email district')
      .sort({ lastMessageAt: -1 })
      .lean();

    const ids = conversations.map((c) => c._id);
    const latestMessages = await OfficerMessage.aggregate([
      { $match: { conversationId: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          message: { $first: '$$ROOT' },
        },
      },
    ]);

    const latestByConversation = new Map(
      latestMessages.map((item) => [String(item._id), item.message])
    );

    const data = conversations.map((conversation) => {
      const partner = conversation.participants.find(
        (participant) => String(participant._id) !== String(req.user.id)
      );
      const latest = latestByConversation.get(String(conversation._id));

      return {
        id: conversation._id,
        partner: partner
          ? {
              id: partner._id,
              fullName: partner.fullName,
              email: partner.email,
              district: partner.district,
            }
          : null,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: latest
          ? latest.text || latest.attachment?.originalName || 'Attachment'
          : 'No messages yet',
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('[OCHAT] Conversation list error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

router.post('/conversations', authenticate, requireOfficer, async (req, res) => {
  try {
    const { officerId } = req.body;
    if (!officerId) {
      return res.status(400).json({ success: false, message: 'officerId is required' });
    }

    if (String(officerId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
    }

    const target = await User.findOne({ _id: officerId, role: 'officer', isActive: true })
      .select('fullName email district')
      .lean();

    if (!target) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    let conversation = await OfficerConversation.findOne({
      participants: { $all: [req.user.id, officerId] },
    })
      .populate('participants', 'fullName email district')
      .lean();

    if (!conversation) {
      conversation = await OfficerConversation.create({
        participants: [req.user.id, officerId],
        lastMessageAt: new Date(),
      });
      conversation = await OfficerConversation.findById(conversation._id)
        .populate('participants', 'fullName email district')
        .lean();
    }

    const partner = conversation.participants.find(
      (participant) => String(participant._id) !== String(req.user.id)
    );

    res.status(201).json({
      success: true,
      data: {
        id: conversation._id,
        partner: {
          id: partner._id,
          fullName: partner.fullName,
          email: partner.email,
          district: partner.district,
        },
        lastMessageAt: conversation.lastMessageAt,
      },
    });
  } catch (error) {
    console.error('[OCHAT] Create conversation error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

router.delete('/conversations/:id', authenticate, requireOfficer, async (req, res) => {
  try {
    const conversation = await OfficerConversation.findById(req.params.id).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((id) => String(id) === String(req.user.id))) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation' });
    }

    await OfficerMessage.deleteMany({ conversationId: conversation._id });
    await OfficerConversation.deleteOne({ _id: conversation._id });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('[OCHAT] Delete conversation error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
});

router.get('/conversations/:id/messages', authenticate, requireOfficer, async (req, res) => {
  try {
    const conversation = await OfficerConversation.findById(req.params.id).lean();
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((id) => String(id) === String(req.user.id))) {
      return res.status(403).json({ success: false, message: 'You are not part of this conversation' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);

    const messages = await OfficerMessage.find({ conversationId: req.params.id })
      .populate('senderId', 'fullName email')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: messages.map((msg) => mapMessage(msg, req.user.id)),
    });
  } catch (error) {
    console.error('[OCHAT] Message list error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

router.post(
  '/conversations/:id/messages',
  authenticate,
  requireOfficer,
  upload.single('file'),
  async (req, res) => {
    try {
      const conversation = await OfficerConversation.findById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      if (!conversation.participants.some((id) => String(id) === String(req.user.id))) {
        return res.status(403).json({ success: false, message: 'You are not part of this conversation' });
      }

      const text = String(req.body?.text || '').trim();
      if (!text && !req.file) {
        return res.status(400).json({ success: false, message: 'Message text or file is required' });
      }

      let attachment = null;
      if (req.file) {
        attachment = {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          mimeType: req.file.mimetype || 'application/octet-stream',
          size: req.file.size,
          kind: classifyAttachment(req.file.mimetype),
          url: `/uploads/officer-chat/${req.file.filename}`,
        };
      }

      const message = await OfficerMessage.create({
        conversationId: conversation._id,
        senderId: req.user.id,
        text,
        attachment,
      });

      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await OfficerMessage.findById(message._id)
        .populate('senderId', 'fullName email')
        .lean();

      res.status(201).json({ success: true, data: mapMessage(populated, req.user.id) });
    } catch (error) {
      console.error('[OCHAT] Send message error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }
);

module.exports = router;
