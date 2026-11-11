import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import AuthPrompt from './auth-prompt.jsx';
import './App.css';

const getLevel = (done) => {
  if (done >= 12) return { label: '⭐ Top Rated', next: null };
  if (done >= 6) return { label: 'Level 2', next: `${12 - done} more to Top Rated` };
  if (done >= 3) return { label: 'Level 1', next: `${6 - done} more to Level 2` };
  return { label: 'New Seller', next: `${3 - done} more to Level 1` };
};

function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('sell');
  const [all, setAll] = useState([]);
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('current_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [reviews, setReviews] = useState([]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuth(true);
      setLoading(false);
      return;
    }
    const headers = getHeaders();

    try {
      const r = await fetch('https://buy-sell-barter.onrender.com/api/profile/me', { headers });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) {
          localStorage.removeItem('token');
          setShowAuth(true);
        }
        setLoading(false);
        return;
      }
      const p = data.user || data.profile || data;
      if (p && p._id) {
        setProfile(p);
        localStorage.setItem('current_user', JSON.stringify(p));
      }
    } catch {}
    setLoading(false);

    try {
      const r = await fetch('https://buy-sell-barter.onrender.com/api/goods/mine', { headers });
      const data = await r.json().catch(() => []);
      setAll(Array.isArray(data) ? data : data.goods || []);
    } catch {}

    try {
      const r = await fetch('https://buy-sell-barter.onrender.com/api/reviews/mine', { headers });
      const data = await r.json().catch(() => []);
      setReviews(Array.isArray(data) ? data : data.reviews || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadProfile();
    const onUpdated = () => loadProfile();
    window.addEventListener('user-updated', onUpdated);
    const onFocus = () => loadProfile();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('user-updated', onUpdated);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadProfile]);

  const stats = useMemo(() => {
    const sell = all.filter((i) => !i.kind || i.kind === 'seller' || i.kind === 'sell');
    const buy = all.filter((i) => i.kind === 'buyer-request');
    const barter = all.filter((i) => i.kind === 'barter');
    const isDone = (i) => ['sold', 'completed', 'done', 'closed'].includes((i.status || '').toLowerCase());
    const totalDone = all.filter(isDone).length;
    return {
      sell: sell.length, buy: buy.length, barter: barter.length, total: all.length,
      sellDone: sell.filter(isDone).length, buyDone: buy.filter(isDone).length,
      barterDone: barter.filter(isDone).length, totalDone,
      totalValue: sell.reduce((s, i) => s + (Number(i.price) || 0), 0),
      // ✅ REAL: 0 goods = 0% success, not 100%
      successRate: all.length ? Math.round((totalDone / all.length) * 100) : 0,
      level: getLevel(totalDone),
    };
  }, [all]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.stars || 0), 0) / reviews.length
    : null;
  const starCounts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => Number(r.stars) === s).length);

  const shown = all.filter((i) => {
    if (tab === 'sell') return !i.kind || i.kind === 'seller' || i.kind === 'sell';
    if (tab === 'buy') return i.kind === 'buyer-request';
    if (tab === 'barter') return i.kind === 'barter';
    return true;
  });

  const deleteItem = async (id) => {
    if (!confirm('Delete this post?')) return;
    const headers = getHeaders();
    const res = await fetch(`https://buy-sell-barter.onrender.com/api/goods/${id}`, { method: 'DELETE', headers });
    if (!res.ok) return alert('Delete failed - login again');
    setAll((prev) => prev.filter((i) => (i._id || i.id) !== id));
  };

  const markDone = async (id) => {
    const username = window.prompt('Who did you complete this deal with? Enter their @username (or leave empty if you don\'t want a review for this deal):');
    const headers = getHeaders();
    let buyerId = null;
    if (username?.trim()) {
      try {
        const r = await fetch(`https://buy-sell-barter.onrender.com/api/users/by-username/${username.trim().replace(/^@/, '')}`, { headers });
        const d = await r.json().catch(() => ({}));
        buyerId = d._id || d.user?._id || null;
        if (!buyerId) alert('Username not found - marking done without counterpart. No review will be possible for this deal.');
      } catch {}
    }
    const res = await fetch(`https://buy-sell-barter.onrender.com/api/goods/${id}/complete`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerId }),
    });
    if (!res.ok) return alert('Mark done failed - login again');
    setAll((prev) => prev.map((i) => ((i._id || i.id) === id ? { ...i, status: 'completed' } : i)));
  };

  const Stars = ({ value, size = 16 }) => (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size, color: s <= value ? '#ffc107' : '#ddd' }}>★</span>
      ))}
    </span>
  );

  if (showAuth) {
    return (
      <div className="profile-page">
        <AuthPrompt onClose={() => navigate('/')} />
      </div>
    );
  }

  if (loading) return <div className="profile-page"><p style={{ textAlign: 'center', padding: 40 }}>Loading profile...</p></div>;
  if (!profile) return <div className="profile-page"><p style={{ textAlign: 'center', padding: 40 }}>Please login again. <button onClick={() => navigate('/login')}>Login</button></p></div>;

  const { avatar, cover, name, email, phone, location, country, state, street, gender, bio, username, purpose, profileComplete, createdAt, isPhoneVerified, isEmailVerified, isIdVerified } = profile;
  const joined = profile.joined || (createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');

  return (
    <div className="profile-page">
      <div className="profile-cover" style={{ backgroundImage: cover ? `url(${cover})` : 'linear-gradient(135deg,#1dbf73,#0e8a4f,#111)' }} />

      {profileComplete === false && (
        <div className="incomplete-banner">
          ⚠️ Your profile is not complete. <button onClick={() => navigate('/edit-profile')}>Complete it in Edit Profile →</button>
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-left">
          <div className="profile-card center">
            <div className="avatar-wrap">
              <img src={avatar || DefaultUser} alt={name} className="profile-avatar-lg" />
              <span className="online-dot" />
            </div>
            <h2>{name}</h2>
            {/* ✅ REAL level - calculated from completed deals */}
            <p className="handle">@{username || (name || '').toLowerCase().replace(/\s/g, '')} • {stats.level.label}</p>
            {stats.level.next && <p className="meta" style={{ color: '#1dbf73', fontWeight: 600 }}>{stats.level.next}</p>}

  
            {reviews.length > 0 ? (
              <>
                <Stars value={Math.round(avgRating)} />
                <p className="rating-line"><b>{avgRating.toFixed(1)}</b> ({reviews.length} reviews) • {stats.successRate}% Success • {stats.totalDone} successful</p>
              </>
            ) : (
              <p className="rating-line" style={{ color: '#888' }}>No reviews yet • {stats.successRate}% Success • {stats.totalDone} successful</p>
            )}

            <p className="meta">📍 {location || 'Location not set'}</p>
            <p className="meta">🌍 {country || ''} {state ? `• ${state}` : ''}</p>
            {joined && <p className="meta">🕒 Member since {joined}</p>}
            <p className="bio">{bio || ''}</p>
            {purpose && <div className="purpose-box"><b>🎯 My Purpose:</b><p>{purpose}</p></div>}
            <button className="edit-btn" onClick={() => navigate('/edit-profile')}>✏️ Edit Profile</button>
            <button className="msg-btn" onClick={() => navigate('/chats')}>💬 My Chats</button>
            <button className="msg-btn" onClick={() => navigate('/reviews')} style={{ background: '#ffc107', color: '#111' }}>⭐ Review Someone You Dealt With</button>
          </div>

          <div className="profile-card">
            <h3>Contact Info</h3>
            <div className="contact-list">
              <p>📧 {email || 'Not provided'}</p>
              <p>📞 {phone || 'Not provided'}</p>
              <p>📍 {street ? `${street}, ` : ''}{state || ''}, {country || ''}</p>
              <p>⚧ Gender: {gender || 'Not provided'}</p>
              <p>📍 Location: {location || 'Not provided'}</p>
            </div>
          </div>

          <div className="profile-card">
            <h3>Verification</h3>
            <p>{isPhoneVerified ? '✅ Phone Verified' : '⚪ Phone Not Verified'}</p>
            <p>{isEmailVerified ? '✅ Email Verified' : '⚪ Email Not Verified'}</p>
            <p>{isIdVerified ? '✅ ID Verified' : '⚪ ID Not Verified'}</p>
          </div>
        </div>

        <div className="profile-right">
          <div className="stats-grid-5">
            <div className="stat"><b>{stats.total}</b><span>Total Goods</span><small>₦{stats.totalValue.toLocaleString()} value</small></div>
            <div className="stat"><b>{stats.sell}</b><span>Sell Posts</span><small>✅ {stats.sellDone} Sold</small></div>
            <div className="stat"><b>{stats.buy}</b><span>Buy Requests</span><small>✅ {stats.buyDone} Completed</small></div>
            <div className="stat"><b>{stats.barter}</b><span>Barter Offers</span><small>✅ {stats.barterDone} Swapped</small></div>
            <div className="stat highlight"><b>{stats.totalDone}</b><span>Successful</span><small>{stats.successRate}% Rate</small></div>
          </div>

          <div className="profile-tabs">
            <button onClick={() => setTab('sell')} className={tab === 'sell' ? 'active' : ''}>For Sale ({stats.sell})</button>
            <button onClick={() => setTab('buy')} className={tab === 'buy' ? 'active' : ''}>Wanted ({stats.buy})</button>
            <button onClick={() => setTab('barter')} className={tab === 'barter' ? 'active' : ''}>Swaps ({stats.barter})</button>
            <button onClick={() => setTab('reviews')} className={tab === 'reviews' ? 'active' : ''}>
              Reviews ({reviews.length}){reviews.length > 0 ? ` ★ ${avgRating.toFixed(1)}` : ' • No rating yet'}
            </button>
          </div>

          <div className="quick-actions">
            <button onClick={() => navigate('/sellers-upload')}>+ Sell</button>
            <button onClick={() => navigate('/buyers-upload')}>+ Want To Buy</button>
            <button onClick={() => navigate('/barters-upload')}>+ Swap</button>
          </div>

          {tab === 'reviews' ? (
            <div>
              {reviews.length > 0 ? (
                <div className="review-summary">
                  <div><h1>{avgRating.toFixed(1)} <small>/ 5</small></h1><Stars value={Math.round(avgRating)} size={20} /><p>{reviews.length} reviews from completed deals</p></div>
                  <div className="bars">
                    {[5, 4, 3, 2, 1].map((s, i) => (
                      <div key={s} className="bar-row"><span>{s}★</span><div className="bar"><div style={{ width: `${reviews.length ? (starCounts[i] / reviews.length) * 100 : 0}%` }} /></div><span>{starCounts[i]}</span></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty">
                  <h3>No reviews yet</h3>
                  <p>Reviews only appear after you complete a deal and the other person reviews you.</p>
                </div>
              )}

              {/* ✅ NO self-review form. Real reviews live on /review page only. */}
              <button className="edit-btn" onClick={() => navigate('/review')} style={{ width: '100%', margin: '12px 0' }}>⭐ Review Someone You Dealt With →</button>

              {reviews.map((r) => (
                <div key={r._id || r.id} className="review-item">
                  <img src={r.reviewer?.avatar || DefaultUser} alt="" />
                  <div>
                    <b>{r.reviewer?.name || r.name || 'Buyer'}</b>
                    <span> {r.createdAt ? `• ${new Date(r.createdAt).toLocaleDateString()}` : ''} {r.good?.name || r.good?.giveName ? `• ${r.good?.name || r.good?.giveName}` : ''}</span>
                    <Stars value={r.stars} />
                    <p>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {shown.length === 0 && (
                <div className="empty">
                  <h3>No {tab === 'sell' ? 'goods for sale' : tab === 'buy' ? 'buy requests' : 'swaps'} yet</h3>
                  <button onClick={() => navigate(tab === 'sell' ? '/sellers-upload' : tab === 'buy' ? '/buyers-upload' : '/barters-upload')}>Post One →</button>
                </div>
              )}
              <div className="goods-grid">
                {shown.map((item) => (
                  <div key={item._id || item.id} className="goods-card">
                    {item.images?.[0] ? <img src={item.images[0]} alt="" className="goods-img" /> : item.videos?.[0] ? <video src={item.videos[0]} muted className="goods-img" /> : <div className="no-img">No Photo</div>}
                    {item.status === 'completed' && <span className="done-badge">✅ Completed</span>}
                    <h3>{item.name || `${item.giveName} ⇄ ${item.wantName}`}</h3>
                    <p className="meta">{item.kind === 'buyer-request' ? `WANTED - Up to ₦${Number(item.budgetMax || 0).toLocaleString()}` : item.kind === 'barter' ? `SWAP: ${item.giveName} ⇄ ${item.wantName}` : `FOR SALE - ₦${Number(item.price || 0).toLocaleString()}`}</p>
                    <p className="meta">📍 {item.location} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>
                    <div className="row-btns">
                      <button onClick={() => navigate('/market')}>View</button>
                      {item.status !== 'completed' && <button className="success-btn" onClick={() => markDone(item._id || item.id)}>✓ Mark Done</button>}
                      {item.status === 'completed' && <button className="success-btn" onClick={() => navigate('/reviews')}>⭐ Review Them</button>}
                      <button className="danger" onClick={() => deleteItem(item._id || item.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;