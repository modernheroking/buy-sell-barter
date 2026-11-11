import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import DefaultUser from './assets/app_icon.png';

const API = 'http://localhost:5000/api/goods';

function Buyers() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}?kind=buyer-request`)
            .then(r => r.json())
            .then(data => {
                setRequests(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = requests.filter(item => {
        if (!search) return true;
        const text = `${item.name} ${item.type} ${item.location}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // ✅ Same helper as Sellers / Market - seller can be ObjectId, populated object, or sellerId fields
    const getSeller = (item) => {
        // 1. Populated seller object: { _id, name, username, avatar }
        if (item.seller && typeof item.seller === 'object') return item.seller;
        // 2. Populated userId object
        if (item.userId && typeof item.userId === 'object') return item.userId;
        // 3. Flat fields from Good.js (sellerName / sellerUsername / sellerAvatar)
        if (item.sellerName || item.sellerUsername || item.sellerAvatar) {
            return {
                _id: item.sellerId || item.seller || item.userId,
                name: item.sellerName,
                username: item.sellerUsername,
                avatar: item.sellerAvatar,
            };
        }
        // 4. Only an ID string - still linkable, name will fall back to "Buyer"
        if (typeof item.seller === 'string' || typeof item.userId === 'string') {
            return { _id: item.seller || item.userId, name: null, username: null, avatar: null };
        }
        return null;
    };

    if (loading) return <div className="market-page"><p>Loading...</p></div>;

    return (
        <div className="market-page">
            <h2>🔍 Buyers - What People Want</h2>
            <p>These people want to buy. Offer them your goods.</p>

            <input
                className="market-search"
                placeholder="Search wanted goods... e.g. iPhone, Laptop"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <button className="pub-btn" onClick={() => navigate('/buyers-upload')}>
                + Post What You Want To Buy
            </button>

            {filtered.length === 0 && (
                <div className="empty">
                    <h3>No buy requests yet</h3>
                    <p>Be the first to ask!</p>
                    <button onClick={() => navigate('/buyers-upload')}>Post Request →</button>
                </div>
            )}

            <div className="goods-grid">
                {filtered.map(item => {
                    const id = item._id || item.id;
                    const seller = getSeller(item);
                    const sellerId = seller?._id;
                    const totalMedia = (item.images?.length || 0) + (item.videos?.length || 0);

                    return (
                        <div
                            key={id}
                            className="goods-card"
                            onClick={() => navigate(`/good/${id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-media">
                                {item.images?.[0] ? (
                                    <img src={item.images[0]} alt={item.name} className="goods-img" />
                                ) : item.videos?.[0] ? (
                                    <video src={item.videos[0]} muted className="goods-img" />
                                ) : (
                                    <div className="no-img">No Example Photo</div>
                                )}
                                {totalMedia > 1 && <span className="media-badge">📷 {totalMedia}</span>}
                                {item.videos?.length > 0 && <span className="video-badge">▶ Video</span>}
                            </div>

                            <span className="badge want">WANTED</span>

                            
                            {sellerId && (
                                <div
                                    className="seller-row"
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        navigate(`/user/${sellerId}`);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px', cursor: 'pointer' }}
                                >
                                    <img
                                        src={seller?.avatar || DefaultUser}
                                        alt=""
                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {seller?.name || 'Buyer'}
                                        </div>
                                        {seller?.username && (
                                            <div style={{ fontSize: 12, color: '#888' }}>@{seller.username}</div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 12, color: '#1dbf73', fontWeight: 600 }}>View Profile →</span>
                                </div>
                            )}

                            <h3>{item.name}</h3>
                            <p className="meta">📦 {item.type} • Condition: {item.condition}</p>

                            <div className="budget-box">
                                <small>MY BUDGET</small>
                                <h3>
                                    {item.budgetMin ? `₦${Number(item.budgetMin).toLocaleString()} - ` : ''}
                                    ₦{Number(item.budgetMax || 0).toLocaleString()}
                                </h3>
                            </div>

                            <p className="desc">{item.description?.slice(0, 90)}</p>

                            {item.features?.length > 0 && (
                                <p className="meta">🎯 Must have: {item.features.join(' • ')}</p>
                            )}

                            <p>📍 {item.location}</p>
                            <p>📦 Qty: {item.quantity} • ⏰ {item.urgency}</p>
                            <p>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>

                            {/* ✅ NEW: Message + Offer - replaces WhatsApp phone leak */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button
                                    className="wa-btn"
                                    style={{ flex: 1, background: '#00a884', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (sellerId) navigate(`/chat/${sellerId}`);
                                    }}
                                >
                                    💬 Message Buyer
                                </button>
                                <button
                                    style={{ flex: 1, background: '#1dbf73', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/good/${id}`); // GoodDetail has Offer / Message too
                                    }}
                                >
                                    Offer This Item →
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Buyers;