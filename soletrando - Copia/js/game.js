// ===== LÓGICA DO JOGO =====

const Game = {
    // Estado do jogo
    state: {
        isActive: false,
        isPractice: false,
        serieId: null,
        turmaIds: [],
        disciplinaIds: [],
        studentName: '',
        palavrasPorTurma: null,
        palavrasModo: 'total',
        modoOrdem: 'sequencial',
        currentWord: null,
        currentIndex: 0,
        revealedLetters: [],
        errorLetters: [],
        correctCount: 0,
        wrongCount: 0,
        startTime: null,
        elapsedSeconds: 0,
        timerInterval: null,
        wordPool: [],
        usedWords: [],
        eventId: null,
        eventNome: '',
        wordResults: []
    },

    // Iniciar jogo
    start(config) {
        this.state = {
            isActive: true,
            isPractice: config.isPractice || false,
            serieId: config.serieId,
            serieName: config.serieName || '',
            turmaIds: config.turmaIds || [],
            turmaNames: config.turmaNames || [],
            disciplinaIds: config.disciplinaIds,
            studentName: config.studentName,
            palavrasPorTurma: config.palavrasPorTurma || null,
            palavrasModo: config.palavrasModo || 'total',
            modoOrdem: config.modoOrdem || 'sequencial',
            currentWord: null,
            currentIndex: 0,
            revealedLetters: [],
            errorLetters: [],
            correctCount: 0,
            wrongCount: 0,
            startTime: Date.now(),
            elapsedSeconds: 0,
            timerInterval: null,
            wordPool: [],
            usedWords: [],
            eventId: config.eventId || null,
            eventNome: config.eventNome || '',
            palavrasExcluidas: config.palavrasExcluidas || [],
            palavrasSelecionadas: config.palavrasSelecionadas || [],
            execucaoId: config.execucaoId || null,
            wordResults: [],
            lastCompletedWord: null,
            currentTurmaIdx: 0,
            _wordPoolTurmaIdx: []
        };

        // Carregar pool de palavras
        this.loadWordPool();
        
        // Aplicar visibilidade do cronômetro imediatamente
        const settingsInit = Data.getSettings();
        const timerInit = document.getElementById('game-timer');
        if (timerInit) timerInit.classList.toggle('hidden', !settingsInit.showTimer);

        // Iniciar timer
        this.startTimer();
        
        // Sortear primeira palavra
        this.nextWord();
        
        // Salvar sessão
        this.saveSession();
        
        // Atualizar UI
        this.updateUI();
    },

    // Carregar pool de palavras
    loadWordPool() {
        this.state._wordPoolTurmaIdx = [];
        
        if (this.state.palavrasSelecionadas && this.state.palavrasSelecionadas.length > 0) {
            const allPalavras = Data.getPalavras();
            const byId = {};
            allPalavras.forEach(p => { byId[p.id] = p; });
            const palavras = this.state.palavrasSelecionadas.map(id => byId[id]).filter(Boolean);
            this.state.wordPool = palavras;
            this.state._wordPoolTurmaIdx = palavras.map(() => 0);
            return;
        }

        let allWords = Data.getPalavras().filter(p => 
            p.serieId === this.state.serieId && 
            this.state.disciplinaIds.includes(p.disciplinaId)
        );

        if (this.state.palavrasExcluidas.length > 0) {
            allWords = allWords.filter(p => !this.state.palavrasExcluidas.includes(p.id));
        }

        // Deduplicar por id (segurança contra dados duplicados)
        const seenIds = new Set();
        allWords = allWords.filter(w => {
            if (seenIds.has(w.id)) return false;
            seenIds.add(w.id);
            return true;
        });

        const numTurmas = this.state.turmaIds.length;
        const ppt = this.state.palavrasPorTurma;

        if (ppt && numTurmas > 0) {
            const byDisc = {};
            allWords.forEach(p => {
                if (!byDisc[p.disciplinaId]) byDisc[p.disciplinaId] = [];
                byDisc[p.disciplinaId].push(p);
            });

            const discEntries = Object.entries(byDisc);
            const numD = discEntries.length;
            const wordsByTurma = [];
            for (let t = 0; t < numTurmas; t++) wordsByTurma[t] = [];

            if (this.state.palavrasModo === 'por') {
                // Por disciplina: cada turma recebe "ppt" palavras de cada disciplina
                for (const [, pool] of discEntries) {
                    const shuff = Utils.shuffleArray(pool);
                    for (let t = 0; t < numTurmas; t++) {
                        wordsByTurma[t].push(...shuff.slice(0, ppt));
                    }
                }
            } else {
                // Total por turma: distribui "ppt" palavras entre as disciplinas
                const perDiscBase = numD > 0 ? Math.floor(ppt / numD) : 0;
                const remTotal = ppt - perDiscBase * numD;
                const discWPT = {};
                const discTotal = {};

                for (let d = 0; d < numD; d++) {
                    const discId = discEntries[d][0];
                    discWPT[discId] = [];
                    discTotal[discId] = 0;
                    for (let t = 0; t < numTurmas; t++) {
                        const add = (numD > 0 && (d + t) % numD < remTotal) ? 1 : 0;
                        const wpt = perDiscBase + add;
                        discWPT[discId].push(wpt);
                        discTotal[discId] += wpt;
                    }
                }

                for (const [discId, pool] of discEntries) {
                    const shuff = Utils.shuffleArray(pool);
                    const taken = shuff.slice(0, discTotal[discId]);
                    let offset = 0;
                    for (let t = 0; t < numTurmas; t++) {
                        const wpt = discWPT[discId][t];
                        wordsByTurma[t].push(...taken.slice(offset, offset + wpt));
                        offset += wpt;
                    }
                }
            }

            const displayOrder = [];
            if (this.state.modoOrdem === 'intercalado') {
                const maxLen = Math.max(...wordsByTurma.map(w => w.length));
                for (let i = 0; i < maxLen; i++) {
                    for (let t = 0; t < numTurmas; t++) {
                        if (i < wordsByTurma[t].length) {
                            displayOrder.push({ word: wordsByTurma[t][i], turmaIdx: t });
                        }
                    }
                }
            } else {
                for (let t = 0; t < numTurmas; t++) {
                    for (let i = 0; i < wordsByTurma[t].length; i++) {
                        displayOrder.push({ word: wordsByTurma[t][i], turmaIdx: t });
                    }
                }
            }

            const palavras = [];
            this.state._wordPoolTurmaIdx = [];
            for (let i = displayOrder.length - 1; i >= 0; i--) {
                palavras.push(displayOrder[i].word);
                this.state._wordPoolTurmaIdx.push(displayOrder[i].turmaIdx);
            }
            this.state.wordPool = palavras;
        } else if (ppt) {
            const byDisc = {};
            allWords.forEach(p => {
                if (!byDisc[p.disciplinaId]) byDisc[p.disciplinaId] = [];
                byDisc[p.disciplinaId].push(p);
            });
            const discEntries = Object.entries(byDisc);
            const numD = discEntries.length;

            if (this.state.palavrasModo === 'total') {
                // Total: distribui "ppt" palavras entre as disciplinas (respeitando o disponível)
                const perDiscBase = numD > 0 ? Math.floor(ppt / numD) : 0;
                const remTotal = ppt - perDiscBase * numD;
                const pool = [];
                discEntries.forEach(([discId, words], d) => {
                    const wpt = perDiscBase + (d < remTotal ? 1 : 0);
                    const shuff = Utils.shuffleArray(words);
                    pool.push(...shuff.slice(0, wpt));
                });
                this.state.wordPool = Utils.shuffleArray(pool);
                this.state._wordPoolTurmaIdx = this.state.wordPool.map(() => 0);
            } else {
                // Por disciplina: "ppt" palavras de cada disciplina
                const pool = [];
                for (const [, words] of discEntries) {
                    const shuff = Utils.shuffleArray(words);
                    pool.push(...shuff.slice(0, ppt));
                }
                this.state.wordPool = Utils.shuffleArray(pool);
                this.state._wordPoolTurmaIdx = this.state.wordPool.map(() => 0);
            }
        } else {
            this.state.wordPool = Utils.shuffleArray(allWords);
            this.state._wordPoolTurmaIdx = this.state.wordPool.map(() => 0);
        }
    },

    // Sortear próxima palavra
    nextWord() {
        // Verificar se acabaram as palavras
        if (this.state.wordPool.length === 0) {
            this.end();
            return;
        }
        
        // Verificar limite de palavras
        const totalPlayed = this.state.correctCount + this.state.wrongCount;
        const effectiveLimit = this._getEffectiveLimit();
        if (effectiveLimit && totalPlayed >= effectiveLimit) {
            this.end();
            return;
        }
        
        // Sortear palavra
        this.state.currentWord = this.state.wordPool.pop();
        this.state.currentTurmaIdx = this.state._wordPoolTurmaIdx.pop() || 0;
        this.state.lastCompletedWord = null;
        this.state.currentIndex = 0;
        this.state.revealedLetters = [];
        this.state.errorLetters = [];
        
        // Atualizar UI
        this.renderWord();
        this.clearErrorPanel();
        this.hideSuccessBar();
        
        // Reset illustration layout
        const gameBody = document.querySelector('.game-body');
        gameBody?.classList.remove('has-illustration');
        this.illustrationVisible = false;
        
        // Focar no input
        this.focusInput();
        
        // Salvar sessão
        this.saveSession();
    },

    // Renderizar palavra na tela
    renderWord() {
        const wordSpaces = document.getElementById('word-spaces');
        const word = this.state.currentWord;
        
        if (!word) return;
        
        wordSpaces.innerHTML = '';

        // Mostrar label da turma atual se houver múltiplas turmas
        const turmaLabel = document.getElementById('current-turma-label');
        if (turmaLabel) {
            const turmaIdx = this.state.currentTurmaIdx;
            const turmaName = this.state.turmaNames[turmaIdx];
            if (this.state.turmaIds.length > 1 && turmaName) {
                turmaLabel.textContent = turmaName;
                turmaLabel.classList.remove('hidden');
            } else {
                turmaLabel.classList.add('hidden');
            }
        }
        
        const letters = word.texto.split('');
        const settings = Data.getSettings();
        
        // Estilo da célula de letra
        const estiloLetra = settings.estilo_letra || 'underline';
        wordSpaces.dataset.estilo = estiloLetra;
        
        letters.forEach((letter, index) => {
            const space = document.createElement('div');
            space.className = 'letter-space';
            
            // Aplicar estilo visual
            space.classList.add(`estilo-${estiloLetra}`);
            
            // Hífen e espaço: mostrar como caractere normal
            if (this.state.revealedLetters.includes(index)) {
                space.textContent = Utils.capitalizeLetter(letter, settings.capitalization);
                space.classList.add('revealed', `anim-${settings.letterAnimation}`);
            } else {
                space.textContent = '_';
            }
            
            space.dataset.index = index;
            space.dataset.letter = letter;
            wordSpaces.appendChild(space);
        });
        
        // Ajustar tamanho da fonte dinamicamente
        this.adjustLetterFontSize();
        
        // Mostrar dica
        this.renderHint();
        
        // Mostrar imagem ilustrativa
        this.renderIllustration();
        
        // Botão ilustração: só se palavra tem imagem
        const btnIllustration = document.getElementById('btn-toggle-illustration');
        if (btnIllustration) {
            const hasImage = word.imagem || word.imagemUrl;
            btnIllustration.classList.toggle('hidden', !hasImage);
        }
        
        // Atualizar contador de palavras restantes
        this.updateWordCount();

        // Ajustar tamanho da fonte após renderização
        requestAnimationFrame(() => this.adjustLetterFontSize());
    },

    // Ajustar tamanho da fonte das letras dinamicamente
    _fontResizeObserver: null,

    adjustLetterFontSize() {
        const container = document.getElementById('word-spaces');
        if (!container) return;

        // Configurar ResizeObserver na primeira chamada
        if (!this._fontResizeObserver) {
            this._fontResizeObserver = new ResizeObserver(() => {
                this.adjustLetterFontSize();
            });
            this._fontResizeObserver.observe(container);
            // Também observar o pai para capturar mudanças de layout (ex: ilustração)
            const parent = container.closest('.game-body');
            if (parent) this._fontResizeObserver.observe(parent);
        }

        const spaces = container.querySelectorAll('.letter-space');
        if (!spaces.length) return;

        const estilo = container.dataset.estilo;
        const isInvisivel = estilo === 'invisivel';

        // Calcular a largura disponível para as letras reveladas
        const containerWidth = container.clientWidth;
        if (!containerWidth) return;

        const style = getComputedStyle(container);
        const gap = parseFloat(style.gap) || 16;

        let activeCount = 0;

        if (isInvisivel) {
            spaces.forEach(sp => {
                if (sp.classList.contains('revealed')) activeCount++;
            });
            if (activeCount === 0) {
                spaces.forEach(sp => { sp.style.fontSize = ''; });
                return;
            }
        } else {
            activeCount = spaces.length;
        }

        // Largura total disponível = containerWidth - gaps entre células
        const totalGaps = (activeCount - 1) * gap;
        const availableWidth = containerWidth - totalGaps - 16;

        if (availableWidth <= 0) return;

        let cellWidth = availableWidth / activeCount;

        // Medir caractere mais largo desta palavra
        const firstSpace = spaces[0];
        const fs = getComputedStyle(firstSpace);
        const fontFamily = fs.fontFamily || 'sans-serif';
        const fontWeight = fs.fontWeight || '700';

        const measurer = document.createElement('span');
        measurer.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-weight:${fontWeight};font-family:${fontFamily}`;
        document.body.appendChild(measurer);

        const word = this.state.currentWord?.texto || '';
        const uniqueChars = [...new Set(word.split(''))];
        uniqueChars.push('_', 'W', 'M', 'm');

        const testSize = 100;
        measurer.style.fontSize = testSize + 'px';

        let widestWidth = 0;
        for (const ch of uniqueChars) {
            measurer.textContent = ch;
            const w = measurer.offsetWidth;
            if (w > widestWidth) widestWidth = w;
        }

        document.body.removeChild(measurer);

        if (widestWidth === 0) return;

        const ratio = cellWidth / (widestWidth / testSize);
        const fontSize = Math.max(16, Math.min(ratio, 416));

        spaces.forEach(sp => {
            sp.style.fontSize = fontSize + 'px';
        });
    },

    // Estado de visibilidade
    hintVisible: false,
    illustrationVisible: false,

    // Renderizar dica
    renderHint() {
        const hintContainer = document.getElementById('word-hint');
        const hintText = document.getElementById('hint-text');
        const settings = Data.getSettings();
        
        if (this.state.currentWord?.dica && settings.showHint) {
            hintText.textContent = this.state.currentWord.dica;
            hintContainer.classList.remove('hidden');
            this.hintVisible = true;
        } else if (this.state.currentWord?.dica) {
            hintText.textContent = this.state.currentWord.dica;
            hintContainer.classList.add('hidden');
            this.hintVisible = false;
        } else {
            hintContainer.classList.add('hidden');
            this.hintVisible = false;
        }
    },

    // Toggle visibilidade da dica
    toggleHint() {
        const hintContainer = document.getElementById('word-hint');
        const word = this.state.currentWord || this.state.lastCompletedWord;
        if (word?.dica) {
            this.hintVisible = !this.hintVisible;
            hintContainer.classList.toggle('hidden', !this.hintVisible);
            Sounds.playClick();
        }
    },

    // Toggle visibilidade da ilustração
    async toggleIllustration() {
        const illustrationArea = document.getElementById('illustration-area');
        const illustrationImg = document.getElementById('illustration-img');
        const gameBody = document.querySelector('.game-body');
        const word = this.state.currentWord || this.state.lastCompletedWord;
        
        if (word?.imagem) {
            if (!illustrationImg.getAttribute('src')) {
                const src = await Utils.resolveImagePath(word.imagem);
                if (src) illustrationImg.src = src;
            }
            if (illustrationImg.getAttribute('src')) {
                this.illustrationVisible = !this.illustrationVisible;
                illustrationArea.classList.toggle('hidden', !this.illustrationVisible);
                gameBody?.classList.toggle('has-illustration', this.illustrationVisible);
                Sounds.playClick();
                // Reajustar fonte após mudança de layout
                requestAnimationFrame(() => this.adjustLetterFontSize());
            }
        }
    },

    // Mostrar dica
    revealHint() {
        const hintContainer = document.getElementById('word-hint');
        const btnRevealHint = document.getElementById('btn-reveal-hint');
        
        hintContainer.classList.remove('hidden');
        btnRevealHint.classList.add('hidden');
        
        Sounds.playClick();
    },

    // Renderizar imagem ilustrativa
    async renderIllustration() {
        const illustrationArea = document.getElementById('illustration-area');
        const illustrationImg = document.getElementById('illustration-img');
        const gameBody = document.querySelector('.game-body');
        const settings = Data.getSettings();
        
        if (this.state.currentWord?.imagem) {
            const src = await Utils.resolveImagePath(this.state.currentWord.imagem);
            if (src) {
                illustrationImg.src = src;
                const crop = this.state.currentWord.crop || null;
                illustrationImg.style.setProperty('--crop-zoom', crop?.zoom || 1);
                illustrationImg.style.setProperty('--crop-x', (crop?.x != null ? crop.x : 50) + '%');
                illustrationImg.style.setProperty('--crop-y', (crop?.y != null ? crop.y : 50) + '%');
                if (settings.showImage) {
                    illustrationArea.classList.remove('hidden');
                    gameBody?.classList.add('has-illustration');
                    this.illustrationVisible = true;
                } else {
                    illustrationArea.classList.add('hidden');
                    gameBody?.classList.remove('has-illustration');
                    this.illustrationVisible = false;
                }
            } else {
                illustrationArea.classList.add('hidden');
                gameBody?.classList.remove('has-illustration');
                illustrationImg.removeAttribute('src');
                this.illustrationVisible = false;
            }
        } else {
            illustrationArea.classList.add('hidden');
            gameBody?.classList.remove('has-illustration');
            illustrationImg.removeAttribute('src');
            this.illustrationVisible = false;
        }
    },

    // Mostrar imagem ilustrativa
    revealIllustration() {
        const illustrationImg = document.getElementById('illustration-img');
        const btnRevealIllustration = document.getElementById('btn-reveal-illustration');
        
        illustrationImg.style.filter = 'none';
        btnRevealIllustration.classList.add('hidden');
        
        Sounds.playClick();
    },

    // Processar letra digitada
    processLetter(letter) {
        if (!this.state.isActive || !this.state.currentWord) return;
        
        const word = this.state.currentWord.texto;
        const expectedLetter = word[this.state.currentIndex];
        
        const normalizedInput = letter.toUpperCase();
        const normalizedExpected = expectedLetter.toUpperCase();
        
        if (normalizedInput === normalizedExpected) {
            this.handleCorrectLetter(letter);
        } else {
            this.handleWrongLetter(letter, expectedLetter);
        }
    },

    // Lidar com letra correta
    handleCorrectLetter(letter) {
        const settings = Data.getSettings();
        
        this.state.revealedLetters.push(this.state.currentIndex);
        this.state.currentIndex++;
        
        const space = document.querySelector(`[data-index="${this.state.currentIndex - 1}"]`);
        if (space) {
            space.textContent = Utils.capitalizeLetter(letter, settings.capitalization);
            space.classList.add('revealed', `anim-${settings.letterAnimation}`);
        }
        
        Sounds.playLetterReveal();
        
        if (settings.effectSparkle && space) {
            const rect = space.getBoundingClientRect();
            Utils.createSparkle(rect.left + rect.width / 2, rect.top + rect.height / 2, document.body);
        }
        
        // Reajustar tamanho da fonte (letras reveladas mudam de largura)
        this.adjustLetterFontSize();
        
        if (this.state.currentIndex >= this.state.currentWord.texto.length) {
            this.handleWordComplete();
        }
        
        this.saveSession();
    },

    // Lidar com letra incorreta
    handleWrongLetter(letter, expectedLetter) {
        const settings = Data.getSettings();
        
        this.state.errorLetters.push(letter);

        // Always show which letter was wrong and which was expected
        const errorLetterTyped = document.getElementById('error-letter-typed');
        const errorLetterExpected = document.getElementById('error-letter-expected');
        const errorWordReveal = document.getElementById('error-word-reveal');
        if (errorLetterTyped) errorLetterTyped.textContent = letter;
        if (errorLetterExpected) errorLetterExpected.textContent = expectedLetter;
        if (settings.revealWord && errorWordReveal) {
            errorWordReveal.innerHTML = `${T('Palavra:')} <span>${this.state.currentWord.texto}</span>`;
            errorWordReveal.classList.remove('hidden');
        }
        
        if (settings.effectShake) {
            const errorPanel = document.getElementById('error-panel');
            errorPanel.classList.remove('hidden');
            errorPanel.classList.add('shake');
            setTimeout(() => errorPanel.classList.remove('shake'), 500);
        }
        
        if (settings.effectFlash) {
            document.body.classList.add('flash-error');
            setTimeout(() => document.body.classList.remove('flash-error'), 500);
        }
        
        Sounds.playError();
        
        if (settings.revealWord) {
            this.showWordReveal(letter, expectedLetter);
        }
        
        const disciplina = Data.getDisciplinaById(this.state.currentWord.disciplinaId);
        this.state.wordResults.push({
            texto: this.state.currentWord.texto,
            resultado: 'erro',
            disciplinaNome: disciplina?.nome || '',
            tempo: this.state.elapsedSeconds,
            letraDigitada: letter,
            letraEsperada: expectedLetter,
            posicao: this.state.currentIndex
        });
        
        this.state.wrongCount++;
        
        this.logWordResult('erro', { letraDigitada: letter, letraEsperada: expectedLetter, posicao: this.state.currentIndex });
        
        this.showResultBar(false);
        
        this.state.lastCompletedWord = this.state.currentWord;
        this.state.currentWord = null;
    },

    // Mostrar letras erradas
    renderErrorLetters() {
        // Error letters are now shown inline in error panel
    },

    // Mostrar revelação da palavra
    showWordReveal(typedLetter, expectedLetter) {
        const errorPanel = document.getElementById('error-panel');
        const errorLetterTyped = document.getElementById('error-letter-typed');
        const errorLetterExpected = document.getElementById('error-letter-expected');
        const errorWordReveal = document.getElementById('error-word-reveal');
        
        errorLetterTyped.textContent = typedLetter;
        errorLetterExpected.textContent = expectedLetter;
        errorWordReveal.innerHTML = `${T('Palavra:')} <span>${this.state.currentWord.texto}</span>`;
        errorWordReveal.classList.remove('hidden');
    },

    // Limpar painel de erro
    clearErrorPanel() {
        document.getElementById('error-panel').classList.add('hidden');
    },

    // Palavra completa (acerto)
    handleWordComplete() {
        this.state.correctCount++;
        
        const disciplina = Data.getDisciplinaById(this.state.currentWord.disciplinaId);
        this.state.wordResults.push({
            texto: this.state.currentWord.texto,
            resultado: 'acerto',
            disciplinaNome: disciplina?.nome || '',
            tempo: this.state.elapsedSeconds
        });
        
        Sounds.playCorrect();
        
        const settings = Data.getSettings();
        if (settings.effectConfetti) {
            Utils.createConfetti(document.getElementById('confetti-container'), 30);
        }
        
        if (settings.effectFlash) {
            document.body.classList.add('flash-success');
            setTimeout(() => document.body.classList.remove('flash-success'), 500);
        }
        
        this.logWordResult('acerto');
        
        this.showResultBar(true);
        
        this.state.lastCompletedWord = this.state.currentWord;
        this.state.currentWord = null;
    },

    // Mostrar barra de resultado (acerto ou erro)
    showResultBar(isCorrect) {
        const successBar = document.getElementById('success-bar');
        const successTime = document.getElementById('success-time');
        const btnNextWord = document.getElementById('btn-next-word');
        const resultIcon = document.getElementById('result-status-icon');
        const resultText = document.getElementById('result-status-text');
        
        if (resultIcon) {
            resultIcon.className = 'result-status-icon ' + (isCorrect ? 'correct' : 'wrong');
            resultIcon.innerHTML = isCorrect
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        }
        if (resultText) {
            resultText.textContent = isCorrect ? T('Acertou!') : T('Errou!');
            resultText.className = isCorrect ? 'result-status-text correct' : 'result-status-text wrong';
        }
        
        successTime.textContent = T('Tempo: {tempo}', { tempo: Utils.formatTime(this.state.elapsedSeconds) });
        
        const inputArea = document.querySelector('.game-input-area');
        if (inputArea) inputArea.style.display = 'none';
        
        const errorPanel = document.getElementById('error-panel');
        if (!isCorrect && errorPanel) {
            errorPanel.classList.remove('hidden');
        }
        
        const hasMoreWords = this.state.wordPool.length > 0;
        const totalPlayed = this.state.correctCount + this.state.wrongCount;
        const effectiveLimit = this._getEffectiveLimit();
        const withinLimit = effectiveLimit === null || totalPlayed < effectiveLimit;
        
        if (btnNextWord) {
            btnNextWord.classList.toggle('hidden', !hasMoreWords || !withinLimit);
        }

        // Botão +1 Palavra
        const btnAddWord = document.getElementById('btn-add-word');
        if (btnAddWord) {
            if (this.state.eventId) {
                btnAddWord.classList.add('hidden');
            } else {
                const finishedAllChosen = effectiveLimit !== null && totalPlayed >= effectiveLimit;
                btnAddWord.classList.toggle('hidden', !finishedAllChosen || !hasMoreWords);
            }
        }
        
        const btnEndGame = document.getElementById('btn-end-game');
        if (btnEndGame) {
            const showEnd = effectiveLimit !== null || !hasMoreWords;
            btnEndGame.classList.toggle('hidden', !showEnd);
        }
        
        successBar.classList.remove('hidden');
    },

    // Esconder barra de resultado
    hideSuccessBar() {
        document.getElementById('success-bar').classList.add('hidden');
        const inputArea = document.querySelector('.game-input-area');
        if (inputArea) inputArea.style.display = '';
    },

    // Registrar resultado da palavra
    logWordResult(resultado, detalhe) {
        if (this.state.isPractice) return;
        
        const serie = Data.getSeriesById(this.state.serieId);
        const primeiraTurma = this.state.turmaIds.length > 0 ? Data.getTurmaById(this.state.turmaIds[0]) : null;
        const disciplina = Data.getDisciplinaById(this.state.currentWord.disciplinaId);
        
        Data.addLog({
            aluno: this.state.studentName,
            serieId: this.state.serieId,
            serieNome: serie?.nome || '',
            turmaId: this.state.turmaIds[0] || null,
            turmaNome: primeiraTurma?.nome || '',
            disciplinaId: this.state.currentWord.disciplinaId,
            disciplinaNome: disciplina?.nome || '',
            palavra: this.state.currentWord.texto,
            sequencia: this.state.revealedLetters,
            resultado: resultado,
            tempo: this.state.elapsedSeconds,
            eventoId: this.state.eventId,
            eventoNome: this.state.eventNome,
            execucaoId: this.state.execucaoId,
            letraDigitada: detalhe?.letraDigitada || null,
            letraEsperada: detalhe?.letraEsperada || null,
            posicao: detalhe?.posicao ?? null,
            isPractice: this.state.isPractice
        });
    },

    // Iniciar timer
    startTimer() {
        this.state.timerInterval = setInterval(() => {
            this.state.elapsedSeconds = Math.floor((Date.now() - this.state.startTime) / 1000);
            document.getElementById('game-timer-text').textContent = Utils.formatTime(this.state.elapsedSeconds);
        }, 1000);
    },

    // Parar timer
    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    },

    // Atualizar UI do jogo
    updateUI() {
        const settings = Data.getSettings();

        const centerEl = document.getElementById('game-header-center');
        if (centerEl) {
            const turmas = this.state.turmaNames.length > 0 ? this.state.turmaNames.join(', ') : '';
            const serie = this.state.serieName || '';
            const student = this.state.studentName || (this.state.isPractice ? T('Modo Ensaio') : '');
            const parts = [];
            if (serie) parts.push(`<span class="serie-name">${serie}</span>`);
            if (turmas) parts.push(`<span class="turma-name">${turmas}</span>`);
            if (student) parts.push(`<span class="student-name">${student}</span>`);
            centerEl.innerHTML = parts.join('<span class="sep">&middot;</span>');
        }
        
        // Badge de ensaio
        const practiceBadge = document.getElementById('practice-badge');
        if (this.state.isPractice) {
            practiceBadge.classList.remove('hidden');
        } else {
            practiceBadge.classList.add('hidden');
        }

        // Timer visível/oculto
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            timerEl.classList.toggle('hidden', !settings.showTimer);
        }

        // Botão ilustração: só se palavra tem imagem
        const btnIllustration = document.getElementById('btn-toggle-illustration');
        if (btnIllustration) {
            const hasImage = this.state.currentWord?.imagem || this.state.currentWord?.imagemUrl;
            btnIllustration.classList.toggle('hidden', !hasImage);
        }
    },

    // Atualizar contador de palavras
    updateWordCount() {
        const settings = Data.getSettings();
        const remainingEl = document.getElementById('word-count-remaining');
        
        if (settings.showRemaining && remainingEl) {
            const remaining = this.state.wordPool.length;
            remainingEl.textContent = T('Palavras restantes: {n}', { n: remaining });
        }
    },

    // Focar no input
    focusInput() {
        const input = document.getElementById('input-letter');
        if (input) {
            input.value = '';
            input.focus();
        }
    },

    // Adicionar 1 palavra ao limite
    addOneWord() {
        if (this.state.palavrasPorTurma !== null) {
            this.state.palavrasPorTurma++;
            Sounds.playClick();
            this.updateWordCount();
            this.hideSuccessBar();
            this.nextWord();
        }
    },

    // Calcular limite efetivo total
    _getEffectiveLimit() {
        const ppt = this.state.palavrasPorTurma;
        if (!ppt) return null;
        const numD = this.state.disciplinaIds.length;
        const numT = this.state.turmaIds.length;
        if (this.state.palavrasModo === 'total') {
            return numT > 0 ? ppt * numT : ppt;
        }
        if (numT === 0) return ppt * numD;
        return ppt * numD * numT;
    },

    // Salvar sessão
    saveSession() {
        const session = {
            ...this.state,
            timestamp: new Date().toISOString()
        };
        Data.saveSession(session);
    },

    // Restaurar sessão
    restoreSession() {
        const session = Data.getSession();
        if (session && session.isActive) {
            this.state = {
                ...session,
                palavrasModo: session.palavrasModo || 'total',
                timerInterval: null
            };
            
            // Restaurar timer
            this.startTimer();
            
            // Atualizar UI
            this.updateUI();
            this.renderWord();
            
            return true;
        }
        return false;
    },

    // Mostrar mensagem de fim
    showEndMessage(message) {
        alert(message);
        this.end();
    },

    // Encerrar jogo
    end() {
        this.stopTimer();
        this.state.isActive = false;
        
        // Limpar sessão
        Data.clearSession();
        
        // Verificar se é evento — retornar ao fluxo
        const eventReturn = sessionStorage.getItem('jogo_evento_retorno');
        if (eventReturn && this.state.eventId) {
            sessionStorage.removeItem('jogo_evento_retorno');
            document.getElementById('screen-game').classList.remove('active');
            EventGame.returnFromGame(this.state);
            return;
        }
        
        // Mostrar tela de resultado da sessão (se tiver palavras jogadas)
        if (this.state.wordResults.length > 0) {
            this.showSessionResults();
        } else {
            this.showGameOver();
        }
    },

    // Mostrar resultado da sessão
    showSessionResults() {
        document.getElementById('screen-game').classList.remove('active');
        document.getElementById('screen-game-over').classList.remove('active');
        document.getElementById('screen-session-result').classList.add('active');

        const total = this.state.wordResults.length;
        const acertos = this.state.correctCount;
        const erros = this.state.wrongCount;
        const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0;

        // Restaurar título padrão (pode ter sido sobrescrito por loadResultsPage)
        const sessionTitle = document.querySelector('#screen-session-result .session-result-title h1');
        if (sessionTitle) {
            sessionTitle.innerHTML = `<svg class="icon-lucide" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg> ${T('Resultado da Sessão')}`;
        }

        // ENSAIO badge
        const ensaioBadge = document.getElementById('session-ensaio-badge');
        if (ensaioBadge) {
            ensaioBadge.classList.toggle('hidden', !this.state.isPractice);
        }

        // Stats
        document.getElementById('session-total-count').textContent = total;
        document.getElementById('session-correct-count').textContent = acertos;
        document.getElementById('session-wrong-count').textContent = erros;
        document.getElementById('session-accuracy').textContent = taxa + '%';

        // Lista de palavras
        const wordsList = document.getElementById('session-words-list');
        wordsList.innerHTML = this.state.wordResults.map(wr => {
            const isCorrect = wr.resultado === 'acerto';
            let errorDetail = '';
            if (!isCorrect && wr.letraDigitada !== undefined) {
                const pos = wr.posicao + 1;
                errorDetail = `<div class="session-word-error-detail">
                    ${T('Erro na {pos}ª letra: digitou {digitado} em vez de {esperado}', { pos, digitado: Utils.escapeHtml(wr.letraDigitada.toUpperCase()), esperado: Utils.escapeHtml(wr.letraEsperada.toUpperCase()) })}
                </div>`;
            }
            return `
            <div class="session-word-item ${isCorrect ? '' : 'wrong'}">
                <span class="session-word-icon ${isCorrect ? 'correct' : 'wrong'}">
                    ${isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
                </span>
                <div class="session-word-info">
                    <span class="session-word-text">${Utils.escapeHtml(wr.texto)}</span>
                    <span class="session-word-discipline">${Utils.escapeHtml(wr.disciplinaNome)}</span>
                    ${errorDetail}
                </div>
                <span class="session-word-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${Utils.formatTime(wr.tempo || 0)}
                </span>
            </div>`;
        }).join('');

        // Confete + som
        if (this.state.correctCount > 0) {
            const settings = Data.getSettings();
            if (settings.effectConfetti) {
                Utils.createConfetti(document.getElementById('session-confetti-container'), 100);
            }
            Sounds.playVictory();
        }
    },

    // Mostrar tela de fim do jogo (simplificada)
    showGameOver() {
        // Esconder tela do jogo
        document.getElementById('screen-game').classList.remove('active');
        document.getElementById('screen-game-over').classList.add('active');
        
        // Atualizar estatísticas
        document.getElementById('stat-correct').textContent = this.state.correctCount;
        document.getElementById('stat-wrong').textContent = this.state.wrongCount;
        document.getElementById('stat-time').textContent = Utils.formatTime(this.state.elapsedSeconds);

        // Lista de palavras
        const wordsContainer = document.getElementById('game-over-words-list');
        if (wordsContainer && this.state.wordResults.length > 0) {
            wordsContainer.innerHTML = this.state.wordResults.map(wr => {
                const isCorrect = wr.resultado === 'acerto';
                let errorDetail = '';
                if (!isCorrect && wr.letraDigitada !== undefined) {
                    const pos = wr.posicao + 1;
                    errorDetail = `<div class="session-word-error-detail">
                        Erro na ${pos}ª letra: digitou <strong>${Utils.escapeHtml(wr.letraDigitada.toUpperCase())}</strong> em vez de <strong>${Utils.escapeHtml(wr.letraEsperada.toUpperCase())}</strong>
                    </div>`;
                }
                return `
                <div class="session-word-item ${isCorrect ? '' : 'wrong'}">
                    <span class="session-word-icon ${isCorrect ? 'correct' : 'wrong'}">
                        ${isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
                    </span>
                    <div class="session-word-info">
                        <span class="session-word-text">${Utils.escapeHtml(wr.texto)}</span>
                        <span class="session-word-discipline">${Utils.escapeHtml(wr.disciplinaNome)}</span>
                        ${errorDetail}
                    </div>
                    <span class="session-word-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ${Utils.formatTime(wr.tempo || 0)}
                    </span>
                </div>`;
            }).join('');
        }
        
        // Confete se tem acertos
        if (this.state.correctCount > 0) {
            const settings = Data.getSettings();
            if (settings.effectConfetti) {
                Utils.createConfetti(document.getElementById('confetti-container'), 100);
            }
            Sounds.playVictory();
        }
    },

    // Resetar estado
    reset() {
        this.stopTimer();
        
        // Desconectar observer de redimensionamento
        if (this._fontResizeObserver) {
            this._fontResizeObserver.disconnect();
            this._fontResizeObserver = null;
        }
        
        this.state = {
            isActive: false,
            isPractice: false,
            serieId: null,
            turmaIds: [],
            disciplinaIds: [],
            studentName: '',
            palavrasPorTurma: null,
            modoOrdem: 'sequencial',
            currentWord: null,
            currentTurmaIdx: 0,
            _wordPoolTurmaIdx: [],
            currentIndex: 0,
            revealedLetters: [],
            errorLetters: [],
            correctCount: 0,
            wrongCount: 0,
            startTime: null,
            elapsedSeconds: 0,
            timerInterval: null,
            wordPool: [],
            usedWords: [],
            eventId: null,
            eventNome: '',
            wordResults: []
        };
    }
};

// Exportar para uso global
window.Game = Game;

// ===== FLUXO DE EVENTOS =====
const EventGame = {
    state: {
        evento: null,
        fase: 'resumo',
        rodadaIdx: 0,
        participanteIdx: 0,
        execucaoId: null,
        nomeAluno: '',
        transicao: null,
        resumoRodada: null,
        palavraPoolExcluded: []
    },

    start(evento) {
        const ev = this.normalizaEvento(evento);
        this.state = {
            evento: ev,
            fase: 'resumo',
            rodadaIdx: 0,
            participanteIdx: 0,
            execucaoId: null,
            nomeAluno: '',
            transicao: null,
            resumoRodada: null,
            palavraPoolExcluded: []
        };
        App.showScreen('event-game');
        this.showPhase('resumo');
    },

    showPhase(phase) {
        this.state.fase = phase;
        document.querySelectorAll('.event-phase').forEach(p => p.classList.add('hidden'));
        const el = document.getElementById('event-phase-' + phase);
        if (el) el.classList.remove('hidden');

        try {
            switch (phase) {
                case 'resumo': this.renderResumo(); break;
                case 'rodada': this.renderRodada(); break;
                case 'fim_rodada': this.renderFimRodada(); break;
                case 'transicao': this.renderTransicao(); break;
                case 'fim': this.renderFim(); break;
            }
        } catch (err) {
            console.error(`EventGame.showPhase('${phase}') render error:`, err);
        }
        App.updateThemeToggleIcon();
    },

    getSerie(id) { return Data.getSeriesById(id); },
    getTurma(id) { return id ? Data.getTurmaById(id) : null; },
    getDisciplinaNome(id) { return Data.getDisciplinaById(id)?.nome || id; },

    normalizaRodada(r) {
        const serieId = r.serieId || r.serie_id;
        const turmaId = r.turmaId || r.turma_id || null;
        const disciplinaIds = r.disciplinaIds || r.disciplinas_ids || (r.disciplinas_config || []).map(c => c.id) || [];
        const palavrasPorAluno = r.palavrasPorAluno || r.palavras_por_aluno || 1;
        const participantes = r.participantes || [];
        return { ...r, serieId, turmaId, disciplinaIds, palavrasPorAluno, participantes };
    },

    normalizaEvento(evento) {
        const ev = { ...evento };
        ev.rodadas = (ev.rodadas || []).map(r => this.normalizaRodada(r));
        return ev;
    },

    temPalavrasParaRodada(rodada) {
        if (!rodada?.serieId) return true;
        const discIds = rodada.disciplinaIds || [];
        if (discIds.length === 0) return true;
        const palavras = Data.getPalavras();
        return discIds.some(id => palavras.some(p => p.serieId === rodada.serieId && p.disciplinaId === id));
    },

    proximaRodadaComPalavras(startIdx) {
        const rodadas = this.state.evento.rodadas || [];
        for (let i = startIdx; i < rodadas.length; i++) {
            if (this.temPalavrasParaRodada(rodadas[i])) return i;
        }
        return -1;
    },

    verificarPalavrasUnicas() {
        const rodadas = this.state.evento.rodadas || [];
        const palavras = Data.getPalavras();
        const series = Data.getSeries();
        const avisos = [];
        const porSerie = {};
        rodadas.forEach((r, idx) => {
            if (!r.serieId) return;
            const modoSelecao = r.modoPalavras === 'selecao' && (r.palavrasSelecionadas || []).length > 0;
            if (modoSelecao) return;
            if (!porSerie[r.serieId]) porSerie[r.serieId] = [];
            porSerie[r.serieId].push({ rodada: r, idx });
        });
        Object.entries(porSerie).forEach(([serieId, lista]) => {
            if (lista.length < 2) return;
            const discIds = [...new Set(lista.flatMap(l => l.rodada.disciplinaIds || []))];
            const totalDisponivel = palavras.filter(p => p.serieId === serieId && discIds.includes(p.disciplinaId)).length;
            const totalDemandado = lista.reduce((acc, l) => acc + (l.rodada.palavrasPorAluno || 1), 0);
            const serieNome = series.find(s => s.id === serieId)?.nome || serieId;
            if (totalDemandado > totalDisponivel) {
                avisos.push({ serie: serieNome, disponivel: totalDisponivel, demandado: totalDemandado, rodadas: lista.map(l => l.idx + 1) });
            }
        });
        return avisos;
    },

    _calcularContagensRodada(r) {
        const serie = this.getSerie(r.serieId);
        const discIds = r.disciplinaIds || [];
        const palavras = Data.getPalavras();
        const modo = r.modoPalavras === 'selecao' ? 'selecao' : 'sorteio';
        const counts = {};
        discIds.forEach(id => { counts[id] = 0; });
        if (modo === 'selecao') {
            const byId = {};
            palavras.forEach(p => { byId[p.id] = p; });
            (r.palavrasSelecionadas || []).forEach(pId => {
                const p = byId[pId];
                if (p && p.serieId === serie?.id && counts[p.disciplinaId] !== undefined) counts[p.disciplinaId]++;
            });
        } else {
            const discOrder = [];
            const seenDisc = new Set();
            palavras.forEach(p => {
                if (p.serieId === serie?.id && discIds.includes(p.disciplinaId) && !seenDisc.has(p.disciplinaId)) {
                    seenDisc.add(p.disciplinaId);
                    discOrder.push(p.disciplinaId);
                }
            });
            const ppt = r.palavrasPorAluno || 1;
            const numD = discOrder.length;
            const perBase = numD > 0 ? Math.floor(ppt / numD) : 0;
            const rem = numD > 0 ? ppt - perBase * numD : 0;
            discOrder.forEach((id, d) => { counts[id] = perBase + (d < rem ? 1 : 0); });
        }
        return { counts, modo };
    },

    _discCountText(counts, modo, id) {
        const n = counts[id] || 0;
        const palavra = n === 1 ? 'palavra' : 'palavras';
        const sel = modo === 'selecao' ? 'selecionada' + (n === 1 ? '' : 's') : 'na rodada';
        return `${n} ${T(palavra)} ${T(sel)}`;
    },

    _renderDisciplinesTable(rodada) {
        const discIds = rodada.disciplinaIds || [];
        const { counts, modo } = this._calcularContagensRodada(rodada);
        return `
            <div class="event-round-table">
                <div class="event-round-disciplines" style="grid-template-columns: repeat(${Math.max(discIds.length, 1)}, minmax(0, 1fr));">
                    ${discIds.map(id => `
                        <div class="event-round-disc">
                            <span class="event-discipline-badge">${Utils.escapeHtml(this.getDisciplinaNome(id))}</span>
                            <span class="event-round-disc-count">${this._discCountText(counts, modo, id)}</span>
                        </div>`).join('')}
                </div>
            </div>`;
    },

    renderResumo() {
        const ev = this.state.evento;
        const rodadas = ev.rodadas || [];
        const palavras = Data.getPalavras();
        const el = document.getElementById('event-phase-resumo');
        if (!el) return;

        const dateStr = ev.data ? new Date(ev.data + 'T12:00:00').toLocaleDateString((typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';

        let roundsHtml = rodadas.map((r, i) => {
            const serie = this.getSerie(r.serieId);
            const turma = this.getTurma(r.turmaId);
            const discIds = r.disciplinaIds || [];
            const participantes = r.participantes || [];
            const totalPalavras = serie ? discIds.reduce((acc, id) => acc + palavras.filter(p => p.serieId === serie.id && p.disciplinaId === id).length, 0) : 0;
            const semPalavras = serie && discIds.length > 0 && totalPalavras === 0;
            const { counts, modo } = this._calcularContagensRodada(r);

            return `
                <div class="event-round-card ${semPalavras ? 'warning' : ''}">
                    <div class="event-round-head">
                        <div class="event-round-number ${semPalavras ? 'warning' : ''}">${i + 1}</div>
                        <div class="event-round-names">
                            ${serie ? `<strong>${Utils.escapeHtml(serie.nome)}</strong>` : ''}
                            ${turma ? `<span>— ${Utils.escapeHtml(turma.nome)}</span>` : ''}
                        </div>
                    </div>
                    ${discIds.length > 0 || participantes.length > 0 ? `
                    <div class="event-round-table">
                        <div class="event-round-disciplines" style="grid-template-columns: repeat(${Math.max(discIds.length, 1)}, minmax(0, 1fr));">
                            ${discIds.map(id => `
                                <div class="event-round-disc">
                                    <span class="event-discipline-badge">${Utils.escapeHtml(this.getDisciplinaNome(id))}</span>
                                    <span class="event-round-disc-count">${this._discCountText(counts, modo, id)}</span>
                                </div>`).join('')}
                            ${participantes.length > 0 ? (() => {
                                const nomes = participantes.map(p => p.nome).filter(Boolean);
                                const nomesText = nomes.length > 1
                                    ? nomes.slice(0, -1).join(', ') + T(' e ') + nomes[nomes.length - 1]
                                    : nomes.join('');
                                return `<div class="event-round-participants"><svg class="event-participant-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>${nomesText}</span></div>`;
                            })() : ''}
                        </div>
                    </div>` : ''}
                    ${semPalavras ? `<p class="event-round-warning">⚠ ${T('Nenhuma palavra cadastrada para esta rodada')}</p>` : ''}
                </div>`;
        }).join('');

        const avisos = this.verificarPalavrasUnicas();
        let warningsHtml = '';
        if (avisos.length > 0) {
            warningsHtml += `<div class="event-warning danger"><div class="event-warning-icon">⚠</div><div><strong>${T('Palavras insuficientes para rodadas distintas')}</strong>${avisos.map(a => `<p class="dim">${T('{serie}: rodadas {rodadas} precisam de {demandado} palavras únicas, mas há apenas {disponivel} disponíveis.', { serie: a.serie, rodadas: a.rodadas.join(T(' e ')), demandado: a.demandado, disponivel: a.disponivel })}</p>`).join('')}</div></div>`;
        }
        const semPalavras = rodadas.filter(r => !this.temPalavrasParaRodada(r));
        if (semPalavras.length > 0) {
            const todasSem = semPalavras.length === rodadas.length;
            const semKey = semPalavras.length === 1
                ? T('{n} rodada sem palavras — serão puladas automaticamente', { n: semPalavras.length })
                : T('{n} rodadas sem palavras — serão puladas automaticamente', { n: semPalavras.length });
            warningsHtml += `<div class="event-warning ${todasSem ? 'danger' : 'accent'}"><div class="event-warning-icon">⚠</div><div><strong>${todasSem ? T('Nenhuma rodada tem palavras cadastradas') : semKey}</strong><p class="dim">${T('Rodadas')}: ${semPalavras.map(r => '#' + (rodadas.indexOf(r) + 1)).join(', ')}</p></div></div>`;
        }

        const temAlguma = this.proximaRodadaComPalavras(0) !== -1;

        el.innerHTML = `
            <div class="game-header">
                <div class="game-info">
                    <button class="btn-icon" onclick="EventGame.goHome()" title="${T('Voltar')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                </div>
                <div class="game-header-center">
                    <span class="serie-name">${Utils.escapeHtml(ev.nome)}</span>
                </div>
                <div class="game-controls">
                    <button id="btn-event-theme" class="btn-icon" onclick="App.toggleTheme()" title="${T('Alternar tema')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></button>
                </div>
            </div>
            <div class="event-phase-body event-resumo">
                ${dateStr ? `<p class="event-date">${dateStr}</p>` : ''}
                <h2 class="event-subtitle">${T(rodadas.length !== 1 ? '{n} rodadas programadas' : '{n} rodada programada', { n: rodadas.length })}</h2>
                <div class="event-rounds-list">${roundsHtml}</div>
                ${warningsHtml}
                <button class="btn btn-primary btn-large event-start-btn" ${!temAlguma ? 'disabled' : ''} onclick="EventGame.iniciarEvento()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    ${T('Iniciar Evento')}
                </button>
            </div>`;
    },

    iniciarEvento() {
        const primeira = this.proximaRodadaComPalavras(0);
        if (primeira === -1) return;
        this.state.execucaoId = 'exec_' + this.state.evento.id + '_' + Date.now();
        this.state.rodadaIdx = primeira;
        this.state.palavraPoolExcluded = [];
        this.showPhase('rodada');
    },

    renderRodada() {
        const ev = this.state.evento;
        const rodadas = ev.rodadas || [];
        const rodada = rodadas[this.state.rodadaIdx];
        if (!rodada) { this.showPhase('fim'); return; }

        const serie = this.getSerie(rodada.serieId);
        const turma = this.getTurma(rodada.turmaId);
        const participantes = (rodada.participantes || []).filter(p => p.nome?.trim());
        const participanteAtual = participantes[this.state.participanteIdx];
        const el = document.getElementById('event-phase-rodada');
        if (!el) return;

        const podePular = this.state.rodadaIdx < rodadas.length - 1;

        let contentHtml = '';

        if (participanteAtual) {
            contentHtml = `
                <h2 class="event-rodada-question">${T('Selecione o aluno')}</h2>
                <p class="event-rodada-sub">${T(participantes.length !== 1 ? '{n} alunos cadastrados — toque para escolher' : '{n} aluno cadastrado — toque para escolher', { n: participantes.length })}</p>
                <div class="event-participantes-list">
                    ${participantes.map((p, i) => {
                        const sel = i === this.state.participanteIdx;
                        return `
                        <button class="event-participante-btn ${sel ? 'selected' : ''}" onclick="EventGame.selectParticipante(${i})">
                            <div class="event-participante-avatar ${sel ? 'selected' : ''}">
                                ${sel
                                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
                                }
                            </div>
                            <span class="event-participante-name ${sel ? 'selected' : ''}">${Utils.escapeHtml(p.nome)}</span>
                        </button>`;
                    }).join('')}
                </div>
                <button class="btn-confirm-event" onclick="EventGame.startStudentGame('${Utils.escapeHtml(participanteAtual.nome)}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ${T('Confirmar e Sortear')}
                </button>
                <p class="event-rodada-or">${T('Ou digite outro nome:')}</p>
                <div class="event-rodada-custom">
                    <input type="text" id="event-custom-name" placeholder="${T('Nome personalizado...')}" class="event-custom-input" onkeydown="if(event.key==='Enter')EventGame.startStudentFromInput()">
                    <button class="btn-custom-arrow" onclick="EventGame.startStudentFromInput()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
                </div>`;
        } else {
            contentHtml = `
                <h2 class="event-rodada-question">${T('Qual aluno vai soletrar?')}</h2>
                <p class="event-rodada-sub">${T('Rodada {n}', { n: this.state.rodadaIdx + 1 })}</p>
                <input type="text" id="event-custom-name" placeholder="${T('Nome do aluno...')}" class="event-custom-input-large" autofocus onkeydown="if(event.key==='Enter')EventGame.startStudentFromInput()">
                <button class="btn-confirm-event large" onclick="EventGame.startStudentFromInput()">
                    ${T('Sortear Palavra')}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>`;
        }

        el.innerHTML = `
            <div class="game-header">
                <div class="game-info">
                    <button class="btn-icon" onclick="EventGame.goBackFromRodada()" title="${T('Voltar')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                </div>
                <div class="game-header-center" id="event-header-center">
                    <span class="serie-name">${Utils.escapeHtml(ev.nome)}</span>
                    <span class="sep">·</span>
                    <span>${T('Rodada {n} de {total}', { n: this.state.rodadaIdx + 1, total: rodadas.length })}</span>
                </div>
                <div class="game-controls">
                    <button id="btn-event-theme" class="btn-icon" onclick="App.toggleTheme()" title="${T('Alternar tema')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></button>
                </div>
            </div>
            <div class="event-phase-body event-center">
                <div class="event-round-info-card">
                    <div class="event-round-info-header">
                        <div class="event-round-number">${this.state.rodadaIdx + 1}</div>
                        <div>
                            ${serie ? `<strong>${Utils.escapeHtml(serie.nome)}</strong>` : ''}
                            ${turma ? `<span class="dim"> — ${Utils.escapeHtml(turma.nome)}</span>` : ''}
                        </div>
                    </div>
                    ${this._renderDisciplinesTable(rodada)}
                </div>
                ${contentHtml}
                <button class="event-skip-btn" onclick="EventGame.skipRound()">${podePular ? T('Pular esta rodada →') : T('Encerrar evento →')}</button>
            </div>`;
    },

    selectParticipante(idx) {
        this.state.participanteIdx = idx;
        this.renderRodada();
    },

    startStudentFromInput() {
        const input = document.getElementById('event-custom-name');
        const nome = input?.value.trim();
        if (nome) this.startStudentGame(nome);
    },

    startStudentGame(nome) {
        if (!nome || !nome.trim()) return;
        this.state.nomeAluno = nome.trim();
        const ev = this.state.evento;
        const rodada = ev.rodadas[this.state.rodadaIdx];
        const serie = this.getSerie(rodada.serieId);
        const turma = this.getTurma(rodada.turmaId);

        const config = {
            serieId: rodada.serieId,
            serieName: serie?.nome || '',
            turmaIds: rodada.turmaId ? [rodada.turmaId] : [],
            turmaNames: turma?.nome ? [turma.nome] : [],
            disciplinaIds: rodada.disciplinaIds || [],
            studentName: nome.trim(),
            palavrasPorTurma: rodada.palavrasPorAluno || null,
            modoOrdem: 'sequencial',
            isPractice: false,
            eventId: ev.id,
            eventNome: ev.nome,
            palavrasExcluidas: this.state.palavraPoolExcluded,
            palavrasSelecionadas: rodada.modoPalavras === 'selecao' ? (rodada.palavrasSelecionadas || []) : [],
            execucaoId: this.state.execucaoId
        };

        sessionStorage.setItem('jogo_evento_retorno', JSON.stringify({
            evento_id: ev.id,
            rodada_idx: this.state.rodadaIdx,
            participante_idx: this.state.participanteIdx,
            execucao_id: this.state.execucaoId
        }));

        App.showScreen('game');
        Game.start(config);
    },

    returnFromGame(gameState) {
        try {
            sessionStorage.removeItem('jogo_evento_retorno');
            App.showScreen('event-game');

            const ev = this.state.evento;
            if (!ev) { console.error('EventGame.returnFromGame: no evento'); this.showPhase('fim'); return; }
            const rodada = ev.rodadas[this.state.rodadaIdx];
            if (!rodada) { console.error('EventGame.returnFromGame: no rodada at idx', this.state.rodadaIdx); this.showPhase('fim'); return; }

            this.state.resumoRodada = {
                rodadaIdx: this.state.rodadaIdx,
                palavrasSorteadas: gameState.correctCount + gameState.wrongCount,
                tempoTotal: gameState.elapsedSeconds,
                nomeAluno: this.state.nomeAluno || '',
                wordResults: gameState.wordResults || []
            };

            this.showPhase('fim_rodada');
        } catch (err) {
            console.error('EventGame.returnFromGame error:', err);
            this.showPhase('fim');
        }
    },

    renderFimRodada() {
        const resumo = this.state.resumoRodada;
        if (!resumo) return;
        const ev = this.state.evento;
        const rodadas = ev.rodadas || [];
        const rodada = rodadas[resumo.rodadaIdx];
        const serie = this.getSerie(rodada?.serieId);
        const turma = this.getTurma(rodada?.turmaId);
        const el = document.getElementById('event-phase-fim_rodada');
        if (!el) return;

        const proxima = this.proximaRodadaComPalavras(resumo.rodadaIdx + 1);
        const isLast = proxima === -1;

        const wordResults = resumo.wordResults || [];
        const acertos = wordResults.filter(w => w.resultado === 'acerto').length;
        const erros = wordResults.filter(w => w.resultado === 'erro').length;

        let wordListHtml = '';
        if (wordResults.length > 0) {
            wordListHtml = `
                <div class="event-word-results">
                    ${wordResults.map(w => {
                        const isOk = w.resultado === 'acerto';
                        return `
                        <div class="event-word-row">
                            <div class="event-word-icon ${isOk ? 'correct' : 'wrong'}">
                                ${isOk
                                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                                }
                            </div>
                            <span class="event-word-text">${Utils.escapeHtml(w.texto)}</span>
                            ${w.disciplinaNome ? `<span class="event-word-disc">${Utils.escapeHtml(w.disciplinaNome)}</span>` : ''}
                            <span class="event-word-time">${Utils.formatTime(w.tempo || 0)}</span>
                        </div>`;
                    }).join('')}
                </div>`;
        }

        el.innerHTML = `
            <div class="game-header">
                <div class="game-info">
                    <button class="btn-icon" onclick="EventGame.showPhase('resumo')" title="${T('Voltar')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                </div>
                <div class="game-header-center">
                    <span class="serie-name">${Utils.escapeHtml(ev.nome)}</span>
                </div>
                <div class="game-controls">
                    <button id="btn-event-theme" class="btn-icon" onclick="App.toggleTheme()" title="${T('Alternar tema')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></button>
                </div>
            </div>
            <div class="event-phase-body event-center">
                <div class="event-trophy"><svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
                <h2 class="event-congrats">${T('Rodada {n} concluída!', { n: resumo.rodadaIdx + 1 })}</h2>
                ${resumo.nomeAluno ? `<p class="event-congrats-sub">${T('Aluno:')} <strong>${Utils.escapeHtml(resumo.nomeAluno)}</strong></p>` : ''}
                <p class="event-congrats-sub dim">${serie?.nome || ''}${turma ? ' — ' + turma.nome : ''}</p>
                <div class="event-stats-card event-stats-table">
                    <div class="event-stat">
                        <div class="event-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg></div>
                        <p class="event-stat-label">${T('Palavras')}</p>
                        <p class="event-stat-value">${resumo.palavrasSorteadas}</p>
                    </div>
                    <div class="event-stat">
                        <div class="event-stat-icon icon-success"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></div>
                        <p class="event-stat-label">${T('Acertos')}</p>
                        <p class="event-stat-value" style="color:var(--success)">${acertos}</p>
                    </div>
                    <div class="event-stat">
                        <div class="event-stat-icon icon-error"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></div>
                        <p class="event-stat-label">${T('Erros')}</p>
                        <p class="event-stat-value" style="color:var(--danger)">${erros}</p>
                    </div>
                    <div class="event-stat">
                        <div class="event-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                        <p class="event-stat-label">${T('Tempo')}</p>
                        <p class="event-stat-value">${Utils.formatTime(resumo.tempoTotal)}</p>
                    </div>
                </div>
                ${wordListHtml}
                <button class="btn btn-primary btn-large event-start-btn" onclick="EventGame.proximaRodada()">
                    ${isLast ? T('Finalizar Evento') : T('Próxima Rodada')}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>`;
    },

    proximaRodada() {
        try {
            const ev = this.state.evento;
            if (!ev) { console.error('EventGame.proximaRodada: no evento'); this.showPhase('fim'); return; }
            const rodadas = ev.rodadas || [];
            const currentIdx = this.state.resumoRodada?.rodadaIdx ?? this.state.rodadaIdx;
            const rodadaAtual = rodadas[currentIdx];
            const turmaAnterior = this.getTurma(rodadaAtual?.turmaId);
            const serieAnterior = this.getSerie(rodadaAtual?.serieId);
            const nomeAnterior = turmaAnterior?.nome || serieAnterior?.nome || 'Rodada atual';
            const idAtual = rodadaAtual?.turmaId || rodadaAtual?.serieId;

            const proximaIdx = this.proximaRodadaComPalavras(this.state.rodadaIdx + 1);

            console.log('EventGame.proximaRodada:', { rodadaIdx: this.state.rodadaIdx, proximaIdx, totalRodadas: rodadas.length, idAtual });

            if (proximaIdx === -1) {
                this.showPhase('fim');
                return;
            }

            const proximaRodada = rodadas[proximaIdx];
            const proximaTurma = this.getTurma(proximaRodada?.turmaId);
            const proximaSerie = this.getSerie(proximaRodada?.serieId);
            const nomeProxima = proximaTurma?.nome || proximaSerie?.nome || 'próxima rodada';
            const idProxima = proximaRodada?.turmaId || proximaRodada?.serieId;

            if (idAtual !== idProxima) {
                this.state.transicao = { de: nomeAnterior, para: nomeProxima, proximoIdx: proximaIdx };
                this.showPhase('transicao');
            } else {
                this.state.rodadaIdx = proximaIdx;
                this.state.participanteIdx = 0;
                this.showPhase('rodada');
            }
        } catch (err) {
            console.error('EventGame.proximaRodada error:', err);
            this.showPhase('fim');
        }
    },

    renderTransicao() {
        const t = this.state.transicao;
        const ev = this.state.evento;
        const el = document.getElementById('event-phase-transicao');
        if (!el || !t) return;

        el.innerHTML = `
            <div class="game-header">
                <div class="game-info">
                    <button class="btn-icon" onclick="EventGame.showPhase('fim_rodada')" title="${T('Voltar')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                </div>
                <div class="game-header-center">
                    <span class="serie-name">${Utils.escapeHtml(ev.nome)}</span>
                </div>
                <div class="game-controls">
                    <button id="btn-event-theme" class="btn-icon" onclick="App.toggleTheme()" title="${T('Alternar tema')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></button>
                </div>
            </div>
            <div class="event-phase-body event-center">
                <div class="event-trophy"><svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg></div>
                <h2 class="event-congrats">${T('Turma concluída!')}</h2>
                <p class="event-congrats-sub">${T('As palavras da turma {nome} acabaram. Vamos iniciar a próxima.', { nome: `<strong>${Utils.escapeHtml(t.de)}</strong>` })}</p>
                <div class="event-transition-card">
                    <span class="event-transition-name from">${Utils.escapeHtml(t.de)}</span>
                    <span class="event-transition-arrow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>
                    <span class="event-transition-name to">${Utils.escapeHtml(t.para)}</span>
                </div>
                <button class="btn btn-primary btn-large event-start-btn" onclick="EventGame.confirmarTransicao()">
                    ${T('Continuar')}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>`;
    },

    confirmarTransicao() {
        try {
            const t = this.state.transicao;
            if (!t) return;
            this.state.rodadaIdx = t.proximoIdx;
            this.state.participanteIdx = 0;
            this.state.transicao = null;
            this.showPhase('rodada');
        } catch (err) {
            console.error('EventGame.confirmarTransicao error:', err);
            this.showPhase('fim');
        }
    },

    renderFim() {
        const ev = this.state.evento;
        const rodadas = ev.rodadas || [];
        const el = document.getElementById('event-phase-fim');
        if (!el) return;

        // Não altera o status ao rodar: o evento pode ser executado várias vezes no dia.
        // O encerramento automático por data é feito em App.autoEncerrarEventos().

        const dateStr = ev.data ? new Date(ev.data + 'T12:00:00').toLocaleDateString((typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR', { day: '2-digit', month: 'long' }) : '';

        el.innerHTML = `
            <div class="game-header">
                <div class="game-info">
                    <button class="btn-icon" onclick="EventGame.goHome()" title="${T('Voltar')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                </div>
                <div class="game-header-center">
                    <span class="serie-name">${Utils.escapeHtml(ev.nome)}</span>
                </div>
                <div class="game-controls">
                    <button id="btn-event-theme" class="btn-icon" onclick="App.toggleTheme()" title="${T('Alternar tema')}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></button>
                </div>
            </div>
            <div class="event-phase-body event-center">
                <div class="event-trophy"><svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
                <h2 class="event-congrats">${T('Evento Concluído!')}</h2>
                <p class="event-congrats-sub">${T('Todas as rodadas de {nome} foram finalizadas.', { nome: `<strong>${Utils.escapeHtml(ev.nome)}</strong>` })}</p>
                <div class="event-stats-card">
                    <p class="event-stat-label">${T('Resumo')}</p>
                    <p class="event-stat-value">${rodadas.length} ${T(rodadas.length !== 1 ? 'rodadas' : 'rodada')}${dateStr ? ' · ' + dateStr : ''}</p>
                </div>
                <div class="event-transition-btns" style="flex-direction:column">
                    <button class="btn btn-primary btn-large event-start-btn" id="btn-event-view-results">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 16V12"/><path d="M12 16V8"/><path d="M16 16v-4"/></svg>
                        ${T('Ver Análises e Resultados')}
                    </button>
                    <button class="btn btn-secondary" onclick="EventGame.goHome()">${T('Voltar ao Início')}</button>
                </div>
            </div>`;
        
        // Botão ver resultados
        const btnResults = document.getElementById('btn-event-view-results');
        if (btnResults) {
            btnResults.onclick = function() {
                App.showEventResults(EventGame.state.evento.id, EventGame.state.execucaoId || null, EventGame.state.evento.nome);
            };
        }
    },

    goHome() {
        App.showScreen('home');
    },

    goBackFromRodada() {
        if (this.state.rodadaIdx === 0) {
            this.showPhase('resumo');
        } else {
            this.showPhase('resumo');
        }
    },

    skipRound() {
        try {
            const rodadas = this.state.evento.rodadas || [];
            const proximaIdx = this.proximaRodadaComPalavras(this.state.rodadaIdx + 1);
            if (proximaIdx === -1) {
                this.showPhase('fim');
                return;
            }
            const idAtual = rodadas[this.state.rodadaIdx]?.turmaId || rodadas[this.state.rodadaIdx]?.serieId;
            const proxima = rodadas[proximaIdx];
            const idProxima = proxima?.turmaId || proxima?.serieId;
            if (idAtual !== idProxima) {
                const serieAnterior = this.getSerie(rodadas[this.state.rodadaIdx]?.serieId);
                const turmaAnterior = this.getTurma(rodadas[this.state.rodadaIdx]?.turmaId);
                const nomeAnterior = turmaAnterior?.nome || serieAnterior?.nome || 'Rodada atual';
                const proximaTurma = this.getTurma(proxima?.turmaId);
                const proximaSerie = this.getSerie(proxima?.serieId);
                const nomeProxima = proximaTurma?.nome || proximaSerie?.nome || 'próxima rodada';
                this.state.transicao = { de: nomeAnterior, para: nomeProxima, proximoIdx: proximaIdx };
                this.showPhase('transicao');
            } else {
                this.state.rodadaIdx = proximaIdx;
                this.state.participanteIdx = 0;
                this.showPhase('rodada');
            }
        } catch (err) {
            console.error('EventGame.skipRound error:', err);
            this.showPhase('fim');
        }
    }
};

window.EventGame = EventGame;