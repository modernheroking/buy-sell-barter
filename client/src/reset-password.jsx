import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './App.css';
import AppIcon from './assets/app_icon.png';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`https://buy-sell-barter.onrender.com/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.msg || data.message || data.error || 'Reset link is invalid or expired. Request a new one.');
                setLoading(false);
                return;
            }

            setSuccess('Password reset successful! Redirecting to login...');
            setLoading(false);
            setTimeout(() => navigate('/login', { state: { message: 'Password reset successful. Login with your new password.' } }), 2000);
        } catch {
            setError('Cannot connect to server. Try again.');
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <img src={AppIcon} alt="Buy & Sell" className="login-logo" />
                <h1>Reset Password</h1>
                <p className="login-sub">Enter your new password</p>

                {success && (
                    <div className="login-success" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>
                        ✅ {success}
                    </div>
                )}
                {error && <div className="login-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <label>New Password</label>
                    <div className="login-password-wrap">
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="button" className="login-show-pass" onClick={() => setShowPass(!showPass)}>
                            {showPass ? '🙈' : '👁️'}
                        </button>
                    </div>

                    <label>Confirm New Password</label>
                    <div className="login-password-wrap">
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="login-switch">
                    <Link to="/forgot-password">Request a new link →</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;