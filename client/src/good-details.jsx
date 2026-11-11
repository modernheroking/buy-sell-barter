import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

const API = 'http://localhost:5000/api/goods';

function GoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [good, setGood] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [starting, setStarting] = useState(false);

  const touchX = useRef(null);
  const touchY = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    fetch(`${API}/${id}`)
      .then(r => r.json())
      .then(d => {
        const g = d.good || d;
        setGood(g);
        setLoading(false);
        const savedLikes = JSON.parse(localStorage.getItem('liked_goods') || '[]');
        setLiked(savedLikes.includes(g._id));
        setLikeCount(Number(g.likes || 0) + (savedLikes.includes(g._id) ? 1 : 0));
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="detail-page"><p>Loading...</p></div>;
  if (!good) return <div className="detail-page"><p>Not found</p><button onClick={() => navigate('/market')}>← Back to Market</button></div>;

  const media = [
    ...(good.images || []).map(src => ({ type: 'image', src })),
    ...(good.videos || []).map(src => ({ type: 'video', src })),
    ...(good.wantImages || []).map(src => ({ type: 'image', src })),
    ...(good.wantVideos || []).map(src => ({ type: 'video', src })),
  ];
  const current = media[index] || { type: 'image', src: '' };
  const isBarter = good.kind === 'barter';
  const isBuy = good.kind === 'buyer-request';
  const seller = typeof good.seller === 'object' ? good.seller : null;
  const sellerId = seller?._id || good.seller || good.userId;
  const sellerName = seller?.name || good.sellerName || 'Seller';
  const sellerAvatar = seller?.avatar || good.sellerAvatar;
  const features = good.features || good.giveFeatures || [];
  const me = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}'); } catch { return {}; } })();
  const isOwner = String(sellerId) === String(me?._id);
  const isCompleted = ['completed', 'sold', 'done', 'closed'].includes((good.status || '').toLowerCase());

  const next = () => setIndex(i => media.length ? (i + 1) % media.length : 0);
  const prev = () => setIndex(i => media.length ? (i - 1 + media.length) % media.length : 0);

  const doLike = () => {
    const saved = JSON.parse(localStorage.getItem('liked_goods') || '[]');
    if (liked) {
      localStorage.setItem('liked_goods', JSON.stringify(saved.filter(x => x !== good._id)));
      setLiked(false); setLikeCount(c => c - 1);
    } else {
      localStorage.setItem('liked_goods', JSON.stringify([...saved, good._id]));
      setLiked(true); setLikeCount(c => c + 1);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) doLike();
    lastTap.current = now;
  };

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; touchY.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
    touchX.current = null; touchY.current = null;
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    navigate('/market');
  };

  // ✅ FINAL PROCUREMENT / TRANSACTION - creates deal, goes to /transaction/:id
  const startTransaction = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    if (isCompleted) return alert('This deal is already completed');
    setStarting(true);
    try {
      const r = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ goodId: good._id }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return alert(data.msg || 'Could not start transaction');
      navigate(`/transaction/${data._id}`);
    } finally { setStarting(false); }
  };

  const ctaLabel = isBarter ? '🔄 Proceed to Final Swap →' : isBuy ? '🏷️ Proceed to Final Deal →' : '🛒 Proceed to Final Purchase →';
  const ctaSub = isBarter ? 'You will both confirm when swap is done' : isBuy ? 'You will both confirm when you deliver / receive' : 'You will both confirm when payment & delivery are done';

  return (
    <div className="detail-page">
      <div className="detail-top">
        <button onClick={() => navigate(-1)}>← Back</button>
        <span>{isBarter ? '🔄 Barter' : isBuy ? '🛒 Buy Request' : '🏷️ For Sale'}</span>
        <button onClick={() => navigator.share?.({ title: good.name, url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href))}>↗ Share</button>
      </div>

      <div className="detail-media" onClick={handleTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {current.type === 'video'
          ? <video key={current.src} src={current.src} controls autoPlay muted loop playsInline />
          : current.src ? <img src={current.src} alt={good.name} /> : <div className="no-img">No Photo</div>
        }
        {showHeart && <div className="big-heart">❤️</div>}
        <div className="detail-side-actions" onClick={e => e.stopPropagation()}>
          <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={doLike}>{liked ? '❤️' : '🤍'}</button>
          <span>{likeCount}</span>
          <button className="like-btn" onClick={() => sellerId && navigate(`/chat/${sellerId}`)}>💬</button>
          <span>Chat</span>
          <button className="like-btn" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied'))}>↗</button>
          <span>Share</span>
        </div>
        {media.length > 1 && (
          <>
            <button className="media-arrow left" onClick={(e) => { e.stopPropagation(); prev(); }}>‹</button>
            <button className="media-arrow right" onClick={(e) => { e.stopPropagation(); next(); }}>›</button>
            <div className="media-counter">{index + 1} / {media.length}</div>
            <div className="media-dots">
              {media.map((_, i) => <span key={i} className={i === index ? 'dot active' : 'dot'} onClick={(e) => { e.stopPropagation(); setIndex(i); }} />)}
            </div>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="detail-thumbs">
          {media.map((m, i) => (
            <div key={i} className={`thumb ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)}>
              {m.type === 'video' ? <><video src={m.src} muted /><span className="thumb-play">▶</span></> : <img src={m.src} alt="" />}
            </div>
          ))}
        </div>
      )}

      <div className="detail-info">
        <div className="detail-price-row">
          <h1>{good.name || `${good.giveName} ⇄ ${good.wantName}`}</h1>
          {isBuy
            ? <div className="detail-price">Budget: ₦{Number(good.budgetMin || 0).toLocaleString()} - ₦{Number(good.budgetMax || 0).toLocaleString()}</div>
            : isBarter
              ? <div className="detail-price">Value: ₦{Number(good.giveValue || 0).toLocaleString()} ⇄ {good.wantName}</div>
              : <div className="detail-price">₦{Number(good.price || 0).toLocaleString()} {good.oldPrice ? <s>₦{Number(good.oldPrice).toLocaleString()}</s> : null}</div>
          }
        </div>

        <div className="detail-meta">
          <span>📍 {good.location}</span>
          <span>🏷️ {good.type || good.giveType}</span>
          <span>✨ {good.condition || good.giveCondition}</span>
          {isBuy && <span>⏰ {good.urgency} • Qty: {good.quantity}</span>}
          {isBarter && <span>💱 {good.flexible}</span>}
          {!isBuy && !isBarter && good.stock != null && <span>📦 Stock: {good.stock}</span>}
          <span>🕒 {good.createdAt ? new Date(good.createdAt).toLocaleDateString() : ''}</span>
          <span>❤️ {likeCount} likes</span>
          {isCompleted && <span>✅ Completed</span>}
        </div>

        <h3>Full Description</h3>
        <p className="detail-desc">{good.description || good.giveDescription || 'No description'}</p>

        {features.length > 0 && (
          <>
            <h3>Key Features</h3>
            <ul className="detail-features">{features.map((f, i) => <li key={i}>✅ {f}</li>)}</ul>
          </>
        )}

        {isBarter && (
          <div className="detail-barter">
            <div className="barter-box give">
              <h3>🤝 They Give</h3><b>{good.giveName}</b><p>{good.giveDescription}</p>
              <p>Condition: {good.giveCondition} • Value: ₦{Number(good.giveValue || 0).toLocaleString()}</p>
              {good.giveFeatures?.map((f, i) => <li key={i}>{f}</li>)}
            </div>
            <div className="barter-arrow">⇄</div>
            <div className="barter-box want">
              <h3>🔄 They Want</h3><b>{good.wantName}</b><p>{good.wantDescription}</p>
              <p>Accepts: {good.wantCondition} • Expect: ₦{Number(good.wantValue || 0).toLocaleString()}</p>
              {good.wantFeatures?.map((f, i) => <li key={i}>{f}</li>)}
            </div>
          </div>
        )}

        {isBuy && (
          <div className="detail-barter">
            <div className="barter-box want">
              <h3>🛒 Buyer Wants</h3>
              <p>Budget: ₦{Number(good.budgetMin || 0).toLocaleString()} - ₦{Number(good.budgetMax || 0).toLocaleString()}</p>
              <p>Urgency: {good.urgency} • Quantity: {good.quantity}</p>
            </div>
          </div>
        )}

        {/* ✅ REAL seller row - goes to /user/:id */}
        {sellerId && (
          <div
            className="detail-seller"
            onClick={() => navigate(`/user/${sellerId}`)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <img src={sellerAvatar || DefaultUser} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}><b>{sellerName}</b><br /><small>📍 {good.location} • View Profile →</small></div>
            <span>View Profile →</span>
          </div>
        )}
      </div>

      <div className="detail-actions" style={{ flexDirection: 'column', gap: 8 }}>
        {isOwner ? (
          <>
            <button className="btn-outline" onClick={() => navigate(`/edit/${good._id}`)}>Edit</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        ) : (
          <>
            {/* ✅ FINAL TRANSACTION BUTTON - the main action, not WhatsApp */}
            <button
              className="btn-barter"
              onClick={startTransaction}
              disabled={starting || isCompleted}
              style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 700, background: '#1dbf73', color: '#fff', border: 0, borderRadius: 12, cursor: 'pointer' }}
            >
              {isCompleted ? '✅ Deal Completed' : starting ? 'Starting...' : ctaLabel}
            </button>
            <p style={{ textAlign: 'center', color: '#666', fontSize: 13, margin: 0 }}>{ctaSub}</p>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => sellerId && navigate(`/chat/${sellerId}`)}>💬 Message Seller</button>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => sellerId && navigate(`/user/${sellerId}`)}>👤 View Profile</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GoodDetail;