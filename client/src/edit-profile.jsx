import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', age: '',
    gender: 'Male', location: '', country: 'Nigeria', state: '',
    street: '', bio: '', purpose: '', avatar: '', cover: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // ✅ FIX 1: Fill instantly from localStorage (from Register/Login)
    // so form is never blank while backend loads
    try {
      const cached = JSON.parse(localStorage.getItem('current_user') || '{}');
      if (cached._id) {
        setForm(prev => ({
          ...prev,
          name: cached.name || '', username: cached.username || '', email: cached.email || '',
          phone: cached.phone || '', age: cached.age || '', gender: cached.gender || 'Male',
          location: cached.location || '', country: cached.country || 'Nigeria',
          state: cached.state || '', street: cached.street || '',
          bio: cached.bio || '', purpose: cached.purpose || '',
          avatar: cached.avatar || '', cover: cached.cover || '',
        }));
      }
    } catch {}

    // ✅ FIX 2: Then overwrite with fresh backend data (source of truth)
    fetch('http://localhost:5000/api/profile/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json().catch(() => ({})))
      .then(d => {
        if (d.msg) { setError(d.msg); return; } // 401 / 404 shows real reason
        const u = d.user || d;
        if (!u || !u._id) return;
        setForm(prev => ({
          ...prev,
          name: u.name || '', username: u.username || '', email: u.email || '',
          phone: u.phone || '', age: u.age || '', gender: u.gender || 'Male',
          location: u.location || '', country: u.country || 'Nigeria',
          state: u.state || '', street: u.street || '',
          bio: u.bio || '', purpose: u.purpose || '',
          avatar: u.avatar || '', cover: u.cover || '',
        }));
      })
      .catch(() => setError('Cannot connect to server'));
  }, [navigate]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleImage = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm(p => ({ ...p, [field]: canvas.toDataURL('image/jpeg', 0.8) }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await fetch('http://localhost:5000/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.msg || data.error || 'Save failed'); setLoading(false); return; }

      // ✅ FIX 3: Save ONLY the user object, not the whole { user } wrapper
      const savedUser = data.user || data;
      localStorage.setItem('current_user', JSON.stringify(savedUser));
      window.dispatchEvent(new Event('user-updated'));
      navigate('/profile');
    } catch { setError('Cannot connect to server'); setLoading(false); }
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-card">
        <button className="back-link" onClick={() => navigate('/profile')}>← Back to Profile</button>
        <h1>Edit Profile</h1>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={save}>
          <div className="edit-cover" style={{ backgroundImage: form.cover ? `url(${form.cover})` : 'linear-gradient(135deg,#1dbf73,#0e8a4f,#111)' }}>
            <label className="cover-edit">📷 Change Cover<input type="file" accept="image/*" hidden onChange={(e) => handleImage(e, 'cover')} /></label>
          </div>
          <div className="edit-avatar-row">
            <img src={form.avatar || DefaultUser} alt="" className="edit-avatar" />
            <label className="upload-btn">📷 Change Photo<input type="file" accept="image/*" hidden onChange={(e) => handleImage(e, 'avatar')} /></label>
          </div>

          <h3>Basic Info</h3>
          <label>Full Name</label><input name="name" value={form.name} onChange={onChange} required />
          <label>Username</label><input name="username" value={form.username} onChange={onChange} required />
          <div className="row">
            <div><label>Email</label><input name="email" type="email" value={form.email} onChange={onChange} required readOnly style={{ opacity: 0.6 }} /></div>
            <div><label>Phone / WhatsApp</label><input name="phone" value={form.phone} onChange={onChange} required /></div>
          </div>
          <div className="row">
            <div><label>Age</label><input name="age" type="number" value={form.age} onChange={onChange} /></div>
            <div><label>Gender</label><select name="gender" value={form.gender} onChange={onChange}><option>Male</option><option>Female</option><option>Other</option></select></div>
          </div>

          <h3>Location</h3>
          <label>Location</label><input name="location" value={form.location} onChange={onChange} placeholder="e.g. Ikeja, Lagos" />
          <div className="row">
            <div><label>Country</label><select name="country" value={form.country} onChange={onChange}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>South Africa</option><option>USA</option><option>UK</option><option>Others</option></select></div>
            <div><label>State</label><input name="state" value={form.state} onChange={onChange} placeholder="e.g. Lagos" /></div>
          </div>
          <label>Street Address</label><input name="street" value={form.street} onChange={onChange} placeholder="e.g. 12 Allen Avenue" />

          <h3>About You</h3>
          <label>Bio</label><input name="bio" value={form.bio} onChange={onChange} placeholder="e.g. Trusted seller in Lagos" />
          <label>Purpose</label><textarea name="purpose" value={form.purpose} onChange={onChange} rows={3} placeholder="e.g. I want to sell my used phones..." />

          <div className="edit-actions">
            <button type="button" className="ghost-btn" onClick={() => navigate('/profile')}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default EditProfile;