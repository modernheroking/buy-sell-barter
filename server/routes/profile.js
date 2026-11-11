const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Good = require('../models/good'); 

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name, username, email, phone, age, gender, location, country, state, street, bio, purpose, avatar, cover } = req.body;

    if (username) {
      const taken = await User.findOne({ username: username.toLowerCase().trim(), _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ msg: 'Username already taken' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name: name.trim() }),
        ...(username && { username: username.toLowerCase().trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(age && { age: Number(age) }),
        ...(gender && { gender }),
        ...(location && { location: location.trim() }),
        ...(country && { country }),
        ...(state !== undefined && { state }),
        ...(street !== undefined && { street }),
        ...(bio !== undefined && { bio }),
        ...(purpose !== undefined && { purpose }),
        ...(avatar !== undefined && { avatar }),
        ...(cover !== undefined && { cover }),
        profileComplete: true,
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user: updated });
  } catch (e) {
    console.log('Profile update error:', e);
    if (e.code === 11000) return res.status(400).json({ msg: 'Username already taken' });
    res.status(500).json({ msg: e.message });
  }
});


router.get('/user/:idOrUsername', async (req, res) => {
  try {
    const { idOrUsername } = req.params;
    console.log('PUBLIC PROFILE HIT:', idOrUsername); 


    const query = /^[0-9a-fA-F]{24}$/.test(idOrUsername)
      ? { _id: idOrUsername }
      : { username: idOrUsername.toLowerCase() };


    const user = await User.findOne(query).select('name username avatar cover bio purpose location country state createdAt');
    if (!user) return res.status(404).json({ msg: 'User not found' });


    const goods = await Good.find({ $or: [{ seller: user._id }, { userId: user._id }, { sellerId: user._id }] })
      .sort({ createdAt: -1 })
      .select('-phone -sellerPhone')
      .lean();


    let reviews = [];
    try {
      const Review = require('../models/review');
      reviews = await Review.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    } catch {
      reviews = [];
    }

    res.json({ user, goods, reviews });
  } catch (e) {
    console.log('Public profile error:', e);
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;