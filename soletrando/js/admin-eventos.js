// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminEventos = {
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

};
