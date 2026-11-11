const router = require('express').Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Good = require('../models/Good');

router.get('/user/:userId', async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name username avatar')
    .populate('good', 'name giveName wantName')
    .sort({ createdAt: -1 }).lean();
  res.json(reviews);
});

router.get('/mine', auth, async (req, res) => {
  const reviews = await Review.find({ reviewee: req.user._id })
    .populate('reviewer', 'name username avatar')
    .sort({ createdAt: -1 }).lean();
  res.json(reviews);
});

router.get('/eligible', auth, async (req, res) => {
  const me = req.user._id;
  const goods = await Good.find({
    status: 'completed',
    $or: [{ seller: me }, { buyer: me }],
  }).populate('seller buyer', 'name username avatar').sort({ completedAt: -1 }).lean();

  const reviewed = await Review.find({ reviewer: me }).distinct('good');
  const reviewedSet = new Set(reviewed.map(String));

  const eligible = goods
    .filter(g => !reviewedSet.has(String(g._id)))
    .map(g => {
      const isSeller = String(g.seller?._id || g.seller) === String(me);
      const other = isSeller ? g.buyer : g.seller;
      return { good: g, reviewee: other };
    })
    .filter(x => x.reviewee); 

  res.json(eligible);
});


router.post('/', auth, async (req, res) => {
  try {
    const { goodId, stars, text } = req.body;
    const me = req.user._id;
    if (!goodId || !stars || !text?.trim()) return res.status(400).json({ msg: 'goodId, stars, text required' });
    if (stars < 1 || stars > 5) return res.status(400).json({ msg: 'Stars 1-5' });

    const good = await Good.findById(goodId);
    if (!good) return res.status(404).json({ msg: 'Transaction not found' });
    if (good.status !== 'completed') return res.status(400).json({ msg: 'Can only review completed transactions' });

    const isSeller = String(good.seller) === String(me);
    const isBuyer = String(good.buyer) === String(me);
    if (!isSeller && !isBuyer) return res.status(403).json({ msg: 'You were not part of this transaction' });

    const reviewee = isSeller ? good.buyer : good.seller;
    if (!reviewee) return res.status(400).json({ msg: 'No counterpart to review' });
    if (String(reviewee) === String(me)) return res.status(400).json({ msg: 'Cannot review yourself' });

    const exists = await Review.findOne({ good: goodId, reviewer: me });
    if (exists) return res.status(400).json({ msg: 'Already reviewed this transaction' });

    const review = await Review.create({ good: goodId, reviewer: me, reviewee, stars, text: text.trim() });
    res.status(201).json(review);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ msg: 'Already reviewed' });
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;