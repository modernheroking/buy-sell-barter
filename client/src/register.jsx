import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', age: '',
    gender: 'Male', location: '', password: '', confirmPassword: '',
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.username || !form.email || !form.phone || !form.age || !form.location) {
      setError('Please fill all fields'); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setError('Enter a valid email'); return; }
    if (form.username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (Number(form.age) < 13 || Number(form.age) > 120) { setError('Enter a valid age'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = form;
      const res = await fetch('https://buy-sell-barter.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSend, age: Number(dataToSend.age) }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) { setError(data.msg || data.error || 'Registration failed'); setLoading(false); return; }

      // ✅ FIX: Register does NOT log you in anymore.
      // It only creates the user in MongoDB, then forces a fresh Login
      // so the token gets confirmed by /login. No stale token, no 401 on upload.
      // Do NOT save token / current_user here.
      navigate('/login', {
        state: {
          registered: true,
          email: form.email.toLowerCase().trim(),
          message: `Account created for @${form.username}! Login now to confirm.`
        }
      });
    } catch {
      setError('Cannot connect to server. Is Express running on port 5000?');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-sub">Join to buy, sell & barter.</p>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <label>Full Name</label>
          <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Adaeze Obi" required />

          <label>Username</label>
          <input name="username" value={form.username} onChange={onChange} placeholder="e.g. adaeze_obi" required />
          <small>@{form.username || 'yourname'}</small>

          <div className="row">
            <div><label>Email</label><input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@gmail.com" required /></div>
            <div><label>Phone / WhatsApp</label><input name="phone" value={form.phone} onChange={onChange} placeholder="e.g. 0803..." required /></div>
          </div>

          <div className="row">
            <div><label>Age</label><input name="age" type="number" min="13" max="120" value={form.age} onChange={onChange} placeholder="e.g. 24" required /></div>
            <div>
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={onChange}><option>Male</option><option>Female</option><option>Other</option></select>
            </div>
          </div>

          <label>Location</label>
          <input name="location" value={form.location} onChange={onChange} placeholder="e.g. Ikeja, Lagos" required />

          <div className="row">
            <div><label>Password</label><input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={onChange} placeholder="Min 6 chars" required /></div>
            <div><label>Confirm Password</label><input name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={onChange} required /></div>
          </div>

          <label className="check"><input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} /> Show password</label>

          <button type="submit" className="primary-btn auth-btn" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          <p className="auth-link">Already have account? <span onClick={() => navigate('/login')}>Login</span></p>
        </form>
      </div>
    </div>
  );
}
export default Register;