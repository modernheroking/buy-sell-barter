import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const r = await fetch('http://localhost:5000/api/messages/chats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json().catch(() => []);
      if (Array.isArray(data)) setChats(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    localStorage.setItem('lastSeen_messages', new Date().toISOString());
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const filtered = chats.filter(c =>
    (c.name + ' ' + (c.username || '')).toLowerCase().includes(search.toLowerCase())
  );

  const lastText = (m) => {
    if (!m) return 'No messages yet';
    if (m.type === 'image') return '📷 Photo';
    if (m.type === 'voice') return '🎤 Voice';
    if (m.type === 'file') return '📎 Document';
    return m.text || '';
  };

  const fmtTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  if (loading) return <div className="chatlist-wrap"><p style={{ padding: 20, color: '#fff' }}>Loading chats...</p></div>;

  return (
    <div className="chatlist-wrap" style={{ maxWidth: 600, margin: '20px auto', background: '#0f0f0f', borderRadius: 12, minHeight: '85vh', color: '#fff' }}>
      <div className="chatlist-header" style={{ padding: 16, borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Chats</h2>
        <button onClick={() => navigate('/market')} style={{ background: '#3ea6ff', border: 0, color: '#fff', padding: '8px 14px', borderRadius: 20, cursor: 'pointer' }}>+ New</button>
      </div>

      <div className="chatlist-search" style={{ padding: 12, borderBottom: '1px solid #222' }}>
        <input
          placeholder="Search chats..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: '#222', border: 0, padding: '10px 14px', borderRadius: 20, color: '#fff', outline: 'none' }}
        />
      </div>

      <div id="chatList">
        {filtered.length === 0 ? (
          <div className="no-chats" style={{ textAlign: 'center', padding: '60px 20px', color: '#777' }}>
            <div style={{ fontSize: 60 }}>💬</div>
            <h3>No conversations yet</h3>
            <p>Go to Market, click a seller's avatar → View Profile → Message</p>
            <button onClick={() => navigate('/market')} style={{ background: '#1dbf73', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer', marginTop: 10 }}>Browse Market →</button>
          </div>
        ) : filtered.map(c => (
          <div key={c._id} className="chat-item" onClick={() => navigate(`/chat/${c._id}`)} style={{ display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ position: 'relative' }}>
              <img src={c.avatar || DefaultUser} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ width: 12, height: 12, background: '#4ade80', borderRadius: '50%', position: 'absolute', bottom: 2, right: 2, border: '2px solid #0f0f0f' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name || `@${c.username}`}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{fmtTime(c.lastMsg?.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div style={{ fontSize: 13, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{lastText(c.lastMsg)}</div>
                {c.unread > 0 && <div style={{ background: '#3ea6ff', color: '#fff', fontSize: 12, padding: '2px 7px', borderRadius: 12, minWidth: 20, textAlign: 'center' }}>{c.unread}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chats;