// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminBackup = {
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
