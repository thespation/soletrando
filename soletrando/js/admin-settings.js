// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminSettings = {
    loadSettings() {
        const settings = Data.getSettings();

        document.getElementById('setting-capitalization').value = settings.capitalization;
        document.getElementById('setting-show-hint').checked = settings.showHint;
    document.getElementById('setting-show-image').checked = settings.showImage;
        document.getElementById('setting-show-remaining').checked = settings.showRemaining;
        document.getElementById('setting-show-timer').checked = settings.showTimer;
        document.getElementById('setting-reveal-word').checked = settings.revealWord;
        document.getElementById('setting-auto-mode').checked = settings.autoMode;
        document.getElementById('setting-sound-correct').checked = settings.soundCorrect;
        document.getElementById('setting-sound-error').checked = settings.soundError;
        document.getElementById('setting-sound-celebration').checked = settings.soundCelebration;
        document.getElementById('setting-effect-confetti').checked = settings.effectConfetti;
        document.getElementById('setting-effect-shake').checked = settings.effectShake;
        document.getElementById('setting-letter-animation').value = settings.letterAnimation;

        document.querySelectorAll('.letter-style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === settings.estilo_letra);
        });
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.palette === (settings.palette || 'nord'));
        });

        const dailyChallengeToggle = document.getElementById('setting-daily-challenge');
        if (dailyChallengeToggle) {
            dailyChallengeToggle.checked = settings.dailyChallengeEnabled !== false;
        }

        const versionEl = document.getElementById('app-version-number');
        if (versionEl) versionEl.textContent = `v${Utils.APP_VERSION}`;
    },

    bindSettingsEvents() {
        const settingsInputs = {
            'setting-capitalization': 'capitalization',
            'setting-show-hint': 'showHint',
        'setting-show-image': 'showImage',
            'setting-show-remaining': 'showRemaining',
            'setting-show-timer': 'showTimer',
            'setting-reveal-word': 'revealWord',
            'setting-auto-mode': 'autoMode',
            'setting-sound-correct': 'soundCorrect',
            'setting-sound-error': 'soundError',
            'setting-sound-celebration': 'soundCelebration',
            'setting-effect-confetti': 'effectConfetti',
            'setting-effect-shake': 'effectShake',
            'setting-letter-animation': 'letterAnimation',
            'setting-daily-challenge': 'dailyChallengeEnabled'
        };

        Object.entries(settingsInputs).forEach(([elementId, settingKey]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', (e) => {
                    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    Data.updateSetting(settingKey, value);
                });
            }
        });
    },

};
