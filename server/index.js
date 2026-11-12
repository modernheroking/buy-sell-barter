const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('./models/User'); // <-- change to your User model path

// Email sender - use your Gmail App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g. buysellbarter@gmail.com
        pass: process.env.EMAIL_PASS, // Gmail App Password, NOT normal password
    },
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: 'Email is required' });

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        // Always return same message - don't leak if email exists or not
        if (!user) {
            return res.json({ msg: 'If an account exists with that email, a reset link has been sent.' });
        }

        // Create token, hash it, save hashed version
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'https://buy-sell-barter.site.je'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"Buy-Sell-Barter" <${process.env.EMAIL_USER}>`,
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
            `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: 'If an account exists with that email, a reset link has been sent. Check your inbox & spam.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ msg: 'Server error. Try again.' });
    }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: 'Reset link is invalid or expired. Request a new one.' });
        }

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