import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';

function TransactionCongratsPopup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState([]);

  // ✅ FIX: Remember which popups you already clicked, so poll doesn't resurrect them
  const dismissedRef = useRef(new Set());
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('dismissed_congrats_tx') || '[]');
      dismissedRef.current = new Set(saved);
    } catch {}
  }, []);

  const markDismissed = (txId) => {
    dismissedRef.current.add(txId);
    try {
      sessionStorage.setItem('dismissed_congrats_tx', JSON.stringify([...dismissedRef.current]));
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const load = async () => {
      try {
        const r = await fetch('https://buy-sell-barter.onrender.com/api/transactions/pending-confirmations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        // ✅ FIX: Filter out anything you already clicked - poll can never bring it back
        setPending(list.filter(tx => !dismissedRef.current.has(String(tx._id))));
      } catch {}
    };

    load();
    const t = setInterval(load, 5000);
    window.addEventListener('focus', load);
    return () => { clearInterval(t); window.removeEventListener('focus', load); };
  }, [location.pathname]);

  // ✅ Hide when you're already where it wants to send you
  const visible = pending.filter(tx => {
    if (tx.reason === 'review') return location.pathname !== '/review';
    return location.pathname !== `/transaction/${tx._id}`;
  });
  if (visible.length === 0) return null;

  const tx = visible[0];
  const me = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}'); } catch { return {}; } })();
  const isSeller = String(tx.seller._id) === String(me._id);
  const other = isSeller ? tx.buyer : tx.seller;
  const goodName = tx.good?.name || `${tx.good?.giveName || ''} ⇄ ${tx.good?.wantName || ''}`.trim() || 'Item';

  const getMessage = () => {
    if (tx.reason === 'review') {
      return {
        title: '🎉 Congratulations! Deal Completed!',
        body: `You and ${other.name} both confirmed the ${tx.kind === 'barter' ? 'swap' : tx.kind === 'buyer-request' ? 'deal' : 'purchase'} for "${goodName}". Now give ${other.name} a review - it helps their Level.`,
        button: `⭐ Leave Review for ${other.name} →`,
      };
    }
    if (tx.kind === 'barter') {
      return {
        title: '🎉 Congratulations!',
        body: `Your swapper ${other.name} confirmed the swap for "${goodName}" and is awaiting your confirmation. Confirm now to complete the swap.`,
        button: 'View Swap & Confirm →',
      };
    }
    if (tx.kind === 'buyer-request') {
      return isSeller
        ? {
            title: '🎉 Congratulations!',
            body: `The buyer ${other.name} confirmed they received "${goodName}" and is awaiting your confirmation. Confirm now to complete the deal.`,
            button: 'View Deal & Confirm →',
          }
        : {
            title: '🎉 Congratulations!',
            body: `The seller ${other.name} confirmed they delivered "${goodName}" and is awaiting your confirmation. Confirm now to complete the deal.`,
            button: 'View Deal & Confirm →',
          };
    }
    return isSeller
      ? {
          title: '🎉 Congratulations!',
          body: `The buyer ${other.name} confirmed they received "${goodName}" and paid. They are awaiting your confirmation. Confirm now to complete the purchase.`,
          button: 'View Purchase & Confirm →',
        }
      : {
          title: '🎉 Congratulations!',
          body: `The seller ${other.name} confirmed they sent "${goodName}" and is awaiting your confirmation. Confirm now to complete the purchase.`,
          button: 'View Purchase & Confirm →',
        };
  };

  const { title, body, button } = getMessage();

  const handleClick = () => {
    // ✅ FIX: Remember this click permanently (for this session) BEFORE navigating
    // Next poll will filter it out, so it can never come back
    markDismissed(String(tx._id));
    setPending(prev => prev.filter(p => String(p._id) !== String(tx._id)));
    if (tx.reason === 'reviews') navigate('/review');
    else navigate(`/transaction/${tx._id}`);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(22, 17, 17, 0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: 24, maxWidth: 420, width: '100%',
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'pop 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
          <img src={other.avatar || DefaultUser} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
          <img src={tx.good?.images?.[0] || DefaultUser} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{title}</h2>
        <p style={{ color: '#444', lineHeight: 1.5, margin: '0 0 20px' }}>{body}</p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 13, color: '#888' }}>
          <span>{tx.sellerConfirmed ? '✅ Seller confirmed' : '⏳ Seller waiting'}</span>
          <span>•</span>
          <span>{tx.buyerConfirmed ? '✅ Buyer confirmed' : '⏳ Buyer waiting'}</span>
        </div>

        <button
          onClick={handleClick}
          style={{
            width: '100%', padding: '14px', fontSize: 16, fontWeight: 800,
            background: tx.reason === 'review' ? '#ffc107' : '#1dbf73', color: tx.reason === 'review' ? '#111' : '#fff',
            border: 0, borderRadius: 12, cursor: 'pointer',
          }}
        >
          {button}
        </button>

        {visible.length > 1 && (
          <p style={{ color: '#888', fontSize: 13, marginTop: 10 }}>+ {visible.length - 1} more deal{visible.length - 1 > 1 ? 's' : ''} waiting for you</p>
        )}

        <p style={{ color: '#999', fontSize: 12, marginTop: 10 }}>
          {tx.reason === 'review' ? 'You can review later from Profile → Reviews' : 'This will stay here until you confirm'}
        </p>
      </div>
    </div>
  );
}

export default TransactionCongratsPopup;