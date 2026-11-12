import { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import AppIcon from './assets/app_icon.png';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('https://buy-sell-barter.onrender.com/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.msg || data.message || data.error || 'Something went wrong. Try again.');
                setLoading(false);
                return;
            }

            setSuccess(data.msg || 'If an account exists with that email, a reset link has been sent. Check your inbox & spam.');
            setLoading(false);
        } catch {
            setError('Cannot connect to server. Try again.');
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <img src={AppIcon} alt="Buy & Sell" className="login-logo" />
                <h1>Forgot Password?</h1>
                <p className="login-sub">Enter your email and we will send you a reset link</p>

                {success && (
                    <div className="login-success" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>
                        ✅ {success}
                    </div>
                )}
                {error && <div className="login-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="you@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="login-switch">
                    Remembered? <Link to="/login">Back to Login →</Link>
                </p>
                <p className="login-switch">
                    Don't have an account? <Link to="/register">Create Account →</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;