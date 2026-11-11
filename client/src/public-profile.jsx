import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

// ✅ SAME RULE AS Profile.jsx - must stay in sync
// 0-2 completed = New Seller | 3-5 = Level 1 | 6-11 = Level 2 | 12+ = Top Rated
const getLevel = (done) => {
  if (done >= 12) return { label: '⭐ Top Rated' };
  if (done >= 6) return { label: 'Level 2' };
  if (done >= 3) return { label: 'Level 1' };
  return { label: 'New Seller' };
};

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('sell');
  const [user, setUser] = useState(null);
  const [all, setAll] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const myId = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}')._id; } catch { return null; } })();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    const headers = localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {};

    // ✅ Load user + goods + REAL reviews in parallel. Backend must return real reviews only.
    Promise.all([
      fetch(`https://buy-sell-barter.onrender.com/api/profile/user/${id}`).then(r => r.json().catch(() => ({}))),
      fetch(`https://buy-sell-barter.onrender.com/api/reviews/user/${id}`).then(r => r.json().catch(() => [])),
      // ✅ Can I review them? Only if I completed a deal with them and haven't reviewed that deal yet
      fetch(`https://buy-sell-barter.onrender.com/api/reviews/eligible`, { headers }).then(r => r.json().catch(() => [])),
    ]).then(([profileData, reviewsData, eligibleData]) => {
      if (!profileData.user) { setNotFound(true); setLoading(false); return; }

      if (myId && String(profileData.user._id) === String(myId)) {
        navigate('/profile', { replace: true });
        return;
      }

      setUser(profileData.user);
      setAll(profileData.goods || []);
      // ✅ Prefer /api/reviews/user/:id - it populates reviewer. Fallback to profile payload.
      const realReviews = Array.isArray(reviewsData) && reviewsData.length > 0 ? reviewsData : (profileData.reviews || []);
      setReviews(realReviews);

      // ✅ Eligible = there is a completed deal with THIS user I haven't reviewed yet
      const eligibleList = Array.isArray(eligibleData) ? eligibleData : [];
      setCanReview(eligibleList.some(x => String(x.reviewee?._id || x.reviewee) === String(profileData.user._id)));
      setLoading(false);
    }).catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const stats = useMemo(() => {
    const sell = all.filter(i => !i.kind || i.kind === 'seller' || i.kind === 'sell');
    const buy = all.filter(i => i.kind === 'buyer-request');
    const barter = all.filter(i => i.kind === 'barter');
    const isDone = (i) => ['sold', 'completed', 'done', 'closed'].includes((i.status || '').toLowerCase());
    const sellDone = sell.filter(isDone).length;
    const buyDone = buy.filter(isDone).length;
    const barterDone = barter.filter(isDone).length;
    const totalDone = all.filter(isDone).length;
    return {
      sell: sell.length, buy: buy.length, barter: barter.length, total: all.length,
      sellDone, buyDone, barterDone, totalDone,
      // ✅ REAL: 0 goods = 0% success, not 100%
      successRate: all.length ? Math.round((totalDone / all.length) * 100) : 0,
      level: getLevel(totalDone),
    };
  }, [all]);

  // ✅ REAL rating: null if no reviews. No fake 5.0.
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.stars || 0), 0) / reviews.length
    : null;
  const starCounts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => Number(r.stars) === s).length);

  const shown = all.filter(i => {
    if (tab === 'sell') return !i.kind || i.kind === 'seller' || i.kind === 'sell';
    if (tab === 'buy') return i.kind === 'buyer-request';
    if (tab === 'barter') return i.kind === 'barter';
    return true;
  });

  const Stars = ({ value, size = 16 }) => (
    <span className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= value ? '#ffc107' : '#ddd' }}>★</span>
      ))}
    </span>
  );

  if (loading) return <div className="profile-page"><p style={{ textAlign: 'center', padding: 40 }}>Loading profile...</p></div>;
  if (notFound || !user) return <div className="profile-page"><p style={{ textAlign: 'center', padding: 40 }}>User not found. <button onClick={() => navigate('/market')}>Back to Market</button></p></div>;

  const { avatar, cover, name, username, bio, purpose, location, country, state, createdAt, isPhoneVerified, isEmailVerified, isIdVerified } = user;
  const joined = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

  return (
    <div className="profile-page">
      <div className="profile-cover" style={{ backgroundImage: cover ? `url(${cover})` : 'linear-gradient(135deg,#1dbf73,#0e8a4f,#111)' }} />

      <div className="profile-layout">
        <div className="profile-left">
          <div className="profile-card center">
            <div className="avatar-wrap">
              <img src={avatar || DefaultUser} alt={name} className="profile-avatar-lg" />
              <span className="online-dot" />
            </div>
            {/* ✅ No fake ✓ - only show ✓ if backend says verified */}
            <h2>{name} {(isPhoneVerified || isEmailVerified || isIdVerified) ? <span className="verified">✓</span> : null}</h2>
            {/* ✅ REAL level - calculated from completed deals */}
            <p className="handle">@{username || (name || '').toLowerCase().replace(/\s/g, '')} • {stats.level.label}</p>

            {/* ✅ REAL stars - NO stars if no reviews */}
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
            <p className="bio">{bio || 'No bio yet.'}</p>
            {purpose && <div className="purpose-box"><b>🎯 Purpose:</b><p>{purpose}</p></div>}

            <button className="msg-btn" onClick={() => navigate(`/chat/${user._id}`)}>💬 Message {name?.split(' ')[0]}</button>

            {/* ✅ Review button ONLY if you actually completed a deal with them and haven't reviewed it */}
            {canReview && (
              <button className="edit-btn" onClick={() => navigate('/review')} style={{ marginTop: 8, background: '#ffc107', color: '#111' }}>
                ⭐ Review {name?.split(' ')[0]}
              </button>
            )}

            <button className="ghost-btn" onClick={() => navigate('/market')} style={{ marginTop: 8 }}>← Back to Market</button>
          </div>

          <div className="profile-card">
            <h3>About Seller</h3>
            <p>📍 Based in {location || 'Not set'}{state ? `, ${state}` : ''}{country ? `, ${country}` : ''}</p>
            {joined && <p>🕒 Member since {joined}</p>}
            <p>📦 {stats.total} listings • ✅ {stats.totalDone} completed</p>
            {/* ✅ REAL verification - no fake ✓ */}
            <p>{isPhoneVerified ? '✅ Phone Verified' : '⚪ Phone Not Verified'}</p>
            <p>{isEmailVerified ? '✅ Email Verified' : '⚪ Email Not Verified'}</p>
            <p>{isIdVerified ? '✅ ID Verified' : '⚪ ID Not Verified'}</p>
            <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Phone & email are hidden for safety. Message them inside the app.</p>
          </div>
        </div>

        <div className="profile-right">
          <div className="stats-grid-5">
            <div className="stat"><b>{stats.total}</b><span>Total Goods</span></div>
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
                  <p>Reviews only appear after this person completes a deal and the other person reviews them.</p>
                </div>
              )}

              {canReview && (
                <button className="edit-btn" onClick={() => navigate('/review')} style={{ width: '100%', margin: '12px 0' }}>⭐ Review Them →</button>
              )}

              {reviews.map(r => (
                <div key={r._id || r.id} className="review-item">
                  <img src={r.reviewer?.avatar || DefaultUser} alt="" />
                  <div>
                    <b>{r.reviewer?.name || r.name || 'Buyer'}</b>
                    <span> {r.createdAt ? `• ${new Date(r.createdAt).toLocaleDateString()}` : ''} {r.good?.name || r.good?.giveName ? `• ${r.good?.name || r.good?.giveName}` : ''}</span>
                    <Stars value={Number(r.stars)} />
                    <p>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {shown.length === 0 && <div className="empty"><h3>No listings in this tab yet</h3></div>}
              <div className="goods-grid">
                {shown.map(item => {
                  const itemId = item._id || item.id;
                  return (
                    <div key={itemId} className="goods-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/good/${itemId}`)}>
                      {item.images?.[0] ? <img src={item.images[0]} alt="" className="goods-img" /> : item.videos?.[0] ? <video src={item.videos[0]} muted className="goods-img" /> : <div className="no-img">No Photo</div>}
                      {item.status === 'completed' && <span className="done-badge">✅ Completed</span>}
                      <h3>{item.name || `${item.giveName} ⇄ ${item.wantName}`}</h3>
                      <p className="meta">{item.kind === 'buyer-request' ? `WANTED - Up to ₦${Number(item.budgetMax || 0).toLocaleString()}` : item.kind === 'barter' ? `SWAP: ${item.giveName} ⇄ ${item.wantName}` : `FOR SALE - ₦${Number(item.price || 0).toLocaleString()}`}</p>
                      <p className="meta">📍 {item.location} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;