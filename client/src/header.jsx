import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ThemeToggle from './theme-toggle.jsx';
import LogOut from './log-out.jsx';
import AuthPrompt from './auth-prompt.jsx';
import './App.css';
import AppIcon from './assets/app_icon.png';
import DefaultUser from './assets/sell-icon.png';

function Header() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const load = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('current_user') || 'null');
                setUser(saved || null);
            } catch { setUser(null); }
        };
        load();
        window.addEventListener('storage', load);
        window.addEventListener('user-updated', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('user-updated', load);
        };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch('https://buy-sell-barter.onrender.com/api/profile/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => {
                const u = d.user || d;
                if (u && u._id) {
                    setUser(u);
                    localStorage.setItem('current_user', JSON.stringify(u));
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
        if (menuOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);

    const goToProfile = (e) => {
        e?.preventDefault();
        setMenuOpen(false);
        if (!localStorage.getItem('token')) { setShowAuth(true); return; }
        navigate('/profile');
    };

    const go = (path) => { navigate(path); setMenuOpen(false); };

    const name = user?.name || 'Guest';
    const username = user?.username || 'guest';
    const avatar = user?.avatar || DefaultUser;
    const location = user?.location || 'Nigeria';
    const country = user?.country || 'Nigeria';
    const state = user?.state || '';
    const bio = user?.bio || 'Welcome to Buy & Sell!';
    const purpose = user?.purpose || '';
    const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }) : 'Recently';
    const avgRating = user?.avgRating || 5.0;
    const reviewsCount = user?.reviewsCount || 0;

    return (
        <>
            {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

            <div className={menuOpen ? "sidebar-drawer open" : "sidebar-drawer"} onClick={(e) => e.stopPropagation()}>
                <div className="top-sidebar-menu" onClick={goToProfile} style={{ cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: 'fit-content' }}>
                        <img src={avatar} alt={name} className="profile-avatar-lg" />
                        <span className="online-dot" />
                    </div>
                    <div className="menu-profile-info">
                        <div className="sidebar-name">
                            <h2>{name} <span className="verified">✓</span></h2>
                            <p className="handle">@{username} • Level 2 Seller</p>
                            <p className="rating-line"><b>{avgRating}</b> ({reviewsCount} reviews) • 98% Success</p>
                            <p className="meta">📍 {location}</p>
                            <p className="meta">🌍 {country}{state ? ` • ${state}` : ''}</p>
                        </div>
                        <div className="divider">
                            <p className="meta">🕒 Member since {joined} • ⚡ Responds in ~1 hr</p>
                            <p className="bio">{bio}</p>
                        </div>
                        <div className="divider2">
                            {purpose && <div className="purpose-box"><b>🎯 My Purpose:</b><p>{purpose}</p></div>}
                            <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate('/edit-profile'); }}>✏️ Edit Profile</button>
                            <button className="msg-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate('/messages'); }}>💬 Contact Me</button>
                        </div>
                    </div>
                </div>
                 

                    <div className="sidebar-links">
                        <a onClick={() => go('/market')}>Market</a>
                        <a onClick={() => go('/sellers')}>Sell</a>
                        <a onClick={() => go('/buyers')}>Buy</a>
                        <a onClick={() => go('/barters')}>Barters</a>
                        <a onClick={() => go('/faq')}>FAQ</a>
                        <a onClick={() => go('/terms')}>Terms</a>
                    </div>
                    {user && (
                        <div className="sidebar-footer">
                            <LogOut />
                        </div>
                    )}
            </div>

            <div className="navbar">
                <div className="left-bar">
                    <div className={menuOpen ? "menu-button toggled" : "menu-button"}
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                        <div></div><div></div><div></div>
                    </div>
                    <div className="icon"><img src={AppIcon} alt='Buy & Sell' /></div>
                    <div className="title" onClick={() => go('/market')}>
                        <span className="name">Buy<span className="and">&</span><span className="subname">Sell</span></span>
                        <p className="peptalk">You had no idea who awaits your offer</p>
                    </div>
                </div>

                <div className='menu'>
                        <a onClick={() => go('/market')}>Market</a>
                        <a onClick={() => go('/sellers')}>Sell</a>
                        <a onClick={() => go('/buyers')}>Buy</a>
                        <a onClick={() => go('/barters')}>Barters</a>
                        <a onClick={() => go('/faq')}>FAQ</a>
                        <a onClick={() => go('/terms')}>Terms</a>
                </div>

                <div className='right-bar'>
                    <a onClick={() => go('/sellers-upload')} className="ytb plus">
                        <div><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>
                    </a>
                    <ThemeToggle />
                    <div className='user-image'>
                        <img src={avatar} alt="User Image" onClick={goToProfile} style={{ cursor: 'pointer' }} />
                    </div>
                    {user ? (
                        <h2 onClick={goToProfile} style={{ cursor: 'pointer' }} className="nav-name">{user.name} <span className="verified">✓</span></h2>
                    ) : (
                        <h2 onClick={() => setShowAuth(true)} style={{ cursor: 'pointer' }} className='guest'>Guest</h2>
                    )}
                {user && (
                    <div className='logout'>
                       <LogOut />
                    </div>
                )}
                </div>
            </div>
            {showAuth && <AuthPrompt onClose={() => setShowAuth(false)} />}
        </>
    );
}

export default Header; 