// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminLogs = {
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

};
