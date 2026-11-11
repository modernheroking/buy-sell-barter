const router = require('express').Router();
const auth = require('../middleware/auth');
const Good = require('../models/good');

const getOwnerId = (req) => req.user?._id || req.userId || req.user?.id;


router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.kind) filter.kind = req.query.kind;
    if (req.query.mode) filter.mode = req.query.mode;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.seller) filter.seller = req.query.seller;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    
    const goods = await Good.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name username avatar location country state')
      .lean();


    const out = goods.map(g => {
      const s = g.seller && typeof g.seller === 'object' ? g.seller : null;
      return {
        ...g,
        seller: s,
        sellerId: s?._id || g.sellerId || g.userId || g.seller || null,
        userId: g.userId || s?._id || g.seller || null,
        sellerName: s?.name || g.sellerName || 'Seller',
        sellerUsername: s?.username || g.sellerUsername || null,
        sellerAvatar: s?.avatar || g.sellerAvatar || null,
        // ✅ NEVER send phone to Market - strip it
        phone: undefined,
        sellerPhone: undefined,
      };
    });

    res.json(out);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const goods = await Good.find({ $or: [{ seller: ownerId }, { userId: ownerId }] })
      .sort({ createdAt: -1 })
      .populate('seller', 'name username avatar location');
    res.json(goods);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {

    const g = await Good.findById(req.params.id)
      .populate('seller', 'name username avatar location country state bio purpose createdAt')
      .lean();
    if (!g) return res.status(404).json({ msg: 'Not found' });

    const s = g.seller && typeof g.seller === 'object' ? g.seller : null;
    res.json({
      ...g,
      seller: s,
      sellerId: s?._id || g.sellerId || g.userId || g.seller || null,
      sellerName: s?.name || g.sellerName,
      sellerUsername: s?.username || g.sellerUsername,
      sellerAvatar: s?.avatar || g.sellerAvatar,
      phone: undefined,
      sellerPhone: undefined,
    });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const b = req.body;
    const ownerId = getOwnerId(req);
    const mode = b.mode || 'Sell';
    const kind = b.kind || (mode === 'Buy' ? 'buyer-request' : mode === 'Barter' ? 'barter' : 'seller');

    if (kind === 'buyer-request' && (!b.name || !b.budgetMax || !b.location)) {
      return res.status(400).json({ msg: 'What you want, max budget + location required' });
    }
    if (kind === 'barter' && (!b.giveName || !b.wantName || !b.location)) {
      return res.status(400).json({ msg: 'Give item, want item + location required' });
    }
    if (kind === 'seller' && (!b.name || !b.location)) {
      return res.status(400).json({ msg: 'Name + location required' });
    }
    if (kind === 'seller' && !b.price) {
      return res.status(400).json({ msg: 'Price required' });
    }


    const good = await Good.create({

      seller: ownerId,
      userId: ownerId,
      sellerId: ownerId,
      sellerName: req.user?.name,
      sellerUsername: req.user?.username,
      sellerAvatar: req.user?.avatar,

      kind, mode,

      name: b.name || `${b.giveName} ⇄ ${b.wantName}`,
      type: b.type || b.giveType || 'Electronics',
      condition: b.condition || b.giveCondition || 'Used - Good',
      location: b.location,

      description: b.description || b.giveDescription || '',
      features: Array.isArray(b.features) ? b.features : [],
      images: b.images || [],
      videos: b.videos || [],
      oldPrice: Number(b.oldPrice) || null,
      status: b.status || 'active',

      budgetMin: Number(b.budgetMin) || null,
      budgetMax: Number(b.budgetMax) || 0,
      quantity: Number(b.quantity) || 1,
      urgency: b.urgency,

      price: Number(b.price) || Number(b.budgetMax) || Number(b.giveValue) || 0,
      stock: Number(b.stock) || Number(b.quantity) || 1,

      giveName: b.giveName,
      giveType: b.giveType,
      giveCondition: b.giveCondition,
      giveValue: Number(b.giveValue) || 0,
      giveDescription: b.giveDescription,
      giveFeatures: Array.isArray(b.giveFeatures) ? b.giveFeatures : [],

      wantName: b.wantName,
      wantType: b.wantType,
      wantCondition: b.wantCondition,
      wantValue: Number(b.wantValue) || 0,
      wantDescription: b.wantDescription,
      wantFeatures: Array.isArray(b.wantFeatures) ? b.wantFeatures : [],
      wantImages: b.wantImages || [],
      wantVideos: b.wantVideos || [],
      wantMedia: b.wantMedia || [],
      flexible: b.flexible,
    });

    res.json(good);
  } catch (e) { console.log(e); res.status(500).json({ msg: e.message }); }
});

router.put('/:id/complete', auth, async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const good = await Good.findOneAndUpdate(
      { _id: req.params.id, $or: [{ seller: ownerId }, { userId: ownerId }] },
      { status: 'completed' },
      { new: true }
    );
    if (!good) return res.status(404).json({ msg: 'Not found or not yours' });
    res.json(good);
  } catch (e) { res.status(500).json({ msg: e.message }); }
});


router.put('/:id/complete', auth, async (req, res) => {
  const good = await Good.findById(req.params.id);
  if (!good) return res.status(404).json({ msg: 'Not found' });
  if (String(good.seller) !== String(req.user._id)) return res.status(403).json({ msg: 'Not yours' });
  good.status = 'completed';
  good.completedAt = new Date();
  good.buyer = req.body.buyerId || good.buyer || null; 
  await good.save();
  res.json(good);
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const g = await Good.findOne({ _id: req.params.id, $or: [{ seller: ownerId }, { userId: ownerId }] });
    if (!g) return res.status(404).json({ msg: 'Not found or not yours' });
    await g.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;