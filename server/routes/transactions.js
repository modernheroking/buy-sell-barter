const Review = require('../models/Review');
const router = require('express').Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Good = require('../models/good');


router.post('/', auth, async (req, res) => {
  try {
    const { goodId } = req.body;
    const me = req.user._id || req.userId;
    const good = await Good.findById(goodId);
    if (!good) return res.status(404).json({ msg: 'Good not found' });
    if (String(good.seller) === String(me)) return res.status(400).json({ msg: 'Cannot start a deal on your own post' });
    if (good.status === 'completed') return res.status(400).json({ msg: 'Already completed' });

    const existing = await Transaction.findOne({ good: goodId, buyer: me, status: 'pending' });
    if (existing) return res.json(existing);

    const kind = good.kind === 'buyer-request' ? 'buyer-request' : good.kind === 'barter' ? 'barter' : 'sell';

    const seller = kind === 'buyer-request' ? me : good.seller;
    const buyer = kind === 'buyer-request' ? good.seller : me;

    const tx = await Transaction.create({
      good: goodId, seller, buyer, kind,
      price: good.price || good.budgetMax || good.giveValue || 0,
    });
    res.status(201).json(tx);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.get('/pending-confirmations', auth, async (req, res) => {
  try {
    const me = String(req.user._id || req.userId);
    const txs = await Transaction.find({
      $or: [
        { seller: me, status: 'pending' },
        { buyer: me, status: 'pending' },
        { seller: me, status: 'completed' },
        { buyer: me, status: 'completed' },
      ],
    })
    .populate('good', 'name giveName wantName images')
    .populate('seller', 'name username avatar')
    .populate('buyer', 'name username avatar')
    .sort({ updatedAt: -1 })
    .lean();

    const needsMe = [];
    for (const tx of txs) {
      const isSeller = String(tx.seller._id) === me;
      const myConfirmed = isSeller ? tx.sellerConfirmed : tx.buyerConfirmed;
      const otherConfirmed = isSeller ? tx.buyerConfirmed : tx.sellerConfirmed;

      if (tx.status === 'pending' && otherConfirmed && !myConfirmed) {
        needsMe.push({ ...tx, reason: 'awaiting-you' });
      }
      if (tx.status === 'completed') {

        const reviewed = await Review.findOne({ good: tx.good._id, reviewer: me });
        if (!reviewed) needsMe.push({ ...tx, reason: 'review' });
      }
    }
    res.json(needsMe);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});


router.get('/:id', auth, async (req, res) => {
  const tx = await Transaction.findById(req.params.id)
    .populate('good')
    .populate('seller', 'name username avatar')
    .populate('buyer', 'name username avatar')
    .lean();
  if (!tx) return res.status(404).json({ msg: 'Not found' });
  const me = String(req.user._id || req.userId);
  if (String(tx.seller._id) !== me && String(tx.buyer._id) !== me) return res.status(403).json({ msg: 'Not your deal' });
  res.json(tx);
});


router.post('/:id/confirm', auth, async (req, res) => {
  const me = String(req.user._id || req.userId);
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ msg: 'Not found' });
  if (tx.status === 'completed') return res.json(tx);

  const isSeller = String(tx.seller) === me;
  const isBuyer = String(tx.buyer) === me;
  if (!isSeller && !isBuyer) return res.status(403).json({ msg: 'Not your deal' });

  if (isSeller) { tx.sellerConfirmed = true; tx.sellerConfirmedAt = new Date(); }
  if (isBuyer) { tx.buyerConfirmed = true; tx.buyerConfirmedAt = new Date(); }


  if (tx.sellerConfirmed && tx.buyerConfirmed) {
    tx.status = 'completed';
    tx.completedAt = new Date();
    await Good.findByIdAndUpdate(tx.good, {
      status: 'completed',
      completedAt: new Date(),
      buyer: tx.buyer, 
      seller: tx.seller,
    });
  }

  await tx.save();
  res.json(tx);
});

router.post('/:id/cancel', auth, async (req, res) => {
  const me = String(req.user._id || req.userId);
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ msg: 'Not found' });
  if (String(tx.seller) !== me && String(tx.buyer) !== me) return res.status(403).json({ msg: 'Not your deal' });
  if (tx.status === 'completed') return res.status(400).json({ msg: 'Already completed, cannot cancel' });
  tx.status = 'cancelled';
  await tx.save();
  res.json(tx);
});

module.exports = router;