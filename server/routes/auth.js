const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;


router.post('/register', async (req, res) => {
  try {
    const { name, username, email, phone, age, gender, location, password } = req.body;

    if (!name || !username || !email || !phone || !age || !location || !password) {
      return res.status(400).json({ msg: 'Name, username, email, phone, age, location and password are required' });
    }

    if (Number(age) < 13 || Number(age) > 120) {
      return res.status(400).json({ msg: 'Enter a valid age' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    if (username.length < 3) {
      return res.status(400).json({ msg: 'Username must be at least 3 characters' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const exists = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });
    if (exists) {
      return res.status(400).json({ msg: 'Email or username taken' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: phone.trim(),
      age: Number(age),
      gender: gender || 'Male',
      location: location.trim(),
      password: hashed,
      country: 'Nigeria',
      bio: '',
      purpose: '',
      profileComplete: true,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({ token, user: safeUser });

  } catch (e) {
    console.log('Register error:', e);
    if (e.code === 11000) {
      return res.status(400).json({ msg: 'Email or username already taken' });
    }
    res.status(500).json({ msg: e.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'User not found. Please register first.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: 'Wrong password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.json({ token, user: safeUser });

  } catch (e) {
    console.log('Login error:', e);
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;