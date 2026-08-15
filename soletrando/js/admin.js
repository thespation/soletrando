// ===== PAINEL DO PROFESSOR =====

const Admin = {
    currentSection: 'series',
    editingId: null,
    _eventsBound: false,

    init() {
        if (!this._eventsBound) {
            this.bindEvents();
            this._eventsBound = true;
        }
        this.loadSection('series');
    },

    bindEvents() {
        document.querySelectorAll('.admin-nav a, .admin-bottom-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadSection(link.dataset.section);
            });
        });

        document.getElementById('btn-add-series')?.addEventListener('click', () => this.showSeriesForm());
        document.getElementById('admin-btn-bulk-series')?.addEventListener('click', () => this.showSeriesBulkImportForm());
        document.getElementById('admin-btn-bulk-disciplina')?.addEventListener('click', () => this.showDisciplinaBulkImportForm());
        document.getElementById('btn-add-disciplina')?.addEventListener('click', () => this.showDisciplinaForm());
        document.getElementById('admin-btn-add-word')?.addEventListener('click', () => this.showWordForm());
        document.getElementById('admin-btn-bulk-word')?.addEventListener('click', () => this.showBulkImportForm());
        document.getElementById('btn-add-event')?.addEventListener('click', () => this.showEventForm());
        document.getElementById('filter-series')?.addEventListener('change', () => { this.loadWordsFilterDisciplinas(); this.renderWords(); });
        document.getElementById('filter-disciplina')?.addEventListener('change', () => this.renderWords());

        document.getElementById('btn-admin-theme')?.addEventListener('click', () => this.toggleTheme());

        this.bindSettingsEvents();

        document.getElementById('btn-export-all')?.addEventListener('click', () => this.exportAll());
        document.getElementById('btn-export-logs')?.addEventListener('click', () => this.exportLogs());
        document.getElementById('btn-import')?.addEventListener('click', () => this.importData());
        document.getElementById('btn-import-close')?.addEventListener('click', () => this.closeImportModal());
        document.getElementById('btn-import-cancel')?.addEventListener('click', () => this.closeImportModal());
        document.getElementById('btn-import-overwrite-all')?.addEventListener('click', () => this._doImportOverwriteAll());
        document.getElementById('btn-import-selective')?.addEventListener('click', () => this._showImportSelective());
        document.getElementById('btn-import-confirm')?.addEventListener('click', () => this._doImportSelective());
        document.getElementById('modal-import')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeImportModal();
        });
        document.getElementById('btn-restore-close')?.addEventListener('click', () => this.closeRestoreModal());
        document.getElementById('btn-restore-cancel')?.addEventListener('click', () => this.closeRestoreModal());
        document.getElementById('btn-restore-overwrite-all')?.addEventListener('click', () => this._doRestoreOverwriteAll());
        document.getElementById('btn-restore-selective')?.addEventListener('click', () => this._showRestoreSelective());
        document.getElementById('btn-restore-confirm')?.addEventListener('click', () => this._doRestoreSelective());
        document.getElementById('modal-restore')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeRestoreModal();
        });
        document.getElementById('btn-backup-save')?.addEventListener('click', () => this.saveLocalBackup());
        document.getElementById('btn-backup-delete-all')?.addEventListener('click', () => this.deleteAllBackups());
        document.getElementById('btn-connect-folder')?.addEventListener('click', () => this.connectSystemFolder());
        this.refreshSystemFolderStatus();
        document.getElementById('btn-clear-avulsos')?.addEventListener('click', () => this.clearAllAvulsos());
        document.getElementById('btn-clear-eventos')?.addEventListener('click', () => this.clearAllEventos());
        this._bindCheckAll('import-check-all', '#import-step-selective .import-checklist');
        this._bindCheckAll('restore-check-all', '#restore-step-selective .import-checklist');

        document.getElementById('btn-crop-close')?.addEventListener('click', () => this.closeCropModal());
        document.getElementById('btn-crop-cancel')?.addEventListener('click', () => this.closeCropModal());
        document.getElementById('btn-crop-save')?.addEventListener('click', () => this.saveCrop());
        document.getElementById('btn-crop-zoom-in')?.addEventListener('click', () => this._zoomCrop(0.1));
        document.getElementById('btn-crop-zoom-out')?.addEventListener('click', () => this._zoomCrop(-0.1));
        document.getElementById('crop-zoom-range')?.addEventListener('input', (e) => {
            if (this._cropState) {
                this._cropState.zoom = parseFloat(e.target.value) / 100;
                this._applyCropState();
            }
        });
        document.getElementById('crop-frame')?.addEventListener('pointerdown', (e) => this._onCropPointerDown(e));
        document.getElementById('modal-crop')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeCropModal();
        });
        document.getElementById('btn-migrate-close')?.addEventListener('click', () => this.closeMigrateModal());
        document.getElementById('btn-migrate-cancel')?.addEventListener('click', () => this.closeMigrateModal());
        document.getElementById('btn-migrate-start')?.addEventListener('click', () => this.migrateImagesToFolder());
        document.getElementById('modal-migrate')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeMigrateModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!document.getElementById('modal-crop')?.classList.contains('hidden')) {
                    this.closeCropModal();
                } else if (!document.getElementById('modal-restore')?.classList.contains('hidden')) {
                    this.closeRestoreModal();
                } else if (!document.getElementById('modal-migrate')?.classList.contains('hidden')) {
                    this.closeMigrateModal();
                }
            }
        });

        document.querySelector('.admin-content')?.addEventListener('click', (e) => {
            try {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                switch (action) {
                    case 'edit-series': this.showSeriesForm(id); break;
                    case 'delete-series': this.deleteSeries(id); break;
                    case 'toggle-series': this.toggleSeries(id); break;
                    case 'edit-turma-inline': this.showTurmaForm(id); break;
                    case 'delete-turma-inline': this.deleteTurmaFromSerie(id); break;
                    case 'edit-disciplina': this.showDisciplinaForm(id); break;
                    case 'delete-disciplina': this.deleteDisciplina(id); break;
                    case 'edit-word': this.showWordForm(id); break;
                    case 'delete-word': this.deleteWord(id); break;
                    case 'crop-word': {
                        const imgEl = btn.tagName === 'IMG' ? btn : btn.querySelector('img');
                        if (imgEl) this.openCropModal(imgEl.currentSrc || imgEl.src, id || null);
                        break;
                    }
                    case 'edit-event': this.showEventForm(id); break;
                    case 'duplicate-event': this.duplicateEvent(id); break;
                    case 'export-event-pdf': this.exportEventPDF(id); break;
                    case 'delete-event': this.deleteEvent(id); break;
                    case 'close-event': this.closeEvent(id); break;
                    case 'reopen-event': this.reopenEvent(id); break;
                    case 'toggle-event-detail': {
                        const src = btn.closest('.admin-section')?.id === 'section-resultados-eventos' ? 'resultados' : 'eventos';
                        this.toggleEventDetail(id, src);
                        break;
                    }
                    // Formulários (série/turma/disciplina/palavra/evento)
                    case 'remove-form-turma-row': this.removeFormTurmaRow(btn); break;
                    case 'add-form-turma-row': this.addFormTurmaRow(); break;
                    case 'close-form': this.closeForm(btn.dataset.container); break;
                    case 'save-series': this.saveSeries(id || null); break;
                    case 'save-turma': this.saveTurma(id); break;
                    case 'save-disciplina': this.saveDisciplina(id || null); break;
                    case 'save-word': this.saveWord(id || null); break;
                    case 'save-event': this.saveEvent(id || null); break;
                    case 'remove-word-image': this.removeWordImage(); break;
                    case 'preview-image-url': this.previewImageUrl(); break;
                    // Importação em lote
                    case 'add-series-bulk-row': this.addSeriesBulkRow(); break;
                    case 'save-bulk-series': this.saveBulkSeries(); break;
                    case 'remove-bulk-turma-row': this.removeBulkTurmaRow(btn); break;
                    case 'add-bulk-turma-row': this.addBulkTurmaRow(btn); break;
                    case 'add-disciplina-bulk-row': this.addDisciplinaBulkRow(); break;
                    case 'save-bulk-disciplinas': this.saveBulkDisciplinas(); break;
                    case 'apply-bulk-series-disciplina': this.applyBulkSeriesDisciplina(); break;
                    case 'add-bulk-row': this.addBulkRow(); break;
                    case 'save-bulk-words': this.saveBulkWords(); break;
                    case 'remove-row': btn.closest('tr')?.remove(); break;
                    // Rodadas de evento
                    case 'add-rodada': this.addRodada(); break;
                    case 'remove-rodada': this.removeRodada(parseInt(btn.dataset.index, 10)); break;
                    case 'set-modo-palavras': this.setModoPalavras(parseInt(btn.dataset.index, 10), btn.dataset.modo); break;
                    case 'remove-participante': this.removeParticipante(parseInt(btn.dataset.index, 10), parseInt(btn.dataset.pi, 10)); break;
                    case 'add-participante': this.addParticipante(parseInt(btn.dataset.index, 10)); break;
                    case 'toggle-all-words': this.toggleAllWords(parseInt(btn.dataset.index, 10), btn.dataset.val === 'true'); break;
                    case 'set-palavra-order': {
                        e.stopPropagation();
                        const novaPos = parseInt(prompt(T('Nova posição:')) || '0');
                        this.setPalavraOrder(parseInt(btn.dataset.index, 10), btn.dataset.wordId, novaPos);
                        break;
                    }
                    case 'move-palavra-order': {
                        e.stopPropagation();
                        this.movePalavraOrder(parseInt(btn.dataset.index, 10), btn.dataset.wordId, parseInt(btn.dataset.dir, 10));
                        break;
                    }
                    case 'start-event-game': App.startEventGame(id); break;
                    case 'close-events-form-and-reload': this.closeForm('events-form-container'); this.loadEvents(); break;
                    // Backups
                    case 'restore-backup': this.restoreBackup(btn.dataset.name); break;
                    case 'delete-backup': this.deleteBackup(btn.dataset.name); break;
                }
            } catch (err) {
                console.error('Erro na delegação de eventos:', err);
            }
        });
    },

    loadSection(section) {
        this.currentSection = section;

        document.querySelectorAll('.admin-nav a, .admin-bottom-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === section);
        });

        document.querySelectorAll('.admin-section').forEach(el => {
            el.classList.remove('active');
        });
        document.getElementById(`section-${section}`)?.classList.add('active');

        switch (section) {
            case 'series': this.loadSeries(); break;
            case 'disciplinas': this.loadDisciplinas(); break;
            case 'palavras': this.loadWords(); break;
            case 'eventos': this.loadEvents(); break;
            case 'resultados-avulsos': this.loadResultadosAvulsos(); break;
            case 'resultados-eventos': this.loadResultadosEventos(); break;
            case 'settings': this.loadSettings(); break;
            case 'export': this.loadBackupInfo(); break;
            case 'admin-logs': this.loadAdminLogs(); break;
        }
    },

    closeForm(containerId) {
        const el = document.getElementById(containerId);
        if (el) {
            el.classList.add('hidden');
            el.innerHTML = '';
        }
    },

    // ===== SÉRIES =====
    loadSeries() {
        const series = Data.getSeries();
        const list = document.getElementById('series-list');
        const count = document.getElementById('series-count');

        if (count) count.textContent = `${series.length} ${T(series.length === 1 ? 'série' : 'séries')}`;

        if (!list) return;

        if (series.length === 0) {
            list.innerHTML = `<div class="card-list-empty">${T('Nenhuma série cadastrada.')}</div>`;
            return;
        }

        list.innerHTML = series.map(s => {
            const isActive = s.active !== false;
            const disciplinas = Data.getDisciplinasBySerie(s.id);
            const palavras = Data.getPalavrasBySerie(s.id);
            const turmas = Data.getTurmasBySerie(s.id);
            return `
                <div class="card-list-item serie-card ${isActive ? '' : 'serie-inactive'}">
                    <div class="card-item-info">
                        <div class="card-item-icon"><svg class="icon-lucide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
                        <div class="card-item-text">
                            <div class="card-item-name">${Utils.escapeHtml(s.nome)} ${isActive ? '' : `<span class="badge-inactive">${T('Inativa')}</span>`}</div>
                            <div class="card-item-meta">${s.professor ? Utils.escapeHtml(s.professor) + ' · ' : ''}${disciplinas.map(d => d.nome).join(', ') || T('Sem disciplinas')} · ${palavras.length} ${T('palavras')}</div>
                        </div>
                    </div>
                    <div class="card-item-actions">
                        ${isActive ? `<button class="btn-icon-sm danger" data-action="toggle-series" data-id="${s.id}" title="${T('Desativar')}" aria-label="${T('Desativar')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg></button>` : `<button class="btn-icon-sm" data-action="toggle-series" data-id="${s.id}" title="${T('Reativar')}" aria-label="${T('Reativar')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>`}
                        <button class="btn-icon-sm" data-action="edit-series" data-id="${s.id}" title="${T('Editar')}" aria-label="${T('Editar')}">${Utils.icon('edit', 14, 'icon-lucide')}</button>
                        <button class="btn-icon-sm danger" data-action="delete-series" data-id="${s.id}" title="${T('Excluir')}" aria-label="${T('Excluir')}">${Utils.icon('trash', 14, 'icon-lucide')}</button>
                    </div>
                    ${turmas.length > 0 ? `
                    <div class="serie-turmas-list">
                        ${turmas.map(t => `
                        <div class="serie-turma-item">
                            <svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <span class="serie-turma-name">${Utils.escapeHtml(t.nome)}</span>
                            ${t.professor ? `<span class="serie-turma-prof">· ${Utils.escapeHtml(t.professor)}</span>` : ''}
                            <div class="serie-turma-actions">
                                <button class="btn-icon-sm" data-action="edit-turma-inline" data-id="${t.id}" title="${T('Editar turma')}" aria-label="${T('Editar turma')}">${Utils.icon('edit', 12, 'icon-lucide')}</button>
                                <button class="btn-icon-sm danger" data-action="delete-turma-inline" data-id="${t.id}" title="${T('Excluir turma')}" aria-label="${T('Excluir turma')}">${Utils.icon('trash', 12, 'icon-lucide')}</button>
                            </div>
                        </div>`).join('')}
                    </div>` : ''}
                </div>`;
        }).join('');
    },

    showSeriesForm(id = null) {
        this.editingId = id;
        const serie = id ? Data.getSeriesById(id) : null;
        const existingTurmas = id ? Data.getTurmasBySerie(id) : [];
        const container = document.getElementById('series-form-container');
        const bulkContainer = document.getElementById('series-bulk-container');
        if (bulkContainer) { bulkContainer.classList.add('hidden'); bulkContainer.innerHTML = ''; }
        if (!container) return;

        const turmaRows = existingTurmas.map(t => `
            <div class="form-turma-row" data-turma-id="${t.id}">
                <div class="form-row">
                    <div>
                        <label>${T('Nome da Turma')}</label>
                        <input type="text" class="input-turma-name" value="${Utils.escapeHtml(t.nome)}" placeholder="${T('Ex: 8ºA')}">
                    </div>
                    <div>
                        <label>${T('Professor(a) Responsável')}</label>
                        <input type="text" class="input-turma-professor" value="${Utils.escapeHtml(t.professor || '')}" placeholder="${T('Opcional')}">
                    </div>
                </div>
                <div class="form-turma-row-actions">
                    <button class="btn-icon-sm danger" data-action="remove-form-turma-row" title="${T('Remover turma')}" aria-label="${T('Remover turma')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
            </div>`).join('');

        container.innerHTML = `
            <h3>${serie ? T('Editar Série') : T('Nova Série')}</h3>
            <div class="form-row">
                <div>
                    <label>${T('Nome da Série')}</label>
                    <input type="text" id="input-series-name" value="${Utils.escapeHtml(serie?.nome || '')}" placeholder="${T('Ex: 6º Ano')}">
                </div>
                <div>
                    <label>${T('Professor(a) Responsável')}</label>
                    <input type="text" id="input-series-professor" value="${Utils.escapeHtml(serie?.professor || '')}" placeholder="${T('Opcional')}">
                </div>
            </div>
            <div class="form-turmas-section">
                <div class="form-turmas-header">
                    <label>${T('Turmas')}</label>
                    <span class="form-turmas-hint">${T('opcional')}</span>
                </div>
                <div id="form-turmas-list">${turmaRows}</div>
                <button class="btn btn-sm btn-outline form-turmas-add" data-action="add-form-turma-row">
                    <svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    ${T('Adicionar Turma')}
                </button>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" data-action="close-form" data-container="series-form-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                <button class="btn btn-primary" data-action="save-series" data-id="${id || ''}">${Utils.icon('check', 14)} ${T('Salvar')}</button>
            </div>`;
 
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const input = document.getElementById('input-series-name');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); Admin.saveSeries(id); }
                });
            }
        }, 50);
    },

    addFormTurmaRow() {
        const list = document.getElementById('form-turmas-list');
        if (!list) return;
        const row = document.createElement('div');
        row.className = 'form-turma-row';
        row.innerHTML = `
            <div class="form-row">
                <div>
                    <label>${T('Nome da Turma')}</label>
                    <input type="text" class="input-turma-name" placeholder="${T('Ex: 8ºA')}">
                </div>
                <div>
                    <label>${T('Professor(a) Responsável')}</label>
                    <input type="text" class="input-turma-professor" placeholder="${T('Opcional')}">
                </div>
            </div>
            <div class="form-turma-row-actions">
                <button class="btn-icon-sm danger" data-action="remove-form-turma-row" title="${T('Remover turma')}" aria-label="${T('Remover turma')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>`;
        list.appendChild(row);
        row.querySelector('.input-turma-name')?.focus();
    },

    removeFormTurmaRow(btn) {
        const row = btn.closest('.form-turma-row');
        if (row) row.remove();
    },

    saveSeries(id) {
        const name = document.getElementById('input-series-name').value.trim();
        if (!name) { alert(T('Digite o nome da série.')); return; }

        const professor = document.getElementById('input-series-professor')?.value.trim() || '';

        let serieId = id;
        if (id) {
            Data.updateSeries(id, { nome: name, professor });
        } else {
            const newSerie = Data.addSeries({ nome: name, professor });
            serieId = newSerie.id;
        }

        const rows = document.querySelectorAll('#form-turmas-list .form-turma-row');
        const existingIds = new Set();

        for (const row of rows) {
            const turmaName = row.querySelector('.input-turma-name')?.value.trim();
            const professor = row.querySelector('.input-turma-professor')?.value.trim() || '';
            if (!turmaName) continue;

            const existingId = row.dataset.turmaId;
            if (existingId) {
                existingIds.add(existingId);
                Data.updateTurma(existingId, { nome: turmaName, professor });
            } else {
                Data.addTurma({ nome: turmaName, serieId, professor });
            }
        }

        if (id) {
            const oldTurmas = Data.getTurmasBySerie(id);
            for (const t of oldTurmas) {
                if (!existingIds.has(t.id)) {
                    Data.deleteTurma(t.id);
                }
            }
        }

        this.closeForm('series-form-container');
        this.loadSeries();
    },

    deleteSeries(id) {
        if (confirm(T('Tem certeza? Isso removerá todas as turmas, disciplinas e palavras vinculadas.'))) {
            Data.deleteSeries(id);
            this.loadSeries();
        }
    },

    toggleSeries(id) {
        const serie = Data.getSeriesById(id);
        const isActive = serie?.active !== false;
        if (isActive) {
            if (!confirm(T('Tem certeza que deseja desativar a série "{nome}"? Ela não aparecerá na seleção do jogador.', { nome: serie.nome }))) return;
        }
        Data.toggleSeriesActive(id);
        this.loadSeries();
    },

    // ===== SÉRIES - BULK =====
    showSeriesBulkImportForm() {
        const container = document.getElementById('series-bulk-container');
        const seriesForm = document.getElementById('series-form-container');
        if (!container) return;

        if (seriesForm) seriesForm.classList.add('hidden');

        container.innerHTML = `
            <h3>${T('Acrescentar Séries em Lote')}</h3>
            <div class="bulk-table-wrapper">
                <table class="bulk-import-table">
                    <thead>
                        <tr>
                            <th style="width:18%;text-align:center">${T('Série')} *</th>
                            <th style="width:14%;text-align:center">${T('Professor(a)')}</th>
                            <th style="text-align:center">${T('Turmas')}</th>
                            <th style="width:40px"></th>
                        </tr>
                    </thead>
                    <tbody id="bulk-series-tbody">
                    </tbody>
                </table>
            </div>
            <div class="bulk-actions">
                <button class="btn btn-secondary" data-action="add-series-bulk-row">
                    ${Utils.icon('plus', 14)}
                    ${T('Adicionar Série')}
                </button>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" data-action="close-form" data-container="series-bulk-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                    <button class="btn btn-primary" data-action="save-bulk-series">
                        ${Utils.icon('save', 14)}
                        ${T('Salvar Todas')}
                    </button>
                </div>
            </div>`;

        container.classList.remove('hidden');

        this._seriesBulkRowCounter = 0;
        for (let i = 0; i < 3; i++) this.addSeriesBulkRow();
    },

    addSeriesBulkRow() {
        const tbody = document.getElementById('bulk-series-tbody');
        if (!tbody) return;

        const idx = this._seriesBulkRowCounter++;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="bulk-input" data-field="nome" placeholder="${T('Ex: 6º Ano')}"></td>
            <td><input type="text" class="bulk-input" data-field="professor" placeholder="${T('Opcional')}"></td>
            <td>
                <div class="bulk-turmas-cell">
                    <div class="bulk-turma-row">
                        <input type="text" class="bulk-input" data-field="turma-nome" placeholder="${T('Ex: 8ºA')}">
                        <input type="text" class="bulk-input" data-field="turma-prof" placeholder="${T('Prof(a)')}">
                        ${Utils.removeRowButton(T('Remover turma'), 12, 'remove-bulk-turma-row')}
                    </div>
                    <button class="btn btn-sm btn-outline" data-action="add-bulk-turma-row" style="margin-top:4px">
                        ${Utils.icon('plus', 12)}
                        ${T('Turma')}
                    </button>
                </div>
            </td>
            <td>
                ${Utils.removeRowButton(T('Remover série'))}
            </td>`;
        tbody.appendChild(row);
    },

    addBulkTurmaRow(btn) {
        const cell = btn.closest('.bulk-turmas-cell');
        const div = document.createElement('div');
        div.className = 'bulk-turma-row';
        div.innerHTML = `
            <input type="text" class="bulk-input" data-field="turma-nome" placeholder="${T('Ex: 8ºA')}">
            <input type="text" class="bulk-input" data-field="turma-prof" placeholder="${T('Prof(a)')}">
            ${Utils.removeRowButton(T('Remover turma'), 12, 'remove-bulk-turma-row')}`;
        cell.insertBefore(div, btn);
    },

    removeBulkTurmaRow(btn) {
        const row = btn.closest('.bulk-turma-row');
        if (row) row.remove();
    },

    saveBulkSeries() {
        const tbody = document.getElementById('bulk-series-tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const toSave = [];

        rows.forEach(row => {
            const nome = row.querySelector('[data-field="nome"]')?.value.trim();
            if (!nome) return;

            const professor = row.querySelector('[data-field="professor"]')?.value.trim() || '';
            const turmaRows = row.querySelectorAll('.bulk-turma-row');
            const turmas = [];
            turmaRows.forEach(t => {
                const tn = t.querySelector('[data-field="turma-nome"]')?.value.trim();
                if (tn) {
                    turmas.push({ nome: tn, professor: t.querySelector('[data-field="turma-prof"]')?.value.trim() || '' });
                }
            });

            toSave.push({ nome, professor, turmas });
        });

        if (toSave.length === 0) {
            alert(T('Nenhuma série válida preenchida.\nPreencha pelo menos uma linha com o nome da Série.'));
            return;
        }

        const hasEmpty = tbody.querySelectorAll('tr').length > 0 && toSave.length < tbody.querySelectorAll('tr').length;
        if (hasEmpty) {
            if (!confirm(T('{n} de {total} linhas serão salvas.\nLinhas sem nome de série serão ignoradas.\nContinuar?', { n: toSave.length, total: tbody.querySelectorAll('tr').length }))) return;
        }

        let saved = 0;
        for (const item of toSave) {
            try {
                const newSerie = Data.addSeries({ nome: item.nome, professor: item.professor });
                saved++;
                for (const t of item.turmas) {
                    Data.addTurma({ nome: t.nome, serieId: newSerie.id, professor: t.professor || item.professor });
                }
            } catch (e) {
                console.error('Erro ao salvar série:', item.nome, e);
            }
        }

        this.closeForm('series-bulk-container');
        this.loadSeries();
        alert(T('{n} série(s) adicionada(s) com sucesso!', { n: saved }));
    },

    // ===== TURMAS (dentro de Séries) =====
    async deleteTurmaFromSerie(id) {
        if (confirm(T('Tem certeza que deseja excluir esta turma?'))) {
            Data.deleteTurma(id);
            this.loadSeries();
        }
    },

    showTurmaForm(id = null) {
        this.editingId = id;
        const turma = id ? Data.getTurmaById(id) : null;
        const container = document.getElementById('series-form-container');
        if (!container || !turma) return;

        container.innerHTML = `
            <h3>${T('Editar Turma — {nome}', { nome: Utils.escapeHtml(turma.nome) })}</h3>
            <div class="form-row">
                <div>
                    <label>${T('Nome da Turma')}</label>
                    <input type="text" id="input-turma-name" value="${Utils.escapeHtml(turma.nome)}" placeholder="${T('Ex: 8ºA')}">
                </div>
                <div>
                    <label>${T('Professor(a) Responsável')}</label>
                    <input type="text" id="input-turma-professor" value="${Utils.escapeHtml(turma.professor || '')}" placeholder="${T('Nome do professor')}">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" data-action="close-form" data-container="series-form-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                <button class="btn btn-primary" data-action="save-turma" data-id="${id}">${Utils.icon('check', 14)} ${T('Salvar')}</button>
            </div>`;

        container.classList.remove('hidden');
    },

    saveTurma(id) {
        const name = document.getElementById('input-turma-name').value.trim();
        const professor = document.getElementById('input-turma-professor').value.trim();

        if (!name) { alert(T('Preencha o nome da turma.')); return; }

        Data.updateTurma(id, { nome: name, professor });
        this.closeForm('series-form-container');
        this.loadSeries();
    },

    // Resolve as imagens salvas em disco (OPFS) dos cards da lista de palavras.
    // Usa IntersectionObserver para só buscar a imagem quando o card estiver
    // perto de aparecer na tela — evita carregar centenas de imagens de uma vez
    // só se o banco de palavras for grande.
    _resolveCardImages(container) {
        const imgs = container.querySelectorAll('.card-item-img[data-disk]');
        if (imgs.length === 0) return;

        const resolveOne = async (img) => {
            const diskPath = img.getAttribute('data-disk');
            if (diskPath) {
                const src = await Utils.resolveImagePath(diskPath);
                if (src) img.src = src;
            }
        };

        if (!('IntersectionObserver' in window)) {
            // Navegador sem suporte: resolve tudo de uma vez, como antes.
            imgs.forEach(resolveOne);
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                obs.unobserve(entry.target);
                resolveOne(entry.target);
            });
        }, { rootMargin: '300px' }); // começa a carregar um pouco antes de entrar na tela

        imgs.forEach(img => observer.observe(img));
    },

    // ===== DISCIPLINAS =====
    loadDisciplinas() {
        const disciplinas = Data.getDisciplinas().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        const list = document.getElementById('disciplinas-list');
        const count = document.getElementById('disciplinas-count');

        if (count) count.textContent = `${disciplinas.length} ${T(disciplinas.length === 1 ? 'disciplina' : 'disciplinas')}`;

        if (!list) return;

        if (disciplinas.length === 0) {
            list.innerHTML = `<div class="card-list-empty">${T('Nenhuma disciplina cadastrada.')}</div>`;
            return;
        }

        list.innerHTML = disciplinas.map(d => {
            const seriesNames = d.seriesIds?.map(sid => Data.getSeriesById(sid)?.nome).filter(Boolean).join(', ') || '-';
            const palavras = Data.getPalavras().filter(p => p.disciplinaId === d.id);

            return `
                <div class="card-list-item">
                    <div class="card-item-info">
                        <div class="card-item-icon blue"><svg class="icon-lucide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>
                        <div class="card-item-text">
                            <div class="card-item-name">${Utils.escapeHtml(d.nome)}</div>
                            <div class="card-item-meta">${Utils.escapeHtml(seriesNames)} · ${palavras.length} ${T('palavras')}</div>
                        </div>
                    </div>
                    <div class="card-item-actions">
                        <button class="btn-icon-sm" data-action="edit-disciplina" data-id="${d.id}" title="${T('Editar')}" aria-label="${T('Editar')}">${Utils.icon('edit', 14, 'icon-lucide')}</button>
                        <button class="btn-icon-sm danger" data-action="delete-disciplina" data-id="${d.id}" title="${T('Excluir')}" aria-label="${T('Excluir')}">${Utils.icon('trash', 14, 'icon-lucide')}</button>
                    </div>
                </div>`;
        }).join('');
    },

    showDisciplinaForm(id = null) {
        this.editingId = id;
        const disciplina = id ? Data.getDisciplinaById(id) : null;
        const series = Data.getSeries();
        const container = document.getElementById('disciplinas-form-container');
        const bulkContainer = document.getElementById('disciplinas-bulk-container');
        if (bulkContainer) { bulkContainer.classList.add('hidden'); bulkContainer.innerHTML = ''; }
        if (!container) return;

        container.innerHTML = `
            <h3>${disciplina ? T('Editar Disciplina') : T('Nova Disciplina')}</h3>
            <div class="form-row single">
                <div>
                    <label>${T('Nome da Disciplina')}</label>
                    <input type="text" id="input-disciplina-name" value="${Utils.escapeHtml(disciplina?.nome || '')}" placeholder="${T('Ex: Matemática')}">
                </div>
            </div>
            <div class="form-row single">
                <div>
                    <label>${T('Séries Vinculadas')}</label>
                    <div class="form-checkbox-group">
                        ${series.map(s => `
                            <label class="form-checkbox-label">
                                <input type="checkbox" name="series" value="${s.id}" ${disciplina?.seriesIds?.includes(s.id) ? 'checked' : ''}>
                                ${Utils.escapeHtml(s.nome)}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" data-action="close-form" data-container="disciplinas-form-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                <button class="btn btn-primary" data-action="save-disciplina" data-id="${id || ''}">${Utils.icon('check', 14)} ${T('Salvar')}</button>
            </div>`;

        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const input = document.getElementById('input-disciplina-name');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); Admin.saveDisciplina(id); }
                });
            }
        }, 50);
    },

    saveDisciplina(id) {
        const name = document.getElementById('input-disciplina-name').value.trim();
        const seriesIds = Array.from(document.querySelectorAll('input[name="series"]:checked')).map(cb => cb.value);

        if (!name) { alert(T('Digite o nome da disciplina.')); return; }
        if (seriesIds.length === 0) { alert(T('Selecione pelo menos uma série.')); return; }

        if (id) {
            Data.updateDisciplina(id, { nome: name, seriesIds });
        } else {
            Data.addDisciplina({ nome: name, seriesIds });
        }

        this.closeForm('disciplinas-form-container');
        this.loadDisciplinas();
    },

    deleteDisciplina(id) {
        if (confirm(T('Tem certeza? Isso removerá todas as palavras vinculadas.'))) {
            Data.deleteDisciplina(id);
            this.loadDisciplinas();
        }
    },

    // ===== DISCIPLINAS - BULK =====
    showDisciplinaBulkImportForm() {
        const container = document.getElementById('disciplinas-bulk-container');
        const discForm = document.getElementById('disciplinas-form-container');
        if (!container) return;

        if (discForm) discForm.classList.add('hidden');

        const series = Data.getSeries();

        container.innerHTML = `
            <h3>${T('Acrescentar Disciplinas em Lote')}</h3>
            <div class="bulk-table-wrapper">
                <table class="bulk-import-table">
                    <thead>
                        <tr>
                            <th style="text-align:center">${T('Disciplina')} *</th>
                            <th style="text-align:center">${T('Séries Vinculadas')} *</th>
                            <th style="width:40px"></th>
                        </tr>
                    </thead>
                    <tbody id="bulk-disciplinas-tbody">
                    </tbody>
                </table>
            </div>
            <div class="bulk-actions">
                <button class="btn btn-secondary" data-action="add-disciplina-bulk-row">
                    ${Utils.icon('plus', 14)}
                    ${T('Adicionar Disciplina')}
                </button>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" data-action="close-form" data-container="disciplinas-bulk-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                    <button class="btn btn-primary" data-action="save-bulk-disciplinas">
                        ${Utils.icon('save', 14)}
                        ${T('Salvar Todas')}
                    </button>
                </div>
            </div>`;

        container.classList.remove('hidden');

        this._disciplinaBulkRowCounter = 0;
        for (let i = 0; i < 3; i++) this.addDisciplinaBulkRow();
    },

    addDisciplinaBulkRow() {
        const tbody = document.getElementById('bulk-disciplinas-tbody');
        if (!tbody) return;

        const idx = this._disciplinaBulkRowCounter++;
        const series = Data.getSeries();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="bulk-input" data-field="nome" placeholder="${T('Ex: Matemática')}"></td>
            <td>
                <select multiple class="bulk-select" data-field="seriesIds" style="min-height:80px">
                    ${series.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.nome)}</option>`).join('')}
                </select>
            </td>
            <td>
                ${Utils.removeRowButton(T('Remover disciplina'))}
            </td>`;
        tbody.appendChild(row);
    },

    saveBulkDisciplinas() {
        const tbody = document.getElementById('bulk-disciplinas-tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const toSave = [];

        rows.forEach(row => {
            const nome = row.querySelector('[data-field="nome"]')?.value.trim();
            if (!nome) return;

            const select = row.querySelector('[data-field="seriesIds"]');
            const seriesIds = select ? Array.from(select.selectedOptions).map(o => o.value) : [];

            toSave.push({ nome, seriesIds });
        });

        if (toSave.length === 0) {
            alert(T('Nenhuma disciplina válida preenchida.\nPreencha pelo menos uma linha com o nome da Disciplina.'));
            return;
        }

        const hasEmpty = tbody.querySelectorAll('tr').length > 0 && toSave.length < tbody.querySelectorAll('tr').length;
        if (hasEmpty) {
            if (!confirm(T('{n} de {total} linhas serão salvas.\nLinhas sem nome de disciplina serão ignoradas.\nContinuar?', { n: toSave.length, total: tbody.querySelectorAll('tr').length }))) return;
        }

        let saved = 0;
        for (const item of toSave) {
            try {
                if (item.seriesIds.length === 0) {
                    if (!confirm(T('Disciplina "{nome}" não tem séries vinculadas. Deseja ignorá-la?', { nome: item.nome }))) continue;
                    continue;
                }
                Data.addDisciplina({ nome: item.nome, seriesIds: item.seriesIds });
                saved++;
            } catch (e) {
                console.error('Erro ao salvar disciplina:', item.nome, e);
            }
        }

        this.closeForm('disciplinas-bulk-container');
        this.loadDisciplinas();
        alert(T('{n} disciplina(s) adicionada(s) com sucesso!', { n: saved }));
    },

    // ===== PALAVRAS =====
    loadWords() {
        const palavras = Data.getPalavras();
        const seriesComPalavras = new Set(palavras.map(p => p.serieId));
        const series = Data.getSeries().filter(s => seriesComPalavras.has(s.id));
        const filterSeries = document.getElementById('filter-series');
        const filterDisciplina = document.getElementById('filter-disciplina');

        if (filterSeries) {
            filterSeries.innerHTML = `<option value="">${T('Todas as Séries')}</option>` +
                series.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.nome)}</option>`).join('');
        }

        this.loadWordsFilterDisciplinas();

        if (filterDisciplina) filterDisciplina.value = '';

        this.renderWords();
    },

    loadWordsFilterDisciplinas() {
        const palavras = Data.getPalavras();
        const filterSeries = document.getElementById('filter-series')?.value;
        const filterDisciplina = document.getElementById('filter-disciplina');
        if (!filterDisciplina) return;

        const disciplinas = Data.getDisciplinas()
            .filter(d => {
                if (filterSeries) {
                    return palavras.some(p => p.serieId === filterSeries && p.disciplinaId === d.id);
                }
                return palavras.some(p => p.disciplinaId === d.id);
            })
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        filterDisciplina.innerHTML = `<option value="">${T('Todas as Disciplinas')}</option>` +
            disciplinas.map(d => `<option value="${d.id}">${Utils.escapeHtml(d.nome)}</option>`).join('');
    },

    renderWords() {
        const filterSeries = document.getElementById('filter-series')?.value;
        const filterDisciplina = document.getElementById('filter-disciplina')?.value;

        let palavras = Data.getPalavras();
        if (filterSeries) palavras = palavras.filter(p => p.serieId === filterSeries);
        if (filterDisciplina) palavras = palavras.filter(p => p.disciplinaId === filterDisciplina);

        const list = document.getElementById('words-list');
        const count = document.getElementById('words-count');

        if (count) count.textContent = `${palavras.length} ${T(palavras.length === 1 ? 'palavra' : 'palavras')}`;

        if (!list) return;

        if (palavras.length === 0) {
            list.innerHTML = `<div class="card-list-empty">${T('Nenhuma palavra encontrada.')}</div>`;
            return;
        }

        list.innerHTML = palavras.map(p => {
            const serie = Data.getSeriesById(p.serieId);
            const disciplina = Data.getDisciplinaById(p.disciplinaId);
            const isDisk = p.imagem && p.imagem.startsWith('disk:');

            return `
                <div class="card-list-item">
                    ${p.imagem ? `<span class="card-item-img-wrap" data-action="crop-word" data-id="${p.id}" title="${T('Ajustar imagem')}"><img class="card-item-img" src="${isDisk ? '' : p.imagem}" data-disk="${isDisk ? p.imagem : ''}" style="${this.cropStyle(p.crop)}" alt="" loading="lazy" decoding="async"></span>` : ''}
                    <div class="card-item-info">
                        ${!p.imagem ? '<div class="card-item-icon purple"><svg class="icon-lucide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M17 18H3"/></svg></div>' : ''}
                        <div class="card-item-text">
                            <div class="card-item-name">${Utils.escapeHtml(p.texto)}</div>
                            <div class="card-item-meta">${p.dica ? Utils.escapeHtml(p.dica) + ' · ' : ''}${Utils.escapeHtml(serie?.nome || '-')} · ${Utils.escapeHtml(disciplina?.nome || '-')}</div>
                        </div>
                    </div>
                    <div class="card-item-actions">
                        <button class="btn-icon-sm" data-action="edit-word" data-id="${p.id}" title="${T('Editar')}" aria-label="${T('Editar')}">${Utils.icon('edit', 14, 'icon-lucide')}</button>
                        <button class="btn-icon-sm danger" data-action="delete-word" data-id="${p.id}" title="${T('Excluir')}" aria-label="${T('Excluir')}">${Utils.icon('trash', 14, 'icon-lucide')}</button>
                    </div>
                </div>`;
        }).join('');

        this._resolveCardImages(list);
    },

    // Bloco de upload/preview de imagem do formulário de palavra (usado por showWordForm).
    _buildWordImageUploadHtml(palavra, id) {
        return `
                    <div class="image-upload-row">
                        <div class="image-upload-preview" id="image-upload-preview" data-action="crop-word" data-id="${id || ''}" title="${T('Ajustar imagem')}">
                            ${palavra?.imagem ? `<img src="${palavra.imagem}" alt="preview">` : ''}
                        </div>
                        <div style="display:flex;flex-direction:column;gap:0.75rem;align-self:flex-start">
                            <label for="input-word-image" class="btn btn-secondary btn-small image-upload-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span id="image-upload-label">${T('Carregar Imagem')}</span>
                            </label>
                            <button type="button" class="btn btn-secondary btn-small" data-action="remove-word-image" id="btn-remove-word-image" ${palavra?.imagem ? '' : 'style="display:none"'}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                ${T('Remover imagem')}
                            </button>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:0.75rem;flex:1;min-width:0">
                            <input type="url" id="input-word-image-url" placeholder="${T('Ou cole o link de uma imagem da internet')}" class="image-link-input">
                            <button type="button" class="btn btn-secondary btn-small" data-action="preview-image-url" style="align-self:flex-end">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                ${T('Visualizar')}
                            </button>
                        </div>
                    </div>
                    <input type="file" id="input-word-image" accept="image/*" style="display:none" onchange="Admin.previewImage(this)">`;
    },

    showWordForm(id = null) {
        const palavra = id ? Data.getPalavras().find(p => p.id === id) : null;
        const series = Data.getSeries();
        const container = document.getElementById('words-form-container');
        if (!container) return;

        container.innerHTML = `
            <h3>${palavra ? T('Editar Palavra') : T('Nova Palavra')}</h3>
            <div class="form-row">
                <div>
                    <label>${T('Palavra')} *</label>
                    <input type="text" id="input-word-text" value="${Utils.escapeHtml(palavra?.texto || '')}" placeholder="${T('Ex: AÇÃO')}" style="text-transform: uppercase;">
                </div>
                <div>
                    <label>${T('Dica')}</label>
                    <input type="text" id="input-word-hint" value="${Utils.escapeHtml(palavra?.dica || '')}" placeholder="${T('Ex: Ato de fazer')}">
                </div>
            </div>
            <div class="form-row">
                <div>
                    <label>${T('Série')} *</label>
                    <select id="select-word-series" onchange="Admin.updateDisciplinasForSeries()">
                        <option value="">${T('Selecione...')}</option>
                        ${series.map(s => `<option value="${s.id}" ${palavra?.serieId === s.id ? 'selected' : ''}>${Utils.escapeHtml(s.nome)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>${T('Disciplina')} *</label>
                    <select id="select-word-disciplina">
                        <option value="">${T('Selecione a série primeiro...')}</option>
                    </select>
                </div>
            </div>
            <div class="form-row single">
                <div>
                    <label>${T('Imagem Ilustrativa')}</label>
                    ${this._buildWordImageUploadHtml(palavra, id)}
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" data-action="close-form" data-container="words-form-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                <button class="btn btn-primary" data-action="save-word" data-id="${id || ''}">${Utils.icon('check', 14)} ${T('Salvar')}</button>
            </div>`;

        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.editingId = id;

        if (palavra?.serieId) {
            setTimeout(() => this.updateDisciplinasForSeries(palavra.disciplinaId), 50);
        }
        if (palavra?.imagem) {
            this._applyPreviewCrop(id);
        }
        setTimeout(() => {
            document.getElementById('input-word-image-url')?.addEventListener('input', () => {
                this._pendingCrop = null;
            });
        }, 50);
    },

    previewImage(input) {
        const preview = document.getElementById('image-upload-preview');
        const label = document.getElementById('image-upload-label');
        if (!preview || !input.files?.[0]) return;

        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="preview">`;
            if (label) label.textContent = T('Trocar Imagem');
            const btn = document.getElementById('btn-remove-word-image');
            if (btn) btn.style.display = '';
            Admin.clearWordImageFlag();
            Admin._pendingCrop = null;
        };
        reader.readAsDataURL(file);
    },

    previewImageUrl() {
        const url = document.getElementById('input-word-image-url')?.value.trim();
        const preview = document.getElementById('image-upload-preview');
        const label = document.getElementById('image-upload-label');
        if (!url || !preview) return;

        const img = new Image();
        img.onload = () => {
            preview.innerHTML = `<img src="${url}" alt="preview">`;
            if (label) label.textContent = T('Imagem da Web');
            const btn = document.getElementById('btn-remove-word-image');
            if (btn) btn.style.display = '';
            Admin.clearWordImageFlag();
            Admin._pendingCrop = null;
        };
        img.onerror = () => alert(T('Não foi possível carregar a imagem desta URL.'));
        img.src = url;
    },

    removeWordImage() {
        if (!confirm(T('Remover esta imagem?'))) return;
        this._pendingCrop = null;
        const preview = document.getElementById('image-upload-preview');
        const label = document.getElementById('image-upload-label');
        const urlInput = document.getElementById('input-word-image-url');
        const fileInput = document.getElementById('input-word-image');
        if (preview) preview.innerHTML = '';
        if (label) label.textContent = T('Carregar Imagem');
        if (urlInput) urlInput.value = '';
        if (fileInput) fileInput.value = '';
        const btn = document.getElementById('btn-remove-word-image');
        if (btn) btn.style.display = 'none';
        const flag = document.getElementById('input-word-image-removed');
        if (!flag) {
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = 'input-word-image-removed';
            hidden.value = '1';
            document.getElementById('image-upload-preview')?.parentElement?.appendChild(hidden);
        }
    },

    clearWordImageFlag() {
        const flag = document.getElementById('input-word-image-removed');
        if (flag) flag.remove();
    },

    cropStyle(crop) {
        const z = crop?.zoom || 1;
        const x = crop?.x != null ? crop.x : 50;
        const y = crop?.y != null ? crop.y : 50;
        return `object-fit:cover;object-position:${x}% ${y}%;transform:scale(${z});transform-origin:${x}% ${y}%;`;
    },

    async _applyPreviewCrop(wordId) {
        const preview = document.getElementById('image-upload-preview');
        const img = preview?.querySelector('img');
        if (!preview || !img) return;
        const palavra = wordId ? Data.getPalavras().find(p => p.id === wordId) : null;
        if (palavra?.imagem && palavra.imagem.startsWith('disk:')) {
            const src = await Utils.resolveImagePath(palavra.imagem);
            if (src) img.src = src;
        }
        const crop = (this._pendingCrop && this._pendingCrop.wordId === wordId) ? this._pendingCrop.crop : (palavra?.crop || null);
        if (crop) {
            img.style.objectFit = 'cover';
            img.style.objectPosition = `${crop.x}% ${crop.y}%`;
            img.style.transform = `scale(${crop.zoom})`;
            img.style.transformOrigin = `${crop.x}% ${crop.y}%`;
        }
    },

    async openCropModal(src, wordId) {
        const modal = document.getElementById('modal-crop');
        const img = document.getElementById('crop-img');
        if (!modal || !img) return;
        if (!src) {
            const palavra = wordId ? Data.getPalavras().find(p => p.id === wordId) : null;
            if (palavra?.imagem) src = palavra.imagem;
        }
        if (src && src.startsWith('disk:')) {
            const resolved = await Utils.resolveImagePath(src);
            if (resolved) src = resolved;
        }
        if (!src) { alert(T('Nenhuma imagem para ajustar.')); return; }

        const existing = wordId ? Data.getPalavras().find(p => p.id === wordId) : null;
        const pending = (this._pendingCrop && this._pendingCrop.wordId === wordId) ? this._pendingCrop.crop : null;
        const crop = pending || existing?.crop || null;
        this._cropState = {
            wordId,
            zoom: crop?.zoom || 1,
            x: crop?.x != null ? crop.x : 50,
            y: crop?.y != null ? crop.y : 50,
            imgW: 0,
            imgH: 0
        };
        img.onload = () => {
            this._cropState.imgW = img.naturalWidth || 0;
            this._cropState.imgH = img.naturalHeight || 0;
            this._applyCropState();
        };
        img.src = src;
        modal.classList.remove('hidden');
        this._applyCropState();
    },

    closeCropModal() {
        const modal = document.getElementById('modal-crop');
        const img = document.getElementById('crop-img');
        if (modal) modal.classList.add('hidden');
        if (img) { img.onload = null; img.removeAttribute('src'); }
        this._cropState = null;
    },

    _applyCropState() {
        const s = this._cropState;
        const img = document.getElementById('crop-img');
        const range = document.getElementById('crop-zoom-range');
        if (!s || !img) return;
        img.style.objectFit = 'cover';
        img.style.objectPosition = `${s.x}% ${s.y}%`;
        img.style.transform = `scale(${s.zoom})`;
        img.style.transformOrigin = `${s.x}% ${s.y}%`;
        if (range) range.value = Math.round(s.zoom * 100);
    },

    _zoomCrop(delta) {
        if (!this._cropState) return;
        this._cropState.zoom = Math.min(3, Math.max(1, Math.round((this._cropState.zoom + delta) * 20) / 20));
        this._applyCropState();
    },

    _onCropPointerDown(e) {
        const s = this._cropState;
        const frame = document.getElementById('crop-frame');
        const img = document.getElementById('crop-img');
        if (!s || !frame || !img || !s.imgW) return;
        e.preventDefault();
        const Wc = frame.clientWidth;
        const Hc = frame.clientHeight;
        const coverScale = Math.max(Wc / s.imgW, Hc / s.imgH);
        const scale = s.zoom * coverScale;
        const renderW = s.imgW * scale;
        const renderH = s.imgH * scale;
        const startX = s.x;
        const startY = s.y;
        const startPX = e.clientX;
        const startPY = e.clientY;
        const move = (ev) => {
            const dx = ev.clientX - startPX;
            const dy = ev.clientY - startPY;
            let nx = startX;
            let ny = startY;
            if (renderW > Wc) nx = startX + (dx / (Wc - renderW)) * 100;
            if (renderH > Hc) ny = startY + (dy / (Hc - renderH)) * 100;
            s.x = Math.max(0, Math.min(100, nx));
            s.y = Math.max(0, Math.min(100, ny));
            this._applyCropState();
        };
        const up = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    },

    saveCrop() {
        const s = this._cropState;
        if (!s) return;
        const crop = { zoom: Math.round(s.zoom * 100) / 100, x: Math.round(s.x * 10) / 10, y: Math.round(s.y * 10) / 10 };
        this._pendingCrop = { wordId: s.wordId, crop };
        if (s.wordId) Data.updatePalavra(s.wordId, { crop });
        this.closeCropModal();
        this._applyPreviewCrop(s.wordId);
        this.renderWords();
    },

    onImportFileSelected(input) {
        const label = document.getElementById('import-file-label');
        if (input.files?.[0]) {
            if (label) label.textContent = input.files[0].name;
        } else {
            if (label) label.textContent = T('Selecionar Arquivo');
        }
    },

    async connectSystemFolder() {
        // IMPORTANTE: showDirectoryPicker() só funciona se chamado bem na
        // sequência do clique do usuário, sem nenhum "await" assíncrono antes
        // (o navegador recusa por segurança, silenciosamente, se demorar).
        // Por isso usamos o cache síncrono (Utils._systemRootCache, já
        // atualizado por refreshSystemFolderStatus) em vez de reconsultar o
        // IndexedDB aqui.
        const connected = !!Utils._systemRootCache;

        if (connected) {
            const nomeAtual = Utils._systemRootCache.name;
            if (!confirm(T('A pasta do sistema atual é "{nome}". Deseja trocar para outra pasta?', { nome: nomeAtual }))) {
                return;
            }
        }

        const result = await Data.connectSystemFolder(true);

        if (result && result !== 'not-found') {
            alert(T('Pasta conectada: {nome}. As imagens serão salvas em {nome}\\img com o nome SerieDisciplinaPalavra.ext.', { nome: result }));
        } else if (result === 'not-found') {
            alert(T('Não encontrei a pasta do projeto. Escolha a pasta "soletrando", que é a que contém as pastas css, js e img.'));
        }
        this.refreshSystemFolderStatus();
    },

    async refreshSystemFolderStatus() {
        const btn = document.getElementById('btn-connect-folder');
        if (!btn) return;
        const label = document.getElementById('connect-folder-label');
        let connected = false;
        try {
            const root = await Utils.ProjectDB.load('backup_root');
            if (root) {
                const perm = await root.queryPermission({ mode: 'readwrite' });
                if (perm === 'granted') {
                    const hasDir = async (n) => {
                        try { await root.getDirectoryHandle(n); return true; } catch { return false; }
                    };
                    if (await hasDir('img') || await hasDir('js')) {
                        Utils._systemRootCache = root;
                        connected = true;
                        btn.title = T('Pasta do sistema: {nome}. Clique para trocar de pasta.', { nome: root.name });
                    } else {
                        btn.title = T('A pasta conectada não é a pasta do projeto. Clique para escolher outra.');
                    }
                }
            }
        } catch (e) { console.warn(e); }
        btn.classList.toggle('connected', connected);
        btn.classList.toggle('disconnected', !connected);
        if (label) label.textContent = connected ? T('Pasta do sistema sincronizada') : T('Conectar Pasta do Sistema');
    },

    // ===== MIGRAÇÃO DE IMAGENS PARA A PASTA img =====
    _getMigrationStats() {
        const palavras = Data.getPalavras().filter(p => p.imagem);
        const palavrasFora = palavras.filter(p => !p.imagem.startsWith('disk:'));
        return {
            palavrasComImagem: palavras.length,
            palavrasFora: palavrasFora.length,
            totalFora: palavrasFora.length
        };
    },

    async openMigrateModal() {
        const root = await Utils._getSystemRootHandle(true);
        if (!root) {
            alert(T('Conecte a Pasta do Sistema primeiro para poder salvar as imagens em "img".'));
            return;
        }
        const s = this._getMigrationStats();
        const statsEl = document.getElementById('migrate-stats');
        const summaryEl = document.getElementById('migrate-summary');
        const btnStart = document.getElementById('btn-migrate-start');

        if (statsEl) {
            statsEl.innerHTML = [
                `<div class="migrate-stat-card"><span class="migrate-stat-value">${s.palavrasComImagem}</span><span class="migrate-stat-label">${T('Palavras com imagem')}</span></div>`,
                `<div class="migrate-stat-card ${s.totalFora > 0 ? 'outside' : 'ok'}"><span class="migrate-stat-value">${s.totalFora}</span><span class="migrate-stat-label">${T('Imagens fora da pasta do sistema')}</span></div>`
            ].join('');
        }

        if (summaryEl) {
            if (s.totalFora > 0) {
                summaryEl.className = 'migrate-summary warn';
                summaryEl.innerHTML = T('<strong>{n}</strong> imagem(ns) ainda estão fora da pasta do sistema (<code>img</code>). Clique em "Migrar agora" para copiá-las para a pasta e passá-las a usar de lá.', { n: s.totalFora });
            } else {
                summaryEl.className = 'migrate-summary ok';
                summaryEl.innerHTML = T('Todas as imagens já estão na pasta do sistema (<code>img</code>). Nada a migrar.');
            }
        }

        if (btnStart) {
            if (!btnStart.dataset.originalHtml) btnStart.dataset.originalHtml = btnStart.innerHTML;
            btnStart.style.display = s.totalFora > 0 ? '' : 'none';
            btnStart.disabled = false;
            btnStart.innerHTML = btnStart.dataset.originalHtml;
        }

        document.getElementById('modal-migrate')?.classList.remove('hidden');
    },

    closeMigrateModal() {
        document.getElementById('modal-migrate')?.classList.add('hidden');
    },

    async migrateImagesToFolder() {
        const root = await Utils._getSystemRootHandle(true);
        if (!root) {
            alert(T('Conecte a Pasta do Sistema primeiro para poder salvar as imagens em "img".'));
            return;
        }

        const btnStart = document.getElementById('btn-migrate-start');
        if (btnStart) {
            if (!btnStart.dataset.originalHtml) btnStart.dataset.originalHtml = btnStart.innerHTML;
            btnStart.disabled = true;
            btnStart.innerHTML = T('Migrando...');
        }

        let migrated = 0, skipped = 0, failed = 0;
        const failures = [];

        const palavras = Data.getPalavras().filter(p => p.imagem);
        for (const p of palavras) {
            const label = T('Palavra "{nome}"', { nome: p.texto });
            if (p.imagem.startsWith('disk:')) {
                skipped++;
                Data.addAdminLog('migrar', 'Imagens', `${label}: já estava em img (${p.imagem.slice(5)})`);
                continue;
            }
            const res = await this._migrateImageToDisk(p.imagem, { tipo: 'palavra', serieId: p.serieId, disciplinaId: p.disciplinaId, nome: p.texto });
            if (res.disk) {
                Data.updatePalavra(p.id, { imagem: res.disk });
                migrated++;
                Data.addAdminLog('migrar', 'Imagens', `${label}: sucesso — copiada como ${res.disk.slice(5)}`);
            } else {
                failed++;
                failures.push(`${label}: ${res.error}`);
                Data.addAdminLog('migrar', 'Imagens', `${label}: erro — ${res.error}`);
            }
        }

        Data.addAdminLog('migrar', 'Imagens', T('Resumo da migração para "img": {n} copiada(s), {m} já existente(s), {p} com erro{erros}', { n: migrated, m: skipped, p: failed, erros: failures.length ? ':\n- ' + failures.join('\n- ') : '' }));

        if (btnStart) {
            btnStart.disabled = false;
            btnStart.innerHTML = btnStart.dataset.originalHtml;
        }
        const detail = failures.length
            ? T('\n\nFicaram como estavam:\n- {erros}{mais}', { erros: failures.slice(0, 12).join('\n- '), mais: failures.length > 12 ? '\n…' : '' })
            : '';
        alert(T('Migração concluída!\n\nCopiadas para "img": {n}\nJá estavam em "img": {m}\nFalhas: {p}{detalhe}', { n: migrated, m: skipped, p: failed, detalhe: detail }));
        this.renderWords?.();
        this.loadAdminLogs?.();
        this.openMigrateModal();
    },

    async _migrateImageToDisk(imagem, ctx) {
        const serie = Data.getSeriesById(ctx.serieId);
        if (!serie) return { error: T('série não encontrada') };

        let file = null;
        let error = null;
        if (imagem.startsWith('data:')) {
            const ext = (imagem.match(/^data:image\/([^;]+)/) || [])[1] || 'png';
            try {
                file = await Utils.dataUrlToFile(imagem, 'imagem.' + ext);
            } catch (e) {
                error = T('imagem embutida inválida: {msg}', { msg: e.message || e });
            }
        } else if (/^https?:\/\//i.test(imagem)) {
            file = await Utils.downloadImageAsFile(imagem);
            if (!file) error = T('download falhou (CORS ou link inválido)');
        } else {
            error = T('tipo de imagem não reconhecido');
        }
        if (error || !file) return { error: error || T('não foi possível obter o arquivo') };

        const discNome = Data.getDisciplinaById(ctx.disciplinaId)?.nome || '';
        const diskPath = await Utils.saveImageToDisk(serie.nome, discNome, ctx.nome, file);
        if (!diskPath) return { error: T('não foi possível gravar na pasta img') };
        return { disk: 'disk:' + diskPath };
    },

    updateDisciplinasForSeries(selectedDisciplinaId = null) {
        const serieId = document.getElementById('select-word-series')?.value;
        const selectDisciplina = document.getElementById('select-word-disciplina');
        if (!selectDisciplina) return;

        if (!serieId) {
            selectDisciplina.innerHTML = `<option value="">${T('Selecione a série primeiro...')}</option>`;
            return;
        }

        const disciplinas = Data.getDisciplinasBySerie(serieId).filter(d =>
            Data.getPalavras().some(p => p.serieId === serieId && p.disciplinaId === d.id)
        );
        selectDisciplina.innerHTML = `<option value="">${T('Selecione...')}</option>` +
            disciplinas.map(d => `<option value="${d.id}" ${d.id === selectedDisciplinaId ? 'selected' : ''}>${Utils.escapeHtml(d.nome)}</option>`).join('');
    },

    async saveWord(id) {
        const texto = document.getElementById('input-word-text').value.trim();
        const dica = document.getElementById('input-word-hint').value.trim();
        const serieId = document.getElementById('select-word-series').value;
        const disciplinaId = document.getElementById('select-word-disciplina').value;
        const imageInput = document.getElementById('input-word-image');

        if (!texto || !serieId || !disciplinaId) { alert(T('Preencha todos os campos obrigatórios.')); return; }

        const imageRemoved = document.getElementById('input-word-image-removed');
        let imagem = null;
        if (!imageRemoved) {
            imagem = id ? Data.getPalavras().find(p => p.id === id)?.imagem : null;
        }

        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            imagem = await Utils.fileToBase64(file);
            const serie = Data.getSeriesById(serieId);
            const disciplina = Data.getDisciplinaById(disciplinaId);
            if (serie && disciplina) {
                const diskPath = await Utils.saveImageToDisk(serie.nome, disciplina.nome, texto, file);
                if (diskPath) imagem = 'disk:' + diskPath;
            }
        } else {
            const imageUrl = document.getElementById('input-word-image-url')?.value.trim();
            if (imageUrl) {
                try {
                    const file = await Utils.downloadImageAsFile(imageUrl);
                    if (!file) throw new Error('bloqueio de acesso (CORS) ou link inválido');
                    imagem = await Utils.fileToBase64(file);
                    const serie = Data.getSeriesById(serieId);
                    const disciplina = Data.getDisciplinaById(disciplinaId);
                    if (serie && disciplina) {
                        const diskPath = await Utils.saveImageToDisk(serie.nome, disciplina.nome, texto, file);
                        if (diskPath) imagem = 'disk:' + diskPath;
                    }
                } catch (e) {
                    console.warn('Falha ao baixar imagem da URL, salvando link direto:', e.message || e);
                    imagem = imageUrl;
                    Data.addAdminLog('editar', 'Palavras', `Imagem de ${texto}: download falhou (${e.message || e}) — salvando link externo`);
                }
            }
        }

        const pendingCrop = this._pendingCrop;
        this._pendingCrop = null;
        const oldWord = id ? Data.getPalavras().find(p => p.id === id) : null;
        const imageChanged = !!imageRemoved || imageInput.files.length > 0 || !!document.getElementById('input-word-image-url')?.value.trim();
        if (imageChanged) {
            if (imagem && imagem.startsWith('disk:')) {
                Data.addAdminLog('editar', 'Palavras', `Imagem de ${texto}: referência gravada como disk:${imagem.slice(5)}`);
            } else if (imagem && imagem.startsWith('data:')) {
                Data.addAdminLog('editar', 'Palavras', `Imagem de ${texto}: gravada embutida em base64 (não foi salva em disco)`);
            } else if (imagem) {
                Data.addAdminLog('editar', 'Palavras', `Imagem de ${texto}: gravada como link externo (${imagem.slice(0, 60)})`);
            } else {
                Data.addAdminLog('editar', 'Palavras', `Imagem de ${texto}: removida`);
            }
        }
        let crop = null;
        if (pendingCrop && pendingCrop.wordId === id) {
            crop = pendingCrop.crop;
        } else if (!imageChanged && oldWord?.crop) {
            crop = oldWord.crop;
        }

        const data = { texto, dica, serieId, disciplinaId, imagem, crop };

        if (id) {
            const old = Data.getPalavras().find(p => p.id === id);
            const shouldDeleteOldDisk = old && old.imagem && old.imagem.startsWith('disk:') && (imageRemoved || imageInput.files.length > 0 || document.getElementById('input-word-image-url')?.value.trim());
            if (shouldDeleteOldDisk) {
                const oldSerie = Data.getSeriesById(old.serieId);
                const oldDisc = Data.getDisciplinaById(old.disciplinaId);
                if (oldSerie && oldDisc) await Utils.deleteImageFromDisk(oldSerie.nome, oldDisc.nome, old.texto);
            }
            Data.updatePalavra(id, data);
        } else {
            Data.addPalavra(data);
        }

        this.closeForm('words-form-container');
        this.renderWords();
    },

    async deleteWord(id) {
        const found = Data.getPalavras().find(p => p.id === id);
        if (!found) { alert(T('Palavra não encontrada.')); return; }
        if (confirm(T('Tem certeza que deseja excluir "{nome}"?', { nome: found.texto }))) {
            if (found.imagem && found.imagem.startsWith('disk:')) {
                const serie = Data.getSeriesById(found.serieId);
                const disciplina = Data.getDisciplinaById(found.disciplinaId);
                if (serie && disciplina) await Utils.deleteImageFromDisk(serie.nome, disciplina.nome, found.texto);
            }
            Data.deletePalavra(id);
            this.renderWords();
        }
    },

    // ===== IMPORTAÇÃO EM LOTE =====
    showBulkImportForm() {
        const container = document.getElementById('words-bulk-container');
        const wordForm = document.getElementById('words-form-container');
        if (!container) return;

        if (wordForm) wordForm.classList.add('hidden');

        const series = Data.getSeries();
        const disciplinasAll = Data.getDisciplinas();

        container.innerHTML = `
            <h3>${T('Acrescentar Palavras em Lote')}</h3>
            <div class="bulk-apply-row">
                <div class="bulk-apply-field">
                    <label>${T('Série (aplicar a todas)')}</label>
                    <select id="bulk-apply-serie" onchange="Admin.onBulkSerieChange()">
                        <option value="">${T('Selecione...')}</option>
                        ${series.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.nome)}</option>`).join('')}
                    </select>
                </div>
                <div class="bulk-apply-field">
                    <label>${T('Disciplina (aplicar a todas)')}</label>
                    <select id="bulk-apply-disciplina">
                        <option value="">${T('Selecione a série primeiro...')}</option>
                    </select>
                </div>
                <button class="btn btn-secondary btn-small" data-action="apply-bulk-series-disciplina" style="align-self: flex-end; margin-bottom: 2px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ${T('Aplicar')}
                </button>
            </div>
            <div class="bulk-table-wrapper">
                <table class="bulk-import-table">
                    <thead>
                        <tr>
                            <th style="text-align:center">${T('Palavra')} *</th>
                            <th style="text-align:center">${T('Dica')}</th>
                            <th style="text-align:center">${T('Série')}</th>
                            <th style="text-align:center">${T('Disciplina')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="bulk-words-tbody">
                    </tbody>
                </table>
            </div>
            <div class="bulk-actions">
                <button class="btn btn-secondary" data-action="add-bulk-row">
                    ${Utils.icon('plus', 14)}
                    ${T('Adicionar Linha')}
                </button>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" data-action="close-form" data-container="words-bulk-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                    <button class="btn btn-primary" data-action="save-bulk-words">
                        ${Utils.icon('save', 14)}
                        ${T('Salvar Todas')}
                    </button>
                </div>
            </div>`;

        container.classList.remove('hidden');

        this._bulkRowCounter = 0;
        for (let i = 0; i < 5; i++) this.addBulkRow();
    },

    addBulkRow() {
        const tbody = document.getElementById('bulk-words-tbody');
        if (!tbody) return;

        const idx = this._bulkRowCounter++;
        const series = Data.getSeries();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="bulk-input" data-field="texto" placeholder="${T('Ex: AÇÃO')}" style="text-transform: uppercase;"></td>
            <td><input type="text" class="bulk-input" data-field="dica" placeholder="${T('Ex: Ato de fazer')}"></td>
            <td>
                <select class="bulk-select" data-field="serieId" onchange="Admin.onBulkRowSerieChange(this)">
                    <option value="">${T('Selecione...')}</option>
                    ${series.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.nome)}</option>`).join('')}
                </select>
            </td>
            <td>
                <select class="bulk-select" data-field="disciplinaId">
                    <option value="">${T('Série...')}</option>
                </select>
            </td>
            <td>
                ${Utils.removeRowButton(T('Remover linha'))}
            </td>`;
        tbody.appendChild(row);
    },

    onBulkSerieChange() {
        const serieId = document.getElementById('bulk-apply-serie')?.value;
        const selectDisc = document.getElementById('bulk-apply-disciplina');
        if (!selectDisc) return;

        if (!serieId) {
            selectDisc.innerHTML = `<option value="">${T('Selecione a série primeiro...')}</option>`;
            return;
        }

        const disciplinas = Data.getDisciplinasBySerie(serieId);
        selectDisc.innerHTML = `<option value="">${T('Selecione...')}</option>` +
            disciplinas.map(d => `<option value="${d.id}">${Utils.escapeHtml(d.nome)}</option>`).join('');
    },

    onBulkRowSerieChange(selectEl) {
        const serieId = selectEl.value;
        const row = selectEl.closest('tr');
        const discSelect = row?.querySelector('[data-field="disciplinaId"]');
        if (!discSelect) return;

        if (!serieId) {
            discSelect.innerHTML = `<option value="">${T('Série...')}</option>`;
            return;
        }

        const disciplinas = Data.getDisciplinasBySerie(serieId);
        discSelect.innerHTML = `<option value="">${T('Selecione...')}</option>` +
            disciplinas.map(d => `<option value="${d.id}">${Utils.escapeHtml(d.nome)}</option>`).join('');
    },

    applyBulkSeriesDisciplina() {
        const serieId = document.getElementById('bulk-apply-serie')?.value;
        const disciplinaId = document.getElementById('bulk-apply-disciplina')?.value;
        const tbody = document.getElementById('bulk-words-tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            if (serieId) {
                const serieSelect = row.querySelector('[data-field="serieId"]');
                if (serieSelect) {
                    serieSelect.value = serieId;
                    this.onBulkRowSerieChange(serieSelect);
                }
            }
            if (disciplinaId) {
                const discSelect = row.querySelector('[data-field="disciplinaId"]');
                if (discSelect) discSelect.value = disciplinaId;
            }
        });
    },

    async saveBulkWords() {
        const tbody = document.getElementById('bulk-words-tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const toSave = [];

        rows.forEach(row => {
            const texto = row.querySelector('[data-field="texto"]')?.value.trim();
            const dica = row.querySelector('[data-field="dica"]')?.value.trim();
            const serieId = row.querySelector('[data-field="serieId"]')?.value;
            const disciplinaId = row.querySelector('[data-field="disciplinaId"]')?.value;

            if (texto && serieId && disciplinaId) {
                toSave.push({ texto, dica, serieId, disciplinaId });
            }
        });

        if (toSave.length === 0) {
            alert(T('Nenhuma palavra válida preenchida.\nPreencha pelo menos uma linha com Palavra, Série e Disciplina.'));
            return;
        }

        const hasEmpty = rows.length > 0 && toSave.length < rows.length;
        if (hasEmpty) {
            if (!confirm(T('{n} de {total} linhas serão salvas.\nLinhas vazias ou incompletas serão ignoradas.\nContinuar?', { n: toSave.length, total: rows.length }))) return;
        }

        let saved = 0;
        for (const item of toSave) {
            try {
                Data.addPalavra(item);
                saved++;
            } catch (e) {
                console.error('Erro ao salvar palavra:', item.texto, e);
            }
        }

        this.closeForm('words-bulk-container');
        this.renderWords();
        alert(T('{n} palavra(s) adicionada(s) com sucesso!', { n: saved }));
    },

    // ===== EVENTOS =====
    loadEvents() {
        const eventos = Data.getEventos();
        const list = document.getElementById('events-list');
        const count = document.getElementById('events-count');

        if (count) count.textContent = `${eventos.length} ${T(eventos.length === 1 ? 'evento' : 'eventos')}`;

        if (!list) return;

        if (eventos.length === 0) {
            list.innerHTML = `<div class="card-list-empty">${T('Nenhum evento cadastrado.')}</div>`;
            return;
        }

        list.innerHTML = eventos.map(e => `
            <div class="card-list-item" data-evento-id="${e.id}">
                <div class="card-item-info">
                    <div class="card-item-icon rose"><svg class="icon-lucide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg></div>
                    <div class="card-item-text">
                        <div class="card-item-name">${Utils.escapeHtml(e.nome)}</div>
                        <div class="card-item-meta">${Utils.formatDate(e.data)} · ${e.rodadas?.length || 0} ${T('rodadas')}</div>
                    </div>
                </div>
                <span class="card-item-badge ${e.status === 'ativo' ? '' : 'closed'}">${e.status === 'ativo' ? T('Ativo') : T('Encerrado')}</span>
                <div class="card-item-actions">
                    <button class="btn-icon-sm" data-action="toggle-event-detail" data-id="${e.id}" title="${T('Ver detalhes')}" aria-label="${T('Ver detalhes')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
                    <button class="btn-icon-sm" data-action="edit-event" data-id="${e.id}" title="${T('Editar')}" aria-label="${T('Editar')}">${Utils.icon('edit', 14, 'icon-lucide')}</button>
                    <button class="btn-icon-sm" data-action="duplicate-event" data-id="${e.id}" title="${T('Duplicar rodadas')}" aria-label="${T('Duplicar rodadas')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
                    <button class="btn-icon-sm" data-action="export-event-pdf" data-id="${e.id}" title="${T('Exportar PDF')}" aria-label="${T('Exportar PDF')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg></button>
                    ${e.status === 'ativo' ? `<button class="btn-icon-sm danger" data-action="close-event" data-id="${e.id}" title="${T('Encerrar')}" aria-label="${T('Encerrar')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg></button>` : `<button class="btn-icon-sm" data-action="reopen-event" data-id="${e.id}" title="${T('Reativar')}" aria-label="${T('Reativar')}"><svg class="icon-lucide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>`}
                    <button class="btn-icon-sm danger" data-action="delete-event" data-id="${e.id}" title="${T('Excluir')}" aria-label="${T('Excluir')}">${Utils.icon('trash', 14, 'icon-lucide')}</button>
                </div>
            </div>`).join('');
    },

    toggleEventDetail(eventoId, sourceSection) {
        const sectionId = sourceSection === 'resultados' ? 'section-resultados-eventos' : 'section-eventos';
        const section = document.getElementById(sectionId);
        if (!section) return;

        const card = section.querySelector(`.card-list-item[data-evento-id="${eventoId}"]`);
        if (!card) return;

        const existing = card.nextElementSibling;
        if (existing && existing.classList.contains('event-detail-panel')) {
            existing.remove();
            return;
        }

        const evento = Data.getEventoById(eventoId);
        if (!evento) return;

        const series = Data.getSeries();
        const disciplinas = Data.getDisciplinas();

        const allPalavras = Data.getPalavras();
        const rodadas = (evento.rodadas || []).map((r, i) => {
            const serie = series.find(s => s.id === r.serieId);
            const disciplinaNames = (r.disciplinaIds || []).map(dId => {
                const d = disciplinas.find(dd => dd.id === dId);
                return d ? Utils.escapeHtml(d.nome) : '?';
            });
            const temSelecao = r.palavrasSelecionadas && r.palavrasSelecionadas.length > 0;
            let palavrasHtml;
            if (temSelecao) {
                const nomes = r.palavrasSelecionadas.map(pId => allPalavras.find(p => p.id === pId)).filter(Boolean);
                const words = nomes.map(p => `<span class="event-detail-word">${Utils.escapeHtml(p.texto)}</span>`);
                palavrasHtml = words.length <= 2 ? words.join(' e ') : words.slice(0, -1).join(', ') + ' e ' + words[words.length - 1];
            } else {
                const pool = allPalavras.filter(p =>
                    p.serieId === r.serieId && (r.disciplinaIds || []).includes(p.disciplinaId)
                );
                palavrasHtml = `<em>${T('Sorteio')}</em> — ${pool.length} ${T(pool.length !== 1 ? 'palavras' : 'palavra')} ${T(pool.length !== 1 ? 'disponíveis' : 'disponível')}`;
            }
            const nomes = (r.participantes || []).map(p => p.nome?.trim()).filter(Boolean);
            const participantes = nomes.length > 0
                ? nomes.map(n => Utils.escapeHtml(n)).join(', ')
                : `<em>${T('Será informado no dia')}</em>`;
            return {
                num: i + 1,
                serie: Utils.escapeHtml(serie?.nome || '?'),
                disciplinas: disciplinaNames.join(', ') || '-',
                palavrasPorAluno: temSelecao ? r.palavrasSelecionadas.length : (r.palavrasPorAluno || 5),
                palavrasHtml,
                participantes
            };
        });

        const detail = document.createElement('div');
        detail.className = 'event-detail-panel';
        detail.innerHTML = `
            <table class="event-detail-table">
                <thead><tr><th>#</th><th>${T('Série')}</th><th>${T('Disciplinas')}</th><th>${T('Palavras/Aluno')}</th><th>${T('Palavras')}</th><th>${T('Participantes')}</th></tr></thead>
                <tbody>${rodadas.map(r => `<tr><td>${r.num}</td><td>${r.serie}</td><td>${r.disciplinas}</td><td>${r.palavrasPorAluno}</td><td>${r.palavrasHtml}</td><td>${r.participantes}</td></tr>`).join('')}</tbody>
            </table>`;

        card.parentNode.insertBefore(detail, card.nextSibling);
    },

    showEventForm(id = null) {
        const evento = id ? Data.getEventoById(id) : null;
        const series = Data.getSeries();
        const rodadas = evento?.rodadas || [];
        const container = document.getElementById('events-form-container');
        if (!container) return;

        container.innerHTML = `
            <h3>${evento ? T('Editar Evento') : T('Criar Evento')}</h3>
            <div class="form-row">
                <div>
                    <label>${T('Nome do Evento')} *</label>
                    <input type="text" id="input-event-name" value="${Utils.escapeHtml(evento?.nome || '')}" placeholder="${T('Ex: Feira de Ciências')}">
                </div>
                <div>
                    <label>${T('Data')}</label>
                    <input type="date" id="input-event-date" value="${evento?.data || new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div class="form-row single">
                <div>
                    <label>${T('Rodadas')}</label>
                    <div id="rodadas-container">
                        ${rodadas.map((r, i) => this.renderRodadaForm(r, i, series)).join('')}
                    </div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-rodada" style="margin-top: 0.5rem;">+ ${T('Adicionar Rodada')}</button>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" data-action="close-form" data-container="events-form-container">${Utils.icon('x', 14)} ${T('Cancelar')}</button>
                <button class="btn btn-primary" data-action="save-event" data-id="${id || ''}">${Utils.icon('check', 14)} ${T('Salvar')}</button>
            </div>`;

        container.classList.remove('hidden');
        this.editingId = id;

        setTimeout(() => {
            this._palavrasClickOrder = this._palavrasClickOrder || {};
            const rc = document.getElementById('rodadas-container');
            if (rc && rc.children.length === 0) this.addRodada();
            rodadas.forEach((r, i) => {
                if (r.palavrasSelecionadas?.length > 0) {
                    this._palavrasClickOrder[i] = [...r.palavrasSelecionadas];
                    this._renumberPalavras(i);
                }
            });
        }, 50);
    },

    // Linha superior (série/turma/disciplinas) do formulário de rodada (usado por renderRodadaForm).
    _buildRodadaTopRowHtml(index, rodada, seriesComPalavras, turmas, disciplinas) {
        return `
                <div class="rodada-row top">
                    <div class="rodada-field">
                        <label>${T('Série')}</label>
                        <select id="rodada-serie-${index}" onchange="Admin.updateRodadaTurmasDisciplinas(${index})">
                            <option value="">${T('Selecione...')}</option>
                            ${seriesComPalavras.map(s => `<option value="${s.id}" ${rodada?.serieId === s.id ? 'selected' : ''}>${Utils.escapeHtml(s.nome)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="rodada-field">
                        <label>${T('Turma (opcional)')}</label>
                        <select id="rodada-turma-${index}">
                            <option value="">${T('Sem turma')}</option>
                            ${turmas.map(t => `<option value="${t.id}" ${rodada?.turmaId === t.id ? 'selected' : ''}>${Utils.escapeHtml(t.nome)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="rodada-field stretch">
                        <label>${T('Disciplinas')}</label>
                        <div class="disc-chips" id="rodada-disc-container-${index}">
                            ${disciplinas.length > 0 ? disciplinas.map(d => `
                                <label class="disc-chip">
                                    <input type="checkbox" name="rodada-disciplina-${index}" value="${d.id}" ${rodada?.disciplinaIds?.includes(d.id) ? 'checked' : ''} onchange="Admin.onDisciplinasChanged(${index})" hidden>
                                    ${Utils.escapeHtml(d.nome)}
                                </label>
                            `).join('') : `<span class="disc-empty">${T('Selecione uma série')}</span>`}
                        </div>
                    </div>
                </div>`;
    },

    // Linha de participantes do formulário de rodada (usado por renderRodadaForm).
    _buildRodadaParticipantesHtml(index, participantes) {
        return `
                <div class="rodada-row">
                    <div class="rodada-field stretch">
                        <label>${T('Participantes (opcional)')}</label>
                        <div class="participantes-tags" id="rodada-participantes-${index}">
                            ${participantes.map((p, pi) => `<span class="participante-tag">${Utils.escapeHtml(p.nome)}<button data-action="remove-participante" data-index="${index}" data-pi="${pi}">×</button></span>`).join('')}
                        </div>
                        <div class="participante-add-row">
                            <input type="text" id="rodada-participante-input-${index}" placeholder="${T('Nome do aluno')}" onkeydown="if(event.key==='Enter'){event.preventDefault();Admin.addParticipante(${index})}">
                            <button type="button" class="btn btn-secondary btn-small" data-action="add-participante" data-index="${index}">+</button>
                        </div>
                    </div>
                </div>`;
    },

    renderRodadaForm(rodada = null, index = 0, series = null) {
        if (!series) series = Data.getSeries();
        const seriesComPalavras = series.filter(s => Data.getPalavras().some(p => p.serieId === s.id));
        const turmas = rodada?.serieId ? Data.getTurmasBySerie(rodada.serieId) : [];
        const disciplinas = rodada?.serieId ? Data.getDisciplinasBySerie(rodada.serieId).filter(d => Data.getPalavras().some(p => p.serieId === rodada.serieId && p.disciplinaId === d.id)) : [];
        const participantes = rodada?.participantes || [];
        const modoPalavras = rodada?.modoPalavras || 'sorteio';
        const palavrasSelecionadas = rodada?.palavrasSelecionadas || [];

        let palavrasHtml = '';
        if (rodada?.serieId && disciplinas.length > 0) {
            const allWords = Data.getPalavras().filter(p =>
                p.serieId === rodada.serieId &&
                (rodada.disciplinaIds || []).includes(p.disciplinaId)
            );
            palavrasHtml = this._renderWordSelectionList(index, allWords, palavrasSelecionadas);
        }

        return `
            <div class="rodada-form" data-index="${index}">
                <div class="rodada-header">
                    <strong>${T('Rodada {n}', { n: index + 1 })}</strong>
                    <button type="button" class="btn btn-danger btn-small" data-action="remove-rodada" data-index="${index}">${T('Remover')}</button>
                </div>
                ${this._buildRodadaTopRowHtml(index, rodada, seriesComPalavras, turmas, disciplinas)}
                <div class="rodada-row">
                    <div class="rodada-field stretch">
                        <div class="palavras-mode-compact">
                            <span class="palavras-mode-label">${T('Palavras')}:</span>
                            <button type="button" class="palavras-mode-chip ${modoPalavras === 'sorteio' ? 'active' : ''}" data-mode="sorteio" data-action="set-modo-palavras" data-index="${index}" data-modo="sorteio">${T('Sorteio')}</button>
                            <button type="button" class="palavras-mode-chip ${modoPalavras === 'selecao' ? 'active' : ''}" data-mode="selecao" data-action="set-modo-palavras" data-index="${index}" data-modo="selecao">${T('Selecionar')}</button>
                            <span class="palavras-info">${T('A ordem de seleção define a ordem no jogo.')}</span>
                            <input type="hidden" id="rodada-modo-palavras-${index}" value="${modoPalavras}">
                        </div>
                        <div id="rodada-palavras-lista-${index}" class="palavras-selection-list ${modoPalavras !== 'selecao' ? 'hidden' : ''}">
                            ${palavrasHtml}
                        </div>
                    </div>
                </div>
                ${this._buildRodadaParticipantesHtml(index, participantes)}
            </div>`;
    },

    addRodada() {
        const container = document.getElementById('rodadas-container');
        if (!container) return;
        const index = container.children.length;
        const series = Data.getSeries();
        const div = document.createElement('div');
        div.innerHTML = this.renderRodadaForm(null, index, series);
        container.appendChild(div.firstElementChild);
        this._palavrasClickOrder = this._palavrasClickOrder || {};
        this._palavrasClickOrder[index] = [];
    },

    _renderWordSelectionList(index, palavras, selectedIds = []) {
        if (palavras.length === 0) {
            return `<p class="palavras-empty">${T('Nenhuma palavra disponível para esta série/disciplina.')}</p>`;
        }
        const selSet = selectedIds.length > 0 ? new Set(selectedIds) : null;
        const selected = [];
        const unselected = [];
        palavras.forEach(p => {
            const pos = selSet ? selectedIds.indexOf(p.id) : -1;
            if (pos !== -1) {
                selected.push({ palavra: p, pos });
            } else {
                unselected.push(p);
            }
        });
        selected.sort((a, b) => a.pos - b.pos);
        unselected.sort((a, b) => a.texto.localeCompare(b.texto, 'pt-BR'));

        let html = `<div class="palavras-select-actions">
            <input type="text" class="palavras-search" placeholder="${T('Buscar...')}" oninput="Admin.filterPalavras(${index}, this.value)">
            <button type="button" class="btn btn-secondary btn-small" data-action="toggle-all-words" data-index="${index}" data-val="true">${T('Todas')}</button>
            <button type="button" class="btn btn-secondary btn-small" data-action="toggle-all-words" data-index="${index}" data-val="false">${T('Limpar')}</button>
            <span class="palavras-count" id="rodada-palavras-count-${index}">${selected.length} ${T('de')} ${palavras.length}</span>
        </div>
        <div class="palavras-chips" id="rodada-palavras-chips-${index}">`;
        if (selected.length > 0) {
            html += `<div class="palavras-chip-group">
                <span class="palavras-chip-group-label">${T('Selecionadas ({n})', { n: selected.length })}</span>
                <div class="palavras-chip-grid">`;
            selected.forEach(({ palavra: p }, idx) => {
                html += `<label class="palavra-chip selected" data-term="${Utils.escapeHtml(p.texto.toLowerCase())}">
                    <input type="checkbox" name="rodada-palavra-${index}" value="${p.id}" checked onchange="Admin.onPalavraToggle(${index})" hidden>
                    <span class="palavra-order visible" data-action="set-palavra-order" data-index="${index}" data-word-id="${p.id}">${idx + 1}</span>
                    <span class="palavra-texto">${Utils.escapeHtml(p.texto)}</span>
                    <button class="palavra-move" data-action="move-palavra-order" data-index="${index}" data-word-id="${p.id}" data-dir="-1" tabindex="-1">&#9650;</button>
                    <button class="palavra-move" data-action="move-palavra-order" data-index="${index}" data-word-id="${p.id}" data-dir="1" tabindex="-1">&#9660;</button>
                </label>`;
            });
            html += '</div></div>';
        }
        const grouped = {};
        unselected.forEach(p => {
            const dNome = Data.getDisciplinaById(p.disciplinaId)?.nome || T('Sem disciplina');
            if (!grouped[dNome]) grouped[dNome] = [];
            grouped[dNome].push(p);
        });
        Object.entries(grouped).forEach(([dNome, words]) => {
            html += `<div class="palavras-chip-group" data-group="${Utils.escapeHtml(dNome)}">
                <span class="palavras-chip-group-label">${Utils.escapeHtml(dNome)} (${words.length})</span>
                <div class="palavras-chip-grid">`;
            words.forEach(p => {
                html += `<label class="palavra-chip" data-term="${Utils.escapeHtml(p.texto.toLowerCase())}">
                    <input type="checkbox" name="rodada-palavra-${index}" value="${p.id}" onchange="Admin.onPalavraToggle(${index})" hidden>
                    <span class="palavra-order"></span>
                    <span class="palavra-texto">${Utils.escapeHtml(p.texto)}</span>
                </label>`;
            });
            html += '</div></div>';
        });
        html += '</div>';
        return html;
    },

    setModoPalavras(index, mode) {
        const hiddenInput = document.getElementById(`rodada-modo-palavras-${index}`);
        const listaEl = document.getElementById(`rodada-palavras-lista-${index}`);
        if (hiddenInput) hiddenInput.value = mode;
        document.querySelectorAll(`.rodada-form[data-index="${index}"] .palavras-mode-chip`).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        if (listaEl) {
            listaEl.classList.toggle('hidden', mode !== 'selecao');
            if (mode === 'selecao') {
                const serieId = document.getElementById(`rodada-serie-${index}`)?.value;
                const disciplinaIds = Array.from(document.querySelectorAll(`[name="rodada-disciplina-${index}"]:checked`)).map(cb => cb.value);
                this._refreshWordList(index, serieId, disciplinaIds);
            }
        }
    },

    toggleAllWords(index, checked) {
        if (!this._palavrasClickOrder) this._palavrasClickOrder = {};
        const cbs = document.querySelectorAll(`input[name="rodada-palavra-${index}"]`);
        cbs.forEach(cb => { cb.checked = checked; });
        if (checked) {
            this._palavrasClickOrder[index] = Array.from(cbs).map(cb => cb.value);
        } else {
            this._palavrasClickOrder[index] = [];
        }
        this._renumberPalavras(index);
    },

    updatePalavrasCount(index) {
        const all = document.querySelectorAll(`input[name="rodada-palavra-${index}"]`);
        const checked = document.querySelectorAll(`input[name="rodada-palavra-${index}"]:checked`);
        const countEl = document.getElementById(`rodada-palavras-count-${index}`);
        if (countEl) countEl.textContent = `${checked.length} ${T('de')} ${all.length}`;
    },

    movePalavraOrder(index, wordId, direction) {
        if (!this._palavrasClickOrder?.[index]) return;
        const arr = this._palavrasClickOrder[index];
        const pos = arr.indexOf(wordId);
        if (pos === -1) return;
        const newPos = pos + direction;
        if (newPos < 0 || newPos >= arr.length) return;
        [arr[pos], arr[newPos]] = [arr[newPos], arr[pos]];
        this._renumberPalavras(index);
    },

    setPalavraOrder(index, wordId, newPos) {
        if (!this._palavrasClickOrder?.[index]) return;
        const arr = this._palavrasClickOrder[index];
        const oldPos = arr.indexOf(wordId);
        if (oldPos === -1) return;
        const target = Math.max(0, Math.min(arr.length - 1, newPos - 1));
        if (target === oldPos) return;
        arr.splice(oldPos, 1);
        arr.splice(target, 0, wordId);
        this._renumberPalavras(index);
    },

    onPalavraToggle(index) {
        if (!this._palavrasClickOrder) this._palavrasClickOrder = {};
        if (!this._palavrasClickOrder[index]) this._palavrasClickOrder[index] = [];
        const checked = document.querySelectorAll(`input[name="rodada-palavra-${index}"]:checked`);
        const checkedIds = Array.from(checked).map(cb => cb.value);
        this._palavrasClickOrder[index] = this._palavrasClickOrder[index].filter(id => checkedIds.includes(id));
        checked.forEach(cb => {
            if (!this._palavrasClickOrder[index].includes(cb.value)) {
                this._palavrasClickOrder[index].push(cb.value);
            }
        });
        this._renumberPalavras(index);
    },

    _renumberPalavras(index) {
        const order = this._palavrasClickOrder?.[index] || [];
        const cbs = document.querySelectorAll(`input[name="rodada-palavra-${index}"]`);
        cbs.forEach(cb => {
            const label = cb.closest('.palavra-chip');
            const orderEl = label?.querySelector('.palavra-order');
            if (!orderEl) return;
            if (cb.checked) {
                const pos = order.indexOf(cb.value) + 1;
                orderEl.textContent = pos > 0 ? pos : '';
                orderEl.classList.toggle('visible', pos > 0);
                if (label) label.classList.toggle('selected', pos > 0);
            } else {
                orderEl.textContent = '';
                orderEl.classList.remove('visible');
                if (label) label.classList.remove('selected');
            }
        });
        this.updatePalavrasCount(index);
    },

    removeRodada(index) {
        const container = document.getElementById('rodadas-container');
        if (!container) return;
        const rodadas = container.querySelectorAll('.rodada-form');
        rodadas[index]?.remove();
        if (this._palavrasClickOrder) {
            const newOrder = {};
            container.querySelectorAll('.rodada-form').forEach((rodada, i) => {
                const oldIdx = parseInt(rodada.dataset.index);
                rodada.dataset.index = i;
                rodada.querySelector('strong').textContent = T('Rodada {n}', { n: i + 1 });
                if (this._palavrasClickOrder[oldIdx] !== undefined) {
                    newOrder[i] = this._palavrasClickOrder[oldIdx];
                }
            });
            this._palavrasClickOrder = newOrder;
        }
    },

    updateRodadaTurmasDisciplinas(index) {
        const serieId = document.getElementById(`rodada-serie-${index}`)?.value;
        const turmaSelect = document.getElementById(`rodada-turma-${index}`);
        const rodadaForm = document.querySelector(`.rodada-form[data-index="${index}"]`);
        const disciplinaContainer = rodadaForm?.querySelector('.disc-chips');

        if (!serieId) {
            if (turmaSelect) turmaSelect.innerHTML = `<option value="">${T('Sem turma')}</option>`;
            if (disciplinaContainer) disciplinaContainer.innerHTML = `<span class="disc-empty">${T('Selecione uma série')}</span>`;
            this._refreshWordList(index, [], []);
            return;
        }

        const turmas = Data.getTurmasBySerie(serieId);
        if (turmaSelect) {
            turmaSelect.innerHTML = `<option value="">${T('Sem turma')}</option>` +
                turmas.map(t => `<option value="${t.id}">${Utils.escapeHtml(t.nome)}</option>`).join('');
        }

        const disciplinas = Data.getDisciplinasBySerie(serieId).filter(d => Data.getPalavras().some(p => p.serieId === serieId && p.disciplinaId === d.id));
        if (disciplinaContainer) {
            if (disciplinas.length === 0) {
                disciplinaContainer.innerHTML = `<span class="disc-empty">${T('Nenhuma disciplina com palavras nesta série')}</span>`;
            } else {
                disciplinaContainer.innerHTML = disciplinas.map(d => `
                    <label class="disc-chip">
                        <input type="checkbox" name="rodada-disciplina-${index}" value="${d.id}" onchange="Admin.onDisciplinasChanged(${index})" hidden>
                        ${Utils.escapeHtml(d.nome)}
                    </label>
                `).join('');
            }
        }
        this._refreshWordList(index, serieId, []);
    },

    onDisciplinasChanged(index) {
        const serieId = document.getElementById(`rodada-serie-${index}`)?.value;
        if (!serieId) return;
        const disciplinaIds = Array.from(document.querySelectorAll(`[name="rodada-disciplina-${index}"]:checked`)).map(cb => cb.value);
        this._refreshWordList(index, serieId, disciplinaIds);
    },

    _refreshWordList(index, serieId, disciplinaIds) {
        const listaEl = document.getElementById(`rodada-palavras-lista-${index}`);
        if (!listaEl) return;
        const modoInput = document.getElementById(`rodada-modo-palavras-${index}`);
        if (modoInput?.value !== 'selecao') { listaEl.innerHTML = ''; return; }
        if (!serieId || disciplinaIds.length === 0) {
            listaEl.innerHTML = `<p class="palavras-empty">${T('Selecione série e disciplinas para ver as palavras.')}</p>`;
            return;
        }
        const palavras = Data.getPalavras().filter(p =>
            p.serieId === serieId && disciplinaIds.includes(p.disciplinaId)
        );
        this._palavrasClickOrder = this._palavrasClickOrder || {};
        this._palavrasClickOrder[index] = [];
        listaEl.innerHTML = this._renderWordSelectionList(index, palavras, []);
    },

    saveEvent(id) {
        const nome = document.getElementById('input-event-name').value.trim();
        const data = document.getElementById('input-event-date').value;

        if (!nome) { alert(T('Digite o nome do evento.')); return; }

        const rodadas = [];
        document.querySelectorAll('.rodada-form').forEach((form, index) => {
            const serieId = document.getElementById(`rodada-serie-${index}`)?.value;
            const turmaId = document.getElementById(`rodada-turma-${index}`)?.value || null;
            const disciplinaIds = Array.from(document.querySelectorAll(`[name="rodada-disciplina-${index}"]:checked`)).map(cb => cb.value);
            const palavrasPorAluno = 5;
            const tags = document.querySelectorAll(`#rodada-participantes-${index} .participante-tag`);
            const participantes = Array.from(tags).map(t => ({ nome: t.textContent.replace('×', '').trim() })).filter(p => p.nome);
            const modoPalavras = document.getElementById(`rodada-modo-palavras-${index}`)?.value || 'sorteio';
            const palavrasSelecionadas = modoPalavras === 'selecao'
                ? (this._palavrasClickOrder?.[index] || []).filter(id =>
                    Array.from(document.querySelectorAll(`input[name="rodada-palavra-${index}"]:checked`)).some(cb => cb.value === id)
                  )
                : [];

            if (serieId && disciplinaIds.length > 0) {
                rodadas.push({ serieId, turmaId, disciplinaIds, palavrasPorAluno, participantes, modoPalavras, palavrasSelecionadas });
            }
        });

        if (rodadas.length === 0) {
            alert(T('Adicione pelo menos uma rodada com série e disciplina selecionadas.'));
            return;
        }

        const eventData = { nome, data, rodadas };
        let evento;

        if (id) {
            evento = Data.updateEvento(id, eventData);
        } else {
            evento = Data.addEvento(eventData);
        }

        this.closeForm('events-form-container');
        this.showEventSummary(evento);
        this.loadEvents();
    },

    showEventSummary(evento) {
        const container = document.getElementById('events-form-container');
        if (!container || !evento) return;

        const series = Data.getSeries();
        const disciplinas = Data.getDisciplinas();

        const rodadas = (evento.rodadas || []).map((r, i) => {
            const serie = series.find(s => s.id === r.serieId);
            const disciplinaNames = (r.disciplinaIds || []).map(dId => {
                const d = disciplinas.find(dd => dd.id === dId);
                return d ? d.nome : '?';
            });
            const temSelecao = r.palavrasSelecionadas && r.palavrasSelecionadas.length > 0;
            const palavrasNoJogo = temSelecao
                ? r.palavrasSelecionadas.length
                : Data.getPalavras().filter(p =>
                    p.serieId === r.serieId && (r.disciplinaIds || []).includes(p.disciplinaId)
                ).length;
            return {
                num: i + 1,
                serie: serie?.nome || '?',
                disciplinas: disciplinaNames.join(', ') || '-',
                palavrasPorAluno: temSelecao ? r.palavrasSelecionadas.length : (r.palavrasPorAluno || 5),
                palavrasNoJogo,
                participantes: r.participantes?.length || 0
            };
        });

        const totalPalavrasNoJogo = rodadas.reduce((s, r) => s + r.palavrasNoJogo, 0);

        container.innerHTML = `
            <h3>${T('Evento Criado')}</h3>
            <div class="event-summary">
                <div class="event-summary-header">
                    <h4>${Utils.escapeHtml(evento.nome)}</h4>
                    <span class="event-summary-date">${Utils.formatDate(evento.data)}</span>
                    <span class="badge badge-success">${T('Ativo')}</span>
                </div>
                <div class="event-summary-stats">
                    <div class="stat-pill"><span class="stat-pill-value">${rodadas.length}</span><span class="stat-pill-label">${T('Rodadas')}</span></div>
                    <div class="stat-pill success"><span class="stat-pill-value">${totalPalavrasNoJogo}</span><span class="stat-pill-label">${T('Palavras no jogo')}</span></div>
                </div>
                <div class="event-summary-table-wrap">
                    <table class="event-summary-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>${T('Série')}</th>
                                <th>${T('Disciplinas')}</th>
                                <th>${T('Palavras/Aluno')}</th>
                                <th>${T('Participantes')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rodadas.map(r => `
                                <tr>
                                    <td>${r.num}</td>
                                    <td>${Utils.escapeHtml(r.serie)}</td>
                                    <td>${Utils.escapeHtml(r.disciplinas)}</td>
                                    <td>${r.palavrasPorAluno}</td>
                                    <td>${r.participantes > 0 ? r.participantes : `<span class="dim">${T('Será informado no dia')}</span>`}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="event-summary-actions">
                    <button class="btn btn-primary" data-action="start-event-game" data-id="${evento.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        ${T('Iniciar Agora')}
                    </button>
                    <button class="btn btn-secondary" data-action="close-events-form-and-reload">${T('Fechar')}</button>
                </div>
            </div>`;
        container.classList.remove('hidden');
    },

    closeEvent(id) {
        if (confirm(T('Tem certeza que deseja encerrar este evento?'))) {
            Data.updateEvento(id, { status: 'encerrado' });
            this.loadEvents();
        }
    },

    reopenEvent(id) {
        Data.updateEvento(id, { status: 'ativo', manterAberto: true });
        this.loadEvents();
    },

    deleteEvent(id) {
        if (confirm(T('Tem certeza que deseja excluir este evento?'))) {
            Data.deleteEvento(id);
            this.loadEvents();
        }
    },

    duplicateEvent(id) {
        const original = Data.getEventoById(id);
        if (!original) return;

        const nomeCopia = original.nome + ' ' + T('(Cópia)');
        const rodadasCopia = (original.rodadas || []).map(r => ({
            serieId: r.serieId,
            turmaId: r.turmaId || null,
            disciplinaIds: [...(r.disciplinaIds || [])],
            palavrasPorAluno: r.palavrasPorAluno || 5,
            participantes: (r.participantes || []).map(p => ({ nome: p.nome })),
            modoPalavras: r.modoPalavras || 'sorteio',
            palavrasSelecionadas: [...(r.palavrasSelecionadas || [])]
        }));

        const novoEvento = Data.addEvento({
            nome: nomeCopia,
            data: new Date().toISOString().split('T')[0],
            rodadas: rodadasCopia
        });

        this.loadEvents();
        this.showEventForm(novoEvento.id);
    },

    // Monta o HTML de uma rodada para o PDF do evento (usado por exportEventPDF).
    _buildRodadaPdfHtml(r, i, series, disciplinas, allPalavras) {
        const serie = series.find(s => s.id === r.serieId);
        const discNames = (r.disciplinaIds || []).map(dId => {
            const d = disciplinas.find(dd => dd.id === dId);
            return d ? Utils.escapeHtml(d.nome) : '?';
        });

        let palavrasHtml = '';
        const temSelecao = r.palavrasSelecionadas && r.palavrasSelecionadas.length > 0;
        if (temSelecao) {
            const palavras = r.palavrasSelecionadas.map(pId => allPalavras.find(p => p.id === pId)).filter(Boolean);
            palavrasHtml = `<div class="word-list"><strong>${T('Palavras Selecionadas ({n}):', { n: palavras.length })}</strong><ol class="word-ordered">` +
                palavras.map(p => `<li>${Utils.escapeHtml(p.texto)} <span class="word-disc">(${Utils.escapeHtml(disciplinas.find(d => d.id === p.disciplinaId)?.nome || '?')})</span></li>`).join('') +
                `</ol></div>`;
        } else {
            const pool = allPalavras.filter(p =>
                p.serieId === r.serieId && (r.disciplinaIds || []).includes(p.disciplinaId)
            );
            palavrasHtml = `<div class="word-list"><strong>${T('Pool de palavras ({n}):', { n: pool.length })}</strong> ` +
                pool.map(p => `<span class="word-item">${Utils.escapeHtml(p.texto)}</span>`).join('') +
                `</div>`;
        }

        const participantes = (r.participantes || []).length > 0
            ? `<div class="participants"><strong>${T('Participantes')}:</strong> ${r.participantes.map(p => Utils.escapeHtml(p.nome)).join(', ')}</div>`
            : `<div class="participants"><em>${T('Nenhum participante definido')}</em></div>`;

        return `
                <div class="round">
                    <h3>${T('Rodada {n}', { n: i + 1 })}</h3>
                    <table class="round-info">
                        <tr><td><strong>${T('Série')}:</strong></td><td>${Utils.escapeHtml(serie?.nome || '?')}</td></tr>
                        <tr><td><strong>${T('Disciplinas')}:</strong></td><td>${discNames.join(', ')}</td></tr>
                        ${!temSelecao ? `<tr><td><strong>${T('Palavras por aluno')}:</strong></td><td>${r.palavrasPorAluno || 5}</td></tr>` : ''}
                        <tr><td><strong>${T('Modo')}:</strong></td><td>${temSelecao ? T('Seleção manual ({n} palavras)', { n: r.palavrasSelecionadas.length }) : T('Sorteio')}</td></tr>
                    </table>
                    ${palavrasHtml}
                    ${participantes}
                </div>`;
    },

    // CSS de impressão do PDF de evento (usado por exportEventPDF).
    _eventPdfStyles() {
        return `
    @page { margin: 1.2cm; size: A4 portrait; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #1a1a1a; line-height: 1.25; }
    h1 { font-size: 15pt; margin-bottom: 0.1rem; color: #065f46; }
    .event-date { font-size: 8.5pt; color: #6b7280; margin-bottom: 0.3rem; }
    .event-status { display: inline-block; font-size: 8pt; padding: 1px 6px; border-radius: 3px; font-weight: 600; margin-bottom: 0.4rem; }
    .event-status.ativo { background: #d1fae5; color: #065f46; }
    .event-status.encerrado { background: #fee2e2; color: #991b1b; }
    hr { border: none; border-top: 1px solid #d1d5db; margin: 0.4rem 0; }
    .round { break-inside: avoid; margin-bottom: 0.7rem; padding: 0.5rem 0.7rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa; }
    .round h3 { font-size: 11pt; color: #065f46; margin-bottom: 0.25rem; border-bottom: 1px solid #d1d5db; padding-bottom: 0.15rem; }
    .round-info { width: 100%; margin-bottom: 0.2rem; }
    .round-info td { padding: 1px 0.5rem 1px 0; font-size: 8.5pt; vertical-align: top; }
    .round-info td:first-child { width: 1px; white-space: nowrap; }
    .word-list { margin: 0.2rem 0; font-size: 8.5pt; }
    .word-item { display: inline; }
    .word-item + .word-item::before { content: ", "; }
    .word-ordered { margin: 0.2rem 0 0 1.3rem; font-size: 8.5pt; }
    .word-ordered li { padding: 0; }
    .word-disc { color: #6b7280; font-size: 8pt; }
    .participants { margin-top: 0.2rem; font-size: 8.5pt; color: #374151; }
    .footer { margin-top: 0.8rem; font-size: 7pt; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 0.3rem; }
    @media print {
        .round { break-inside: avoid; }
    }`;
    },

    // Monta o documento HTML completo do PDF de evento (usado por exportEventPDF).
    _buildEventPdfDocument(evento, rodadasHtml) {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${Utils.escapeHtml(evento.nome)} — Soletrando</title>
<style>${this._eventPdfStyles()}</style>
</head>
<body>
    <h1>${Utils.escapeHtml(evento.nome)}</h1>
    <div class="event-date">${Utils.formatDate(evento.data)}</div>
    <div class="event-status ${evento.status === 'ativo' ? 'ativo' : 'encerrado'}">${evento.status === 'ativo' ? 'Ativo' : 'Encerrado'}</div>
    <hr>
    ${rodadasHtml}
    <div class="footer">Soletrando — ${Utils.formatDate(evento.data)} · ${new Date().toLocaleString((typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR')}</div>
</body>
</html>`;
    },

    exportEventPDF(id) {
        const evento = Data.getEventoById(id);
        if (!evento) return;

        const series = Data.getSeries();
        const disciplinas = Data.getDisciplinas();
        const allPalavras = Data.getPalavras();

        const rodadasHtml = (evento.rodadas || [])
            .map((r, i) => this._buildRodadaPdfHtml(r, i, series, disciplinas, allPalavras))
            .join('');

        const html = this._buildEventPdfDocument(evento, rodadasHtml);

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 500);
        } else {
            alert(T('Permita pop-ups para gerar o PDF.'));
        }
    },

    addParticipante(rodadaIndex) {
        const input = document.getElementById(`rodada-participante-input-${rodadaIndex}`);
        const container = document.getElementById(`rodada-participantes-${rodadaIndex}`);
        if (!input || !container) return;
        const nome = input.value.trim();
        if (!nome) return;
        const tag = document.createElement('span');
        tag.className = 'participante-tag';
        tag.innerHTML = `${Utils.escapeHtml(nome)}<button data-action="remove-participante" data-index="${rodadaIndex}" data-pi="${container.children.length}">×</button>`;
        container.appendChild(tag);
        input.value = '';
        input.focus();
    },

    removeParticipante(rodadaIndex, tagIndex) {
        const container = document.getElementById(`rodada-participantes-${rodadaIndex}`);
        if (container && container.children[tagIndex]) {
            container.children[tagIndex].remove();
        }
    },

    filterPalavras(index, term) {
        const chipsContainer = document.getElementById(`rodada-palavras-chips-${index}`);
        if (!chipsContainer) return;
        const lowered = term.toLowerCase().trim();
        chipsContainer.querySelectorAll('.palavra-chip').forEach(chip => {
            const text = chip.dataset.term || '';
            const group = chip.closest('.palavras-chip-group');
            chip.style.display = (!lowered || text.includes(lowered)) ? '' : 'none';
            if (group) {
                const visible = Array.from(group.querySelectorAll('.palavra-chip')).some(c => c.style.display !== 'none');
                group.style.display = visible ? '' : 'none';
            }
        });
    },

    // ===== RESULTADOS =====
    loadResultadosAvulsos() {
        const logs = Data.getLogs().filter(l => !l.eventoId);
        const count = document.getElementById('resultados-avulsos-count');

        if (count) count.textContent = `${logs.length} ${T(logs.length === 1 ? 'resultado' : 'resultados')}`;

        App.renderResultsStats('resultados-avulsos-stats', logs);

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
        const serieEl = document.getElementById('resultados-avulsos-podium-series');
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

        App.renderDisciplineChart('resultados-avulsos-chart', logs);

        const groups = Data.groupLogsByExecucao(logs);
        this._renderAvulsosLogsContent(groups);

        const list = document.getElementById('resultados-avulsos-content');
        if (list) list.innerHTML = '';
    },

    _renderAvulsosLogsContent(groups) {
        const container = document.getElementById('avulsos-logs-content');
        if (!container) return;
        if (!groups || groups.length === 0) {
            container.innerHTML = `<p class="event-logs-empty">${T('Nenhum resultado avulso encontrado.')}</p>`;
            return;
        }
        container.innerHTML = groups.map((g, idx) => {
            const dt = g.startTime ? new Date(g.startTime) : null;
            const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
            const dtStr = dt ? dt.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }) + T(' às ') + dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : T('Data desconhecida');
            return `
            <div class="event-exec-group glass">
                <div class="event-exec-header">
                    ${Utils.icon('clock', 16)}
                    <span class="event-exec-date">${dtStr}</span>
                    <span class="event-exec-badge">${g.total} ${T(g.total !== 1 ? 'palavras' : 'palavra')} · ${g.acertos} ${T(g.acertos !== 1 ? 'acertos' : 'acerto')} · ${g.taxa}%</span>
                    <button class="btn-icon-sm danger event-exec-delete" data-exec-idx="${idx}" title="${T('Excluir execução')}" aria-label="${T('Excluir execução')}">
                        ${Utils.icon('trash', 14)}
                    </button>
                </div>
                <div class="event-logs-table-wrap">
                    <table class="event-logs-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>${T('Palavra')}</th>
                                <th>${T('Erro')}</th>
                                <th>${T('Disciplina')}</th>
                                <th>${T('Série')}</th>
                                <th>${T('Tempo')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${g.logs.map(l => {
                                const isOk = l.resultado === 'acerto';
                                return `
                                <tr>
                                    <td><span class="log-result-badge ${isOk ? 'correct' : 'wrong'}">
                                        ${isOk
                                            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                                            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                                        }
                                    </span></td>
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

        container.querySelectorAll('.event-exec-delete').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const execIdx = parseInt(btn.dataset.execIdx);
                if (!confirm(T('Excluir esta execução e todos os seus registros?'))) return;
                const group = groups[execIdx];
                if (!group) return;
                const logIds = new Set(group.logs.map(l => l.id));
                const allLogs = Data.getLogs();
                Data.saveLogs(allLogs.filter(l => !logIds.has(l.id)));
                const execLabel = group.execucaoId || group.logs[0]?.aluno || `#${execIdx + 1}`;
                Data.addAdminLog('excluir', 'Dados', `Execução excluída: ${execLabel}`);
                this.loadResultadosAvulsos();
            });
        });
    },

    loadResultadosEventos() {
        const eventos = Data.getEventos();
        const list = document.getElementById('resultados-eventos-content');
        const count = document.getElementById('resultados-eventos-count');
        const selectEl = document.getElementById('resultados-eventos-select');

        if (count) count.textContent = `${eventos.length} ${T(eventos.length === 1 ? 'evento' : 'eventos')}`;

        const sorted = [...eventos].sort((a, b) => {
            const da = a.data || '9999-99-99';
            const db = b.data || '9999-99-99';
            return da.localeCompare(db);
        });

        if (selectEl && eventos.length > 0) {
            selectEl.innerHTML = `
                <div class="evento-dropdown-wrap">
                    <button class="evento-dropdown-trigger" id="evento-dropdown-trigger">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        <span id="evento-dropdown-label">${T('Todos os eventos')}</span>
                        <svg class="evento-dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div class="evento-dropdown-list" id="evento-dropdown-list">
                        <button class="evento-dropdown-item active" data-evento-id="">${T('Todos os eventos')}</button>
                        ${sorted.map(e => {
                            const label = `${Utils.formatDate(e.data)} — ${Utils.escapeHtml(e.nome)}`;
                            return `<button class="evento-dropdown-item" data-evento-id="${e.id}">${label}</button>`;
                        }).join('')}
                    </div>
                </div>`;
            const trigger = document.getElementById('evento-dropdown-trigger');
            const dropdown = document.getElementById('evento-dropdown-list');
            trigger?.addEventListener('click', (ev) => {
                ev.stopPropagation();
                document.getElementById('exec-dropdown-list')?.classList.remove('open');
                dropdown?.classList.toggle('open');
            });
            document.addEventListener('click', () => dropdown?.classList.remove('open'));
            selectEl.querySelectorAll('.evento-dropdown-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectEl.querySelectorAll('.evento-dropdown-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const label = document.getElementById('evento-dropdown-label');
                    if (label) label.textContent = btn.textContent;
                    dropdown?.classList.remove('open');
                    this._renderEventoResults(btn.dataset.eventoId);
                });
            });
            // Verificar se veio de um evento específico
            const preselectId = this._preselectEventoId || '';
            this._preselectEventoId = '';
            if (preselectId) {
                // Atualizar label e filtrar diretamente
                const ev = eventos.find(e => e.id === preselectId);
                if (ev) {
                    const label = document.getElementById('evento-dropdown-label');
                    if (label) label.textContent = `${Utils.formatDate(ev.data)} — ${Utils.escapeHtml(ev.nome)}`;
                    // Marcar item como ativo
                    selectEl.querySelectorAll('.evento-dropdown-item').forEach(b => {
                        b.classList.toggle('active', b.dataset.eventoId === preselectId);
                    });
                }
                this._renderEventoResults(preselectId);
            } else {
                this._renderEventoResults('');
            }
        } else if (selectEl) {
            selectEl.innerHTML = '';
            App.renderResultsStats('resultados-eventos-stats', []);
            document.getElementById('resultados-eventos-podium-alunos').innerHTML = `<p style="color:var(--text-muted);text-align:center;width:100%">${T('Nenhum dado disponível')}</p>`;
            document.getElementById('resultados-eventos-podium-series').innerHTML = `<p style="color:var(--text-muted);text-align:center;width:100%">${T('Nenhum dado disponível')}</p>`;
            App.renderDisciplineChart('resultados-eventos-chart', []);
        }

        if (list) list.innerHTML = '';
    },

    _renderEventoResults(eventoId) {
        const allLogs = Data.getLogs();
        const logs = eventoId ? allLogs.filter(l => l.eventoId === eventoId) : allLogs.filter(l => l.eventoId);
        this._currentEventoLogs = logs;
        this._currentEventoId = eventoId;
        this._currentExecFilter = '';

        const execEl = document.getElementById('resultados-eventos-execucoes');
        if (execEl) {
            const execMap = new Map();
            logs.filter(l => l.execucaoId).sort((a, b) => (b.data || '').localeCompare(a.data || '')).forEach(l => {
                if (!execMap.has(l.execucaoId)) execMap.set(l.execucaoId, l);
            });
            if (execMap.size > 1) {
                const entries = [...execMap.entries()];
                const makeLabel = (log, i) => {
                    const dt = log.data ? new Date(log.data) : null;
                    const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
                    const dtStr = dt ? dt.toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                    return T('Execução {n} — {data}', { n: i + 1, data: dtStr });
                };
                execEl.innerHTML = `
                    <div class="evento-dropdown-wrap">
                        <button class="evento-dropdown-trigger" id="exec-dropdown-trigger">
                            ${Utils.icon('clock', 16)}
                            <span id="exec-dropdown-label">${T('Todas as execuções')}</span>
                            <svg class="evento-dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div class="evento-dropdown-list" id="exec-dropdown-list">
                            <button class="evento-dropdown-item active" data-exec="">${T('Todas as execuções')}</button>
                            ${entries.map(([execId, log], i) => {
                                return `<button class="evento-dropdown-item" data-exec="${execId}">${makeLabel(log, i)}</button>`;
                            }).join('')}
                        </div>
                    </div>`;
                execEl.classList.remove('hidden');
                const trigger = document.getElementById('exec-dropdown-trigger');
                const dropdown = document.getElementById('exec-dropdown-list');
                trigger?.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    document.getElementById('evento-dropdown-list')?.classList.remove('open');
                    dropdown?.classList.toggle('open');
                });
                document.addEventListener('click', () => dropdown?.classList.remove('open'));
                execEl.querySelectorAll('.evento-dropdown-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        execEl.querySelectorAll('.evento-dropdown-item').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        const label = document.getElementById('exec-dropdown-label');
                        if (label) label.textContent = btn.textContent;
                        dropdown?.classList.remove('open');
                        this._currentExecFilter = btn.dataset.exec;
                        this._updateEventoResults();
                    });
                });
            } else {
                execEl.innerHTML = '';
                execEl.classList.add('hidden');
            }
        }

        this._updateEventoResults();
    },

    _updateEventoResults() {
        let logs = this._currentEventoLogs;
        if (this._currentExecFilter) {
            logs = logs.filter(l => l.execucaoId === this._currentExecFilter);
        }
        App.renderResultsStats('resultados-eventos-stats', logs);
        App.renderPodium('resultados-eventos-podium-alunos', logs);

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
        const serieEl = document.getElementById('resultados-eventos-podium-series');
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

        App.renderDisciplineChart('resultados-eventos-chart', logs);

        const groups = Data.groupLogsByExecucao(logs);
        this._renderEventLogsContent(groups);
    },

    filterEventLogs() {},

    // Uma linha da tabela de logs de execução de evento (usado por _renderEventLogsContent).
    _buildEventLogRowHtml(l) {
        const isOk = l.resultado === 'acerto';
        return `
                                <tr>
                                    <td><span class="log-result-badge ${isOk ? 'correct' : 'wrong'}">
                                        ${isOk
                                            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                                            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                                        }
                                    </span></td>
                                    <td class="log-cell-name">${Utils.escapeHtml(l.aluno || '-')}</td>
                                    <td class="log-cell-word">${Utils.escapeHtml(l.palavra)}</td>
                                    <td class="log-cell-error">${Utils.logErrorCell(l)}</td>
                                    <td class="log-cell-disc">${Utils.escapeHtml(l.disciplinaNome || '-')}</td>
                                    <td class="log-cell-series">${Utils.escapeHtml(l.serieNome || '-')}</td>
                                    <td class="log-cell-time">${Utils.formatTime(l.tempo || 0)}</td>
                                </tr>`;
    },

    // Um card de execução (grupo de logs) na tela de resultados de evento
    // (usado por _renderEventLogsContent).
    _buildEventLogGroupHtml(g, idx, locale) {
        const dt = g.startTime ? new Date(g.startTime) : null;
        const dtStr = dt ? dt.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }) + T(' às ') + dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : T('Data desconhecida');
        const execId = g.execucaoId || '';
        return `
            <div class="event-exec-group glass">
                <div class="event-exec-header">
                    ${Utils.icon('clock', 16)}
                    <span class="event-exec-date">${dtStr}</span>
                    <span class="event-exec-badge">${g.total} ${T(g.total !== 1 ? 'palavras' : 'palavra')} · ${g.acertos} ${T(g.acertos !== 1 ? 'acertos' : 'acerto')} · ${g.taxa}%</span>
                    <button class="btn-icon-sm danger event-exec-delete" data-exec-id="${execId}" data-exec-idx="${idx}" title="${T('Excluir execução')}" aria-label="${T('Excluir execução')}">
                        ${Utils.icon('trash', 14)}
                    </button>
                </div>
                <div class="event-logs-table-wrap">
                    <table class="event-logs-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>${T('Aluno')}</th>
                                <th>${T('Palavra')}</th>
                                <th>${T('Erro')}</th>
                                <th>${T('Disciplina')}</th>
                                <th>${T('Série')}</th>
                                <th>${T('Tempo')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${g.logs.map(l => this._buildEventLogRowHtml(l)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    // Liga o botão "excluir" de cada card de execução renderizado por
    // _renderEventLogsContent, removendo os logs correspondentes.
    _bindEventLogDeleteButtons(container, groups) {
        container.querySelectorAll('.event-exec-delete').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const execIdx = parseInt(btn.dataset.execIdx);
                if (!confirm(T('Excluir esta execução e todos os seus registros?'))) return;
                const group = groups[execIdx];
                if (!group) return;
                const logIds = new Set(group.logs.map(l => l.id));
                const allLogs = Data.getLogs();
                Data.saveLogs(allLogs.filter(l => !logIds.has(l.id)));
                const execLabel = group.execucaoId || group.logs[0]?.aluno || `#${execIdx + 1}`;
                Data.addAdminLog('excluir', 'Dados', `Execução de evento excluída: ${execLabel}`);
                this._renderEventoResults(this._currentEventoId);
            });
        });
    },

    _renderEventLogsContent(groups) {
        const container = document.getElementById('event-logs-content');
        if (!container) return;
        if (!groups || groups.length === 0) {
            container.innerHTML = `<p class="event-logs-empty">${T('Nenhum registro encontrado.')}</p>`;
            return;
        }
        const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
        container.innerHTML = groups.map((g, idx) => this._buildEventLogGroupHtml(g, idx, locale)).join('');
        this._bindEventLogDeleteButtons(container, groups);
    },

    async clearAllAvulsos() {
        const logs = Data.getLogs().filter(l => !l.eventoId);
        if (logs.length === 0) {
            alert(T('Não há resultados avulsos para limpar.'));
            return;
        }
        const total = logs.length;
        const msg = T('Excluir TODOS os resultados avulsos ({n} {registro})?\n\nEsta ação não pode ser desfeita.\nUm backup automático será criado antes, para que você possa restaurar os dados a qualquer momento.', { n: total, registro: T(total === 1 ? 'registro' : 'registros') });
        if (!confirm(msg)) return;
        const btn = document.getElementById('btn-clear-avulsos');
        if (btn) btn.disabled = true;
        try {
            const meta = await Data.saveLocalBackup(true);
            const allLogs = Data.getLogs();
            Data.saveLogs(allLogs.filter(l => l.eventoId));
            Data.addAdminLog('excluir', 'Dados', T('Todos os resultados avulsos excluídos ({n} registros) — backup: {nome}', { n: total, nome: meta.fileName || T('criado') }));
            this.loadResultadosAvulsos();
            alert(T('Todos os resultados avulsos foram excluídos ({n} registros).\n\nBackup automático criado antes da exclusão. Você pode restaurá-lo na seção Backups a qualquer momento.', { n: total }));
        } catch (e) {
            alert(T('Nenhum backup foi criado. Exclusão cancelada para não perder dados.\nErro: {msg}', { msg: e.message }));
        }
        if (btn) btn.disabled = false;
    },

    async clearAllEventos() {
        const logs = Data.getLogs().filter(l => l.eventoId);
        if (logs.length === 0) {
            alert(T('Não há resultados de eventos para limpar.'));
            return;
        }
        const total = logs.length;
        const msg = T('Excluir TODOS os resultados de eventos ({n} {registro})?\n\nEsta ação não pode ser desfeita.\nUm backup automático será criado antes, para que você possa restaurar os dados a qualquer momento.', { n: total, registro: T(total === 1 ? 'registro' : 'registros') });
        if (!confirm(msg)) return;
        const btn = document.getElementById('btn-clear-eventos');
        if (btn) btn.disabled = true;
        try {
            const meta = await Data.saveLocalBackup(true);
            const allLogs = Data.getLogs();
            Data.saveLogs(allLogs.filter(l => !l.eventoId));
            Data.addAdminLog('excluir', 'Dados', T('Todos os resultados de eventos excluídos ({n} registros) — backup: {nome}', { n: total, nome: meta.fileName || T('criado') }));
            this.loadResultadosEventos();
            alert(T('Todos os resultados de eventos foram excluídos ({n} registros).\n\nBackup automático criado antes da exclusão. Você pode restaurá-lo na seção Backups a qualquer momento.', { n: total }));
        } catch (e) {
            alert(T('Nenhum backup foi criado. Exclusão cancelada para não perder dados.\nErro: {msg}', { msg: e.message }));
        }
        if (btn) btn.disabled = false;
    },

    // ===== LOG DE ATIVIDADES =====
    loadAdminLogs() {
        const searchEl = document.getElementById('admin-logs-search');
        const sectionEl = document.getElementById('admin-logs-filter-section');
        const actionEl = document.getElementById('admin-logs-filter-action');

        const logs = Data.getAdminLogs();
        const sectionLabels = {
            'Séries': T('Séries'), 'Turmas': T('Turmas'), 'Disciplinas': T('Disciplinas'), 'Palavras': T('Palavras'),
            'Eventos': T('Eventos'), 'Dados': T('Dados'), 'Configurações': T('Configurações'),
            'Log de Atividades': T('Log de Atividades')
        };
        const actionLabels = {
            criar: T('Criar'), editar: T('Editar'), excluir: T('Excluir'),
            importar: T('Importar'), exportar: T('Exportar'), migrar: T('Migrar')
        };

        const existingSections = [...new Set(logs.map(l => l.section).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        const existingActions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();

        if (sectionEl) {
            const prevSection = sectionEl.value;
            sectionEl.innerHTML = `<option value="">${T('Todas as seções')}</option>` +
                existingSections.map(s => `<option value="${s}" ${s === prevSection ? 'selected' : ''}>${sectionLabels[s] || s}</option>`).join('');
        }

        if (actionEl) {
            const prevAction = actionEl.value;
            actionEl.innerHTML = `<option value="">${T('Todas as ações')}</option>` +
                existingActions.map(a => `<option value="${a}" ${a === prevAction ? 'selected' : ''}>${actionLabels[a] || a}</option>`).join('');
        }

        const render = () => this._renderAdminLogs(
            sectionEl?.value || '',
            actionEl?.value || '',
            searchEl?.value || ''
        );

        sectionEl?.removeEventListener('change', render);
        actionEl?.removeEventListener('change', render);
        searchEl?.removeEventListener('input', render);
        sectionEl?.addEventListener('change', render);
        actionEl?.addEventListener('change', render);
        searchEl?.addEventListener('input', render);

        document.getElementById('btn-export-admin-logs')?.removeEventListener('click', this._exportAdminLogsHandler);
        document.getElementById('btn-clear-admin-logs')?.removeEventListener('click', this._clearAdminLogsHandler);
        this._exportAdminLogsHandler = () => this._exportAdminLogsCSV();
        this._clearAdminLogsHandler = () => {
            if (confirm(T('Excluir todo o histórico de atividades?'))) {
                Data.clearAdminLogs();
                render();
            }
        };
        document.getElementById('btn-export-admin-logs')?.addEventListener('click', this._exportAdminLogsHandler);
        document.getElementById('btn-clear-admin-logs')?.addEventListener('click', this._clearAdminLogsHandler);

        render();
    },

    _renderAdminLogs(sectionFilter, actionFilter, searchText) {
        const container = document.getElementById('admin-logs-list');
        const countEl = document.getElementById('admin-logs-count');
        if (!container) return;

        let logs = Data.getAdminLogs().reverse();

        if (sectionFilter) logs = logs.filter(l => l.section === sectionFilter);
        if (actionFilter) logs = logs.filter(l => l.action === actionFilter);
        if (searchText) {
            const q = searchText.toLowerCase();
            logs = logs.filter(l => {
                const detailTxt = (typeof I18n !== 'undefined' && I18n.current) ? I18n.logDetails(l.details || '') : '';
                const sectionTxt = (l.section && typeof I18n !== 'undefined' && I18n.current) ? T(l.section) : '';
                return (l.details || '').toLowerCase().includes(q) ||
                    detailTxt.toLowerCase().includes(q) ||
                    (l.section || '').toLowerCase().includes(q) ||
                    sectionTxt.toLowerCase().includes(q) ||
                    (l.action || '').toLowerCase().includes(q);
            });
        }

        if (countEl) countEl.textContent = `${logs.length} ${T(logs.length !== 1 ? 'registros' : 'registro')}`;

        if (logs.length === 0) {
            container.innerHTML = `<p class="event-logs-empty">${T('Nenhum registro encontrado.')}</p>`;
            return;
        }

        const actionLabels = {
            criar: `<span class="admin-log-badge create">${T('Criar')}</span>`,
            editar: `<span class="admin-log-badge edit">${T('Editar')}</span>`,
            excluir: `<span class="admin-log-badge delete">${T('Excluir')}</span>`,
            importar: `<span class="admin-log-badge import">${T('Importar')}</span>`,
            exportar: `<span class="admin-log-badge export">${T('Exportar')}</span>`,
            migrar: `<span class="admin-log-badge migrate">${T('Migrar')}</span>`
        };

        container.innerHTML = `
            <div class="admin-logs-table-wrap">
                <table class="admin-logs-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>${T('Data / Hora')}</th>
                            <th>${T('Seção')}</th>
                            <th>${T('Ação')}</th>
                            <th>${T('Detalhes')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map((l, i) => {
                            const dt = new Date(l.timestamp);
                            const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
                            const dtStr = dt.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            const sectionTxt = l.section ? T(l.section) : '-';
                            const detailTxt = (typeof I18n !== 'undefined' && I18n.current) ? I18n.logDetails(l.details || '') : (l.details || '');
                            return `
                            <tr>
                                <td class="admin-log-row-num">${i + 1}</td>
                                <td class="admin-log-date">${dtStr}</td>
                                <td class="admin-log-section">${Utils.escapeHtml(sectionTxt)}</td>
                                <td class="admin-log-action">${actionLabels[l.action] || Utils.escapeHtml(l.action)}</td>
                                <td class="admin-log-details">${Utils.escapeHtml(detailTxt || '-')}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    _exportAdminLogsCSV() {
        const logs = Data.getAdminLogs();
        if (logs.length === 0) return;
        const BOM = '\uFEFF';
        const header = T('Data/Hora;Seção;Ação;Detalhes') + '\r\n';
        const rows = logs.map(l => {
            const dt = new Date(l.timestamp);
            const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
            const dtStr = dt.toLocaleDateString(locale) + ' ' + dt.toLocaleTimeString(locale);
            const actionLabels = {
                criar: T('Criar'), editar: T('Editar'), excluir: T('Excluir'),
                importar: T('Importar'), exportar: T('Exportar'), migrar: T('Migrar')
            };
            const sectionTxt = l.section ? T(l.section) : '';
            const detailTxt = (typeof I18n !== 'undefined' && I18n.current) ? I18n.logDetails(l.details || '') : (l.details || '');
            return `"${dtStr}";"${sectionTxt}";"${actionLabels[l.action] || l.action || ''}";"${(detailTxt || '').replace(/"/g, '""')}"`;
        }).join('\r\n');
        const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = T('atividades') + `_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        Data.addAdminLog('exportar', 'Log de Atividades', T('Log de atividades exportado em CSV'));
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        Data.updateSetting('darkMode', next === 'dark');
        App.updateThemeToggleIcon();
    },

    // ===== CONFIGURAÇÕES =====
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
        document.querySelectorAll('.color-theme-swatch').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === (settings.theme || 'default'));
        });
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
            'setting-letter-animation': 'letterAnimation'
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

    // ===== BACKUP LOCAL =====
    _formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },

    async loadBackupInfo() {
        const info = document.getElementById('backup-local-info');
        const tableContainer = document.getElementById('backup-table-container');
        if (!info) return;

        let backups = [];
        try { backups = await Data.listBackups(); } catch (e) { console.warn(e); }

        if (backups.length === 0) {
            info.innerHTML = T('Nenhum backup salvo.');
            if (tableContainer) tableContainer.innerHTML = '';
            return;
        }

        const manualCount = backups.filter(b => !b.isAuto).length;
        const autoCount = backups.filter(b => b.isAuto).length;
        info.innerHTML = `<strong>${backups.length}</strong> ${T(backups.length > 1 ? 'backups' : 'backup')} ${T('na pasta')} <code>backups</code>` +
            (autoCount > 0 ? ` (${manualCount} ${T(manualCount > 1 ? 'manuais' : 'manual')}, ${autoCount} ${T(autoCount > 1 ? 'automáticos' : 'automático')})` : '');

        let html = `<div class="table-container"><table class="data-table"><thead><tr><th>${T('Data')}</th><th>${T('Tamanho')}</th><th>${T('Tipo')}</th><th>${T('Ações')}</th></tr></thead><tbody>`;
        for (const b of backups) {
            const dateStr = b.date && !b.invalid
                ? b.date.toLocaleDateString((typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR') + ' ' + b.date.toLocaleTimeString((typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '—';
            const typeLabel = b.isAuto ? T('Automático') : T('Manual');
            const typeClass = b.isAuto ? 'badge-auto' : 'badge-manual';
            html += `<tr>
                <td>${dateStr}</td>
                <td>${this._formatFileSize(b.size)}</td>
                <td><span class="backup-type-badge ${typeClass}">${typeLabel}</span></td>
                <td class="backup-actions">
                    <button class="btn btn-secondary btn-small" data-action="restore-backup" data-name="${Utils.escapeHtml(b.name)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> ${T('Restaurar')}</button>
                    <button class="btn btn-secondary btn-small btn-danger-text" data-action="delete-backup" data-name="${Utils.escapeHtml(b.name)}">${Utils.icon('trash', 14)} ${T('Excluir')}</button>
                </td>
            </tr>`;
        }
        html += '</tbody></table></div>';
        if (tableContainer) tableContainer.innerHTML = html;
    },

    async saveLocalBackup() {
        const btn = document.getElementById('btn-backup-save');
        if (btn) { btn.disabled = true; btn.textContent = T('Salvando...'); }
        try {
            const meta = await Data.saveLocalBackup();
            if (meta.downloaded) {
                alert(T('Pasta não selecionada. Arquivo de backup baixado.'));
            } else {
                alert(T('Backup salvo!\n{n} séries, {m} palavras, {p} logs.', { n: meta.totalSeries, m: meta.totalPalavras, p: meta.totalLogs }));
            }
            this.loadBackupInfo();
        } catch (e) {
            console.error('Erro ao salvar backup:', e);
            if (e.name !== 'AbortError') alert(T('Erro ao salvar backup: {msg}', { msg: e.message }));
        }
        if (btn) { btn.disabled = false; btn.innerHTML = Utils.icon('save', 16) + ' ' + T('Salvar Backup'); }
    },

    restoreBackup(fileName) {
        this._restoreFileName = fileName;
        document.querySelectorAll('#restore-step-selective input[type="checkbox"]').forEach(cb => cb.checked = true);
        const checkAll = document.getElementById('restore-check-all');
        if (checkAll) { checkAll.checked = true; checkAll.indeterminate = false; }
        const ow = document.querySelector('#restore-step-selective input[name="restore-merge-mode"][value="overwrite"]');
        if (ow) ow.checked = true;
        document.getElementById('restore-step-choice').classList.remove('hidden');
        document.getElementById('restore-step-selective').classList.add('hidden');
        document.getElementById('btn-restore-confirm').style.display = 'none';
        const desc = document.getElementById('restore-desc');
        if (desc) desc.textContent = T('Como deseja restaurar os dados do backup "{nome}"?', { nome: fileName });
        const contentsEl = document.getElementById('restore-contents');
        if (contentsEl) {
            contentsEl.textContent = T('Lendo conteúdo do backup...');
            Data.getBackupContents(fileName).then(contents => {
                if (contents) {
                    contentsEl.textContent = T('Conteúdo: {a} resultado(s) avulso(s) · {b} resultado(s) de evento · {p} palavra(s) · {s} série(s) · {e} evento(s)', { a: contents.avulsos, b: contents.eventosLogs, p: contents.palavras, s: contents.series, e: contents.eventos });
                } else {
                    contentsEl.textContent = T('Não foi possível ler o conteúdo deste backup.');
                }
            }).catch(() => {
                if (contentsEl) contentsEl.textContent = T('Não foi possível ler o conteúdo deste backup.');
            });
        }
        document.getElementById('modal-restore').classList.remove('hidden');
    },

    closeRestoreModal() {
        document.getElementById('modal-restore').classList.add('hidden');
        this._restoreFileName = null;
    },

    async _doRestoreOverwriteAll() {
        const fileName = this._restoreFileName;
        if (!fileName) return;
        if (!confirm(T('Restaurar backup "{nome}"?\nOs dados atuais serão substituídos.\n\nUm backup automático será criado antes, para que você possa voltar ao estado atual.', { nome: fileName }))) return;
        this.closeRestoreModal();
        try {
            let backupMsg = '';
            try {
                const meta = await Data.saveLocalBackup(true);
                backupMsg = meta.downloaded
                    ? T('\n\nUm backup do estado atual foi baixado como arquivo.')
                    : T('\n\nBackup do estado atual salvo em "{nome}".', { nome: meta.savedTo });
            } catch (be) {
                if (be.name !== 'AbortError') console.warn('Backup automático falhou:', be);
            }
            const result = await Data.restoreLocalBackup(fileName);
            alert(T('Backup restaurado com sucesso! ({n} imagens)\n\nAgora no sistema: {a} resultado(s) avulso(s), {e} resultado(s) de evento.{msg}', { n: result.images, a: result.avulsos, e: result.eventos, msg: backupMsg }));
            this.loadSection(this.currentSection);
        } catch (e) {
            if (e.name !== 'AbortError') alert(T('Erro ao restaurar: {msg}', { msg: e.message }));
        }
    },

    _showRestoreSelective() {
        document.getElementById('restore-step-choice').classList.add('hidden');
        document.getElementById('restore-step-selective').classList.remove('hidden');
        document.getElementById('btn-restore-confirm').style.display = '';
    },

    async _doRestoreSelective() {
        const fileName = this._restoreFileName;
        const checkboxes = document.querySelectorAll('#restore-step-selective input[type="checkbox"]:checked');
        const entities = Array.from(checkboxes).map(cb => cb.dataset.entity).filter(Boolean);
        if (entities.length === 0) { alert(T('Selecione pelo menos um tipo de dado para restaurar.')); return; }
        const mergeMode = document.querySelector('#restore-step-selective input[name="restore-merge-mode"]:checked')?.value || 'overwrite';
        const entityLabels = {
            series: T('Séries'), turmas: T('Turmas'), disciplinas: T('Disciplinas'), palavras: T('Palavras'),
            eventos: T('Eventos'), logsAvulsos: T('Resultados de Jogos Avulsos'),
            logsEventos: T('Resultados de Eventos'), adminLogs: T('Logs de Atividades'), settings: T('Configurações')
        };
        const modeLabels = { overwrite: T('sobrescrever'), skip: T('ignorar'), update: T('atualizar') };
        const entityLabel = entities.map(e => entityLabels[e] || e).join(', ');
        if (!confirm(T('Restaurar do backup "{nome}" apenas: {entidades}?\nModo de conflito: {modo}.\n\nUm backup automático será criado antes, para que você possa voltar ao estado atual.', { nome: fileName, entidades: entityLabel, modo: modeLabels[mergeMode] || mergeMode }))) return;
        this.closeRestoreModal();
        try {
            let backupMsg = '';
            try {
                const meta = await Data.saveLocalBackup(true);
                backupMsg = meta.downloaded
                    ? T('\n\nUm backup do estado atual foi baixado como arquivo.')
                    : T('\n\nBackup do estado atual salvo em "{nome}".', { nome: meta.savedTo });
            } catch (be) {
                if (be.name !== 'AbortError') console.warn('Backup automático falhou:', be);
            }
            const result = await Data.restoreLocalBackup(fileName, { entities, mergeMode });
            const resultMsg = result.avulsos !== undefined || result.eventos !== undefined
                ? T('\n\nAgora no sistema: {a} resultado(s) avulso(s), {e} resultado(s) de evento.', { a: result.avulsos, e: result.eventos })
                : '';
            alert(T('Restauração seletiva concluída!{msg}{backup}', { msg: resultMsg, backup: backupMsg }));
            this.loadSection(this.currentSection);
        } catch (e) {
            if (e.name !== 'AbortError') alert(T('Erro ao restaurar: {msg}', { msg: e.message }));
        }
    },

    async deleteBackup(fileName) {
        if (!confirm(T('Excluir backup "{nome}"?', { nome: fileName }))) return;
        try {
            await Data.deleteSingleBackup(fileName);
            this.loadBackupInfo();
        } catch (e) {
            alert(T('Erro ao excluir: {msg}', { msg: e.message }));
        }
    },

    async deleteAllBackups() {
        if (!confirm(T('Excluir TODOS os backups?'))) return;
        try {
            await Data.deleteAllBackups();
            this.loadBackupInfo();
            alert(T('Todos os backups excluídos.'));
        } catch (e) {
            if (e.name !== 'AbortError') alert(T('Erro ao excluir: {msg}', { msg: e.message }));
        }
    },

    // ===== EXPORTAR/IMPORTAR =====
    exportLogs() {
        const csv = Data.exportLogsCSV();
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soletrando_logs.csv';
        a.click();
        URL.revokeObjectURL(url);
        Data.addAdminLog('exportar', 'Dados', T('Logs de atividade exportados em CSV'));
    },

    async exportAll() {
        const btn = document.getElementById('btn-export-all');
        if (btn) { btn.disabled = true; btn.textContent = T('Exportando...'); }
        try {
            const palavras = Data.getPalavras();
            const turmas = Data.getTurmas();
            let embeddedCount = 0;

            for (const p of palavras) {
                if (p.imagem && p.imagem.startsWith('disk:')) {
                    const bytes = await Utils.resolveImageBytes(p.imagem);
                    if (bytes) {
                        const ext = p.imagem.split('.').pop().toLowerCase();
                        const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }[ext] || 'image/png';
                        const b64 = btoa(String.fromCharCode(...bytes));
                        p.imagem = `data:${mime};base64,${b64}`;
                        embeddedCount++;
                    }
                }
            }
            Utils.log(`[Export] ${embeddedCount} imagens embutidas no JSON`);

            const opfsImages = await Utils.collectAllImagesFromOPFS();
            Utils.log(`[Export] ${opfsImages.length} imagens brutas do OPFS`);

            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                series: Data.getSeries(),
                turmas: turmas,
                disciplinas: Data.getDisciplinas(),
                palavras: palavras,
                eventos: Data.getEventos(),
                logs: Data.getLogs(),
                adminLogs: Data.getAdminLogs(),
                settings: Data.getSettings()
            };

            const entries = [{ path: 'dados.json', data: new TextEncoder().encode(JSON.stringify(exportData, null, 2)) }];
            for (const img of opfsImages) entries.push(img);

            const blob = Utils.createZip(entries);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'soletrando_backup.zip';
            a.click();
            URL.revokeObjectURL(url);
            Data.addAdminLog('exportar', 'Dados', T('Backup completo exportado (ZIP)'));
        } catch (e) {
            console.error('Erro ao exportar:', e);
            alert(T('Erro ao exportar dados: {msg}', { msg: e.message }));
        }
        if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> ' + T('Exportar Tudo (ZIP)'); }
    },

    // === Importação com opções ===
    _importParsedData: null,
    _importFileIsZip: false,
    _importZipEntries: null,

    _bindCheckAll(checkAllId, checklistSel) {
        const checkAll = document.getElementById(checkAllId);
        if (!checkAll) return;
        const boxes = () => Array.from(document.querySelectorAll(checklistSel + ' input[type="checkbox"]')).filter(b => b.id !== checkAllId);
        const sync = () => {
            const all = boxes();
            const checked = all.filter(b => b.checked).length;
            checkAll.checked = all.length > 0 && checked === all.length;
            checkAll.indeterminate = checked > 0 && checked < all.length;
        };
        checkAll.addEventListener('change', () => boxes().forEach(b => b.checked = checkAll.checked));
        boxes().forEach(b => b.addEventListener('change', sync));
        sync();
    },

    async importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput?.files[0];
        if (!file) { alert(T('Selecione um arquivo para importar.')); return; }

        try {
            if (file.name.endsWith('.zip')) {
                const buf = await file.arrayBuffer();
                const entries = await Utils.readZip(buf);
                const dadosEntry = entries.find(e => e.path === 'dados.json');
                if (!dadosEntry) { alert(T('Arquivo ZIP inválido: dados.json não encontrado.')); return; }
                const text = new TextDecoder().decode(dadosEntry.data);
                this._importParsedData = JSON.parse(text);
                this._importFileIsZip = true;
                this._importZipEntries = entries;
            } else {
                const text = await file.text();
                this._importParsedData = JSON.parse(text);
                this._importFileIsZip = false;
                this._importZipEntries = null;
            }
        } catch (error) {
            console.error('Erro ao ler arquivo:', error);
            alert(T('Erro ao ler o arquivo. Verifique se é um arquivo JSON ou ZIP válido.'));
            return;
        }

        // Mostrar modal de opções
        document.getElementById('import-step-choice').classList.remove('hidden');
        document.getElementById('import-step-selective').classList.add('hidden');
        document.getElementById('btn-import-confirm').style.display = 'none';
        document.getElementById('modal-import').classList.remove('hidden');
    },

    closeImportModal() {
        document.getElementById('modal-import').classList.add('hidden');
        this._importParsedData = null;
        this._importFileIsZip = false;
        this._importZipEntries = null;
    },

    async _doImportOverwriteAll() {
        const data = this._importParsedData;
        const isZip = this._importFileIsZip;
        const zipEntries = this._importZipEntries;
        this.closeImportModal();

        const btn = document.getElementById('btn-import');
        if (btn) { btn.disabled = true; btn.textContent = T('Importando...'); }

        try {
            let backupMsg = '';
            try {
                const meta = await Data.saveLocalBackup(true);
                if (meta.downloaded) {
                    backupMsg = T('\n\nUm backup foi baixado como arquivo.');
                } else {
                    backupMsg = T('\n\nBackup automático salvo em "{nome}" ({n} séries, {m} palavras).', { nome: meta.savedTo, n: meta.totalSeries, m: meta.totalPalavras });
                }
            } catch (be) {
                if (be.name !== 'AbortError') console.warn('Backup automático falhou:', be);
            }

            const text = JSON.stringify(data);
            const success = Data.importData(text);
            if (!success) { alert(T('Erro ao importar dados. Verifique o formato.')); if (btn) { btn.disabled = false; btn.innerHTML = Utils.icon('save', 16) + ' ' + T('Importar'); } return; }

            let imgCount = 0;
            if (isZip && zipEntries) {
                const imageEntries = zipEntries.filter(e => (e.path.startsWith('img/') || e.path.startsWith('imagens/')) && e.data.length > 0);
                if (imageEntries.length) {
                    await Utils.importImagesToOPFS(imageEntries);
                    imgCount = imageEntries.length;
                }
            }

            alert(T('Dados importados com sucesso! ({n} imagens restauradas){msg}', { n: imgCount, msg: backupMsg }));
            this.loadSection(this.currentSection);
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert(T('Erro ao importar dados.'));
        }

        if (btn) { btn.disabled = false; btn.innerHTML = Utils.icon('save', 16) + ' ' + T('Importar'); }
    },

    _showImportSelective() {
        document.getElementById('import-step-choice').classList.add('hidden');
        document.getElementById('import-step-selective').classList.remove('hidden');
        document.getElementById('btn-import-confirm').style.display = '';
    },

    async _doImportSelective() {
        const checkboxes = document.querySelectorAll('#import-step-selective input[type="checkbox"]:checked');
        const entities = Array.from(checkboxes).map(cb => cb.dataset.entity).filter(Boolean);
        if (entities.length === 0) { alert(T('Selecione pelo menos um tipo de dado para importar.')); return; }

        const mergeMode = document.querySelector('#import-step-selective input[name="import-merge-mode"]:checked')?.value || 'overwrite';

        const data = this._importParsedData;
        const isZip = this._importFileIsZip;
        const zipEntries = this._importZipEntries;
        this.closeImportModal();

        const btn = document.getElementById('btn-import');
        if (btn) { btn.disabled = true; btn.textContent = T('Importando...'); }

        try {
            let backupMsg = '';
            try {
                const meta = await Data.saveLocalBackup(true);
                if (meta.downloaded) {
                    backupMsg = T('\n\nUm backup foi baixado como arquivo.');
                } else {
                    backupMsg = T('\n\nBackup automático salvo em "{nome}" ({n} séries, {m} palavras).', { nome: meta.savedTo, n: meta.totalSeries, m: meta.totalPalavras });
                }
            } catch (be) {
                if (be.name !== 'AbortError') console.warn('Backup automático falhou:', be);
            }

            const text = JSON.stringify(data);
            const success = Data.importDataSelective(text, { entities, mergeMode });
            if (!success) { alert(T('Erro ao importar dados. Verifique o formato.')); if (btn) { btn.disabled = false; btn.innerHTML = Utils.icon('save', 16) + ' ' + T('Importar'); } return; }

            let imgCount = 0;
            if (isZip && zipEntries) {
                const imageEntries = zipEntries.filter(e => (e.path.startsWith('img/') || e.path.startsWith('imagens/')) && e.data.length > 0);
                if (imageEntries.length) {
                    await Utils.importImagesToOPFS(imageEntries);
                    imgCount = imageEntries.length;
                }
            }

            alert(T('Importação seletiva concluída! ({n} imagens restauradas){msg}', { n: imgCount, msg: backupMsg }));
            this.loadSection(this.currentSection);
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert(T('Erro ao importar dados.'));
        }

        if (btn) { btn.disabled = false; btn.innerHTML = Utils.icon('save', 16) + ' ' + T('Importar'); }
    }
};
