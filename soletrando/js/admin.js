// @ts-check
// ===== PAINEL DO PROFESSOR =====
/**
 * @typedef {Object} AdminModule
 * @property {string} currentSection
 * @property {string|null} editingId
 * @property {boolean} _eventsBound
 * @property {function(): void} init
 * @property {function(): void} bindEvents
 * @property {function(string): void} loadSection
 * @property {function(string): void} closeForm
 */

/** @type {AdminModule} */
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
        document.getElementById('btn-migrate-images')?.addEventListener('click', () => this.openMigrateModal());
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

};

// Mescla os módulos de domínio no objeto Admin.
// Cada módulo define métodos que usam `this`; ao serem atribuídos ao Admin,
// `this` aponta para o próprio Admin em tempo de chamada.
Object.assign(Admin,
    AdminSeries,
    AdminDisciplinas,
    AdminPalavras,
    AdminEventos,
    AdminResultados,
    AdminLogs,
    AdminSettings,
    AdminBackup
);
