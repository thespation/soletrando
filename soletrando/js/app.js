// ===== APP PRINCIPAL =====

const App = {
    currentScreen: 'home',

    // Inicializar aplicação
    init() {
        if (typeof I18n !== 'undefined') I18n.init();
        this.bindEvents();
        this.loadTheme();
        this.checkSession();
        this.loadHomeBanner();
    },

    // Vincular eventos globais
    bindEvents() {
        // Tela inicial
        document.getElementById('btn-play')?.addEventListener('click', () => this.showScreen('select'));
        document.getElementById('btn-results')?.addEventListener('click', () => this.showScreen('results'));
        document.getElementById('btn-rules')?.addEventListener('click', () => this.showRulesModal());
        document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());
        document.getElementById('btn-admin-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('admin');
            Admin.init();
        });

        // Seleção
        document.getElementById('btn-back-home')?.addEventListener('click', () => this.goBack());
        document.getElementById('btn-turmas-none')?.addEventListener('click', () => this.selectNoTurma());
        document.getElementById('btn-turmas-continue')?.addEventListener('click', () => this.confirmTurmas());
        document.getElementById('btn-modo-total')?.addEventListener('click', () => this.setPalavrasModo('total'));
        document.getElementById('btn-modo-por')?.addEventListener('click', () => this.setPalavrasModo('por'));
        document.querySelectorAll('.modo-ordem-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setModoOrdem(btn.dataset.ordem));
        });
        document.querySelectorAll('.letter-style-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setLetterStyle(btn.dataset.style));
        });

        // Jogo
        document.getElementById('btn-close-game')?.addEventListener('click', () => Game.end());
        document.getElementById('input-letter')?.addEventListener('input', (e) => {
            const letter = this._extractLetter(e.target.value);
            e.target.value = '';
            if (letter) Game.processLetter(letter);
        });
        document.getElementById('input-letter')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const settings = Data.getSettings();
                if (settings.autoMode) return;
                this.submitLetter();
            }
        });
        document.getElementById('btn-next-word')?.addEventListener('click', () => Game.nextWord());
        document.getElementById('btn-end-game')?.addEventListener('click', () => Game.end());
        document.getElementById('btn-add-word')?.addEventListener('click', () => Game.addOneWord());
        document.getElementById('btn-fullscreen')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('btn-toggle-hint')?.addEventListener('click', () => Game.toggleHint());
        document.getElementById('btn-toggle-illustration')?.addEventListener('click', () => Game.toggleIllustration());
        document.getElementById('error-close')?.addEventListener('click', () => Game.clearErrorPanel());

        // Resultado da sessão
        document.getElementById('btn-new-student')?.addEventListener('click', () => this.showScreen('select'));
        document.getElementById('btn-session-home')?.addEventListener('click', () => this.showScreen('home'));
        document.getElementById('btn-session-home-top')?.addEventListener('click', () => this.showScreen('home'));
        document.getElementById('btn-session-history')?.addEventListener('click', () => this.showScreen('results'));
        document.getElementById('btn-session-theme')?.addEventListener('click', () => this.toggleTheme());

        // Fim do jogo
        document.getElementById('btn-play-again')?.addEventListener('click', () => this.showScreen('select'));
        document.getElementById('btn-go-home')?.addEventListener('click', () => this.showScreen('home'));

        // Resultados
        document.getElementById('btn-back-results')?.addEventListener('click', () => this.showScreen('home'));
        document.getElementById('btn-results-theme')?.addEventListener('click', () => this.toggleTheme());

        // Seleção de série
        document.getElementById('btn-select-theme')?.addEventListener('click', () => this.toggleTheme());

        // Jogo
        document.getElementById('btn-game-theme')?.addEventListener('click', () => this.toggleTheme());

        // Admin
        document.getElementById('btn-exit-admin')?.addEventListener('click', () => this.showScreen('home'));

        // Regras
        document.getElementById('btn-close-rules')?.addEventListener('click', () => this.closeRulesModal());
        document.getElementById('modal-rules')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeRulesModal();
        });

        // Sessão anterior
        document.getElementById('btn-continue-session')?.addEventListener('click', () => this.continueSession());
        document.getElementById('btn-new-session')?.addEventListener('click', () => this.newSession());

        // Delegação de eventos para conteúdo gerado dinamicamente (listas de série/turma/
        // disciplina, banner de eventos na home, etc.)
        document.getElementById('app')?.addEventListener('click', (e) => {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            try {
                const action = el.dataset.action;
                const id = el.dataset.id;
                switch (action) {
                    case 'goto-admin':
                        e.preventDefault();
                        this.showScreen('admin');
                        break;
                    case 'select-serie': this.selectSerie(id); break;
                    case 'toggle-turma': this.toggleTurma(id); break;
                    case 'toggle-disciplina': this.toggleDisciplina(id); break;
                    case 'set-palavras-por-turma': this.setPalavrasPorTurma(el.dataset.value); break;
                    case 'show-event-results': this.showEventResults(id); break;
                    case 'start-event-game': this.startEventGame(id); break;
                    case 'toggle-home-history': this.toggleHomeHistory(); break;
                }
            } catch (err) {
                console.error('Erro na delegação de eventos (App):', err);
            }
        });
    },

    // Mostrar tela
    _eventResultsId: null,
    _execResultsId: null,

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`)?.classList.add('active');
        this.currentScreen = screenId;

        // Carregar dados ao mostrar tela
        switch (screenId) {
            case 'select':
                this.loadSelectionSeries();
                break;
            case 'admin':
                Admin.init();
                break;
            case 'results':
                this.loadResultsPage(this._eventResultsId, this._execResultsId);
                this._eventResultsId = null;
                this._execResultsId = null;
                break;
            case 'home':
                this.loadHomeBanner();
                break;
        }
    },

    showEventResults(eventoId, execucaoId, eventName) {
        this._eventResultsId = eventoId;
        this._execResultsId = execucaoId || null;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-results')?.classList.add('active');
        this.currentScreen = 'results';
        this.loadResultsPage(eventoId, this._execResultsId, eventName);
        this._eventResultsId = null;
        this._execResultsId = null;
    },

    // Mostrar resultados de uma execução específica
    showExecutionResults(execucaoId) {
        if (!execucaoId) return;
        const logs = Data.getLogs().filter(l => l.execucaoId === execucaoId);
        if (logs.length === 0) {
            alert(T('Nenhum resultado encontrado para esta execução.'));
            return;
        }
        this._eventResultsId = logs[0].eventoId || '';
        this._execResultsId = execucaoId;
        this.showScreen('results');
    },

    // Carregar séries na tela de seleção
    loadSelectionSeries() {
        const allSeries = Data.getSeries();
        const series = allSeries
            .filter(s => s.active !== false && Data.getPalavrasBySerie(s.id).length > 0)
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        const container = document.getElementById('select-series-list');

        if (!container) return;

        // Update header title
        document.getElementById('select-step-title').textContent = T('Selecionar Série');

        // Resetar etapas
        document.getElementById('step-series').classList.remove('hidden');
        document.getElementById('step-turmas').classList.add('hidden');
        document.getElementById('step-disciplinas').classList.add('hidden');

        if (series.length === 0) {
            container.innerHTML = `
                <div class="selection-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
                    <p>${T('Nenhuma série cadastrada.')}</p>
                    <a href="#" data-action="goto-admin" class="selection-empty-link">${T('Ir para o Painel do Professor')}</a>
                </div>`;
            return;
        }

        container.innerHTML = series.map(s => {
            const turmas = Data.getTurmasBySerie(s.id);
            return `
                <div class="selection-item" data-id="${s.id}" data-action="select-serie">
                    <svg class="selection-item-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
                    <h3>${Utils.escapeHtml(s.nome)}</h3>
                </div>
            `;
        }).join('');
    },

    // Selecionar série
    selectSerie(serieId) {
        document.querySelectorAll('#select-series-list .selection-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.id === serieId);
        });

        const series = Data.getSeries();
        const selectedSerie = series.find(s => s.id === serieId);
        this.selectedSerieName = selectedSerie?.nome || '';

        this.selectedSerieId = serieId;
        this.selectedTurmaIds = [];
        this.selectedTurmaNames = [];
        this.selectedDisciplinaIds = [];
        this.palavrasPorTurma = 'ilimitado';
        this.modoOrdem = 'sequencial';

        const turmas = Data.getTurmasBySerie(serieId).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        if (turmas.length > 0) {
            document.getElementById('step-series').classList.add('hidden');
            document.getElementById('step-turmas').classList.remove('hidden');
            document.getElementById('select-step-title').textContent = 'Selecionar Turma(s)';
            document.getElementById('select-serie-label').textContent = this.selectedSerieName;

            const container = document.getElementById('select-turmas-list');
            container.innerHTML = turmas.map(t => `
                <div class="selection-item turma-multi-item" data-id="${t.id}" data-action="toggle-turma">
                    <span class="turma-checkbox"></span>
                    <svg class="selection-item-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <h3>${Utils.escapeHtml(t.nome)}</h3>
                    ${t.professor ? `<p>${Utils.escapeHtml(t.professor)}</p>` : ''}
                </div>
            `).join('');

            document.getElementById('btn-turmas-continue').disabled = true;
        } else {
            this.showDisciplinasStep();
        }
    },

    // Voltar etapa na seleção
    goBack() {
        const seriesVisible = !document.getElementById('step-series')?.classList.contains('hidden');
        const turmasVisible = !document.getElementById('step-turmas')?.classList.contains('hidden');
        const disciplinasVisible = !document.getElementById('step-disciplinas')?.classList.contains('hidden');

        if (seriesVisible) {
            this.showScreen('home');
        } else if (turmasVisible) {
            document.getElementById('step-turmas').classList.add('hidden');
            document.getElementById('step-series').classList.remove('hidden');
            document.getElementById('select-step-title').textContent = T('Selecionar Série');
        } else if (disciplinasVisible) {
            const turmas = Data.getTurmasBySerie(this.selectedSerieId);
            document.getElementById('step-disciplinas').classList.add('hidden');
            if (turmas.length > 0) {
                document.getElementById('step-turmas').classList.remove('hidden');
                document.getElementById('select-step-title').textContent = T('Selecionar Turma(s)');
                document.getElementById('select-serie-label').textContent = this.selectedSerieName;
            } else {
                document.getElementById('step-series').classList.remove('hidden');
                document.getElementById('select-step-title').textContent = T('Selecionar Série');
            }
        }
    },

    // Alternar seleção de turma (multi-select)
    toggleTurma(turmaId) {
        const item = document.querySelector(`#select-turmas-list .selection-item[data-id="${turmaId}"]`);
        const idx = this.selectedTurmaIds.indexOf(turmaId);
        const turmas = Data.getTurmasBySerie(this.selectedSerieId);

        if (idx > -1) {
            this.selectedTurmaIds.splice(idx, 1);
            const nameIdx = this.selectedTurmaNames.indexOf(turmas.find(t => t.id === turmaId)?.nome || '');
            if (nameIdx > -1) this.selectedTurmaNames.splice(nameIdx, 1);
            item?.classList.remove('selected');
        } else {
            this.selectedTurmaIds.push(turmaId);
            this.selectedTurmaNames.push(turmas.find(t => t.id === turmaId)?.nome || '');
            item?.classList.add('selected');
        }

        document.getElementById('btn-turmas-continue').disabled = this.selectedTurmaIds.length === 0;
    },

    // Pular seleção de turmas
    selectNoTurma() {
        document.querySelectorAll('#select-turmas-list .selection-item').forEach(item => {
            item.classList.remove('selected');
        });
        this.selectedTurmaIds = [];
        this.selectedTurmaNames = [];
        this.showDisciplinasStep();
    },

    // Confirmar turmas e ir para disciplinas
    confirmTurmas() {
        if (this.selectedTurmaIds.length > 0) {
            this.showDisciplinasStep();
        }
    },

    // Mostrar etapa de disciplinas
    showDisciplinasStep() {
        document.getElementById('step-series').classList.add('hidden');
        document.getElementById('step-turmas').classList.add('hidden');
        document.getElementById('step-disciplinas').classList.remove('hidden');
        document.getElementById('select-step-title').textContent = T('Selecionar Disciplinas');

        const pathParts = [this.selectedSerieName];
        if (this.selectedTurmaNames.length > 0) pathParts.push(this.selectedTurmaNames.join(', '));
        document.getElementById('select-path-label').textContent = pathParts.join(' — ');

        const disciplinas = Data.getDisciplinasBySerie(this.selectedSerieId);
        const container = document.getElementById('select-disciplinas-list');

        const disciplinasWithWords = disciplinas.filter(d => {
            const palavras = Data.getPalavrasBySerieAndDisciplina(this.selectedSerieId, d.id);
            return palavras.length > 0;
        }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        if (disciplinasWithWords.length === 0) {
            container.innerHTML = `<p>${T('Nenhuma disciplina com palavras cadastradas para esta série.')}</p>`;
            document.getElementById('disciplinas-config')?.classList.add('hidden');
            return;
        }

        this.selectedDisciplinaIds = [];
        this.palavrasPorTurma = 'ilimitado';
        this.palavrasModo = this.selectedTurmaIds.length > 0 ? 'total' : 'por';
        this.modoOrdem = 'sequencial';
        this.modoEnsaio = false;

        document.querySelectorAll('.palavras-modo-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.modo === this.palavrasModo);
        });

        container.innerHTML = disciplinasWithWords.map(d => {
            const wordCount = Data.getPalavrasBySerieAndDisciplina(this.selectedSerieId, d.id).length;
            return `
                <div class="selection-item" data-id="${d.id}" data-action="toggle-disciplina">
                    <svg class="selection-item-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
                    <h3>${Utils.escapeHtml(d.nome)}</h3>
                    <p>${wordCount} ${T(wordCount === 1 ? 'palavra' : 'palavras')}</p>
                </div>
            `;
        }).join('');

        document.getElementById('disciplinas-config')?.classList.add('hidden');
        document.getElementById('available-words').textContent = '0';

        this.renderPalavrasOptions(0);

        // Ordem visível apenas com múltiplas turmas
        const ordemSection = document.querySelector('.modo-ordem');
        if (ordemSection) ordemSection.classList.toggle('hidden', this.selectedTurmaIds.length < 2);

        const ensaioBtn = document.getElementById('btn-ensaio');
        if (ensaioBtn) {
            ensaioBtn.classList.remove('active');
            this.modoEnsaio = false;
        }

        this.bindDisciplinasEvents();
    },

    bindDisciplinasEvents() {
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn && !startBtn._bound) {
            startBtn.addEventListener('click', () => this.startGame());
            startBtn._bound = true;
        }
        const ensaioBtn = document.getElementById('btn-ensaio');
        if (ensaioBtn && !ensaioBtn._bound) {
            ensaioBtn.addEventListener('click', () => {
                this.modoEnsaio = !this.modoEnsaio;
                ensaioBtn.classList.toggle('active', this.modoEnsaio);
            });
            ensaioBtn._bound = true;
        }
    },

    toggleDisciplina(disciplinaId) {
        const item = document.querySelector(`#select-disciplinas-list .selection-item[data-id="${disciplinaId}"]`);
        
        if (this.selectedDisciplinaIds.includes(disciplinaId)) {
            this.selectedDisciplinaIds = this.selectedDisciplinaIds.filter(id => id !== disciplinaId);
            item?.classList.remove('selected');
        } else {
            this.selectedDisciplinaIds.push(disciplinaId);
            item?.classList.add('selected');
        }

        this.updateWordCount();
    },

    // Máximo de palavras por disciplina respeitando o disponível (e o nº de turmas)
    _getMaxPorDisciplina() {
        const numTurmas = Math.max(1, this.selectedTurmaIds.length);
        let maxPerDisc = 0;
        this.selectedDisciplinaIds.forEach(discId => {
            const words = Data.getPalavrasBySerieAndDisciplina(this.selectedSerieId, discId).length;
            maxPerDisc = maxPerDisc === 0 ? words : Math.min(maxPerDisc, words);
        });
        return Math.floor(maxPerDisc / numTurmas);
    },

    // Rótulo + resumo do total efetivo conforme o modo de distribuição
    updateConfigLabels(total) {
        const label = document.getElementById('config-words-label');
        const summary = document.getElementById('palavras-summary');
        const numDisc = this.selectedDisciplinaIds.length;
        const numTurmas = this.selectedTurmaIds.length;
        const por = this.palavrasModo === 'por';

        if (label) {
            if (por) {
                label.textContent = numTurmas > 0 ? T('Por disciplina e turma:') : T('Por disciplina:');
            } else {
                label.textContent = numTurmas > 0 ? T('Total por turma:') : T('Total de palavras:');
            }
        }

        if (!summary) return;
        let txt = '';
        if (this.palavrasPorTurma === 'ilimitado') {
            txt = T('Todas as {total} palavras disponíveis', { total });
        } else {
            const n = Number(this.palavrasPorTurma) || 0;
            if (por) {
                const tot = n * numDisc * Math.max(1, numTurmas);
                txt = numTurmas > 0
                    ? T('{n} por disciplina em cada turma (total: {tot})', { n, tot })
                    : T('{n} por disciplina (total: {tot})', { n, tot });
            } else {
                txt = numTurmas > 0 ? T('{n} no total por turma', { n }) : T('{n} no total', { n });
            }
        }
        summary.textContent = txt;
    },

    updateWordCount() {
        const count = Data.countPalavrasBySerieAndDisciplinas(this.selectedSerieId, this.selectedDisciplinaIds);
        document.getElementById('available-words').textContent = count;

        const configPanel = document.getElementById('disciplinas-config');
        const startBtn = document.getElementById('btn-start-game');

        if (this.selectedDisciplinaIds.length > 0) {
            configPanel?.classList.remove('hidden');
            if (startBtn) startBtn.disabled = false;
        } else {
            configPanel?.classList.add('hidden');
            if (startBtn) startBtn.disabled = true;
        }

        // Com apenas 1 disciplina, "Por disciplina" não faz sentido: força o modo total
        const numDisc = this.selectedDisciplinaIds.length;
        const btnPor = document.getElementById('btn-modo-por');
        if (numDisc <= 1) {
            if (btnPor) btnPor.classList.add('hidden');
            if (this.palavrasModo === 'por') this.palavrasModo = 'total';
        } else {
            if (btnPor) btnPor.classList.remove('hidden');
        }

        document.querySelectorAll('.palavras-modo-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.modo === this.palavrasModo);
        });

        this.renderPalavrasOptions(count);
    },

    setPalavrasModo(modo) {
        this.palavrasModo = modo;
        document.querySelectorAll('.palavras-modo-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.modo === modo);
        });
        this.updateWordCount();
    },

    renderPalavrasOptions(total) {
        const container = document.getElementById('palavras-por-turma-options');
        if (!container) return;

        // Teto de segurança; o máximo depende do modo
        const MAX_PPT = 15;
        let maxOpt;
        if (this.palavrasModo === 'por') {
            maxOpt = this._getMaxPorDisciplina();
        } else {
            maxOpt = total;
        }
        maxOpt = Math.max(1, Math.min(maxOpt, MAX_PPT));

        // Se o valor atual não é mais válido, ajusta para o teto
        if (this.palavrasPorTurma !== 'ilimitado' && this.palavrasPorTurma > maxOpt) {
            this.palavrasPorTurma = maxOpt;
        }

        const options = ['ilimitado'];
        for (let i = 1; i <= maxOpt; i++) options.push(i);

        container.innerHTML = options.map(v => {
            const active = this.palavrasPorTurma === v ? ' active' : '';
            const label = v === 'ilimitado' ? '&infin;' : v;
            return `<button class="btn btn-secondary${active}" data-action="set-palavras-por-turma" data-value="${v}">${label}</button>`;
        }).join('');

        this.updateConfigLabels(total);
    },

    setPalavrasPorTurma(value) {
        this.palavrasPorTurma = value === 'ilimitado' ? 'ilimitado' : parseInt(value);
        this.updateWordCount();
    },

    setModoOrdem(value) {
        this.modoOrdem = value;
        document.querySelectorAll('.modo-ordem-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ordem === value);
        });
    },

    startGame() {
        if (this.selectedDisciplinaIds.length === 0) {
            alert(T('Selecione pelo menos uma disciplina.'));
            return;
        }

        const totalPalavras = Data.countPalavrasBySerieAndDisciplinas(this.selectedSerieId, this.selectedDisciplinaIds);
        if (totalPalavras === 0) {
            alert(T('Nenhuma palavra disponível para as disciplinas selecionadas.'));
            return;
        }

        let palavrasPorTurma;
        if (this.palavrasPorTurma === 'ilimitado') {
            palavrasPorTurma = null;
        } else {
            palavrasPorTurma = Number(this.palavrasPorTurma) || 1;
        }

        this.showScreen('game');
        this.updateGameInputUI();
        
        Game.start({
            serieId: this.selectedSerieId,
            serieName: this.selectedSerieName || '',
            turmaIds: this.selectedTurmaIds,
            turmaNames: this.selectedTurmaNames,
            disciplinaIds: this.selectedDisciplinaIds,
            studentName: '',
            palavrasPorTurma,
            palavrasModo: this.palavrasModo,
            modoOrdem: this.modoOrdem,
            isPractice: this.modoEnsaio,
            eventId: null,
            eventNome: ''
        });
    },

    // Extrair última letra válida (incluindo acentos como ã, ç)
    _extractLetter(value) {
        if (!value) return '';
        const m = value.match(/[\u00A1-\u024F\u1E00-\u1EFFa-zA-Z-]/g);
        return m ? m[m.length - 1] : '';
    },

    // Submeter letra
    submitLetter() {
        const input = document.getElementById('input-letter');
        const letter = this._extractLetter(input?.value || '');

        if (!letter) return;

        Game.processLetter(letter);
        input.value = '';
        input.focus();
    },

    // Tela cheia
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Erro ao entrar em tela cheia:', err);
            });
        } else {
            document.exitFullscreen();
        }
    },

    // Atualizar UI do input do jogo (auto mode)
    updateGameInputUI() {
        const input = document.getElementById('input-letter');
        if (input) {
            input.focus();
        }
    },

    // Estilo das células de letras
    setLetterStyle(style) {
        Data.updateSetting('estilo_letra', style);
        document.querySelectorAll('.letter-style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === style);
        });
    },

    // ===== other code continues

    // Carregar tema
    loadTheme() {
        const settings = Data.getSettings();
        
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        this.updateThemeToggleIcon();
    },

    // Alternar tema
    toggleTheme() {
        const settings = Data.getSettings();
        const newDarkMode = !settings.darkMode;
        Data.updateSetting('darkMode', newDarkMode);
        
        if (newDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        this.updateThemeToggleIcon();
        Sounds.playClick();
    },

    // Atualizar ícone do toggle de tema
    updateThemeToggleIcon() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const sunSvg = '<svg class="icon-lucide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
        const moonSvg = '<svg class="icon-lucide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
        const sunSvg16 = sunSvg.replace('width="20" height="20"', 'width="16" height="16"');
        const moonSvg16 = moonSvg.replace('width="20" height="20"', 'width="16" height="16"');

        const btn = document.getElementById('btn-theme-toggle');
        if (btn) btn.innerHTML = isDark ? sunSvg : moonSvg;

        const resultsBtn = document.getElementById('btn-results-theme');
        if (resultsBtn) resultsBtn.innerHTML = isDark ? sunSvg : moonSvg;

        const adminBtn = document.getElementById('btn-admin-theme');
        if (adminBtn) adminBtn.innerHTML = isDark ? sunSvg16 : moonSvg16;

        const selectBtn = document.getElementById('btn-select-theme');
        if (selectBtn) selectBtn.innerHTML = isDark ? sunSvg : moonSvg;

        const gameBtn = document.getElementById('btn-game-theme');
        if (gameBtn) gameBtn.innerHTML = isDark ? sunSvg : moonSvg;

        const sessionBtn = document.getElementById('btn-session-theme');
        if (sessionBtn) sessionBtn.innerHTML = isDark ? sunSvg : moonSvg;

        const eventBtns = document.querySelectorAll('#btn-event-theme');
        eventBtns.forEach(btn => { btn.innerHTML = isDark ? sunSvg : moonSvg; });
    },

    // Verificar sessão anterior
    checkSession() {
        const session = Data.getSession();
        
        if (session && session.isActive) {
            const sessionInfo = document.getElementById('session-info');
            if (sessionInfo) {
                sessionInfo.innerHTML = `
                    <p><strong>${T('Aluno:')}</strong> ${Utils.escapeHtml(session.studentName)}</p>
                    <p><strong>${T('Data:')}</strong> ${Utils.formatDateTime(session.timestamp)}</p>
                `;
            }
            
            document.getElementById('modal-session')?.classList.remove('hidden');
        }
    },

    // Continuar sessão
    continueSession() {
        document.getElementById('modal-session')?.classList.add('hidden');
        this.showScreen('game');
        this.updateGameInputUI();
        Game.restoreSession();
    },

    // Nova sessão
    newSession() {
        document.getElementById('modal-session')?.classList.add('hidden');
        Data.clearSession();
    },

    // Mostrar regras
    showRulesModal() {
        document.getElementById('modal-rules')?.classList.remove('hidden');
    },

    // Fechar regras
    closeRulesModal() {
        document.getElementById('modal-rules')?.classList.add('hidden');
    },

    // ===== PÁGINA DE RESULTADOS =====
loadResultsPage(eventoId, execucaoId, eventName) {
    const allLogs = Data.getLogs();
    const isEvent = !!eventoId;
    let logs = isEvent ? allLogs.filter(l => l.eventoId === eventoId) : allLogs.filter(l => !l.eventoId);
    if (execucaoId) logs = logs.filter(l => l.execucaoId === execucaoId);

    // Mostrar/esconder seção de alunos (só em eventos)
    const alunoPodiumCard = document.getElementById('results-podium-alunos')?.closest('.chart-card');
    if (alunoPodiumCard) alunoPodiumCard.classList.toggle('hidden', !isEvent);

    // Ajustar título da série conforme o modo
    const serieTitle = document.querySelector('.chart-card:has(#results-podium-series) .chart-title');
    if (serieTitle) {
        serieTitle.textContent = isEvent ? T('Hall da Fama — Séries') : T('Desempenho por Série');
    }

    // Atualizar título
    const titleEl = document.querySelector('#screen-results .session-result-title h1');
    if (titleEl) {
        if (isEvent) {
            const ev = Data.getEventos().find(e => e.id === eventoId);
            const nome = eventName || ev?.nome || (logs.length > 0 ? logs[0].eventoNome : '') || T('Resultados');
            titleEl.innerHTML = `<svg class="icon-lucide" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> ${Utils.escapeHtml(nome)}`;
        } else {
            titleEl.innerHTML = `<svg class="icon-lucide" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg> ${T('Resultados')}`;
        }
    }

    this.renderResultsStats('results-stats-cards', logs);

    const serieStats = {};
    logs.forEach(log => {
        const sName = log.serieNome || T('Sem série');
        if (!serieStats[sName]) serieStats[sName] = { correct: 0, total: 0 };
        serieStats[sName].total++;
        if (log.resultado === 'acerto') serieStats[sName].correct++;
    });
    const serieTop3 = Object.entries(serieStats)
        .map(([nome, s]) => ({ nome, acertos: s.correct, total: s.total, taxa: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }))
        .sort((a, b) => b.acertos - a.acertos)
        .slice(0, 3);

    const podiumOrder = [1, 0, 2].filter(i => i < serieTop3.length);
    const classes = ['first', 'second', 'third'];
    const serieEl = document.getElementById('results-podium-series');
    if (serieEl) {
        if (serieTop3.length === 0) {
            serieEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;width:100%">${T('Nenhum dado disponível')}</p>`;
        } else {
            serieEl.innerHTML = podiumOrder.map(idx => {
                const p = serieTop3[idx];
                return `<div class="podium-bar ${classes[idx]} turma">
                    <span class="podium-position">${idx + 1}º</span>
                    <span class="podium-name">${Utils.escapeHtml(p.nome)}</span>
                    <span class="podium-score">${p.acertos} ✓ (${p.taxa}%)</span>
                </div>`;
            }).join('');
        }
    }

    if (isEvent) this.renderPodium('results-podium-alunos', logs);
    this.renderDisciplineChart('results-chart-disciplines', logs);

    const groups = Data.groupLogsByExecucao(logs);
    const container = document.getElementById('results-logs-content');
    if (container) {
        if (!groups || groups.length === 0) {
            container.innerHTML = `<p class="event-logs-empty">${T('Nenhum resultado registrado.')}</p>`;
        } else {
            container.innerHTML = groups.map(g => {
                const dt = g.startTime ? new Date(g.startTime) : null;
                const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
                const dtStr = dt ? dt.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }) + T(' às ') + dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : T('Data desconhecida');
                return `
                <div class="event-exec-group glass">
                    <div class="event-exec-header">
                        ${Utils.icon('clock', 16)}
                        <span class="event-exec-date">${dtStr}</span>
                        <span class="event-exec-badge">${g.total} ${T(g.total !== 1 ? 'palavras' : 'palavra')} · ${g.acertos} ${T(g.acertos !== 1 ? 'acertos' : 'acerto')} · ${g.taxa}%</span>
                    </div>
                    <div class="event-logs-table-wrap">
                        <table class="event-logs-table">
                            <thead>
                                <tr><th></th>${isEvent ? `<th>${T('Aluno')}</th>` : ''}<th>${T('Palavra')}</th><th>${T('Erro')}</th><th>${T('Disciplina')}</th><th>${T('Série')}</th><th>${T('Tempo')}</th></tr>
                            </thead>
                            <tbody>
                                ${g.logs.map(l => {
                                    const isOk = l.resultado === 'acerto';
                                    return `<tr>
                                        <td><span class="log-result-badge ${isOk ? 'correct' : 'wrong'}">${isOk ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span></td>
                                        ${isEvent ? `<td class="log-cell-word">${Utils.escapeHtml(l.aluno || '-')}</td>` : ''}
                                        <td class="log-cell-word">${Utils.escapeHtml(l.palavra)}</td>
                                        <td class="log-cell-error">${Utils.logErrorCell(l)}</td>
                                        <td class="log-cell-disc">${Utils.escapeHtml(l.disciplinaNome || '-')}</td>
                                        <td class="log-cell-series">${Utils.escapeHtml(l.serieNome || '-')}</td>
                                        <td class="log-cell-time">${Utils.formatTime(l.tempo || 0)}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            }).join('');
        }
    }
},

    renderResultsStats(containerId, logs) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const total = logs.length;
        const acertos = logs.filter(l => l.resultado === 'acerto').length;
        const erros = logs.filter(l => l.resultado === 'erro').length;
        const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0;
        const tempoMedio = total > 0 ? Math.round(logs.reduce((s, l) => s + (l.tempo || 0), 0) / total) : 0;
        const items = [
            { label: T('Total'), value: total, cls: '' },
            { label: T('Acertos'), value: acertos, cls: 'success' },
            { label: T('Erros'), value: erros, cls: 'danger' },
            { label: T('Taxa'), value: taxa + '%', cls: 'accent' },
            { label: T('Tempo médio'), value: Utils.formatTime(tempoMedio), cls: '' }
        ];
        el.innerHTML = items.map(s => `
            <div class="stat-pill ${s.cls}">
                <span class="stat-pill-value">${s.value}</span>
                <span class="stat-pill-label">${s.label}</span>
            </div>
        `).join('');
    },

    renderPodium(containerId, logs, options = {}) {
        const el = document.getElementById(containerId);
        if (!el) return;

        const alunoStats = {};
        logs.forEach(log => {
            if (!alunoStats[log.aluno]) alunoStats[log.aluno] = { correct: 0, total: 0 };
            alunoStats[log.aluno].total++;
            if (log.resultado === 'acerto') alunoStats[log.aluno].correct++;
        });

        const top3 = Object.entries(alunoStats)
            .map(([nome, s]) => ({ nome, acertos: s.correct, total: s.total, taxa: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }))
            .sort((a, b) => b.acertos - a.acertos)
            .slice(0, 3);

        if (top3.length === 0) {
            el.innerHTML = `<p style="color:var(--text-muted);text-align:center;width:100%">${T('Nenhum dado disponível')}</p>`;
            return;
        }

        const podiumOrder = [1, 0, 2].filter(i => i < top3.length);
        const classes = ['first', 'second', 'third'];
        const showTaxa = options.showTaxa || false;

        el.innerHTML = podiumOrder.map(idx => {
            const p = top3[idx];
            const label = showTaxa ? `${p.acertos} ✓ (${p.taxa}%)` : `${p.acertos} ✓`;
            return `
                <div class="podium-bar ${classes[idx]} ${options.turma ? 'turma' : ''}">
                    <span class="podium-position">${idx + 1}º</span>
                    <span class="podium-name">${Utils.escapeHtml(p.nome)}</span>
                    <span class="podium-score">${label}</span>
                </div>`;
        }).join('');
    },

    renderDisciplineChart(containerId, logs) {
        const el = document.getElementById(containerId);
        if (!el) return;

        const discStats = {};
        logs.forEach(log => {
            if (!discStats[log.disciplinaNome]) discStats[log.disciplinaNome] = { correct: 0, total: 0 };
            discStats[log.disciplinaNome].total++;
            if (log.resultado === 'acerto') discStats[log.disciplinaNome].correct++;
        });

        const data = Object.entries(discStats)
            .map(([nome, s]) => ({ nome, taxa: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }))
            .filter(d => d.nome);

        if (data.length === 0) {
            el.innerHTML = `<p style="color:var(--text-muted);text-align:center;width:100%">${T('Nenhum dado disponível')}</p>`;
            return;
        }

        const maxTaxa = Math.max(...data.map(d => d.taxa), 1);
        const colors = ['rgba(34,197,94,0.2)', 'rgba(245,158,11,0.2)'];
        const colorsSolid = ['#22c55e', '#f59e0b'];
        const maxBarHeight = 220;

        el.innerHTML = data.map((disc, i) => {
            const h = Math.round((disc.taxa / maxTaxa) * maxBarHeight) || 4;
            const color = colors[i % 2];
            const border = colorsSolid[i % 2];
            return `
                <div class="podium-bar taxa-bar" style="height:${h}px;background:${color};border-top:3px solid ${border}">
                    <span class="podium-position" style="color:${border}">${disc.taxa}%</span>
                    <span class="podium-name">${Utils.escapeHtml(disc.nome)}</span>
                </div>`;
        }).join('');
    },

    drawBarChart(canvasId, logs) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = container.clientWidth - 3;
        const displayHeight = Math.max(300, Math.round(displayWidth * 0.4));

        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const width = displayWidth;
        const height = displayHeight;

        ctx.clearRect(0, 0, width, height);

        if (!logs) logs = Data.getLogs().filter(l => !l.isPractice);

        const discStats = {};
        logs.forEach(log => {
            if (!discStats[log.disciplinaNome]) discStats[log.disciplinaNome] = { correct: 0, total: 0 };
            discStats[log.disciplinaNome].total++;
            if (log.resultado === 'acerto') discStats[log.disciplinaNome].correct++;
        });

        const data = Object.entries(discStats)
            .map(([nome, s]) => ({ nome, taxa: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }))
            .filter(d => d.nome);

        if (data.length === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Segoe UI, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(T('Nenhum dado disponível'), width / 2, height / 2);
            return;
        }

        const barWidth = Math.min(80, (width - 100) / data.length);
        const spacing = 30;
        const startX = (width - (barWidth + spacing) * data.length + spacing) / 2;
        const colors = ['rgba(34,197,94,0.55)', 'rgba(245,158,11,0.55)'];
        const colorsBorder = ['#22c55e', '#f59e0b'];

        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#e2e8f0';
        const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#64748b';

        data.forEach((disc, i) => {
            const x = startX + i * (barWidth + spacing);
            const barHeight = (disc.taxa / 100) * (height - 100);
            const y = height - 60 - barHeight;
            const color = colors[i % 2];
            const borderColor = colorsBorder[i % 2];

            ctx.fillStyle = color;
            ctx.beginPath();
            const r = 4;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barWidth - r, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
            ctx.lineTo(x + barWidth, height - 60);
            ctx.lineTo(x, height - 60);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.fill();

            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barWidth - r, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
            ctx.lineTo(x + barWidth, height - 60);
            ctx.lineTo(x, height - 60);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.stroke();

            ctx.fillStyle = textPrimary;
            ctx.font = 'bold 14px Segoe UI, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(disc.taxa + '%', x + barWidth / 2, y - 8);

            ctx.fillStyle = textMuted;
            ctx.font = '12px Segoe UI, system-ui, sans-serif';
            ctx.fillText(disc.nome.substring(0, 12), x + barWidth / 2, height - 30);
        });
    },

    // ===== BANNER DE EVENTOS NA HOME =====
    // Fechar automaticamente eventos cuja data já passou (podem ser reabertos no painel)
    autoEncerrarEventos() {
        const hoje = new Date();
        const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        let eventos;
        try { eventos = Data.getEventos(); } catch(e) { eventos = []; }
        let backfill = false;
        eventos.forEach(e => {
            if (e.status === 'ativo' && !e.manterAberto && e.data && String(e.data).slice(0, 10) < hojeStr) {
                Data.updateEvento(e.id, { status: 'encerrado' });
            } else if (e.status === 'encerrado' && !e.updatedAt) {
                e.updatedAt = new Date().toISOString();
                backfill = true;
            }
        });
        if (backfill) {
            try { Data.saveEventos(eventos); } catch (e) { console.warn(e); }
        }
    },

    loadHomeBanner() {
        this.autoEncerrarEventos();

        const homeContainer = document.querySelector('.home-container');
        if (!homeContainer) return;

        const existingBanner = document.getElementById('event-banner');
        if (existingBanner) existingBanner.remove();

        let eventos;
        try { eventos = Data.getEventos(); } catch(e) { eventos = []; }

        if (eventos.length === 0) return;

        const hoje = (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();

        const dataNormalizada = (d) => d ? String(d).slice(0, 10) : null;

        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

        const eventosAtivos = eventos.filter(e => e.status === 'ativo');
        const encerrados = eventos.filter(e => e.status === 'encerrado')
            .filter(e => {
                const dt = e.updatedAt || e.createdAt;
                return dt && new Date(dt) > umaSemanaAtras;
            });

        if (eventosAtivos.length === 0 && encerrados.length === 0) return;

        const doHoje = eventosAtivos.filter(e => {
            const d = dataNormalizada(e.data);
            return d === hoje || (d && d <= hoje);
        });
        const futuros = eventosAtivos.filter(e => {
            const d = dataNormalizada(e.data);
            return d && d > hoje;
        }).sort((a, b) => dataNormalizada(a.data).localeCompare(dataNormalizada(b.data)));
        const semData = eventosAtivos.filter(e => !dataNormalizada(e.data));

        let html = '';

        // ===== EVENTOS DE HOJE (ou data passada com status aberto) =====
        doHoje.forEach(e => {
            const rodadas = e.rodadas || [];
            const logsEvento = Data.getLogs().filter(l => l.eventoId === e.id && !l.modoEnsaio);
            const temLogs = logsEvento.length > 0;

            html += `
            <div class="home-event-card today">
                <div class="home-event-main">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <div class="home-event-info">
                        <span class="home-event-label today">${T('HOJE — {nome}', { nome: Utils.escapeHtml(e.nome) })}</span>
                        <span class="home-event-meta">
                            <span class="home-event-meta-line"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>${rodadas.length} ${T(rodadas.length !== 1 ? 'rodadas' : 'rodada')}</span>
                            ${temLogs ? `<span class="home-event-meta-line"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>${logsEvento.length} ${T(logsEvento.length !== 1 ? 'execuções' : 'execução')}</span>` : ''}
                        </span>
                    </div>
                </div>
                <div class="home-event-btns">
                    ${temLogs ? `<button class="btn btn-small home-event-results-btn" data-action="show-event-results" data-id="${e.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        ${T('Resultados')}
                    </button>` : ''}
                    <button class="btn btn-primary btn-small" data-action="start-event-game" data-id="${e.id}">${T('Iniciar')}</button>
                </div>
            </div>`;
        });

        // ===== EVENTOS FUTUROS (máx 3) =====
        futuros.slice(0, 3).forEach(e => {
            const rodadas = e.rodadas || [];
            const d = new Date(e.data + 'T12:00:00');
            const diffMs = d - new Date();
            const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const diasStr = dias === 1 ? T('amanhã') : T('em {dias} dias', { dias });

            html += `
            <div class="home-event-card future">
                <div class="home-event-main">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div class="home-event-info">
                        <span class="home-event-label">${Utils.escapeHtml(e.nome)}</span>
                        <span class="home-event-meta"><span class="home-event-meta-line"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>${Utils.formatDate(e.data)} (${diasStr}) · ${rodadas.length} ${T(rodadas.length !== 1 ? 'rodadas' : 'rodada')}</span></span>
                    </div>
                </div>
            </div>`;
        });

        // ===== EVENTOS SEM DATA =====
        semData.forEach(e => {
            const rodadas = e.rodadas || [];
            const logsEvento = Data.getLogs().filter(l => l.eventoId === e.id && !l.modoEnsaio);
            const temLogs = logsEvento.length > 0;
            html += `
            <div class="home-event-card future">
                <div class="home-event-main">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <div class="home-event-info">
                        <span class="home-event-label">${Utils.escapeHtml(e.nome)}</span>
                        <span class="home-event-meta"><span class="home-event-meta-line"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>${rodadas.length} ${T(rodadas.length !== 1 ? 'rodadas' : 'rodada')} · ${T('Sem data definida')}</span></span>
                    </div>
                </div>
                <div class="home-event-btns">
                    ${temLogs ? `<button class="btn btn-small home-event-results-btn" data-action="show-event-results" data-id="${e.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        ${T('Resultados')}
                    </button>` : ''}
                    <button class="btn btn-primary btn-small" data-action="start-event-game" data-id="${e.id}">${T('Iniciar')}</button>
                </div>
            </div>`;
        });

        // ===== HISTÓRICO DE EVENTOS ENCERRADOS =====
        if (encerrados.length > 0) {
            html += `
            <button class="home-event-toggle" data-action="toggle-home-history">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ${T('{n} evento(s) encerrado(s)', { n: encerrados.length })}
                <svg class="toggle-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="home-event-history" id="home-event-history">`;
            encerrados.forEach(e => {
                const temLogs = Data.getLogs().some(l => l.eventoId === e.id);
                html += `
                <div class="home-event-card closed">
                    <div class="home-event-main">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <div class="home-event-info">
                            <span class="home-event-label closed">${Utils.escapeHtml(e.nome)}</span>
                            <span class="home-event-meta"><span class="home-event-meta-line"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>${Utils.formatDate(e.data)} · ${T('Encerrado')}</span></span>
                        </div>
                    </div>
                    ${temLogs ? `<button class="btn btn-small home-event-results-btn" data-action="show-event-results" data-id="${e.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        ${T('Resultados')}
                    </button>` : ''}
                </div>`;
            });
            html += '</div>';
        }

        if (!html) return;

        const banner = document.createElement('div');
        banner.id = 'event-banner';
        banner.className = 'home-event-banner';
        banner.innerHTML = html;

        const ref = homeContainer.querySelector('.home-links');
        homeContainer.insertBefore(banner, ref);
    },

    toggleHomeHistory() {
        const el = document.getElementById('home-event-history');
        const toggle = document.querySelector('.home-event-toggle');
        if (el) {
            el.classList.toggle('open');
            toggle?.classList.toggle('open');
        }
    },

    toggleHomeEventHistory(eventoId) {
        const el = document.getElementById('home-event-history-' + eventoId);
        if (el) el.classList.toggle('hidden');
    },

    renderHomeEventHistory(logs) {
        if (!logs || logs.length === 0) return `<p class="home-event-history-empty">${T('Nenhuma execução registrada.')}</p>`;
        const groups = Data.groupLogsByExecucao(logs);
        return groups.map(g => {
            const dt = g.startTime ? new Date(g.startTime) : null;
            const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
            const dtStr = dt ? dt.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }) + T(' às ') + dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : T('Data desconhecida');
            const rows = g.logs.map(l => {
                const isOk = l.resultado === 'acerto';
                const errDetail = (!isOk && l.letraDigitada)
                    ? T('digitou {x}, esperava {y}', { x: String(l.letraDigitada).toUpperCase(), y: String(l.letraEsperada || '').toUpperCase() })
                    : '';
                return `
                <div class="home-history-row" ${errDetail ? `title="${Utils.escapeHtml(errDetail)}"` : ''}>
                    <span class="home-history-icon ${isOk ? 'correct' : 'wrong'}">
                        ${isOk
                            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                        }
                    </span>
                    <span class="home-history-name">${Utils.escapeHtml(l.aluno || '-')}</span>
                    <span class="home-history-word">${Utils.escapeHtml(l.palavra)}</span>
                    ${errDetail ? `<span class="home-history-error">${Utils.escapeHtml(errDetail)}</span>` : ''}
                    <span class="home-history-disc">${Utils.escapeHtml(l.disciplinaNome || '')}</span>
                    <span class="home-history-time">${Utils.formatTime(l.tempo || 0)}</span>
                </div>`;
            }).join('');
            return `
            <div class="home-history-exec-group">
                <div class="home-history-exec-header">
                    ${Utils.icon('clock', 14)}
                    <span>${dtStr}</span>
                    <span class="home-history-exec-badge">${g.total} ${T(g.total !== 1 ? 'palavras' : 'palavra')} · ${T('{taxa}% acerto', { taxa: g.taxa })}</span>
                </div>
                <div class="home-history-list">${rows}</div>
            </div>`;
        }).join('');
    },

    // ===== FLUXO DE EVENTOS =====
    startEventGame(eventoId) {
        const evento = Data.getEventoById(eventoId);
        if (!evento || !evento.rodadas || evento.rodadas.length === 0) {
            alert(T('Este evento não tem rodadas configuradas.'));
            return;
        }
        
        EventGame.start(evento);
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Exportar para uso global
window.App = App;