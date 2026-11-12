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

    const isLoggedIn = () => !!localStorage.getItem('token');

    const clearLocally = (tab) => {
        clearedAt.current[tab] = Date.now();
        setBadges(prev => ({
            ...prev,
            ...(tab === 'market' ? { newMarket: 0 } : {}),
            ...(tab === 'buyers' ? { newBuy: 0 } : {}),
            ...(tab === 'sellers' ? { newSell: 0 } : {}),
        }));
    };

    const go = async (path, tab, requiresAuth = false) => {

        if (requiresAuth && !isLoggedIn()) {
            navigate('/login', { state: { from: path } });
            return;
        }

        if (tab) {
            clearLocally(tab);

            if (isLoggedIn()) {
                try {
                    await fetch(`https://buy-sell-barter.onrender.com/api/notifications/seen/${tab}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    });
                } catch {}
            }
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
            if (!token) return; // Guests = no badges, no fetch
            try {
                const r = await fetch('https://buy-sell-barter.onrender.com/api/notifications/badges', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await r.json().catch(() => ({}));
                if (typeof data.newMarket !== 'number') return;
                const now = Date.now();
                setBadges({
                    unreadMessages: data.unreadMessages,
                    newMarket: now - clearedAt.current.market < 10000 ? 0 : data.newMarket,
                    newBuy: now - clearedAt.current.buyers < 10000 ? 0 : data.newBuy,
                    newSell: now - clearedAt.current.sellers < 10000 ? 0 : data.newSell,
                });
            } catch {}
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
        return <span className="footer-badge">{count > 99 ? '99+' : count}</span>;
    };

    return (
        <div className={`footer ${hidden ? 'hide-down' : ''}`}>
            <nav id="yt">
                <button type="button" onClick={() => go('/market', 'market', false)} className="ytb">
                    <Badge count={badges.newMarket} />
                    <svg viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z" /></svg>
                    <span className="ytb-label">Market</span>
                </button>

                <button type="button" onClick={() => go('/buyers', 'buyers', false)} className="ytb">
                    <Badge count={badges.newBuy} />
                    <img src={BuyersIcon} alt="Buyers" className="footer-img" />
                    <span className="ytb-label">Buyers</span>
                </button>


                <button type="button" onClick={() => go('/sellers-upload', null, true)} className="ytb plus">
                    <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></div>
                </button>

                <button type="button" onClick={() => go('/sellers', 'sellers', false)} className="ytb">
                    <Badge count={badges.newSell} />
                    <img src={SellersIcon} alt="Sellers" className="footer-img" />
                    <span className="ytb-label">Sellers</span>
                </button>

                <button type="button" onClick={() => go('/profile', null, true)} className="ytb">
                    <Badge count={badges.unreadMessages} />
                    <div className='you'><img src={avatar} alt="You" className="footer-img you-img" /></div>
                    <span className="ytb-label">You</span>
                </button>
            </nav>
        </div>
    );
}
export default Footer;