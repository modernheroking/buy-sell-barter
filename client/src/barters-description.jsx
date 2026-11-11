import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const TYPES = ['Electronics', 'Fashion', 'Home & Furniture', 'Phones & Tablets', 'Vehicles', 'Beauty', 'Food', 'Others'];
const API = 'https://buy-sell-barter.onrender.com/api/goods';

function BartersDescription() {
    const navigate = useNavigate();
    const [media, setMedia] = useState([]);
    const [wantMedia, setWantMedia] = useState([]);
    const [isPosting, setIsPosting] = useState(false);

    const [form, setForm] = useState({
        giveName: '', giveType: 'Electronics', giveCondition: 'Used - Good',
        giveValue: '', location: '', giveDescription: '', giveFeatures: '',
        wantName: '', wantType: 'Electronics', wantCondition: 'Any',
        wantValue: '', wantDescription: '', wantFeatures: '',
        flexible: 'Yes - I can add cash if your item is better', phone: '',
    });

    useEffect(() => {
        const saved = JSON.parse(sessionStorage.getItem('barters_draft_media') || '[]');
        setMedia(saved);
        const savedWant = JSON.parse(sessionStorage.getItem('barters_draft_want_media') || '[]');
        setWantMedia(savedWant);
        if (saved.length === 0) navigate('/barters-upload');
    }, [navigate]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // --- GIVE media - up to 5 ---
    const handleFile = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setMedia(prev => {
                    const next = [...prev, { type: file.type.startsWith('video') ? 'video' : 'image', src: reader.result }].slice(0, 5);
                    sessionStorage.setItem('barters_draft_media', JSON.stringify(next));
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
        sessionStorage.setItem('barters_draft_media', JSON.stringify(next));
    };

    // --- WANT media - up to 3 examples ---
    const handleWantFile = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setWantMedia(prev => {
                    const next = [...prev, { type: file.type.startsWith('video') ? 'video' : 'image', src: reader.result }].slice(0, 3);
                    sessionStorage.setItem('barters_draft_want_media', JSON.stringify(next));
                    return next;
                });
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeWantMedia = (i) => {
        const next = wantMedia.filter((_, idx) => idx !== i);
        setWantMedia(next);
        sessionStorage.setItem('barters_draft_want_media', JSON.stringify(next));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.giveName || !form.wantName || !form.location || media.length === 0) {
            alert('Add what you give, what you want, location and at least 1 photo of your item');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) { alert('Login first'); navigate('/login'); return; }

        setIsPosting(true);
        const me = JSON.parse(localStorage.getItem('current_user') || '{}');

        const payload = {
            kind: 'barter',
            // ✅ FIX 3: top-level fields for Market / Detail / search
            name: `${form.giveName} ⇄ ${form.wantName}`,
            type: form.giveType,
            condition: form.giveCondition,
            description: form.giveDescription,
            price: Number(form.giveValue) || 0,
            location: form.location,
            phone: form.phone,
            // ✅ FIX 1: seller identity
            sellerName: me.name || '',
            seller: me._id || null,
            // Give
            images: media.filter(m => m.type === 'image').map(m => m.src),
            videos: media.filter(m => m.type === 'video').map(m => m.src),
            giveName: form.giveName,
            giveType: form.giveType,
            giveCondition: form.giveCondition,
            giveValue: Number(form.giveValue) || 0,
            giveDescription: form.giveDescription,
            giveFeatures: form.giveFeatures.split(',').map(f => f.trim()).filter(Boolean),
            // Want
            wantName: form.wantName,
            wantType: form.wantType,
            wantCondition: form.wantCondition,
            wantValue: Number(form.wantValue) || 0,
            wantDescription: form.wantDescription,
            wantFeatures: form.wantFeatures.split(',').map(f => f.trim()).filter(Boolean),
            wantImages: wantMedia.filter(m => m.type === 'image').map(m => m.src),
            wantVideos: wantMedia.filter(m => m.type === 'video').map(m => m.src),
            // ❌ FIX 4: REMOVED wantMedia raw objects - schema expects strings only
            flexible: form.flexible,
        };

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            // ✅ FIX 2: backend sends { error }, not { msg }
            if (!res.ok) { alert(data.error || data.msg || 'Post failed'); return; }
            sessionStorage.removeItem('barters_draft_media');
            sessionStorage.removeItem('barters_draft_want_media');
            navigate('/barters');
        } catch {
            alert('Cannot connect to server - is server running on :5000?');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="upload-page">
            <button type="button" onClick={() => navigate('/barters-upload')}>← Back to Camera</button>
            <h2>Barter - Swap Goods</h2>
            <p>No cash needed. Offer your goods, get what you want in return.</p>

            <form onSubmit={handleSubmit} className="upload-form">
                <h3 className="section-title">1. What You Give 🤝</h3>

                <label>Photos / Video of YOUR item (up to 5) *</label>
                <div className="img-preview">
                    {media.map((m, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            {m.type === 'image' ? <img src={m.src} alt="" /> : <video src={m.src} controls muted />}
                            <button type="button" onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: '#fff', border: 0, borderRadius: '50%', width: 22, height: 22 }}>✕</button>
                        </div>
                    ))}
                    {media.length < 5 && <label className="add-photo">+ Add Photo<input type="file" accept="image/*,video/*" multiple hidden onChange={handleFile} /></label>}
                </div>
                <small>{media.length} / 5</small>

                <label>Your Goods Name *</label>
                <input name="giveName" value={form.giveName} onChange={handleChange} placeholder="e.g. iPhone 12 128GB" required />

                <div className="row">
                    <div>
                        <label>Type *</label>
                        <select name="giveType" value={form.giveType} onChange={handleChange}>
                            {TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Condition *</label>
                        <select name="giveCondition" value={form.giveCondition} onChange={handleChange}>
                            <option>New</option><option>Like New</option><option>Used - Good</option><option>Used - Fair</option>
                        </select>
                    </div>
                </div>

                <div className="row">
                    <div>
                        <label>Estimated Value (₦) - helps fair swap</label>
                        <input name="giveValue" type="number" value={form.giveValue} onChange={handleChange} placeholder="e.g. 280000" />
                    </div>
                    <div>
                        <label>Your Location *</label>
                        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Ikeja, Lagos" required />
                    </div>
                </div>

                <label>Full Description of YOUR item *</label>
                <textarea name="giveDescription" rows="4" value={form.giveDescription} onChange={handleChange} placeholder="Brand, age, faults, battery, what's in the box, why are you swapping it?" required />

                <label>Key Features (comma)</label>
                <input name="giveFeatures" value={form.giveFeatures} onChange={handleChange} placeholder="e.g. Battery 92%, No scratch, Original charger" />

                <h3 className="section-title">2. What You Want In Return 🔄</h3>

                <label>Example Photo / Video of what you WANT (up to 3)</label>
                <div className="img-preview">
                    {wantMedia.map((m, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            {m.type === 'image' ? <img src={m.src} alt="" /> : <video src={m.src} controls muted />}
                            <button type="button" onClick={() => removeWantMedia(i)} style={{ position: 'absolute', top: 2, right: 2, background: '#7c3aed', color: '#fff', border: 0, borderRadius: '50%', width: 22, height: 22 }}>✕</button>
                        </div>
                    ))}
                    {wantMedia.length < 3 && <label className="add-photo">+ Add Example<input type="file" accept="image/*,video/*" multiple hidden onChange={handleWantFile} /></label>}
                </div>
                <small>{wantMedia.length} / 3 examples</small>
                <p style={{ fontSize: 12, color: '#666' }}>Screenshot / photo from internet of the PS5 / S22 you want - helps sellers know exactly.</p>

                <label>Item You Want *</label>
                <input name="wantName" value={form.wantName} onChange={handleChange} placeholder="e.g. Samsung S22 / PS5 / iPad / Laptop" required />

                <div className="row">
                    <div>
                        <label>Type You Want</label>
                        <select name="wantType" value={form.wantType} onChange={handleChange}>
                            {TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Condition You Accept</label>
                        <select name="wantCondition" value={form.wantCondition} onChange={handleChange}>
                            <option>Any</option><option>New Only</option><option>Like New</option><option>Used - Good</option>
                        </select>
                    </div>
                </div>

                <label>Value You Expect (₦) - optional</label>
                <input name="wantValue" type="number" value={form.wantValue} onChange={handleChange} placeholder="e.g. 300000 - if their item is worth more, you add cash" />

                <label>Full Description of What You Want *</label>
                <textarea name="wantDescription" rows="4" value={form.wantDescription} onChange={handleChange} placeholder="Exact model, color, storage, must-haves, what you will NOT accept..." required />

                <label>Must-Have Features (comma)</label>
                <input name="wantFeatures" value={form.wantFeatures} onChange={handleChange} placeholder="e.g. Must be 256GB, Must have receipt" />

                <label>Are You Flexible?</label>
                <select name="flexible" value={form.flexible} onChange={handleChange}>
                    <option>Yes - I can add cash if your item is better</option>
                    <option>Yes - I can accept cash if my item is better</option>
                    <option>Straight swap only - no cash</option>
                    <option>Open to other offers - surprise me</option>
                </select>

                <label>WhatsApp / Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 0803..." required />

                <button type="submit" className="pub-btn" disabled={isPosting}>
                    {isPosting ? 'Posting...' : 'Post Barter Offer →'}
                </button>
            </form>
        </div>
    );
}

export default BartersDescription;