const router = require('express').Router();
const auth = require('../middleware/auth');
const Message = require('../models/message');
const User = require('../models/User');
const multer = require('multer');
const { uploadToCloudinary } = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const getId = (req) => req.user?._id || req.userId || req.user?.id;


const getUrl = (result) => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  return result.secure_url || result.url || '';
};

const getFileType = (file) => {
  if (!file) return 'text';
  if (file.mimetype.startsWith('image/')) return 'image';
  if (file.mimetype.startsWith('video/')) return 'video';
  if (file.mimetype.startsWith('audio/')) return 'voice';
  return 'file';
};


router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file' });
    const me = getId(req);
    const folder = req.body.type === 'voice' ? 'buy-sell-barter/voice' : 'buy-sell-barter/chat';
    const result = await uploadToCloudinary(req.file.buffer, folder);
    const fileUrl = getUrl(result);

    const msg = await Message.create({
      sender: me,
      receiver: req.params.id,
      text: (req.body.text || '').trim(),
      type: req.body.type || getFileType(req.file),
      fileUrl: fileUrl || null,
      fileName: req.file.originalname || null,
      replyTo: req.body.replyTo || null,
    });
    const populated = await Message.findById(msg._id).populate('sender', 'name username avatar');
    res.json(populated);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.get('/chats', auth, async (req, res) => {
  try {
    const me = getId(req);

    const msgs = await Message.find({
      $or: [{ sender: me }, { receiver: me }],
      deleted: false,
    }).sort({ createdAt: -1 }).lean();

    const map = {};
    for (const m of msgs) {
      const otherId = String(m.sender) === String(me) ? String(m.receiver) : String(m.sender);
      if (!map[otherId]) map[otherId] = { last: m, unread: 0 };

      if (String(m.sender) !== String(me) && !m.isSeen) map[otherId].unread++;
    }

    const userIds = Object.keys(map);
    if (!userIds.length) return res.json([]);

    const users = await User.find({ _id: { $in: userIds } }).select('name username avatar').lean();
    const out = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      lastMsg: map[String(u._id)].last,
      unread: map[String(u._id)].unread,
    })).sort((a, b) => new Date(b.lastMsg.createdAt) - new Date(a.lastMsg.createdAt));

    res.json(out);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const me = getId(req);
    const other = req.params.userId;
    const after = req.query.after;

    let query = {
      $or: [{ sender: me, receiver: other }, { sender: other, receiver: me }],
      deleted: false,
    };
    if (after) {
      const last = await Message.findById(after);
      if (last) query.createdAt = { $gt: last.createdAt };
    }

    const msgs = await Message.find(query).sort({ createdAt: 1 }).populate('sender', 'name username avatar').lean();

    await Message.updateMany({ sender: other, receiver: me, isSeen: false }, { isSeen: true });

    const otherUser = await User.findById(other).select('name username avatar').lean();
    res.json({ user: otherUser, messages: msgs });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.post('/:userId', auth, async (req, res) => {
  try {
    const me = getId(req);
    const { text, type, fileUrl, fileName, replyTo } = req.body;
    if (!text?.trim() && !fileUrl) return res.status(400).json({ msg: 'Empty message' });

    const msg = await Message.create({
      sender: me,
      receiver: req.params.userId,
      text: (text || '').trim(),
      type: type || (fileUrl ? 'file' : 'text'),
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      replyTo: replyTo || null,
    });
    const populated = await Message.findById(msg._id).populate('sender', 'name username avatar');
    res.json(populated);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const me = getId(req);
    const msg = await Message.findOne({ _id: req.params.id, sender: me });
    if (!msg) return res.status(404).json({ msg: 'Not found' });
    msg.deleted = true;
    await msg.save();
    res.json({ msg: 'Deleted' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;