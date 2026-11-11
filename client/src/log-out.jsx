import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LogOut({ className = 'logout-btn', label = '🚪 Log Out' }) {
    const navigate = useNavigate();
    const [confirming, setConfirming] = useState(false);

    const doLogout = () => {
        // 1. Clear all auth + user data
        localStorage.removeItem('token');
        localStorage.removeItem('current_user');
        sessionStorage.removeItem('sellers_draft_media');
        sessionStorage.removeItem('sellers_draft_mode');

        // 2. Tell Header to re-read and show Guest
        window.dispatchEvent(new Event('user-updated'));

        // 3. Go home
        navigate('/market');
    };

    // First click = ask, second click = logout
    if (!confirming) {
        return (
            <button className={className} onClick={() => setConfirming(true)}>
                {label}
            </button>
        );
    }

    return (
        <div className="logout-confirm">
            <p>Log out?</p>
            <button className="logout-yes" onClick={doLogout}>Yes, log out</button>
            <button className="logout-no" onClick={() => setConfirming(false)}>Cancel</button>
        </div>
    );
}

export default LogOut;