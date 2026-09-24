// @ts-check
// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
/**
 * @typedef {Object} AdminSeriesModule
 * @property {function(): void} loadSeries
 * @property {function(string|null): void} showSeriesForm
 * @property {function(): void} addFormTurmaRow
 * @property {function(HTMLElement): void} removeFormTurmaRow
 * @property {function(string|null): void} saveSeries
 * @property {function(string): void} deleteSeries
 * @property {function(string): void} toggleSeries
 * @property {function(): void} showSeriesBulkImportForm
 * @property {function(): void} addSeriesBulkRow
 * @property {function(HTMLElement): void} addBulkTurmaRow
 * @property {function(HTMLElement): void} removeBulkTurmaRow
 * @property {function(): void} saveBulkSeries
 * @property {function(string): Promise<void>} deleteTurmaFromSerie
 * @property {function(string|null): void} showTurmaForm
 * @property {function(string): void} saveTurma
 * @property {function(HTMLElement): void} _resolveCardImages
 */

/** @type {AdminSeriesModule} */
const AdminSeries = {
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
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

};
