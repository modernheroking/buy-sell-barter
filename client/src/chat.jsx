import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DefaultUser from './assets/app_icon.png';
import ThemeToggle from './theme-toggle.jsx';
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
  const [uploading, setUploading] = useState(false);

  const chatBodyRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const meId = (() => { try { return JSON.parse(localStorage.getItem('current_user') || '{}')._id; } catch { return null; } })();

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  const scrollDown = () => { requestAnimationFrame(() => { if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; }); };

  const load = async (poll = false) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const lastId = poll && msgs.length ? msgs[msgs.length - 1]._id : null;
      const url = `https://buy-sell-barter.onrender.com/api/messages/${withId}${lastId ? `?after=${lastId}` : ''}`;
      const r = await fetch(url, { headers: headers() });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (!poll) { setError(data.msg || `Failed to load chat (${r.status})`); setLoading(false); }
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
      if (!poll) { setError('Cannot reach server'); setLoading(false); }
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
      const r = await fetch(`https://buy-sell-barter.onrender.com/api/messages/${withId}`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText, type: 'text', replyTo: replyTo?._id || null }),
      });
      const data = await r.json().catch(() => ({}));
      if (data._id) setMsgs(prev => [...prev, data]);
      scrollDown();
    } catch {}
  };

  const sendFile = async (file, type) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      form.append('text', text || '');
      if (replyTo?._id) form.append('replyTo', replyTo._id);
      const r = await fetch(`https://buy-sell-barter.onrender.com/api/messages/${withId}/upload`, {
        method: 'POST', headers: headers(), body: form,
      });
      const data = await r.json().catch(() => ({}));
      if (data._id) setMsgs(prev => [...prev, data]);
      else alert(data.msg || 'Upload failed');
      setText(''); setReplyTo(null); scrollDown();
    } catch (e) { alert('Upload failed - check connection'); }
    setUploading(false);
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'voice';
    sendFile(file, type);
    e.target.value = '';
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
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        sendFile(voiceFile, 'voice');
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
    await fetch(`https://buy-sell-barter.onrender.com/api/messages/${id}`, { method: 'DELETE', headers: headers() });
  };

  const renderBubble = (m) => {
    if (m.type === 'image') return <><img src={m.fileUrl} alt="" style={{ width: '100%', maxWidth: 260, borderRadius: 8, display: 'block' }} />{m.text && <div style={{ marginTop: 6 }}>{m.text}</div>}</>;
    if (m.type === 'video') return <><video src={m.fileUrl} controls style={{ width: '100%', maxWidth: 260, borderRadius: 8, display: 'block' }} />{m.text && <div style={{ marginTop: 6 }}>{m.text}</div>}</>;
    if (m.type === 'voice') return <audio controls src={m.fileUrl} style={{ width: 200, maxWidth: '100%' }} />;
    if (m.type === 'file') return <><a href={m.fileUrl} download style={{ color: 'var(--chat-seen)' }}>📎 {m.fileName || 'Document'}</a>{m.text && <div style={{ marginTop: 6 }}>{m.text}</div>}</>;
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</span>;
  };

  if (loading) return (
    <div className="chat-wrap" style={{ padding: 40, textAlign: 'center', justifyContent: 'center' }}>
      <p>Loading chat...</p>
    </div>
  );

  if (error) return (
    <div className="chat-wrap" style={{ padding: 40, textAlign: 'center', justifyContent: 'center' }}>
      <h3>⚠️ {error}</h3>
      <button onClick={() => { setLoading(true); setError(''); load(false); }} style={{ background: '#00a884', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer', marginRight: 8 }}>Retry</button>
      <button onClick={() => navigate('/chats')} style={{ background: 'var(--chat-header)', border: 0, color: 'var(--chat-text)', padding: '10px 18px', borderRadius: 20, cursor: 'pointer' }}>Back to Chats</button>
    </div>
  );

  if (!user) return (
    <div className="chat-wrap" style={{ padding: 40, textAlign: 'center', justifyContent: 'center' }}>
      <h3>User not found</h3>
      <button onClick={() => navigate('/chats')} style={{ background: '#00a884', border: 0, color: '#fff', padding: '10px 18px', borderRadius: 20, cursor: 'pointer' }}>Back to Chats</button>
    </div>
  );

  return (
    <div className="chat-wrap">
      {/* HEADER - with ThemeToggle now */}
      <div className="chat-header" style={{ height: 59, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 6px', flexShrink: 0, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <button onClick={() => navigate('/chats')} style={{ background: 'none', border: 0, color: 'var(--chat-text)', fontSize: 22, cursor: 'pointer', flexShrink: 0 }}>←</button>
          <img src={user?.avatar || DefaultUser} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onClick={() => navigate(`/user/${withId}`)} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={() => navigate(`/user/${withId}`)}>{user?.name || 'User'}</h3>
            <small style={{ color: 'var(--chat-muted)', fontSize: 12 }}>@{user?.username}</small>
          </div>
        </div>
        {/* ✅ Dark / Light switch - same component as Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ThemeToggle />
          <button onClick={() => navigate(`/user/${withId}`)} style={{ background: 'none', border: 0, color: 'var(--chat-muted)', fontSize: 18, cursor: 'pointer' }}>👤</button>
        </div>
      </div>

      {/* MESSAGES - ONLY THIS SCROLLS */}
      <div ref={chatBodyRef} className="chat-body" style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
        {msgs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--chat-muted)', marginTop: 40 }}>No messages yet. Say hi 👋</p>}
        {msgs.map(m => {
          const isMe = String(m.sender?._id || m.sender) === String(meId);
          return (
            <div key={m._id} style={{ display: 'flex', width: '100%', margin: '3px 0', gap: 6, justifyContent: isMe ? 'flex-end' : 'flex-start', boxSizing: 'border-box' }}>
              {!isMe && <img src={m.sender?.avatar || user?.avatar || DefaultUser} alt="" style={{ width: 28, height: 28, borderRadius: '50%', alignSelf: 'flex-end', flexShrink: 0 }} />}
              <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative', minWidth: 0 }}>
                <div className={isMe ? 'chat-bubble-me' : 'chat-bubble-other'} style={{ position: 'relative', padding: '6px 8px', borderRadius: 8, fontSize: 14.4, maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'anywhere' }} onClick={() => setMenuId(menuId === m._id ? null : m._id)}>
                  {renderBubble(m)}
                </div>
                {isMe && <div style={{ fontSize: 11, color: m.isSeen ? 'var(--chat-seen)' : 'var(--chat-muted)', marginTop: 2 }}>{m.isSeen ? '✓✓ Seen' : '✓ Delivered'}</div>}
                {menuId === m._id && (
                  <div className="chat-menu" style={{ position: 'absolute', top: 24, right: 0, borderRadius: 8, minWidth: 160, zIndex: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    <button onClick={() => { setReplyTo(m); setMenuId(null); }} style={{ padding: '12px 16px', background: 'none', border: 0, color: 'var(--chat-text)', textAlign: 'left', cursor: 'pointer' }}>Reply</button>
                    {isMe && <button onClick={() => deleteMsg(m._id)} style={{ padding: '12px 16px', background: 'none', border: 0, color: '#ff6b6b', textAlign: 'left', cursor: 'pointer' }}>Delete</button>}
                    <button onClick={() => { navigator.clipboard.writeText(m.text || ''); setMenuId(null); }} style={{ padding: '12px 16px', background: 'none', border: 0, color: 'var(--chat-text)', textAlign: 'left', cursor: 'pointer' }}>Copy</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {replyTo && (
        <div style={{ background: 'var(--chat-header)', padding: '8px 12px', borderLeft: '4px solid #00a884', color: 'var(--chat-text)', fontSize: 13, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Replying to: {replyTo.text?.slice(0, 40)}</span>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 0, color: 'var(--chat-text)', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {isRecording && <div style={{ textAlign: 'center', background: 'var(--chat-header)', padding: 8, flexShrink: 0 }}>🔴 Recording {Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, '0')} - tap mic again to stop</div>}
      {uploading && <div style={{ textAlign: 'center', background: 'var(--chat-header)', padding: 8, flexShrink: 0 }}>Uploading...</div>}

      {/* INPUT - pinned bottom */}
      <div className="chat-footer" style={{ padding: '6px 6px calc(6px + env(safe-area-inset-bottom))', display: 'flex', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
        <div className="chat-input-wrap" style={{ flex: 1, borderRadius: 24, display: 'flex', alignItems: 'flex-end', padding: '5px 6px', gap: 2, minWidth: 0 }}>
          <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'none', border: 0, color: 'var(--chat-muted)', width: 38, height: 38, cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>😊</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 0, color: 'var(--chat-muted)', width: 38, height: 38, cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>📎</button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" hidden onChange={handleFilePick} />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
            rows={1}
            placeholder="Message"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'var(--chat-text)', fontSize: 16, resize: 'none', padding: '8px 4px', minWidth: 0 }}
          />
        </div>
        <button onClick={toggleRecord} style={{ width: 45, height: 45, borderRadius: '50%', background: isRecording ? '#f15c6d' : '#00a884', color: '#fff', border: 0, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>🎤</button>
        {text.trim() && <button onClick={() => sendMsg()} style={{ width: 45, height: 45, borderRadius: '50%', background: '#00a884', color: '#fff', border: 0, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>}
      </div>

      {showEmoji && (
        <div className="chat-emoji-bar" style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4, flexShrink: 0, maxHeight: 160, overflowY: 'auto' }}>
          {EMOJIS.map(e => (
            <span key={e} onClick={() => { setText(t => t + e); setShowEmoji(false); }} style={{ fontSize: 26, padding: 4, cursor: 'pointer' }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Chat;