import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import AppIcon from './assets/app_icon.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/profile';

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (location.state?.registered) {
      setSuccess(location.state.message || 'Account created! Login now to confirm.');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ✅ Load Google script + render Google button
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
      );
    };

    const handleGoogleLogin = async (response) => {
      setGoogleLoading(true);
      setError('');
      try {
        const res = await fetch('https://buy-sell-barter.onrender.com/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.msg || 'Google login failed');
          setGoogleLoading(false);
          return;
        }
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('current_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('user-updated'));
        navigate(from, { replace: true });
      } catch {
        setError('Cannot connect to server.');
        setGoogleLoading(false);
      }
    };

    // Load script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, [from, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('https://buy-sell-barter.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.msg || data.message || data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('current_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('user-updated'));
      navigate(from, { replace: true });

    } catch (err) {
      setError('Cannot connect to server. Is backend running on port 5000?');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={AppIcon} alt="Buy & Sell" className="login-logo" />
        <h1>Welcome Back</h1>
        <p className="login-sub">Login to buy, sell & barter</p>

        {success && (
          <div className="login-success" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>
            ✅ {success}
          </div>
        )}

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
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

          <div className="login-row">
            <label className="login-remember"><input type="checkbox" /> Remember me</label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        {/* ✅ REAL Google button - rendered by Google */}
        {googleLoading && <p style={{ textAlign: 'center', fontSize: 13 }}>Signing in with Google...</p>}
        <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}></div>

        <p className="login-switch">
          Don't have an account? <Link to="/register">Create Account →</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;