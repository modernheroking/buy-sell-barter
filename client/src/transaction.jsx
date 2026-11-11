import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

function TransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const me = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}'); } catch { return {}; } })();
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = async () => {
    const r = await fetch(`https://buy-sell-barter.onrender.com/api/transactions/${id}`, { headers: headers() });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return alert(data.msg || 'Transaction not found');
    setTx(data);
    setLoading(false);

    try {
      const rr = await fetch('https://buy-sell-barter.onrender.com/api/reviews/eligible', { headers: headers() });
      const eligible = await rr.json().catch(() => []);
      setReviewed(!eligible.some(x => String(x.good._id) === String(data.good._id)));
    } catch {}
  };

  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    if (!confirm('Confirm this deal is DONE on your side? This cannot be undone.')) return;
    setConfirming(true);
    const r = await fetch(`https://buy-sell-barter.onrender.com/api/transactions/${id}/confirm`, { method: 'POST', headers: headers() });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) alert(data.msg || 'Confirm failed');
    else setTx(data);
    setConfirming(false);
  };

  const cancel = async () => {
    if (!confirm('Cancel this deal?')) return;
    const r = await fetch(`https://buy-sell-barter.onrender.com/api/transactions/${id}/cancel`, { method: 'POST', headers: headers() });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) alert(data.msg || 'Cancel failed');
    else setTx(data);
  };

  if (loading) return <div className="detail-page"><p>Loading transaction...</p></div>;
  if (!tx) return <div className="detail-page"><p>Not found</p></div>;

  const isSeller = String(tx.seller._id) === String(me._id);
  const other = isSeller ? tx.buyer : tx.seller;
  const myConfirmed = isSeller ? tx.sellerConfirmed : tx.buyerConfirmed;
  const otherConfirmed = isSeller ? tx.buyerConfirmed : tx.sellerConfirmed;
  const good = tx.good || {};

  const myLabel = tx.kind === 'barter'
    ? (isSeller ? 'I sent my item & got their item' : 'I sent my item & got their item')
    : tx.kind === 'buyer-request'
      ? (isSeller ? 'I delivered the item & got paid' : 'I got the item & paid')
      : (isSeller ? 'I sent the item & got paid' : 'I got the item & paid');

  const otherLabel = tx.kind === 'barter' ? 'They sent their item & got yours'
    : tx.kind === 'buyer-request' ? (isSeller ? 'Buyer got item & paid' : 'Seller delivered & got paid')
    : (isSeller ? 'Buyer got item & paid' : 'Seller sent item & got paid');

  return (
    <div className="detail-page" style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <button onClick={() => navigate(-1)}>← Back</button>
      <h2 style={{ margin: '12px 0 4px' }}>{tx.kind === 'barter' ? '🔄 Final Swap' : tx.kind === 'buyer-request' ? '🛒 Final Deal' : '🛒 Final Purchase'}</h2>
      <p style={{ color: '#666' }}>Both sides must confirm. Only then does it count for Level + Reviews.</p>

  
      <div className="profile-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {good.images?.[0] ? <img src={good.images[0]} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }} /> : <div className="no-img" style={{ width: 72, height: 72 }}>No Photo</div>}
        <div>
          <b>{good.name || `${good.giveName} ⇄ ${good.wantName}`}</b>
          <p style={{ margin: '4px 0', color: '#666' }}>{tx.kind === 'barter' ? `${good.giveName} ⇄ ${good.wantName}` : `₦${Number(tx.price || 0).toLocaleString()}`}</p>
          <p style={{ margin: 0, color: '#666' }}>📍 {good.location}</p>
        </div>
      </div>

     
      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <div className="profile-card" style={{ flex: 1, textAlign: 'center' }}>
          <img src={tx.seller.avatar || DefaultUser} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <p><b>{tx.seller.name}</b><br /><small>Seller</small></p>
          <p style={{ fontSize: 20 }}>{tx.sellerConfirmed ? '✅ Confirmed' : '⏳ Waiting'}</p>
          <p style={{ color: '#666', fontSize: 13 }}>{tx.sellerConfirmed ? `Confirmed ${tx.sellerConfirmedAt ? new Date(tx.sellerConfirmedAt).toLocaleString() : ''}` : 'Has not confirmed yet'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 24 }}>⇄</div>
        <div className="profile-card" style={{ flex: 1, textAlign: 'center' }}>
          <img src={tx.buyer.avatar || DefaultUser} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <p><b>{tx.buyer.name}</b><br /><small>Buyer</small></p>
          <p style={{ fontSize: 20 }}>{tx.buyerConfirmed ? '✅ Confirmed' : '⏳ Waiting'}</p>
          <p style={{ color: '#666', fontSize: 13 }}>{tx.buyerConfirmed ? `Confirmed ${tx.buyerConfirmedAt ? new Date(tx.buyerConfirmedAt).toLocaleDateString() : ''}` : 'Has not confirmed yet'}</p>
        </div>
      </div>

      
      {tx.status === 'completed' ? (
        <div className="profile-card" style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', textAlign: 'center' }}>
          <h3>🎉 Deal Completed!</h3>
          <p>Both of you confirmed. This now counts toward Level, and you can both review each other.</p>
          {!reviewed ? (
            <button className="edit-btn" onClick={() => navigate('/reviews')} style={{ width: '100%', background: '#ffc107', color: '#111' }}>⭐ Leave Review for {other.name} →</button>
          ) : (
            <p>✅ You already reviewed this deal</p>
          )}
          <button className="ghost-btn" onClick={() => navigate(`/user/${other._id}`)} style={{ marginTop: 8 }}>View {other.name}'s Profile →</button>
        </div>
      ) : tx.status === 'cancelled' ? (
        <div className="profile-card" style={{ textAlign: 'center' }}><h3>❌ Deal Cancelled</h3><p>This deal was cancelled. It does NOT count for Level or Reviews.</p></div>
      ) : (
        <div className="profile-card">
          <h3>Your Confirmation</h3>
          <p>{myLabel}</p>
          {myConfirmed ? (
            <p style={{ color: '#1dbf73', fontWeight: 700 }}>✅ You confirmed. Waiting for {other.name}...</p>
          ) : (
            <button onClick={confirm} disabled={confirming} style={{ width: '100%', padding: 14, background: '#1dbf73', color: '#fff', border: 0, borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
              {confirming ? 'Confirming...' : `✅ I Confirm - ${myLabel}`}
            </button>
          )}
          <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>{otherConfirmed ? `✅ ${other.name} already confirmed - your confirmation will complete the deal!` : `⏳ ${other.name} has not confirmed yet. They will see this page too.`}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="ghost-btn" style={{ flex: 1 }} onClick={() => navigate(`/chat/${other._id}`)}>💬 Message {other.name?.split(' ')[0]}</button>
            <button className="ghost-btn" style={{ flex: 1, color: '#d32f2f' }} onClick={cancel}>Cancel Deal</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionPage;