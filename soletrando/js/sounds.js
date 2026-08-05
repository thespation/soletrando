// ===== GERENCIAMENTO DE SONS =====

const Sounds = {
    // Contexto de áudio
    audioContext: null,
    
    // Inicializar contexto
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // Criar som sintético
    createTone(frequency, duration, type = 'sine', volume = 0.3) {
        this.init();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    // Som de acerto
    playCorrect() {
        const settings = Data.getSettings();
        if (!settings.soundCorrect) return;
        
        this.createTone(523.25, 0.15, 'sine', 0.3); // C5
        setTimeout(() => this.createTone(659.25, 0.15, 'sine', 0.3), 100); // E5
        setTimeout(() => this.createTone(783.99, 0.2, 'sine', 0.3), 200); // G5
    },

    // Som de erro
    playError() {
        const settings = Data.getSettings();
        if (!settings.soundError) return;
        
        this.createTone(200, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.createTone(150, 0.4, 'sawtooth', 0.2), 150);
    },

    // Som de celebração
    playCelebration() {
        const settings = Data.getSettings();
        if (!settings.soundCelebration) return;
        
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.50];
        notes.forEach((note, i) => {
            setTimeout(() => this.createTone(note, 0.2, 'sine', 0.25), i * 80);
        });
    },

    // Som de suspense
    playSuspense() {
        const settings = Data.getSettings();
        if (!settings.soundSuspense) return;
        
        this.createTone(220, 0.5, 'sine', 0.15);
        setTimeout(() => this.createTone(233.08, 0.5, 'sine', 0.15), 400);
        setTimeout(() => this.createTone(246.94, 0.5, 'sine', 0.15), 800);
    },

    // Som de letra revelada
    playLetterReveal() {
        this.createTone(440, 0.1, 'sine', 0.2);
    },

    // Som de clique
    playClick() {
        this.createTone(800, 0.05, 'sine', 0.1);
    },

    // Som de vitória
    playVictory() {
        const settings = Data.getSettings();
        if (!settings.soundCelebration) return;
        
        const melody = [
            { note: 523.25, duration: 0.15 },
            { note: 523.25, duration: 0.15 },
            { note: 523.25, duration: 0.15 },
            { note: 523.25, duration: 0.3 },
            { note: 415.30, duration: 0.3 },
            { note: 466.16, duration: 0.3 },
            { note: 523.25, duration: 0.15 },
            { note: 466.16, duration: 0.15 },
            { note: 523.25, duration: 0.5 }
        ];
        
        let time = 0;
        melody.forEach(({ note, duration }) => {
            setTimeout(() => this.createTone(note, duration, 'sine', 0.3), time);
            time += duration * 1000;
        });
    }
};

// Exportar para uso global
window.Sounds = Sounds;