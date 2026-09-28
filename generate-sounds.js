// Sound generator for Toyota Chat
// Creates Web Audio API sounds dynamically

class ToyotaSoundGenerator {
    constructor() {
        this.audioContext = null;
        this.isEnabled = true;
    }
    
    initAudioContext() {
        if (!this.audioContext && (window.AudioContext || window.webkitAudioContext)) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
    
    // Check if sound can be played
    canPlaySound() {
        return this.isEnabled && this.initAudioContext() !== null;
    }
    
    // Notification sound (Toyota chime)
    createNotificationSound() {
        if (!this.canPlaySound()) return;
        
        const ctx = this.initAudioContext();
        const now = ctx.currentTime;
        
        // Resume audio context if suspended (due to browser autoplay policies)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        try {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc1.type = 'sine';
            osc2.type = 'sine';
            
            osc1.frequency.value = 523.25;
            osc2.frequency.value = 659.25;
            
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.4);
            osc2.stop(now + 0.4);
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
    
    // Message sent sound
    createMessageSentSound() {
        if (!this.canPlaySound()) return;
        
        const ctx = this.initAudioContext();
        const now = ctx.currentTime;
        
        if (ctx.state === 'suspended') ctx.resume();
        
        try {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            osc.type = 'sine';
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
            
            osc.frequency.value = 440;
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
    
    // Message received sound
    createMessageReceivedSound() {
        if (!this.canPlaySound()) return;
        
        const ctx = this.initAudioContext();
        const now = ctx.currentTime;
        
        if (ctx.state === 'suspended') ctx.resume();
        
        try {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 523.25;
            osc.frequency.exponentialRampToValueAtTime(392, now + 0.15);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
    
    // Login success sound
    createLoginSound() {
        if (!this.canPlaySound()) return;
        
        const ctx = this.initAudioContext();
        const now = ctx.currentTime;
        
        if (ctx.state === 'suspended') ctx.resume();
        
        try {
            const notes = [523.25, 659.25, 783.99];
            
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                const startTime = now + index * 0.12;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);
                
                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
    
    // Error sound
    createErrorSound() {
        if (!this.canPlaySound()) return;
        
        const ctx = this.initAudioContext();
        const now = ctx.currentTime;
        
        if (ctx.state === 'suspended') ctx.resume();
        
        try {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = 220;
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
}

// Create global instance
window.ToyotaSoundGenerator = ToyotaSoundGenerator;
window.soundGenerator = new ToyotaSoundGenerator();