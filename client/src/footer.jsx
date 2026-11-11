import './App.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyersIcon from './assets/buy-icon.png';
import SellersIcon from './assets/sell-icon.png';
import DefaultUser from './assets/app_icon.png';

function Footer() {
    const navigate = useNavigate();
    const [hidden, setHidden] = useState(false);
    const [avatar, setAvatar] = useState(DefaultUser);
    const [badges, setBadges] = useState({ unreadMessages: 0, newSell: 0, newBuy: 0, newMarket: 0 });


    const clearedAt = useRef({ market: 0, buyers: 0, sellers: 0 });

    const clearLocally = (tab) => {
        clearedAt.current[tab] = Date.now();
        setBadges(prev => ({
            ...prev,
            ...(tab === 'market' ? { newMarket: 0 } : {}),
            ...(tab === 'buyers' ? { newBuy: 0 } : {}),
            ...(tab === 'sellers' ? { newSell: 0 } : {}),
        }));
    };

    const go = async (path, tab) => {
        if (tab) {
            clearLocally(tab);
    
            try {
                const r = await fetch(`https://buy-sell-barter.onrender.com/api/notifications/seen/${tab}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                const data = await r.json().catch(() => ({}));
                if (!r.ok) console.log('❌ Seen FAILED:', r.status, data);
                else console.log('✅ Seen saved on server:', tab);
            } catch (e) { console.log('❌ Seen fetch failed:', e); }
        }
        navigate(path);
    };

    useEffect(() => {
        const load = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('current_user') || 'null');
                setAvatar(saved?.avatar || DefaultUser);
            } catch { setAvatar(DefaultUser); }
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
        const loadBadges = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const r = await fetch('https://buy-sell-barter.onrender.com/api/notifications/badges', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await r.json().catch(() => ({}));
                if (typeof data.newMarket !== 'number') { console.log('Badges error:', data); return; }

                const now = Date.now();
                setBadges(prev => ({
                    unreadMessages: data.unreadMessages,
                    newMarket: now - clearedAt.current.market < 10000 ? 0 : data.newMarket,
                    newBuy: now - clearedAt.current.buyers < 10000 ? 0 : data.newBuy,
                    newSell: now - clearedAt.current.sellers < 10000 ? 0 : data.newSell,
                }));
            } catch (e) { console.log('Badges fetch failed:', e); }
        };
        loadBadges();
        const t = setInterval(loadBadges, 5000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        let lastTop = window.scrollY;
        const onScroll = () => {
            const curr = window.scrollY;
            if (Math.abs(curr - lastTop) < 10) return;
            setHidden(curr > lastTop && curr > 70);
            lastTop = curr;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const Badge = ({ count }) => {
        if (!count || count <= 0) return null;
        return (
            <span style={{
                position: 'absolute', top: -2, right: -2,
                background: '#ff3b30', color: '#fff', fontSize: 11, fontWeight: 800,
                minWidth: 20, height: 20, padding: '0 5px', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff', zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                transform: 'translateX(-100%)',
            }}>
                {count > 99 ? '99+' : count}
            </span>
        );
    };

    return (
        <div className={`footer ${hidden ? 'hide-down' : ''}`}>
            <nav id="yt">
                <a onClick={() => go('/market', 'market')} className="ytb" style={{ position: 'relative' }}>
                    <Badge count={badges.newMarket} />
                    <svg viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z" /></svg>
                    <span>Market</span>
                </a>

                <a onClick={() => go('/buyers', 'buyers')} className="ytb" style={{ position: 'relative' }}>
                    <Badge count={badges.newBuy} />
                    <img src={BuyersIcon} alt="Buyers" className="footer-img" />
                    <span>Buyers</span>
                </a>

                <a onClick={() => go('/sellers-upload')} className="ytb plus">
                    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></div>
                </a>

                <a onClick={() => go('/sellers', 'sellers')} className="ytb" style={{ position: 'relative' }}>
                    <Badge count={badges.newSell} />
                    <img src={SellersIcon} alt="Sellers" className="footer-img" />
                    <span>Sellers</span>
                </a>

                <a onClick={() => go('/profile')} className="ytb" style={{ position: 'relative' }}>
                    <Badge count={badges.unreadMessages} />
                    <div className='you'>
                        <img src={avatar} alt="You" className="footer-img you-img" />
                    </div>
                    <span>You</span>
                </a>
            </nav>
        </div>
    );
}

export default Footer;