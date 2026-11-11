const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Good = require('../models/good');
const Message = require('../models/Message');


const getMe = (req) => {
  return req.user?._id || req.user?.id || req.userId || req.user;
};

router.get('/badges', auth, async (req, res) => {
  try {
    const me = getMe(req);
    const user = await User.findById(me).lean();
    if (!user) return res.json({ unreadMessages: 0, newSell: 0, newBuy: 0, newBarter: 0, newMarket: 0 });

    const sinceMarket = user.lastSeenMarket || new Date(0);
    const sinceBuyers = user.lastSeenBuyers || new Date(0);
    const sinceSellers = user.lastSeenSellers || new Date(0);

    const unreadMessages = await Message.countDocuments({ receiver: me, isSeen: false });

    const notMine = { $ne: me };
    const [newMarket, newSell, newBuy, newBarter] = await Promise.all([
      Good.countDocuments({ createdAt: { $gt: sinceMarket }, seller: notMine }),
      Good.countDocuments({
        createdAt: { $gt: sinceSellers }, seller: notMine,
        $or: [{ kind: 'seller' }, { kind: 'sell' }, { kind: { $exists: false } }, { kind: '' }],
      }),
      Good.countDocuments({
        createdAt: { $gt: sinceBuyers }, seller: notMine,
        $or: [{ kind: 'buyer-request' }, { kind: 'buy' }, { kind: 'buyer' }],
      }),
      Good.countDocuments({ createdAt: { $gt: sinceMarket }, seller: notMine, kind: 'barter' }),
    ]);

    res.json({ unreadMessages, newSell, newBuy, newBarter, newMarket });
  } catch (e) {
    console.log('Badges error:', e);
    res.status(500).json({ msg: e.message });
  }
});

router.post('/seen/:tab', auth, async (req, res) => {
  try {
    const me = getMe(req);
    const tab = req.params.tab;
    const field = tab === 'market' ? 'lastSeenMarket'
      : tab === 'buyers' ? 'lastSeenBuyers'
      : tab === 'sellers' ? 'lastSeenSellers'
      : null;

    if (!field) return res.status(400).json({ msg: 'Invalid tab: ' + tab });
    if (!me) return res.status(401).json({ msg: 'No user in auth' });


    const updated = await User.findByIdAndUpdate(
      me,
      { [field]: new Date() },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ msg: 'User not found: ' + me });

    console.log(`✅ Seen saved: user=${me} ${field}=${updated[field]}`);
    res.json({ ok: true, [field]: updated[field] });
  } catch (e) {
    console.log('Seen error:', e);
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;