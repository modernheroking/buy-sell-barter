import { useNavigate } from 'react-router-dom';
import './App.css';

export default function AuthPrompt({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="auth-prompt-overlay" onClick={onClose}>
      <div className="auth-prompt-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-x" onClick={onClose}>✕</button>
        <h2>🔒 Login Required</h2>
        <p>Login to view your profile, post goods and chat with sellers.</p>
        <button className="primary-btn" onClick={() => navigate('/login')}>Login</button>
        <button className="ghost-btn" onClick={() => navigate('/register')}>Create New Account</button>
        <p className="auth-prompt-small">Don't have an account? It takes 1 minute.</p>
      </div>
    </div>
  );
}