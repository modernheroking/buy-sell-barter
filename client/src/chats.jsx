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
      const r = await fetch('https://buy-sell-barter.onrender.com/api/messages/chats', {
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
    if (m.type === 'video') return '🎥 Video';
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

  if (loading) return (
    <div className="chatlist-wrap">
      <p style={{ padding: 20, color: 'var(--chat-muted)' }}>Loading chats...</p>
    </div>
  );

  return (
    <div className="chatlist-wrap">
      {/* HEADER - pinned, never scrolls */}
      <div className="chatlist-header" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--chat-border)' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Chats</h2>
        <button onClick={() => navigate('/market')} style={{ background: '#3ea6ff', border: 0, color: '#fff', padding: '8px 14px', borderRadius: 20, cursor: 'pointer', flexShrink: 0 }}>+ New</button>
      </div>

      {/* SEARCH - pinned, never scrolls */}
      <div className="chatlist-search" style={{ padding: 12, flexShrink: 0, borderBottom: '1px solid var(--chat-border)' }}>
        <input
          placeholder="Search chats..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', background: 'var(--chat-input)', border: '1px solid var(--chat-border)', padding: '10px 14px', borderRadius: 20, color: 'var(--chat-text)', outline: 'none', fontSize: 15 }}
        />
      </div>

      {/* LIST - ONLY THIS SCROLLS */}
      <div className="chatlist-body" style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div className="no-chats" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--chat-muted)' }}>
            <div style={{ fontSize: 60 }}>💬</div>
            <h3 style={{ color: 'var(--chat-text)' }}>No conversations yet</h3>
            <p>Go to Market, click a seller's avatar → View Profile → Message</p>
            <button onClick={() => navigate('/market')} style={{ background: '#1dbf73', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer', marginTop: 10 }}>Browse Market →</button>
          </div>
        ) : filtered.map(c => (
          <div key={c._id} className="chat-item" onClick={() => navigate(`/chat/${c._id}`)} style={{ display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--chat-border)', boxSizing: 'border-box' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={c.avatar || DefaultUser} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ width: 12, height: 12, background: '#4ade80', borderRadius: '50%', position: 'absolute', bottom: 2, right: 2, border: '2px solid var(--chat-bg)' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || `@${c.username}`}</div>
                <div style={{ fontSize: 12, color: 'var(--chat-muted)', flexShrink: 0 }}>{fmtTime(c.lastMsg?.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--chat-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{lastText(c.lastMsg)}</div>
                {c.unread > 0 && <div style={{ background: '#3ea6ff', color: '#fff', fontSize: 12, padding: '2px 7px', borderRadius: 12, minWidth: 20, textAlign: 'center', flexShrink: 0 }}>{c.unread}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chats;