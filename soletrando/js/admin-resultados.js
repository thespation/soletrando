// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminResultados = {
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

};
