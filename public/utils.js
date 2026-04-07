const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, startTime) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, startTime);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function playTada() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    // C5 then E5 (Classic Tada)
    playTone(523.25, 'sine', 0.15, now); 
    playTone(659.25, 'sine', 0.6, now + 0.15); 
}

function playFunSong() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    // Fun arpeggio for Checkin / Checkout
    playTone(392.00, 'square', 0.1, now); 
    playTone(523.25, 'square', 0.1, now + 0.1); 
    playTone(659.25, 'square', 0.1, now + 0.2); 
    playTone(783.99, 'square', 0.4, now + 0.3); 
}
