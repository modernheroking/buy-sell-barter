import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

function ReviewPage() {
  const navigate = useNavigate();
  const [eligible, setEligible] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    fetch('http://localhost:5000/api/reviews/eligible', { headers: headers() })
      .then(r => r.json())
      .then(d => { setEligible(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    const r = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ goodId: selected.good._id, stars, text }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return alert(data.msg || 'Review failed');
    alert('Review posted!');
    setEligible(prev => prev.filter(x => x.good._id !== selected.good._id));
    setSelected(null); setText(''); setStars(5);
  };

  if (loading) return <div className="profile-page"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;

  return (
    <div className="profile-page" style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>⭐ Leave a Review</h2>
      <p style={{ color: '#666' }}>Only people you completed a deal with. No fake reviews.</p>

      {eligible.length === 0 && (
        <div className="empty">
          <h3>No deals to review yet</h3>
          <p>Complete a sale, buy, or swap first - then come back to review them.</p>
          <button onClick={() => navigate('/market')}>Go to Market →</button>
        </div>
      )}

      {!selected && eligible.map(({ good, reviewee }) => (
        <div key={good._id} className="review-item" style={{ cursor: 'pointer' }} onClick={() => setSelected({ good, reviewee })}>
          <img src={reviewee?.avatar || DefaultUser} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
          <div>
            <b>Review {reviewee?.name}</b>
            <p style={{ color: '#666', margin: '4px 0' }}>{good.name || `${good.giveName} ⇄ ${good.wantName}`} • Completed {good.completedAt ? new Date(good.completedAt).toLocaleDateString() : ''}</p>
            <button>Review →</button>
          </div>
        </div>
      ))}

      {selected && (
        <form onSubmit={submit} className="review-form">
          <h3>Review {selected.reviewee?.name}</h3>
          <p>{selected.good.name || `${selected.good.giveName} ⇄ ${selected.good.wantName}`}</p>
          <div style={{ fontSize: 32 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} onClick={() => setStars(s)} style={{ cursor: 'pointer', color: s <= stars ? '#ffc107' : '#ddd' }}>★</span>
            ))}
          </div>
          <textarea placeholder="How was dealing with them?" value={text} onChange={e => setText(e.target.value)} required rows={4} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Post Review</button>
            <button type="button" onClick={() => setSelected(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ReviewPage;