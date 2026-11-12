import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import DefaultUser from './assets/app_icon.png';

const API = 'https://buy-sell-barter.onrender.com/api/goods';

function Barters() {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);


    const meId = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}')._id; } catch { return null; } })();

    useEffect(() => {
        fetch(`${API}?kind=barter`)
            .then(r => r.json())
            .then(data => {
                setOffers(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const toList = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
        return [];
    };

    const filtered = offers.filter(item => {
        if (!search) return true;
        const text = `${item.giveName} ${item.wantName} ${item.location} ${item.giveType} ${item.wantType} ${item.giveDescription} ${item.wantDescription}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // ✅ SAME helper as Sellers.jsx + Buyers.jsx
    const getSeller = (item) => {
        if (item.seller && typeof item.seller === 'object') return item.seller;
        if (item.userId && typeof item.userId === 'object') return item.userId;
        if (item.sellerName || item.sellerUsername || item.sellerAvatar) {
            return {
                _id: item.sellerId || item.seller || item.userId,
                name: item.sellerName,
                username: item.sellerUsername,
                avatar: item.sellerAvatar,
            };
        }
        if (typeof item.seller === 'string' || typeof item.userId === 'string') {
            return { _id: item.seller || item.userId, name: null, username: null, avatar: null };
        }
        return null;
    };

    const deleteOffer = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this barter offer?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${API}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        setOffers(prev => prev.filter(o => (o._id || o.id) !== id));
    };

    if (loading) return <div className="market-page"><p>Loading...</p></div>;

    return (
        <div className="market-page">
            <h2>🔄 Trade by Barter</h2>
            <p>Swap goods for goods. No cash needed.</p>

            <input
                className="market-search"
                placeholder="Search swaps... e.g. iPhone, PS5, Laptop"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <button className="pub-btn" onClick={() => navigate('/barters-upload')}>
                + Post Barter Offer
            </button>

            {filtered.length === 0 && (
                <div className="empty">
                    <h3>No barter offers yet</h3>
                    <p>Be the first to swap!</p>
                    <button onClick={() => navigate('/barters-upload')}>Post Your Swap →</button>
                </div>
            )}

            <div className="goods-grid">
                {filtered.map(item => {
                    const id = item._id || item.id;
                    const seller = getSeller(item);
                    const sellerId = seller?._id;
                    const isMine = sellerId && meId && String(sellerId) === String(meId);
                    const giveFeatures = toList(item.giveFeatures);
                    const wantFeatures = toList(item.wantFeatures);
                    const totalMedia = (item.images?.length || 0) + (item.videos?.length || 0);
                    const hasVideo = item.videos?.[0];
                    const hasImage = item.images?.[0];

                    return (
                        <div
                            key={id}
                            className="goods-card barter-card"
                            onClick={() => navigate(`/good/${id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-media">
                                {hasVideo ? (
                                    <video src={hasVideo} muted playsInline preload="metadata" className="goods-img" />
                                ) : hasImage ? (
                                    <img src={hasImage} alt={item.giveName} className="goods-img" />
                                ) : (
                                    <div className="no-img">No Photo</div>
                                )}
                                {totalMedia > 1 && <span className="media-badge">📷 {totalMedia}</span>}
                                {hasVideo && <span className="video-badge">▶ Video</span>}
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <small>YOU GET</small>
                                    {item.videos?.[0] ? <video src={item.videos[0]} muted className="goods-img" />
                                        : item.images?.[0] ? <img src={item.images[0]} alt="" className="goods-img" />
                                        : <div className="no-img">No Photo</div>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <small>THEY WANT</small>
                                    {item.wantVideos?.[0] ? <video src={item.wantVideos[0]} muted className="goods-img" />
                                        : item.wantImages?.[0] ? <img src={item.wantImages[0]} alt="" className="goods-img" />
                                        : item.wantMedia?.[0] ? <img src={item.wantMedia[0].src} alt="" className="goods-img" />
                                        : <div className="no-img">No Example</div>}
                                </div>
                            </div>

                            <span className="badge barter">SWAP</span>

                            {/* ✅ NEW: SAME seller row as Sellers + Buyers - 36px, name + @username, View Profile → */}
                            {sellerId && (
                                <div
                                    className="seller-row"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/user/${sellerId}`);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px', cursor: 'pointer' }}
                                    title={`View ${seller?.name || 'Trader'}'s profile`}
                                >
                                    <img
                                        src={seller?.avatar || DefaultUser}
                                        alt=""
                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {seller?.name || 'Trader'}
                                        </div>
                                        {seller?.username && (
                                            <div style={{ fontSize: 12, color: '#888' }}>@{seller.username}</div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 12, color: '#1dbf73', fontWeight: 600 }}>View Profile →</span>
                                </div>
                            )}

                            <div className="swap-box">
                                <div>
                                    <small>YOU GET</small>
                                    <h3>{item.giveName}</h3>
                                    <p>{item.giveCondition} • {item.giveType}</p>
                                    {item.giveValue ? <p>Value: ₦{Number(item.giveValue).toLocaleString()}</p> : null}
                                </div>
                                <div className="swap-arrow">⇄</div>
                                <div>
                                    <small>THEY WANT</small>
                                    <h3>{item.wantName}</h3>
                                    <p>{item.wantCondition} • {item.wantType}</p>
                                    {item.wantValue ? <p>Value: ₦{Number(item.wantValue).toLocaleString()}</p> : null}
                                </div>
                            </div>

                            {item.giveDescription && <p className="desc">{item.giveDescription?.slice(0, 90)}</p>}
                            {item.wantDescription && <p className="desc"><b>Wants:</b> {item.wantDescription?.slice(0, 90)}</p>}

                            {giveFeatures.length > 0 && <p className="meta">✅ {giveFeatures.join(' • ')}</p>}
                            {wantFeatures.length > 0 && <p className="meta">🎯 Must have: {wantFeatures.join(' • ')}</p>}

                            <p>📍 {item.location}</p>
                            <p>🔁 {item.flexible}</p>
                            <p>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>

                            {/* ✅ NEW: SAME 2-button row as Sellers + Buyers - replaces WhatsApp phone leak */}
                            {!isMine && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    <button
                                        style={{ flex: 1, background: '#00a884', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (sellerId) navigate(`/chat/${sellerId}`);
                                        }}
                                    >
                                        💬 Message Trader
                                    </button>
                                    <button
                                        style={{ flex: 1, background: '#1dbf73', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/good/${id}`);
                                        }}
                                    >
                                        Offer Trade →
                                    </button>
                                </div>
                            )}

                            {/* ✅ FIX: Delete only for owner - was visible to everyone before */}
                            {isMine && (
                                <button className="del-btn" onClick={(e) => deleteOffer(e, id)} style={{ width: '100%', marginTop: 10 }}>
                                    Delete
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Barters;