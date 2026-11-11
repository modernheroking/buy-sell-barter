import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function BartersUpload(){
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);

    const [mode, setMode] = useState('Barter');
    const [facing, setFacing] = useState('user');
    const [quality, setQuality] = useState('720p');
    const [speed, setSpeed] = useState('1x');
    const [duration, setDuration] = useState('15s');
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [media, setMedia] = useState([]);
    const [sound, setSound] = useState('No sound');
    const [flash, setFlash] = useState(false);

    const startCamera = async (face = facing) => {
        try{
            if(streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: face, width: quality === '720p' ? 1280 : 1920, height: quality === '720p' ? 720 : 1080 },
                audio: true
            });
            streamRef.current = stream;
            if(videoRef.current){
                videoRef.current.srcObject = stream;
                videoRef.current.playbackRate = parseFloat(speed);
                videoRef.current.play();
            }
        }catch(e){ alert('Allow camera + mic'); }
    };

    useEffect(() => { startCamera(); return () => { if(streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }; }, []);
    useEffect(() => { if(videoRef.current) videoRef.current.playbackRate = parseFloat(speed); }, [speed]);

    useEffect(() => {
        let t;
        if(isRecording){
            t = setInterval(() => setRecordTime(p => {
                const max = parseInt(duration);
                if(p + 1 >= max){ stopRecording(); return p; }
                return p + 1;
            }), 1000);
        }
        return () => clearInterval(t);
    }, [isRecording, duration]);

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        // ✅ FIX: Don't crash if camera not ready yet
        if (!video || !canvas || !video.videoWidth) { alert('Wait for camera to load'); return; }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const src = canvas.toDataURL('image/jpeg', 0.9);
        setMedia(prev => [...prev, { type: 'image', src }].slice(0, 5));
        setFlash(true); setTimeout(() => setFlash(false), 200);
    };

    const startRecording = () => {
        if (!streamRef.current) { alert('Wait for camera to load'); return; }
        chunksRef.current = [];
        const rec = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        rec.ondataavailable = e => { if(e.data.size) chunksRef.current.push(e.data); };
        rec.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const reader = new FileReader();
            reader.onload = () => setMedia(prev => [...prev, { type: 'video', src: reader.result }].slice(0, 5));
            reader.readAsDataURL(blob);
        };
        recorderRef.current = rec;
        rec.start();
        setIsRecording(true); setRecordTime(0);
    };
    const stopRecording = () => { if(recorderRef.current && isRecording){ recorderRef.current.stop(); setIsRecording(false); } };
    const onShutter = () => { if(isRecording) stopRecording(); else startRecording(); };

    const flipCamera = () => {
        const next = facing === 'user' ? 'environment' : 'user';
        setFacing(next); startCamera(next);
    };

    const handleFile = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setMedia(prev => [...prev, { type: file.type.startsWith('video') ? 'video' : 'image', src: reader.result }].slice(0, 5));
            reader.readAsDataURL(file);
        });
    };

    // ✅ REMOVED: const src = canvas.toDataURL(...) - this was crashing the page

    const goToDescription = () => {
        if (media.length === 0) { alert('Picture or Video of YOUR item is compulsory! Capture, record, or Add from gallery'); return; }
        if (JSON.stringify(media).length > 8 * 1024 * 1024) { alert('Media too big - use shorter video / fewer photos'); return; }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        sessionStorage.setItem('barters_draft_media', JSON.stringify(media));
        sessionStorage.setItem('barters_draft_mode', 'Barter');
        navigate('/barters-description');
    };

    const switchMode = (m) => {
        setMode(m);
        if(m === 'Buy') navigate('/buyers-upload');
        if(m === 'Sell') navigate('/sellers-upload');
    };

    return (
        <div className="camera-page">
            <div className="camera-view">
                <video ref={videoRef} playsInline muted autoPlay className="camera-video" />
                {flash && <div className="flash" />}
                <canvas ref={canvasRef} style={{display:'none'}} />

                <button className="cam-close" onClick={() => navigate('/market')}>✕</button>
                <button className="add-sound" onClick={() => { const s = prompt('Sound name?', sound); if(s) setSound(s); }}>♪ Add sound {sound !== 'No sound' ? `- ${sound}` : ''}</button>

                <div className="cam-right">
                    <button onClick={flipCamera} title="Flip"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>
                    <button onClick={() => setQuality(quality === '720p' ? '1080p' : '720p')}><b>{quality}</b><span>Quality</span></button>
                    <button onClick={() => setSpeed(speed === '1x' ? '2x' : speed === '2x' ? '0.5x' : '1x')}><b>{speed}</b><span>Speed</span></button>
                    <button onClick={() => setDuration(duration === '15s' ? '60s' : duration === '60s' ? '10m' : '15s')}><span>◷</span><b>{duration}</b></button>
                </div>

                {media.length > 0 && (
                    <div className="cam-thumbs">
                        {media.map((m,i) => m.type === 'image' ? <img key={i} src={m.src} alt="" /> : <video key={i} src={m.src} muted />)}
                    </div>
                )}
                {isRecording && <div className="rec-badge">● REC {recordTime}s / {duration}</div>}

                <div className="cam-bottom">
                    <label className="cam-add">
                        <span className="add-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </span>
                        <span>Add</span>
                        <input type="file" accept="image/*,video/*" multiple hidden onChange={handleFile} />
                    </label>

                    <div className="shutter-wrap">
                        <button className={`shutter ${isRecording ? 'recording' : ''}`} onClick={onShutter}><span /></button>
                        <button className="capture-btn" onClick={takePhoto}>📷 Capture</button>
                    </div>

                    <button className="cam-next" onClick={goToDescription} disabled={media.length === 0}>Next →<small>{media.length}/5</small></button>
                </div>

                <div className="cam-modes">
                    {['Buy','Sell','Barter'].map(m => (
                        <button key={m} className={mode === m ? 'active' : ''} onClick={() => switchMode(m)}>{m}</button>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default BartersUpload;