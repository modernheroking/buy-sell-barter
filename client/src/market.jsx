import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

const API = 'https://buy-sell-barter.onrender.com/api/goods';

function Market() {
    const navigate = useNavigate();
    const [goods, setGoods] = useState([]);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(API)
            .then(r => r.json())
            .then(data => {
                const seen = new Set();
                const all = (Array.isArray(data) ? data : []).filter(i => {
                    const key = i._id || i.id;
                    if (seen.has(key)) return false;
                    seen.add(key); return true;
                });
                setGoods(all);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const go = (path) => navigate(path);
    const categories = ['All', 'Electronics', 'Fashion', 'Home & Furniture', 'Phones & Tablets', 'Vehicles', 'Beauty', 'Food', 'Others'];

    const filtered = useMemo(() => goods.filter(item => {
        const type = item.type || item.giveType || item.wantType || '';
        const name = item.name || item.giveName || '';
        const matchCat = category === 'All' || type === category;
        const matchSearch = !search || (name + ' ' + type + ' ' + (item.location || '')).toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    }), [goods, category, search]);

    const sellItems = filtered.filter(i => !i.kind || i.kind === 'seller' || i.kind === 'sell');
    const buyItems = filtered.filter(i => i.kind === 'buyer-request');
    const barterItems = filtered.filter(i => i.kind === 'barter');

    if (loading) return <div className="page-wrapper"><p style={{ padding: 20 }}>Loading market...</p></div>;

    return (
        <div className="page-wrapper">
            <div className="categories-bar">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} className={`cat-btn ${category === cat ? 'active' : ''}`}>{cat}</button>
                ))}
            </div>

            <input className="market-search" placeholder="Search goods..." value={search} onChange={e => setSearch(e.target.value)} />

            <div className="video-grid-wrapper">
                {/* ✅ See all is now a small link in the header - NOT a card */}
                <Row title="🛒 For Sale" items={sellItems} onMore={() => go('/sellers')} moreText="See all →">
                    {(item) => (
                        <GoodsCard item={item} badge={<span className="badge sale">FOR SALE</span>} title={item.name} desc={item.description} price={item.price} oldPrice={item.oldPrice} kind="seller" />
                    )}
                </Row>

                <Row title="🔍 Wanted By Buyers" items={buyItems} onMore={() => go('/buyers')} moreText="See all →" isShort>
                    {(item) => (
                        <GoodsCard item={item} badge={<span className="badge want">WANTED</span>} title={item.name} desc={item.description} price={item.budgetMax} label="Budget" kind="buyer-request" />
                    )}
                </Row>

                <Row title="🔄 Swap By Barter" items={barterItems} onMore={() => go('/barters')} moreText="See all →">
                    {(item) => (
                        <GoodsCard item={item} badge={<span className="badge barter">SWAP</span>} title={`${item.giveName} ⇄ ${item.wantName}`} desc={item.giveDescription} extra={`${item.giveName} for ${item.wantName}`} kind="barter" />
                    )}
                </Row>

                {filtered.length === 0 && (
                    <div className="no-results">
                        No goods found. <button onClick={() => go('/sellers-upload')}>Be first to upload →</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ title, items, children, onMore, moreText, isShort }) {
    if (items.length === 0) return null;
    return (
        <div className="row-block">
            {/* ✅ Header with See all link - replaces watch-more-card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <h2 className="row-title" style={{ margin: 0 }}>{title}</h2>
                <button
                    onClick={onMore}
                    style={{ background: 'none', border: 0, color: '#1dbf73', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    {moreText}
                </button>
            </div>
            <div className={isShort ? "shorts-grid" : "normal-grid"} style={{ marginTop: 12 }}>
                {items.map(item => (
                    <div key={item._id || item.id}>{children(item)}</div>
                ))}
                {/* ✅ REMOVED: watch-more-card - no more See More card at end of row */}
            </div>
        </div>
    );
}

function GoodsCard({ item, badge, title, desc, price, oldPrice, label, extra, kind }) {
    const navigate = useNavigate();
    const img = item.images?.[0];
    const video = item.videos?.[0];
    const totalMedia = (item.images?.length || 0) + (item.videos?.length || 0);
    const id = item._id || item.id;

    // ✅ SAME helper as Sellers / Buyers / Barters
    const getSeller = (it) => {
        if (it.seller && typeof it.seller === 'object') return it.seller;
        if (it.userId && typeof it.userId === 'object') return it.userId;
        if (it.sellerName || it.sellerUsername || it.sellerAvatar) {
            return {
                _id: it.sellerId || it.seller || it.userId,
                name: it.sellerName,
                username: it.sellerUsername,
                avatar: it.sellerAvatar,
            };
        }
        if (typeof it.seller === 'string' || typeof it.userId === 'string') {
            return { _id: it.seller || it.userId, name: null, username: null, avatar: null };
        }
        return null;
    };

    const seller = getSeller(item);
    const sellerId = seller?._id;
    const sellerLabel = kind === 'buyer-request' ? 'Buyer' : kind === 'barter' ? 'Trader' : 'Seller';
    const btnLabel = kind === 'buyer-request' ? 'Offer This Item →' : kind === 'barter' ? 'Offer Trade →' : 'Buy Now →';

    const goToSeller = (e) => {
        e.stopPropagation();
        if (sellerId) navigate(`/user/${sellerId}`);
    };

    return (
        <div className="video-card goods-card" onClick={() => navigate(`/good/${id}`)} style={{ cursor: 'pointer' }}>
            <div className="thumb-wrap">
                {img ? <img src={img} alt={title} className="thumb-video" />
                    : video ? <video src={video} muted className="thumb-video" />
                    : <div className="no-img">No Photo</div>}
                {badge}
                {totalMedia > 1 && <span className="media-badge">📷 {totalMedia}</span>}
                {video && <span className="video-badge">▶ Video</span>}
            </div>
            <div className="video-info">
                <div className="video-text">
                    <h3>{title}</h3>

                    {/* ✅ SAME seller row as Sellers / Buyers / Barters - 36px, name + @username, View Profile → */}
                    {sellerId && (
                        <div
                            className="seller-row"
                            onClick={goToSeller}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 6px', cursor: 'pointer' }}
                            title={`View ${seller?.name || sellerLabel}'s profile`}
                        >
                            <img
                                src={seller?.avatar || DefaultUser}
                                alt=""
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {seller?.name || sellerLabel}
                                </div>
                                {seller?.username && (
                                    <div style={{ fontSize: 12, color: '#888' }}>@{seller.username}</div>
                                )}
                            </div>
                            <span style={{ fontSize: 12, color: '#1dbf73', fontWeight: 600 }}>View Profile →</span>
                        </div>
                    )}

                    <p className="channel">📍 {item.location}</p>
                    <p className="meta">{desc?.slice(0, 80)}</p>
                    {extra && <p className="meta">{extra}</p>}
                    {price ? <p className="meta"><b>{label || 'Price'}: ₦{Number(price).toLocaleString()}</b> {oldPrice && <s>₦{Number(oldPrice).toLocaleString()}</s>}</p> : null}
                    <p className="meta">📦 {item.type || item.giveType} • {item.condition || item.giveCondition}</p>

                    {/* ✅ SAME 2-button row as Sellers / Buyers / Barters - was 1 black button before */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                            style={{ flex: 1, background: '#00a884', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (sellerId) navigate(`/chat/${sellerId}`);
                            }}
                        >
                            💬 Message {sellerLabel}
                        </button>
                        <button
                            style={{ flex: 1, background: '#1dbf73', border: 0, color: '#fff', padding: '10px', borderRadius: 10, cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/good/${id}`);
                            }}
                        >
                            {btnLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Market;