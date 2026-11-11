import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const TYPES = ['Electronics', 'Fashion', 'Home & Furniture', 'Phones & Tablets', 'Vehicles', 'Beauty', 'Food', 'Others'];
const API = 'http://localhost:5000/api/goods';

function BuyersDescription() {
    const navigate = useNavigate();
    const [media, setMedia] = useState([]);
    const [isPosting, setIsPosting] = useState(false);

    const [form, setForm] = useState({
        name: '', type: 'Electronics', budgetMin: '', budgetMax: '',
        condition: 'Any', location: '', quantity: '1', urgency: 'This week',
        phone: '', description: '', features: '',
    });

    useEffect(() => {
        const saved = JSON.parse(sessionStorage.getItem('buyers_draft_media') || '[]');
        setMedia(saved);
        if (saved.length === 0) navigate('/buyers-upload');
    }, [navigate]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFile = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setMedia(prev => {
                    // ✅ FIX 1: was slice(0,3) -> now 5, same as Sell / Barter
                    const next = [...prev, { type: file.type.startsWith('video') ? 'video' : 'image', src: reader.result }].slice(0, 5);
                    sessionStorage.setItem('buyers_draft_media', JSON.stringify(next));
                    return next;
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeMedia = (i) => {
        const next = media.filter((_, idx) => idx !== i);
        setMedia(next);
        sessionStorage.setItem('buyers_draft_media', JSON.stringify(next));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.budgetMax || !form.location) {
            alert('Add what you want, your max budget and location');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) { alert('Login first'); navigate('/login'); return; }

        setIsPosting(true);

        // ✅ FIX 2: get real user, so list/detail show buyer name
        const me = JSON.parse(localStorage.getItem('current_user') || '{}');

        const payload = {
            kind: 'buyer-request',
            name: form.name,
            type: form.type,
            condition: form.condition,
            location: form.location,
            phone: form.phone,
            description: form.description,
            features: form.features.split(',').map(f => f.trim()).filter(Boolean),
            images: media.filter(m => m.type === 'image').map(m => m.src),
            videos: media.filter(m => m.type === 'video').map(m => m.src),
            // ✅ FIX 3: keep both - Market uses price, Detail uses budgetMin/Max
            price: Number(form.budgetMax) || 0,
            budgetMin: Number(form.budgetMin) || 0,
            budgetMax: Number(form.budgetMax) || 0,
            quantity: Number(form.quantity) || 1,
            // ❌ REMOVED: stock - Buy requests have no stock
            urgency: form.urgency,
            // ✅ FIX 2: buyer identity for Market + Detail + MongoDB
            sellerName: me.name || '',
            buyer: me.name || '',
            seller: me._id || null,
            buyerId: me._id || null,
        };

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            // ✅ FIX 4: backend sends { error }, not { msg }
            if (!res.ok) { alert(data.error || data.msg || 'Post failed'); return; }
            sessionStorage.removeItem('buyers_draft_media');
            navigate('/buyers');
        } catch {
            alert('Cannot connect to server - is server running on :5000?');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="upload-page">
            <button type="button" onClick={() => navigate('/buyers-upload')}>← Back to Camera</button>
            <h2>What Do You Want To Buy?</h2>
            <p>Post a request - sellers near you will see it and offer you their goods.</p>

            <form onSubmit={handleSubmit} className="upload-form">
                <label className="upload-label">Example Photo / Video (up to 5) *</label>
                <div className="img-preview">
                    {media.map((m, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            {m.type === 'image' ? <img src={m.src} alt="" /> : <video src={m.src} controls muted />}
                            <button type="button" onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: '#fff', border: 0, borderRadius: '50%', width: 22, height: 22 }}>✕</button>
                        </div>
                    ))}
                    {media.length < 5 && (
                        <label className="add-photo">+ Add Photo<input type="file" accept="image/*,video/*" multiple hidden onChange={handleFile} /></label>
                    )}
                </div>
                <small>{media.length} / 5 media</small>

                <label>What do you want? *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. iPhone 13 Pro Max 256GB / 3-bedroom flat in Lekki" required />

                <div className="row">
                    <div>
                        <label>Type / Category *</label>
                        <select name="type" value={form.type} onChange={handleChange}>
                            {TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Condition Accepted</label>
                        <select name="condition" value={form.condition} onChange={handleChange}>
                            <option>Any</option><option>New Only</option><option>Like New</option><option>Used - Good</option>
                        </select>
                    </div>
                </div>

                <div className="row">
                    <div>
                        <label>Budget From (₦)</label>
                        <input name="budgetMin" type="number" value={form.budgetMin} onChange={handleChange} placeholder="e.g. 400000" />
                    </div>
                    <div>
                        <label>Budget Up To (₦) *</label>
                        <input name="budgetMax" type="number" value={form.budgetMax} onChange={handleChange} placeholder="e.g. 450000" required />
                    </div>
                </div>

                <div className="row">
                    <div>
                        <label>Your Location *</label>
                        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Ikeja, Lagos" required />
                    </div>
                    <div>
                        <label>How Many?</label>
                        <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} />
                    </div>
                </div>

                <label>How Urgent?</label>
                <select name="urgency" value={form.urgency} onChange={handleChange}>
                    <option>Today</option><option>This week</option><option>This month</option><option>Not urgent - just checking price</option>
                </select>

                <label>WhatsApp / Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 0803..." required />

                <label>Description - Be specific so sellers can help *</label>
                <textarea name="description" rows="4" value={form.description} onChange={handleChange} placeholder="Color, size, brand, must-have features, what you will NOT accept..." required />

                <label>Must-Have Features (separate with comma)</label>
                <input name="features" value={form.features} onChange={handleChange} placeholder="e.g. Battery 90%+, Original box, Lagos pickup only" />

                <button type="submit" className="pub-btn" disabled={isPosting}>
                    {isPosting ? 'Posting...' : 'Post Buy Request →'}
                </button>
            </form>
        </div>
    );
}

export default BuyersDescription;