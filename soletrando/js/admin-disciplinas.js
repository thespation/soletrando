// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminDisciplinas = {
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

};
