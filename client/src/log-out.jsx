import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LogOut({ className = 'logout-btn', label = '🚪 Log Out' }) {
    const navigate = useNavigate();
    const [confirming, setConfirming] = useState(false);

    const doLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('current_user');
        sessionStorage.removeItem('sellers_draft_media');
        sessionStorage.removeItem('sellers_draft_mode');

        window.dispatchEvent(new Event('user-updated'));


        navigate('/market');
    };


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