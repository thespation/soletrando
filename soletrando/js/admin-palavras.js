// Módulo de domínio do painel do professor — mesclado em Admin via Object.assign em admin.js
const AdminPalavras = {
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <span id="image-upload-label">${T('Carregar Imagem')}</span>
                            </label>
                            <button type="button" class="btn btn-secondary btn-small" data-action="remove-word-image" id="btn-remove-word-image" ${palavra?.imagem ? '' : 'style="display:none"'}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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

        // Avisar sobre modo incógnito/privado antes de tentar
        if (window.location.protocol === 'file:' || (window.navigator && window.navigator.userAgent && window.navigator.userAgent.includes('Chrome') && window.chrome && window.chrome.runtime && window.chrome.runtime.id === undefined)) {
            // Não dá pra detectar 100% confiável, mas alertar não custa
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
        const descEl = document.getElementById('migrate-modal-desc');
        const statsEl = document.getElementById('migrate-stats');
        const summaryEl = document.getElementById('migrate-summary');
        const btnStart = document.getElementById('btn-migrate-start');

        if (descEl) {
            descEl.innerHTML = T('Veja quantas imagens já estão na pasta do sistema (<code>img</code>) e quantas ainda estão fora dela.');
        }

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
        if (!diskPath) {
            const errMsg = T('não foi possível gravar na pasta img');
            console.error('[migrate] saveImageToDisk returned null/undefined', { serie: serie.nome, disc: discNome, palavra: ctx.nome });
            return { error: errMsg };
        }
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

};
