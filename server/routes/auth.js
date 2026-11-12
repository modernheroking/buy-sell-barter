const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ================= REGISTER =================
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
    const exists = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
    if (exists) {
      return res.status(400).json({ msg: 'Email or username taken' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(), username: cleanUsername, email: cleanEmail, phone: phone.trim(),
      age: Number(age), gender: gender || 'Male', location: location.trim(),
      password: hashed, country: 'Nigeria', bio: '', purpose: '',
      authProvider: 'email', profileComplete: true,
    });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.status(201).json({ token, user: safeUser });
  } catch (e) {
    console.log('Register error:', e);
    if (e.code === 11000) return res.status(400).json({ msg: 'Email or username already taken' });
    res.status(500).json({ msg: e.message });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ msg: 'User not found. Please register first.' });
    if (!user.password) return res.status(400).json({ msg: 'This account was created with Google. Please use Continue with Google.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Wrong password' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user.toObject();
    res.json({ token, user: safeUser });
  } catch (e) {
    console.log('Login error:', e);
    res.status(500).json({ msg: e.message });
  }
});

// ================= GOOGLE =================
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ msg: 'No Google credential' });
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload.email_verified) return res.status(400).json({ msg: 'Google email not verified' });
        const email = payload.email.toLowerCase();
        let user = await User.findOne({ email });
        if (!user) {
            let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
            if (base.length < 3) base = base + 'user';
            let cleanUsername = base;
            let tries = 0;
            while (await User.findOne({ username: cleanUsername }) && tries < 10) {
                cleanUsername = base + Math.floor(Math.random() * 10000);
                tries++;
            }
            user = await User.create({
                name: payload.name, username: cleanUsername, email: email, phone: '',
                avatar: payload.picture || '', googleId: payload.sub, authProvider: 'google',
                password: '', country: 'Nigeria', profileComplete: false,
            });
        } else {
            if (!user.googleId) {
                user.googleId = payload.sub;
                if (user.authProvider === 'email') user.authProvider = 'email';
                if (!user.avatar) user.avatar = payload.picture || '';
                await user.save();
            }
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...safeUser } = user.toObject();
        res.json({ token, user: safeUser });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(400).json({ msg: 'Google login failed. Try again.' });
    }
});

// ================= FORGOT PASSWORD =================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: 'Email is required' });
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.json({ msg: 'A reset link has been sent.' });
        if (!user.password && user.googleId) return res.json({ msg: 'A reset link has been sent.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'https://buy-sell-barter.site.je'}/reset-password/${resetToken}`;

        // Send via Resend - HTTPS, works on Render
        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Buy-Sell-Barter <onboarding@resend.dev>',
                to: user.email,
                subject: 'Reset Your Buy-Sell-Barter Password',
                html: `
                <div style="font-family: Arial; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                    <h2 style="color: #111;">Reset Your Password</h2>
                    <p>Hi ${user.name || 'there'},</p>
                    <p>You requested to reset your password. Click the button below:</p>
                    <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
                    <p style="margin-top: 16px;">Or copy this link:<br><a href="${resetUrl}">${resetUrl}</a></p>
                    <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
                </div>
                `
            })
        });

        if (!resendRes.ok) {
            console.log('Resend error:', await resendRes.text());
        }

        res.json({ msg: 'If an account exists with that email, a reset link has been sent. Check your inbox & spam.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ msg: 'Server error. Try again.' });
    }
});

// ================= RESET PASSWORD =================
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Reset link is invalid or expired. Request a new one.' });
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.json({ msg: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ msg: 'Server error. Try again.' });
    }
});

module.exports = router;