import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import './App.css';

const EMOJIS = ['😂', '❤️', '👍', '🔥', '😭', '🙏', '😍', '🤣', '😎', '👌', '😊', '🎉'];

function Chat() {
  const { id: withId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const chatBodyRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const meId = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}')._id; } catch { return null; } })();

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  const scrollDown = () => { setTimeout(() => { if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; }, 50); };

  const load = async (poll = false) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const lastId = poll && msgs.length ? msgs[msgs.length - 1]._id : null;
      const url = `http://localhost:5000/api/messages/${withId}${lastId ? `?after=${lastId}` : ''}`;
      const r = await fetch(url, { headers: headers() });
      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        if (!poll) {
          setError(data.msg || `Failed to load chat (${r.status})`);
          setLoading(false);
        }
        return;
      }

      if (data.user) setUser(data.user);
      if (Array.isArray(data.messages) && data.messages.length) {
        setMsgs(prev => {
          const ids = new Set(prev.map(m => m._id));
          const fresh = data.messages.filter(m => !ids.has(m._id));
          return [...prev, ...fresh];
        });
        scrollDown();
      }
      if (!poll) setLoading(false);
    } catch (e) {
      if (!poll) {
        setError('Cannot reach server - is backend running on :5000?');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setMsgs([]); setUser(null); setLoading(true); setError('');
    load(false);
    const t = setInterval(() => load(true), 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [withId]);

  useEffect(() => { scrollDown(); }, [msgs.length]);

  const sendMsg = async (overrideText) => {
    const msgText = (overrideText ?? text).trim();
    if (!msgText) return;
    setText(''); setReplyTo(null); setShowEmoji(false);
    try {
      const r = await fetch(`http://localhost:5000/api/messages/${withId}`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText, type: 'text', replyTo: replyTo?._id || null }),
      });
      const data = await r.json().catch(() => ({}));
      if (data._id) setMsgs(prev => [...prev, data]);
      scrollDown();
    } catch {}
  };

  const toggleRecord = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      clearInterval(recTimerRef.current);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        alert('Voice recorded - connect your file upload endpoint to send voice. Text works now.');
      };
      rec.start();
      recorderRef.current = rec;
      setIsRecording(true);
      setRecSec(0);
      recTimerRef.current = setInterval(() => setRecSec(s => s + 1), 1000);
    } catch { alert('Mic permission denied'); }
  };

  const deleteMsg = async (id) => {
    setMenuId(null);
    setMsgs(prev => prev.filter(m => m._id !== id));
    await fetch(`http://localhost:5000/api/messages/${id}`, { method: 'DELETE', headers: headers() });
  };

  const renderBubble = (m) => {
    if (m.type === 'image') return <><img src={m.fileUrl} alt="" style={{ width: '100%', maxWidth: 300, borderRadius: 8, display: 'block' }} />{m.text && <div style={{ marginTop: 6 }}>{m.text}</div>}</>;
    if (m.type === 'voice') return <audio controls src={m.fileUrl} style={{ width: 220 }} />;
    if (m.type === 'file') return <><a href={m.fileUrl} download style={{ color: '#53bdeb' }}>📎 {m.fileName || 'Document'}</a>{m.text && <div style={{ marginTop: 6 }}>{m.text}</div>}</>;
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</span>;
  };

  // ✅ FIX: ORDER MATTERS - these must be BEFORE the main return, and NOT inside JSX
  // 1. Loading first
  if (loading) return (
    <div className="chat-wrap" style={{ padding: 40, color: '#fff', textAlign: 'center' }}>
      <p>Loading chat...</p>
      <p style={{ fontSize: 12, color: '#8696a0' }}>Chatting with: {withId}</p>
    </div>
  );

  // 2. Error second - now you will SEE the real error instead of infinite Loading
  if (error) return (
    <div className="chat-wrap" style={{ padding: 40, color: '#fff', textAlign: 'center' }}>
      <h3>⚠️ {error}</h3>
      <p style={{ color: '#8696a0', fontSize: 13 }}>ID in URL: {withId}</p>
      <button onClick={() => { setLoading(true); setError(''); load(false); }} style={{ background: '#00a884', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer', marginRight: 8 }}>Retry</button>
      <button onClick={() => navigate('/chats')} style={{ background: '#333', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer' }}>Back to Chats</button>
    </div>
  );

  // 3. User not found third - only after loading finished and no error
  if (!user) return (
    <div className="chat-wrap" style={{ padding: 40, color: '#fff', textAlign: 'center' }}>
      <h3>User not found</h3>
      <button onClick={() => navigate('/chats')} style={{ background: '#00a884', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer' }}>Back to Chats</button>
    </div>
  );

  // 4. Main chat - only reached if loading=false, error='', user exists
  return (
    <div className="chat-wrap" style={{ maxWidth: 1000, margin: '0 auto', background: '#0b141a', height: '100dvh', display: 'flex', flexDirection: 'column', color: '#e9edef' }}>
      <div className="chat-header" style={{ height: 59, background: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <button onClick={() => navigate('/chats')} style={{ background: 'none', border: 0, color: '#e9edef', fontSize: 22, cursor: 'pointer' }}>←</button>
          <img src={user?.avatar || DefaultUser} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onClick={() => navigate(`/user/${withId}`)} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={() => navigate(`/user/${withId}`)}>{user?.name || 'User'}</h3>
            <small style={{ color: '#8696a0', fontSize: 12 }}>@{user?.username}</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => navigate(`/user/${withId}`)} style={{ background: 'none', border: 0, color: '#aebac1', fontSize: 18, cursor: 'pointer' }}>👤</button>
        </div>
      </div>

      <div ref={chatBodyRef} className="chat-body" style={{ flex: 1, overflowY: 'auto', padding: '10px 3%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {msgs.length === 0 && <p style={{ textAlign: 'center', color: '#8696a0', marginTop: 40 }}>No messages yet. Say hi 👋</p>}
        {msgs.map(m => {
          const isMe = String(m.sender?._id || m.sender) === String(meId);
          return (
            <div key={m._id} className={`msg ${isMe ? 'me' : ''}`} style={{ display: 'flex', width: '100%', margin: '3px 0', gap: 6, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && <img src={m.sender?.avatar || user?.avatar || DefaultUser} alt="" style={{ width: 28, height: 28, borderRadius: '50%', alignSelf: 'flex-end' }} />}
              <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                <div className="bubble" style={{ position: 'relative', padding: '6px 8px', borderRadius: 8, fontSize: 14.4, background: isMe ? '#005c4b' : '#202c33', color: '#e9edef' }} onClick={() => setMenuId(menuId === m._id ? null : m._id)}>
                  {renderBubble(m)}
                </div>
                {isMe && <div style={{ fontSize: 11, color: m.isSeen ? '#53bdeb' : '#8696a0', marginTop: 2 }}>{m.isSeen ? '✓✓ Seen' : '✓ Delivered'}</div>}
                {menuId === m._id && (
                  <div style={{ position: 'absolute', top: 24, right: 0, background: '#233138', borderRadius: 8, minWidth: 160, zIndex: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <button onClick={() => { setReplyTo(m); setMenuId(null); }} style={{ padding: '12px 16px', background: 'none', border: 0, color: '#e9edef', textAlign: 'left', cursor: 'pointer' }}>Reply</button>
                    {isMe && <button onClick={() => deleteMsg(m._id)} style={{ padding: '12px 16px', background: 'none', border: 0, color: '#ff6b6b', textAlign: 'left', cursor: 'pointer' }}>Delete</button>}
                    <button onClick={() => { navigator.clipboard.writeText(m.text || ''); setMenuId(null); }} style={{ padding: '12px 16px', background: 'none', border: 0, color: '#e9edef', textAlign: 'left', cursor: 'pointer' }}>Copy</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {replyTo && (
        <div style={{ background: '#18232a', padding: '8px 12px', borderLeft: '4px solid #00a884', color: '#d1d7db', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>Replying to: {replyTo.text?.slice(0, 40)}</span>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {isRecording && <div style={{ textAlign: 'center', background: '#202c33', padding: 8, color: '#fff' }}>🔴 Recording {Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, '0')} - tap mic again to stop</div>}

      <div className="chat-footer" style={{ background: '#202c33', padding: 6, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, background: '#2a3942', borderRadius: 24, display: 'flex', alignItems: 'flex-end', padding: '5px 6px', gap: 2 }}>
          <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 0, color: '#8696a0', width: 38, height: 38, cursor: 'pointer', fontSize: 20 }}>😊</button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            rows={1}
            placeholder="Message"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: '#d1d7db', fontSize: 16, resize: 'none', padding: '8px 4px' }}
          />
        </div>
        <button onClick={toggleRecord} style={{ width: 45, height: 45, borderRadius: '50%', background: isRecording ? '#f15c6d' : '#00a884', color: '#fff', border: 0, cursor: 'pointer', fontSize: 18 }}>🎤</button>
        <button onClick={() => sendMsg()} style={{ width: 45, height: 45, borderRadius: '50%', background: '#00a884', color: '#fff', border: 0, cursor: 'pointer', fontSize: 18, display: text.trim() ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>➤</button>
      </div>

      {showEmoji && (
        <div style={{ background: '#233138', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {EMOJIS.map(e => (
            <span key={e} onClick={() => { setText(t => t + e); setShowEmoji(false); }} style={{ fontSize: 26, padding: 4, cursor: 'pointer' }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Chat;