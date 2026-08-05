// ===== UTILITÁRIOS =====

const Utils = {
    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Formatar tempo (segundos para MM:SS)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Formatar data
    formatDate(dateString) {
        if (!dateString) return '—';
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
            return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(locale);
        }
        const date = new Date(dateString + 'T12:00:00');
        return date.toLocaleDateString((typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR');
    },

    // Formatar data e hora
    formatDateTime(dateString) {
        if (!dateString) return '—';
        const locale = (typeof I18n !== 'undefined' && I18n.current) ? I18n.locale() : 'pt-BR';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) {
            const parts = dateString.split('T')[0].split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateString;
        }
        return d.toLocaleString(locale);
    },

    // Embaralhar array (Fisher-Yates)
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Normalizar letra (remover acentos para comparação)
    normalizeLetter(letter) {
        return letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    },

    // Capitalizar texto conforme configuração
    capitalizeLetter(letter, mode = 'upper') {
        switch (mode) {
            case 'lower':
                return letter.toLowerCase();
            case 'capitalize':
                return letter.charAt(0).toUpperCase() + letter.slice(1).toLowerCase();
            case 'upper':
            default:
                return letter.toUpperCase();
        }
    },

    // Converter imagem para Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    dataUrlToFile(dataUrl, filename) {
        return new Promise((resolve, reject) => {
            try {
                const arr = dataUrl.split(',');
                const mime = (arr[0].match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
                let bytes;
                if (arr[0].includes(';base64')) {
                    const bstr = atob(arr[1]);
                    bytes = new Uint8Array(bstr.length);
                    for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i);
                } else {
                    const txt = decodeURIComponent(arr[1] || '');
                    bytes = new Uint8Array(txt.length);
                    for (let i = 0; i < txt.length; i++) bytes[i] = txt.charCodeAt(i);
                }
                resolve(new File([bytes], filename, { type: mime }));
            } catch (e) {
                reject(e);
            }
        });
    },

    // Criar elemento HTML
    createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    },

    // Escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Detalhe do erro para tabelas de resultados (letra digitada vs esperada)
    logErrorCell(log) {
        const T = (str) => (typeof I18n !== 'undefined' && I18n.current) ? I18n.t(str) : str;
        const isOk = log?.resultado === 'acerto';
        if (isOk) return '<span class="log-error-none">—</span>';
        if (!log?.letraDigitada && !log?.letraEsperada) return `<span class="log-error-detail">${T('erro')}</span>`;
        const digitada = Utils.escapeHtml(String(log.letraDigitada).toUpperCase());
        const esperada = Utils.escapeHtml(String(log.letraEsperada).toUpperCase());
        const pos = log.posicao != null ? ` (${T('{n}ª letra').split('{n}').join(Number(log.posicao) + 1)})` : '';
        return `<span class="log-error-detail">${T('digitou')} <b>${digitada}</b>, ${T('esperava')} <b>${esperada}</b>${pos}</span>`;
    },

    // Debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Copiar para clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erro ao copiar:', err);
            return false;
        }
    },

    // Download de arquivo
    downloadFile(content, filename, type = 'application/json') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Baixar imagem de uma URL (tentando contornar bloqueio CORS)
    async downloadImageAsFile(url) {
        const attempts = [
            { label: 'direto', fn: () => fetch(url, { mode: 'cors' }) },
            { label: 'proxy allorigins', fn: () => fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url)) },
            { label: 'proxy corsproxy.io', fn: () => fetch('https://corsproxy.io/?url=' + encodeURIComponent(url)) }
        ];
        for (const attempt of attempts) {
            try {
                console.log('[IMG] Baixando imagem via', attempt.label);
                const response = await attempt.fn();
                if (!response.ok) {
                    console.warn('[IMG]', attempt.label, 'retornou HTTP', response.status);
                    continue;
                }
                const blob = await response.blob();
                if (!blob.type.startsWith('image/')) {
                    console.warn('[IMG]', attempt.label, 'não retornou imagem (tipo:', blob.type + ')');
                    continue;
                }
                const ext = (blob.type.split('/')[1] || 'png') === 'svg+xml' ? 'svg' : (blob.type.split('/')[1] || 'png');
                return new File([blob], 'imagem.' + ext, { type: blob.type });
            } catch (e) {
                console.warn('[IMG] Falha via', attempt.label + ':', e.message || e);
            }
        }
        return null;
    },

    // Confirmar ação
    confirm(message) {
        return window.confirm(message);
    },

    // Alerta
    alert(message) {
        window.alert(message);
    },

    // Debounce de input
    debounceInput(input, callback, delay = 300) {
        let timeout;
        input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(callback, delay);
        });
    },

    // Scroll suave para elemento
    scrollTo(element, container) {
        if (container) {
            container.scrollTo({
                top: element.offsetTop - container.offsetTop,
                behavior: 'smooth'
            });
        } else {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Criar confetti
    createConfetti(container, count = 50) {
        const colors = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9'];
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }

        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    },

    // Criar efeito de brilho
    createSparkle(x, y, container) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.innerHTML = '✦';
        sparkle.style.color = '#fbbf24';
        sparkle.style.fontSize = '24px';
        container.appendChild(sparkle);

        setTimeout(() => {
            sparkle.remove();
        }, 600);
    },

    // ===== GERENCIAMENTO DE IMAGENS NO DISCO (OPFS) =====
    async _getImagesRoot() {
        try {
            const root = await navigator.storage.getDirectory();
            return await root.getDirectoryHandle('img', { create: true });
        } catch (e) {
            console.warn('[OPFS] Armazenamento interno indisponível:', e);
            return null;
        }
    },

    async _getOrCreateDir(parent, dirName) {
        try {
            return await parent.getDirectoryHandle(dirName, { create: true });
        } catch {
            return null;
        }
    },

    _systemRootCache: null,
    async _getSystemRootHandle(request = false) {
        try {
            if (this._systemRootCache) return this._systemRootCache;
            const root = await this.ProjectDB.load('backup_root');
            if (!root) {
                console.warn('[FS] Nenhuma pasta conectada (backup_root não encontrado no IndexedDB)');
                return null;
            }
            let perm = await root.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted' && request) {
                try { perm = await root.requestPermission({ mode: 'readwrite' }); } catch (e) { console.warn('[FS] requestPermission falhou:', e); }
            }
            if (perm !== 'granted') {
                console.warn('[FS] Permissão necessária para a pasta conectada:', root.name);
                return null;
            }
            const hasDir = async (n) => {
                try { await root.getDirectoryHandle(n); return true; } catch { return false; }
            };
            if (!(await hasDir('img')) && !(await hasDir('js'))) {
                console.warn('[FS] A pasta conectada não é a pasta do projeto:', root.name);
                return null;
            }
            this._systemRootCache = root;
            return root;
        } catch (e) {
            console.warn('[FS] Erro ao obter pasta do sistema:', e);
            return null;
        }
    },

    async saveImageToSystemFolder(relativePath, data) {
        const root = await this._getSystemRootHandle(true);
        if (!root) return { ok: false, reason: 'pasta do sistema não conectada ou sem permissão' };
        try {
            const imagensDir = await root.getDirectoryHandle('img', { create: true });
            await this.writeFileToDir(imagensDir, relativePath, data);
            return { ok: true, folder: imagensDir.name };
        } catch (e) {
            console.warn('[FS] Falha ao salvar imagem na pasta do sistema:', e);
            return { ok: false, reason: e.message || 'erro de escrita' };
        }
    },

    async deleteImageFromSystemFolder(relativePath) {
        try {
            const root = await this._getSystemRootHandle(true);
            if (!root) return;
            const imagensDir = await root.getDirectoryHandle('img');
            const parts = relativePath.split('/').filter(Boolean);
            let dir = imagensDir;
            for (let i = 0; i < parts.length - 1; i++) dir = await dir.getDirectoryHandle(parts[i]);
            await dir.removeEntry(parts[parts.length - 1]);
        } catch {}
    },

    async _getFileFromDir(dirHandle, path) {
        const parts = path.split('/').filter(Boolean);
        try {
            if (parts.length === 1) {
                const h = await dirHandle.getFileHandle(parts[0]);
                return await h.getFile();
            }
        } catch {}
        try {
            let dir = dirHandle;
            for (let i = 0; i < parts.length - 1; i++) dir = await dir.getDirectoryHandle(parts[i]);
            const h = await dir.getFileHandle(parts[parts.length - 1]);
            return await h.getFile();
        } catch {
            return null;
        }
    },

    async _readSystemImage(relativePath, asBytes) {
        try {
            const root = await this._getSystemRootHandle();
            if (!root) return null;
            const imagensDir = await root.getDirectoryHandle('img');
            const file = await this._getFileFromDir(imagensDir, relativePath);
            if (!file) return null;
            if (asBytes) {
                const buf = await file.arrayBuffer();
                return new Uint8Array(buf);
            }
            return URL.createObjectURL(file);
        } catch {
            return null;
        }
    },

    async saveImageToDisk(serieNome, disciplinaNome, palavraTexto, imageFile) {
        const mimeExt = imageFile.type.split('/')[1] || 'png';
        const ext = mimeExt === 'svg+xml' ? 'svg' : mimeExt;
        const fileName = `${this.sanitizeFileName(serieNome)}_${this.sanitizeFileName(disciplinaNome)}_${this.sanitizeFileName(palavraTexto)}.${ext}`;

        let opfsOk = false;
        const root = await this._getImagesRoot();
        if (root) {
            try {
                const fileHandle = await root.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(imageFile);
                await writable.close();
                opfsOk = true;
            } catch (e) {
                console.error('[IMG] Falha ao gravar no armazenamento interno:', e);
            }
        }

        const sysResult = await this.saveImageToSystemFolder(fileName, imageFile);

        if (sysResult.ok) {
            if (opfsOk) {
                this._logAdminImage(`Imagem de ${palavraTexto} gravada como ${fileName}: interno OK + pasta do sistema "${sysResult.folder}"`);
            } else {
                this._logAdminImage(`Imagem de ${palavraTexto} gravada como ${fileName}: interno indisponível, mas pasta do sistema OK`);
            }
            return fileName;
        }
        if (opfsOk) {
            this._logAdminImage(`Imagem de ${palavraTexto} gravada como ${fileName}: interno OK, MAS pasta do sistema falhou (${sysResult.reason})`);
            return fileName;
        }
        this._logAdminImage(`Imagem de ${palavraTexto}: não foi possível gravar em disco (interno indisponível; pasta do sistema: ${sysResult.reason})`);
        return null;
    },

    _logAdminImage(message) {
        console.log('[IMG]', message);
        try {
            if (window.Data && typeof window.Data.addAdminLog === 'function') {
                window.Data.addAdminLog('editar', 'Palavras', message);
            }
        } catch {}
    },

    async deleteImageFromDisk(serieNome, disciplinaNome, palavraTexto) {
        const root = await this._getImagesRoot();
        const baseName = `${this.sanitizeFileName(serieNome)}_${this.sanitizeFileName(disciplinaNome)}_${this.sanitizeFileName(palavraTexto)}`;

        if (root) {
            for (const ext of ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']) {
                try {
                    await root.removeEntry(baseName + '.' + ext);
                    break;
                } catch {}
            }
            try {
                const serieDir = await root.getDirectoryHandle(this.sanitizeFileName(serieNome));
                const discDir = await serieDir.getDirectoryHandle(this.sanitizeFileName(disciplinaNome));
                for (const ext of ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']) {
                    try {
                        await discDir.removeEntry(this.sanitizeFileName(palavraTexto) + '.' + ext);
                        break;
                    } catch {}
                }
                let hasFiles = false;
                for await (const _ of discDir.values()) { hasFiles = true; break; }
                if (!hasFiles) await serieDir.removeEntry(this.sanitizeFileName(disciplinaNome));
                let hasDirs = false;
                for await (const _ of serieDir.values()) { hasDirs = true; break; }
                if (!hasDirs) await root.removeEntry(this.sanitizeFileName(serieNome));
            } catch {}
        }
        for (const ext of ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']) {
            await this.deleteImageFromSystemFolder(baseName + '.' + ext);
        }
    },

    sanitizeFileName(name) {
        return name
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    },

    async resolveImagePath(imagem) {
        if (!imagem || !imagem.startsWith('disk:')) return imagem;
        const relativePath = imagem.slice(5);
        const systemUrl = await this._readSystemImage(relativePath, false);
        if (systemUrl) return systemUrl;
        const root = await this._getImagesRoot();
        if (!root) return null;
        const file = await this._getFileFromDir(root, relativePath);
        return file ? URL.createObjectURL(file) : null;
    },

    async resolveImageBytes(imagem) {
        if (!imagem || !imagem.startsWith('disk:')) return null;
        const relativePath = imagem.slice(5);
        const systemBytes = await this._readSystemImage(relativePath, true);
        if (systemBytes) return systemBytes;
        const root = await this._getImagesRoot();
        if (!root) return null;
        const file = await this._getFileFromDir(root, relativePath);
        if (!file) return null;
        const buf = await file.arrayBuffer();
        return new Uint8Array(buf);
    },

    // ===== ZIP =====
    _crc32Table: null,
    _getCrc32Table() {
        if (this._crc32Table) return this._crc32Table;
        const t = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[i] = c;
        }
        this._crc32Table = t;
        return t;
    },
    _crc32(buf) {
        const table = this._getCrc32Table();
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
        return (crc ^ 0xFFFFFFFF) >>> 0;
    },
    _encodeStr(str) {
        return new TextEncoder().encode(str);
    },
    _u16(v) { return [v & 0xFF, (v >> 8) & 0xFF]; },
    _u32(v) { return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF]; },

    createZip(entries) {
        const localHeaders = [];
        const centralHeaders = [];
        const dataChunks = [];
        let offset = 0;

        for (const entry of entries) {
            const nameBytes = this._encodeStr(entry.path);
            const dataBytes = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
            const crc = this._crc32(dataBytes);
            const now = new Date();
            const dosTime = ((now.getSeconds() >> 1)) | (now.getMinutes() << 5) | (now.getHours() << 11);
            const dosDate = now.getDate() | ((now.getMonth() + 1) << 5) | ((now.getFullYear() - 1980) << 9);

            const localHeader = new Uint8Array(30 + nameBytes.length);
            const lv = new DataView(localHeader.buffer);
            lv.setUint32(0, 0x04034b50, true);
            lv.setUint16(4, 20, true);
            lv.setUint16(6, 0, true);
            lv.setUint16(8, 0, true);
            lv.setUint16(10, dosTime, true);
            lv.setUint16(12, dosDate, true);
            lv.setUint32(14, crc, true);
            lv.setUint32(18, dataBytes.length, true);
            lv.setUint32(22, dataBytes.length, true);
            lv.setUint16(26, nameBytes.length, true);
            lv.setUint16(28, 0, true);
            localHeader.set(nameBytes, 30);

            const centralHeader = new Uint8Array(46 + nameBytes.length);
            const cv = new DataView(centralHeader.buffer);
            cv.setUint32(0, 0x02014b50, true);
            cv.setUint16(4, 20, true);
            cv.setUint16(6, 20, true);
            cv.setUint16(8, 0, true);
            cv.setUint16(10, 0, true);
            cv.setUint16(12, dosTime, true);
            cv.setUint16(14, dosDate, true);
            cv.setUint32(16, crc, true);
            cv.setUint32(20, dataBytes.length, true);
            cv.setUint32(24, dataBytes.length, true);
            cv.setUint16(28, nameBytes.length, true);
            cv.setUint16(30, 0, true);
            cv.setUint16(32, 0, true);
            cv.setUint16(34, 0, true);
            cv.setUint16(36, 0, true);
            cv.setUint32(38, 0x20, true);
            cv.setUint32(42, offset, true);
            centralHeader.set(nameBytes, 46);

            localHeaders.push(localHeader);
            dataChunks.push(dataBytes);
            centralHeaders.push(centralHeader);
            offset += localHeader.length + dataBytes.length;
        }

        const centralDirOffset = offset;
        let centralDirSize = 0;
        for (const ch of centralHeaders) centralDirSize += ch.length;

        const eocd = new Uint8Array(22);
        const ev = new DataView(eocd.buffer);
        ev.setUint32(0, 0x06054b50, true);
        ev.setUint16(4, 0, true);
        ev.setUint16(6, 0, true);
        ev.setUint16(8, entries.length, true);
        ev.setUint16(10, entries.length, true);
        ev.setUint32(12, centralDirSize, true);
        ev.setUint32(16, centralDirOffset, true);
        ev.setUint16(20, 0, true);

        const totalSize = offset + centralDirSize + 22;
        const result = new Uint8Array(totalSize);
        let pos = 0;
        for (let i = 0; i < entries.length; i++) {
            result.set(localHeaders[i], pos); pos += localHeaders[i].length;
            result.set(dataChunks[i], pos); pos += dataChunks[i].length;
        }
        for (const ch of centralHeaders) { result.set(ch, pos); pos += ch.length; }
        result.set(eocd, pos);

        return new Blob([result], { type: 'application/zip' });
    },

    async readZip(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const bytes = new Uint8Array(arrayBuffer);
        const entries = [];

        let pos = 0;
        while (pos + 30 <= bytes.length) {
            const sig = view.getUint32(pos, true);
            if (sig !== 0x04034b50) break;
            const nameLen = view.getUint16(pos + 26, true);
            const extraLen = view.getUint16(pos + 28, true);
            const compSize = view.getUint32(pos + 18, true);
            const uncompSize = view.getUint32(pos + 22, true);
            const name = new TextDecoder().decode(bytes.slice(pos + 30, pos + 30 + nameLen));
            const dataStart = pos + 30 + nameLen + extraLen;
            const data = bytes.slice(dataStart, dataStart + compSize);
            entries.push({ path: name, data, size: uncompSize });
            pos = dataStart + compSize;
        }
        return entries;
    },

    async collectAllImagesFromOPFS() {
        const images = [];
        try {
            const root = await navigator.storage.getDirectory();
            console.log('[OPFS] Root obtido');
            let imagensDir;
            try {
                imagensDir = await root.getDirectoryHandle('img', { create: false });
            } catch {
                imagensDir = await root.getDirectoryHandle('img', { create: true });
            }
            console.log('[OPFS] Diretório img obtido');
            const collectDir = async (dirHandle, prefix) => {
                for await (const [name, handle] of dirHandle.entries()) {
                    if (handle.kind === 'file') {
                        const file = await handle.getFile();
                        const buf = await file.arrayBuffer();
                        images.push({ path: prefix + name, data: new Uint8Array(buf) });
                    } else if (handle.kind === 'directory') {
                        await collectDir(handle, prefix + name + '/');
                    }
                }
            };
            await collectDir(imagensDir, 'img/');
            // Compatibilidade: migra imagens da pasta antiga "imagens" do OPFS
            try {
                const legacy = await root.getDirectoryHandle('imagens', { create: false });
                await collectDir(legacy, 'img/');
                console.log('[OPFS] Imagens da pasta antiga "imagens" migradas');
            } catch {}
            console.log(`[OPFS] ${images.length} imagens coletadas`);
        } catch (e) {
            console.error('[OPFS] Erro ao coletar imagens:', e);
        }
        try {
            const root = await this._getSystemRootHandle();
            if (root) {
                const imagensDir = await root.getDirectoryHandle('img');
                const sysImages = await this.walkDirectory(imagensDir, 'img/');
                const existing = new Set(images.map(i => i.path));
                for (const e of sysImages) {
                    if (!existing.has(e.path)) images.push(e);
                }
                console.log(`[FS] ${sysImages.length} imagens da pasta do sistema coletadas`);
            }
        } catch (e) {
            console.warn('[FS] Erro ao coletar imagens da pasta do sistema:', e);
        }
        return images;
    },

    async importImagesToOPFS(imageEntries) {
        if (!imageEntries.length) return;
        try {
            const root = await navigator.storage.getDirectory();
            const imagensDir = await root.getDirectoryHandle('img', { create: true });
            for (const entry of imageEntries) {
                const parts = entry.path.split('/').filter(Boolean);
                if (parts[0] !== 'img' && parts[0] !== 'imagens') continue;
                let dir = imagensDir;
                for (let i = 1; i < parts.length - 1; i++) {
                    dir = await dir.getDirectoryHandle(parts[i], { create: true });
                }
                const fileName = parts[parts.length - 1];
                const fileHandle = await dir.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(entry.data);
                await writable.close();
                await this.saveImageToSystemFolder(parts.slice(1).join('/'), entry.data);
            }
        } catch (e) {
            console.error('Erro ao importar imagens:', e);
        }
    },

    // ===== OPERAÇÕES COM PASTA LOCAL (File System Access API) =====
    async walkDirectory(dirHandle, prefix = '') {
        const entries = [];
        try {
            for await (const [name, handle] of dirHandle.entries()) {
                if (handle.kind === 'file') {
                    const file = await handle.getFile();
                    const buf = await file.arrayBuffer();
                    entries.push({ path: prefix + name, data: new Uint8Array(buf) });
                } else if (handle.kind === 'directory') {
                    const sub = await this.walkDirectory(handle, prefix + name + '/');
                    entries.push(...sub);
                }
            }
        } catch (e) {
            console.error('[FS] Erro ao percorrer diretório:', e);
        }
        return entries;
    },

    async writeFileToDir(dirHandle, path, data) {
        const parts = path.split('/').filter(Boolean);
        let dir = dirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i], { create: true });
        }
        const fileHandle = await dir.getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
    },

    async fileExists(dirHandle, path) {
        const parts = path.split('/').filter(Boolean);
        let dir = dirHandle;
        try {
            for (let i = 0; i < parts.length - 1; i++) {
                dir = await dir.getDirectoryHandle(parts[i]);
            }
            await dir.getFileHandle(parts[parts.length - 1]);
            return true;
        } catch {
            return false;
        }
    },

    // ===== IndexedDB para persistir handles de diretório =====
    ProjectDB: {
        DB_NAME: 'soletrando_fs',
        STORE: 'handles',

        open() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(this.DB_NAME, 1);
                req.onupgradeneeded = () => req.result.createObjectStore(this.STORE);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        },

        async save(key, value) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE, 'readwrite');
                tx.objectStore(this.STORE).put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        },

        async load(key) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE, 'readonly');
                const req = tx.objectStore(this.STORE).get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }
    }
};

// Exportar para uso global
window.Utils = Utils;