import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const API = 'http://localhost:5000/api/goods';

function SellersDescription() {
    const navigate = useNavigate();
    const [media, setMedia] = useState([]);

    const [form, setForm] = useState({
        name: '', type: 'Electronics', price: '', oldPrice: '',
        condition: 'New', location: '', stock: '1', phone: '',
        description: '', features: '',
    });

    useEffect(() => {
        const savedMedia = JSON.parse(sessionStorage.getItem('sellers_draft_media') || '[]');
        setMedia(savedMedia);
        if (savedMedia.length === 0) navigate('/sellers-upload');
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFile = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setMedia(prev => {
                    const next = [...prev, { type: file.type.startsWith('video') ? 'video' : 'image', src: reader.result }].slice(0, 5);
                    sessionStorage.setItem('sellers_draft_media', JSON.stringify(next));
                    return next;
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (i) => {
        const next = media.filter((_, idx) => idx !== i);
        setMedia(next);
        sessionStorage.setItem('sellers_draft_media', JSON.stringify(next));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.location) return alert('Add name + location');
        if (!form.price) return alert('Add price');

  
        const token = localStorage.getItem('token');
        if (!token) { alert('Login first to post'); navigate('/login'); return; }

        const me = JSON.parse(localStorage.getItem('current_user') || '{}');

        const payload = {
            kind: 'seller',
            mode: 'Sell',
            name: form.name,
            type: form.type,
            price: Number(form.price) || 0,
            oldPrice: Number(form.oldPrice) || 0,
            condition: form.condition,
            location: form.location,
            stock: Number(form.stock) || 1,
            phone: form.phone,
            description: form.description,
            features: form.features.split(',').map(f => f.trim()).filter(Boolean),
            images: media.filter(m => m.type === 'image').map(m => m.src),
            videos: media.filter(m => m.type === 'video').map(m => m.src),
            sellerName: me.name || '',
        };

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                console.log('❌ Save failed:', res.status, data);
                
                if (res.status === 401) {
                    alert('Session expired - login again');
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }
                return alert(data.msg || data.error || `Save failed (${res.status})`);
            }
            sessionStorage.removeItem('sellers_draft_media');
            sessionStorage.removeItem('sellers_draft_mode');
            navigate('/sellers');
        } catch (err) {
            console.log('❌ Network error:', err);
            alert('Cannot connect to server - is Express running on :5000?');
        }
    };

    return (
        <div className="upload-page">
            <button onClick={() => navigate('/sellers-upload')}>← Back to Camera</button>
            <h2>Add Description - Sell</h2>
            <p>Your media is saved. Now sell it well.</p>

            <div className="img-preview">
                {media.map((m, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                        {m.type === 'image' ? <img src={m.src} alt="" /> : <video src={m.src} controls muted />}
                        <button type="button" onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: '#fff', border: 0, borderRadius: '50%', width: 22, height: 22 }}>✕</button>
                    </div>
                ))}
                <label className="add-photo">+ Add More<input type="file" accept="image/*,video/*" multiple hidden onChange={handleFile} /></label>
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
                <label>Goods Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. iPhone 13 Pro Max" required />
                <div className="row">
                    <div><label>Type *</label>
                        <select name="type" value={form.type} onChange={handleChange}><option>Electronics</option><option>Fashion</option><option>Home & Furniture</option><option>Phones & Tablets</option><option>Vehicles</option><option>Beauty</option><option>Food</option><option>Others</option></select>
                    </div>
                    <div><label>Condition *</label>
                        <select name="condition" value={form.condition} onChange={handleChange}><option>New</option><option>Like New</option><option>Used - Good</option><option>Used - Fair</option></select>
                    </div>
                </div>
                <div className="row">
                    <div><label>Price (₦) *</label><input name="price" type="number" value={form.price} onChange={handleChange} placeholder="450000" required /></div>
                    <div><label>Old Price (₦)</label><input name="oldPrice" type="number" value={form.oldPrice} onChange={handleChange} placeholder="520000" /></div>
                </div>
                <div className="row">
                    <div><label>Location *</label><input name="location" value={form.location} onChange={handleChange} placeholder="Ikeja, Lagos" required /></div>
                    <div><label>Stock</label><input name="stock" type="number" min="1" value={form.stock} onChange={handleChange} /></div>
                </div>
                <label>WhatsApp / Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="0803..." required />
                <label>Description *</label>
                <textarea name="description" rows="4" value={form.description} onChange={handleChange} placeholder="What is it? Any fault? What is in box?" required />
                <label>Key Features (comma)</label>
                <input name="features" value={form.features} onChange={handleChange} placeholder="Battery 95%, Original charger" />
                <button type="submit" className="pub-btn">Post to Sellers →</button>
            </form>
        </div>
    );
}
export default SellersDescription;