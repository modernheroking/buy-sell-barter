import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

const API = 'https://buy-sell-barter.onrender.com/api/goods';

function Sellers() {
    const navigate = useNavigate();
    const [goods, setGoods] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}?kind=seller`)
            .then(r => r.json())
            .then(data => {
                setGoods(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = goods.filter(item => {
        if (!search) return true;
        const text = `${item.name} ${item.type} ${item.location}`.toLowerCase();
        return text.includes(search.toLowerCase());
    });

    // ✅ SAME helper as Buyers.jsx - seller can be object, flat fields, or ID string
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

    if (loading) return <div className="market-page"><p>Loading...</p></div>;

    return (
        <div className="market-page">
            <h2>🛒 Sellers - Goods For Sale</h2>
            <p>Buy directly from sellers near you.</p>

            <input
                className="market-search"
                placeholder="Search for sale... e.g. iPhone, Sofa"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <button className="pub-btn" onClick={() => navigate('/sellers-upload')}>
                + Sell Your Goods
            </button>

            {filtered.length === 0 && (
                <div className="empty">
                    <h3>No goods for sale yet</h3>
                    <p>Be the first to sell!</p>
                    <button onClick={() => navigate('/sellers-upload')}>Upload Goods →</button>
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
                                    <div className="no-img">No Photo</div>
                                )}
                                {totalMedia > 1 && <span className="media-badge">📷 {totalMedia}</span>}
                                {item.videos?.length > 0 && <span className="video-badge">▶ Video</span>}
                            </div>

                            <span className="badge sale">FOR SALE</span>

                            {/* ✅ SAME seller row as Buyers.jsx - 36px, name + @username, View Profile → */}
                            {sellerId && (
                                <div
                                    className="seller-row"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/user/${sellerId}`);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px', cursor: 'pointer' }}
                                    title={`View ${seller?.name || 'Seller'}'s profile`}
                                >
                                    <img
                                        src={seller?.avatar || DefaultUser}
                                        alt=""
                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {seller?.name || 'Seller'}
                                        </div>
                                        {seller?.username && (
                                            <div style={{ fontSize: 12, color: '#888' }}>@{seller.username}</div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 12, color: '#1dbf73', fontWeight: 600 }}>View Profile →</span>
                                </div>
                            )}

                            <h3>{item.name}</h3>
                            <p className="meta">📦 {item.type} • {item.condition}</p>

                            <div className="price-box">
                                <h3>₦{Number(item.price || 0).toLocaleString()}</h3>
                                {item.oldPrice && <s>₦{Number(item.oldPrice).toLocaleString()}</s>}
                                {item.oldPrice && item.price && <span className="discount">-{Math.round((1 - item.price / item.oldPrice) * 100)}% OFF</span>}
                            </div>

                            <p className="desc">{item.description?.slice(0, 90)}</p>

                            {item.features?.length > 0 && (
                                <p className="meta">✅ {item.features.join(' • ')}</p>
                            )}

                            <p>📍 {item.location} • 📦 Stock: {item.stock}</p>
                            <p>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</p>

                            {/* ✅ SAME 2-button row as Buyers.jsx - was 1 black button before */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button
                                    style={{ flex: 1, background: '#00a884', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (sellerId) navigate(`/chat/${sellerId}`);
                                    }}
                                >
                                    💬 Message Seller
                                </button>
                                <button
                                    style={{ flex: 1, background: '#1dbf73', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/good/${id}`);
                                    }}
                                >
                                    Buy Now →
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Sellers;