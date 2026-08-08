// ===== GERENCIAMENTO DE DADOS =====

const Data = {
    // Chaves do LocalStorage
    KEYS: {
        SERIES: 'soletrando_series',
        TURMAS: 'soletrando_turmas',
        DISCIPLINAS: 'soletrando_disciplinas',
        PALAVRAS: 'soletrando_palavras',
        EVENTOS: 'soletrando_entity_Evento',
        LOGS: 'soletrando_entity_LogPartida',
        ADMIN_LOGS: 'soletrando_admin_logs',
        SETTINGS: 'soletrando_settings',
        SESSION: 'soletrando_session'
    },

    // Grava no localStorage com tratamento de erro (cota cheia, modo privado
    // bloqueando storage, etc.) para nunca perder uma edição silenciosamente.
    _persist(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Falha ao salvar no localStorage:', e);
            alert(typeof T === 'function'
                ? T('Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado pelo navegador.')
                : 'Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado pelo navegador.');
            return false;
        }
    },

    // ===== SÉRIES =====
    getSeries() {
        let data = JSON.parse(localStorage.getItem(this.KEYS.SERIES) || '[]');
        if (data.length === 0) {
            const legacy = JSON.parse(localStorage.getItem('soletrando_entity_Serie') || '[]');
            if (legacy.length > 0) {
                data = legacy.map(s => ({ id: s.id, nome: s.nome, createdAt: s.created_date || s.createdAt }));
                this.saveSeries(data);
            }
        }
        return data;
    },

    saveSeries(series) {
        this._persist(this.KEYS.SERIES, series);
    },

    addSeries(series) {
        const all = this.getSeries();
        const newSeries = {
            id: Utils.generateId(),
            nome: series.nome,
            professor: series.professor || '',
            active: true,
            createdAt: new Date().toISOString()
        };
        all.push(newSeries);
        this.saveSeries(all);
        const logMsg = `Série criada: ${series.nome}` + (series.professor ? ` (Professor(a): ${series.professor})` : '');
        this.addAdminLog('criar', 'Séries', logMsg);
        return newSeries;
    },

    toggleSeriesActive(id) {
        const all = this.getSeries();
        const index = all.findIndex(s => s.id === id);
        if (index !== -1) {
            all[index].active = !all[index].active;
            this.saveSeries(all);
            const status = all[index].active ? 'ativada' : 'desativada';
            this.addAdminLog('editar', 'Séries', `Série ${status}: ${all[index].nome}`);
            return all[index];
        }
        return null;
    },

    updateSeries(id, data) {
        const all = this.getSeries();
        const index = all.findIndex(s => s.id === id);
        if (index !== -1) {
            const old = { ...all[index] };
            all[index] = { ...all[index], ...data };
            this.saveSeries(all);
            const changes = [];
            if (old.nome !== all[index].nome) changes.push(`Nome: "${old.nome}" → "${all[index].nome}"`);
            if ((old.professor || '') !== (all[index].professor || '')) changes.push(`Professor(a): "${old.professor || 'vazio'}" → "${all[index].professor || 'vazio'}"`);
            this.addAdminLog('editar', 'Séries', changes.length ? changes.join('; ') : `Série editada: ${all[index].nome}`);
            return all[index];
        }
        return null;
    },

    deleteSeries(id) {
        const all = this.getSeries();
        const serie = all.find(s => s.id === id);
        // Remove série e tudo vinculado
        const turmas = this.getTurmas().filter(t => t.serieId !== id);
        const disciplinas = this.getDisciplinas().filter(d => !d.seriesIds?.includes(id));
        const palavras = this.getPalavras().filter(p => p.serieId !== id);
        
        this.saveTurmas(turmas);
        this.saveDisciplinas(disciplinas);
        this.savePalavras(palavras);
        
        const filtered = all.filter(s => s.id !== id);
        this.saveSeries(filtered);
        this.addAdminLog('excluir', 'Séries', `Série excluída: ${serie?.nome || id}`);
    },

    getSeriesById(id) {
        return this.getSeries().find(s => s.id === id);
    },

    // ===== TURMAS =====
    getTurmas() {
        let data = JSON.parse(localStorage.getItem(this.KEYS.TURMAS) || '[]');
        if (data.length === 0) {
            const legacy = JSON.parse(localStorage.getItem('soletrando_entity_Turma') || '[]');
            if (legacy.length > 0) {
                data = legacy.map(t => ({
                    id: t.id, nome: t.nome, serieId: t.serie_id, professor: t.professor || '',
                    imagensHabilitadas: t.imagens_habilitadas || t.imagensHabilitadas || false,
                    imagensMostrarInicio: t.revelar_imagem_inicio || t.imagensMostrarInicio || false,
                    createdAt: t.created_date || t.createdAt
                }));
                this.saveTurmas(data);
            }
        }
        return data;
    },

    saveTurmas(turmas) {
        this._persist(this.KEYS.TURMAS, turmas);
    },

    addTurma(turma) {
        const all = this.getTurmas();
        const newTurma = {
            id: Utils.generateId(),
            nome: turma.nome,
            serieId: turma.serieId,
            professor: turma.professor || '',
            imagensHabilitadas: turma.imagensHabilitadas || false,
            imagensMostrarInicio: turma.imagensMostrarInicio || false,
            createdAt: new Date().toISOString()
        };
        all.push(newTurma);
        this.saveTurmas(all);
        this.addAdminLog('criar', 'Turmas', `Turma criada: ${turma.nome} (${turma.professor || 'sem professor(a)'}) — Série: ${this.getSeriesById(turma.serieId)?.nome || '?'}`);
        return newTurma;
    },

    updateTurma(id, data) {
        const all = this.getTurmas();
        const index = all.findIndex(t => t.id === id);
        if (index !== -1) {
            const old = { ...all[index] };
            all[index] = { ...all[index], ...data };
            this.saveTurmas(all);
            const changes = [];
            if (old.nome !== all[index].nome) changes.push(`Nome: "${old.nome}" → "${all[index].nome}"`);
            if (old.professor !== all[index].professor) changes.push(`Professor(a): "${old.professor}" → "${all[index].professor}"`);
            this.addAdminLog('editar', 'Turmas', changes.length ? changes.join('; ') : `Turma editada: ${all[index].nome}`);
            return all[index];
        }
        return null;
    },

    deleteTurma(id) {
        const turma = this.getTurmas().find(t => t.id === id);
        const all = this.getTurmas().filter(t => t.id !== id);
        this.saveTurmas(all);
        this.addAdminLog('excluir', 'Turmas', `Turma excluída: ${turma?.nome || id}`);
    },

    getTurmasBySerie(serieId) {
        return this.getTurmas().filter(t => t.serieId === serieId);
    },

    getTurmaById(id) {
        return this.getTurmas().find(t => t.id === id);
    },

    // ===== DISCIPLINAS =====
    getDisciplinas() {
        let data = JSON.parse(localStorage.getItem(this.KEYS.DISCIPLINAS) || '[]');
        if (data.length === 0) {
            const legacy = JSON.parse(localStorage.getItem('soletrando_entity_Disciplina') || '[]');
            if (legacy.length > 0) {
                data = legacy.map(d => ({
                    id: d.id, nome: d.nome, cor: d.cor || null,
                    seriesIds: d.series_ids || d.seriesIds || [],
                    createdAt: d.created_date || d.createdAt
                }));
                this.saveDisciplinas(data);
            }
        }
        return data;
    },

    saveDisciplinas(disciplinas) {
        this._persist(this.KEYS.DISCIPLINAS, disciplinas);
    },

    addDisciplina(disciplina) {
        const all = this.getDisciplinas();
        const newDisciplina = {
            id: Utils.generateId(),
            nome: disciplina.nome,
            seriesIds: disciplina.seriesIds || [],
            createdAt: new Date().toISOString()
        };
        all.push(newDisciplina);
        this.saveDisciplinas(all);
        this.addAdminLog('criar', 'Disciplinas', `Disciplina criada: ${disciplina.nome}`);
        return newDisciplina;
    },

    updateDisciplina(id, data) {
        const all = this.getDisciplinas();
        const index = all.findIndex(d => d.id === id);
        if (index !== -1) {
            const old = { ...all[index] };
            all[index] = { ...all[index], ...data };
            this.saveDisciplinas(all);
            const changes = [];
            if (old.nome !== all[index].nome) changes.push(`Nome: "${old.nome}" → "${all[index].nome}"`);
            const oldSeries = JSON.stringify(old.seriesIds || []);
            const newSeries = JSON.stringify(all[index].seriesIds || []);
            if (oldSeries !== newSeries) {
                const oldNames = (old.seriesIds || []).map(sid => this.getSeriesById(sid)?.nome).filter(Boolean).join(', ') || 'nenhuma';
                const newNames = (all[index].seriesIds || []).map(sid => this.getSeriesById(sid)?.nome).filter(Boolean).join(', ') || 'nenhuma';
                changes.push(`Séries: "${oldNames}" → "${newNames}"`);
            }
            const nomeDisc = all[index].nome;
            this.addAdminLog('editar', 'Disciplinas', changes.length ? `${nomeDisc}: ${changes.join('; ')}` : `Disciplina editada: ${nomeDisc}`);
            return all[index];
        }
        return null;
    },

    deleteDisciplina(id) {
        const all = this.getDisciplinas();
        const disc = all.find(d => d.id === id);
        // Remove disciplina e palavras vinculadas
        const palavras = this.getPalavras().filter(p => p.disciplinaId !== id);
        this.savePalavras(palavras);
        
        const filtered = all.filter(d => d.id !== id);
        this.saveDisciplinas(filtered);
        this.addAdminLog('excluir', 'Disciplinas', `Disciplina excluída: ${disc?.nome || id}`);
    },

    getDisciplinasBySerie(serieId) {
        return this.getDisciplinas().filter(d => d.seriesIds?.includes(serieId)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    },

    getDisciplinaById(id) {
        return this.getDisciplinas().find(d => d.id === id);
    },

    // ===== PALAVRAS =====
    getPalavras() {
        let data = JSON.parse(localStorage.getItem(this.KEYS.PALAVRAS) || '[]');
        if (data.length === 0) {
            const legacy = JSON.parse(localStorage.getItem('soletrando_entity_Palavra') || '[]');
            if (legacy.length > 0) {
                data = legacy.map(p => ({
                    id: p.id, texto: p.texto, dica: p.dica || '',
                    imagem: p.imagem_url || p.imagem || null,
                    serieId: p.serie_id || p.serieId,
                    disciplinaId: p.disciplina_id || p.disciplinaId,
                    createdAt: p.created_date || p.createdAt
                }));
                this.savePalavras(data);
            }
        }
        return data;
    },

    savePalavras(palavras) {
        this._persist(this.KEYS.PALAVRAS, palavras);
    },

    addPalavra(palavra) {
        const all = this.getPalavras();
        const newPalavra = {
            id: Utils.generateId(),
            texto: palavra.texto.toUpperCase(),
            dica: palavra.dica || '',
            imagem: palavra.imagem || null,
            crop: palavra.crop || null,
            serieId: palavra.serieId,
            disciplinaId: palavra.disciplinaId,
            createdAt: new Date().toISOString()
        };
        all.push(newPalavra);
        this.savePalavras(all);
        this.addAdminLog('criar', 'Palavras', `Palavra criada: ${newPalavra.texto} (${this.getDisciplinaById(palavra.disciplinaId)?.nome || '?'} — ${this.getSeriesById(palavra.serieId)?.nome || '?'})`);
        return newPalavra;
    },

    updatePalavra(id, data) {
        const all = this.getPalavras();
        const index = all.findIndex(p => p.id === id);
        if (index !== -1) {
            const old = { ...all[index] };
            if (data.texto) data.texto = data.texto.toUpperCase();
            all[index] = { ...all[index], ...data };
            this.savePalavras(all);
            const changes = [];
            if (old.texto !== all[index].texto) changes.push(`Texto: "${old.texto}" → "${all[index].texto}"`);
            if ((old.dica || '') !== (all[index].dica || '')) changes.push(`Dica: "${old.dica || ''}" → "${all[index].dica || ''}"`);
            if (old.serieId !== all[index].serieId) {
                const oldSerie = this.getSeriesById(old.serieId)?.nome || '?';
                const newSerie = this.getSeriesById(all[index].serieId)?.nome || '?';
                changes.push(`Série: "${oldSerie}" → "${newSerie}"`);
            }
            if (old.disciplinaId !== all[index].disciplinaId) {
                const oldDisc = this.getDisciplinaById(old.disciplinaId)?.nome || '?';
                const newDisc = this.getDisciplinaById(all[index].disciplinaId)?.nome || '?';
                changes.push(`Disciplina: "${oldDisc}" → "${newDisc}"`);
            }
            if ((old.imagem || '') !== (all[index].imagem || '')) changes.push('Imagem alterada');
            if ((old.crop?.zoom !== all[index].crop?.zoom) || (old.crop?.x !== all[index].crop?.x) || (old.crop?.y !== all[index].crop?.y)) changes.push('Enquadramento da imagem ajustado');
            this.addAdminLog('editar', 'Palavras', changes.length ? `Palavra ${all[index].texto}: ${changes.join('; ')}` : `Palavra editada: ${all[index].texto}`);
            return all[index];
        }
        return null;
    },

    deletePalavra(id) {
        const all = this.getPalavras();
        const palavra = all.find(p => p.id === id);
        const filtered = all.filter(p => p.id !== id);
        this.savePalavras(filtered);
        const discNome = palavra ? this.getDisciplinaById(palavra.disciplinaId)?.nome || '?' : '?';
        const serieNome = palavra ? this.getSeriesById(palavra.serieId)?.nome || '?' : '?';
        this.addAdminLog('excluir', 'Palavras', `Palavra excluída: ${palavra?.texto || id} (${discNome} — ${serieNome})`);
    },

    getPalavrasBySerieAndDisciplina(serieId, disciplinaId) {
        return this.getPalavras().filter(p => 
            p.serieId === serieId && p.disciplinaId === disciplinaId
        );
    },

    getPalavrasBySerie(serieId) {
        return this.getPalavras().filter(p => p.serieId === serieId);
    },

    countPalavrasBySerieAndDisciplinas(serieId, disciplinaIds) {
        return this.getPalavras().filter(p => 
            p.serieId === serieId && disciplinaIds.includes(p.disciplinaId)
        ).length;
    },

    // ===== EVENTOS =====
    getEventos() {
        let data = JSON.parse(localStorage.getItem(this.KEYS.EVENTOS) || '[]');
        const old = JSON.parse(localStorage.getItem('soletrando_eventos') || '[]');
        if (old.length > 0) {
            const existingIds = new Set(data.map(e => e.id));
            old.forEach(e => {
                if (!existingIds.has(e.id)) {
                    data.push(e);
                }
            });
            this.saveEventos(data);
            localStorage.removeItem('soletrando_eventos');
        }
        return data;
    },

    saveEventos(eventos) {
        this._persist(this.KEYS.EVENTOS, eventos);
    },

    addEvento(evento) {
        const all = this.getEventos();
        const newEvento = {
            id: Utils.generateId(),
            nome: evento.nome,
            data: evento.data,
            status: 'ativo',
            rodadas: evento.rodadas || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        all.push(newEvento);
        this.saveEventos(all);
        this.addAdminLog('criar', 'Eventos', `Evento criado: ${evento.nome} (${(evento.rodadas || []).length} rodada${(evento.rodadas || []).length !== 1 ? 's' : ''})`);
        return newEvento;
    },

    updateEvento(id, data) {
        const all = this.getEventos();
        const index = all.findIndex(e => e.id === id);
        if (index !== -1) {
            const old = { ...all[index] };
            all[index] = { ...all[index], ...data, updatedAt: new Date().toISOString() };
            this.saveEventos(all);
            const changes = [];
            const nomeEvento = all[index].nome;
            const serieNome = (id) => this.getSeriesById(id)?.nome || id;
            const discNomes = (ids) => (ids || []).map(id => this.getDisciplinaById(id)?.nome || id).filter(Boolean).join(', ');
            const partNomes = (parts) => (parts || []).map(p => (typeof p === 'string' ? p : p.nome)).filter(Boolean).join(', ');
            const palavraTextos = (ids) => {
                const byId = {};
                this.getPalavras().forEach(p => { byId[p.id] = p; });
                return (ids || []).map(id => byId[id]?.texto || id).filter(Boolean).join(', ');
            };
            if (old.nome !== nomeEvento) changes.push(`Nome: "${old.nome}" → "${nomeEvento}"`);
            if (old.data !== all[index].data) changes.push(`Data: "${old.data}" → "${all[index].data}"`);
            if (old.status !== all[index].status) changes.push(`Status: "${old.status}" → "${all[index].status}"`);

            // Comparar rodadas detalhadamente
            const oldRodadas = old.rodadas || [];
            const newRodadas = all[index].rodadas || [];
            const maxR = Math.max(oldRodadas.length, newRodadas.length);
            for (let i = 0; i < maxR; i++) {
                const o = oldRodadas[i];
                const n = newRodadas[i];
                if (!o && n) {
                    const extra = [];
                    if ((n.disciplinaIds || []).length) extra.push(`disciplinas: ${discNomes(n.disciplinaIds)}`);
                    if (n.modoPalavras === 'selecao' && (n.palavrasSelecionadas || []).length) extra.push(`palavras: ${palavraTextos(n.palavrasSelecionadas)}`);
                    if ((n.participantes || []).length) extra.push(`alunos: ${partNomes(n.participantes)}`);
                    changes.push(`Rodada ${i + 1} (${serieNome(n.serieId)}): criada${extra.length ? ' — ' + extra.join('; ') : ''}`);
                } else if (o && !n) {
                    changes.push(`Rodada ${i + 1} (${serieNome(o.serieId)}): removida`);
                } else if (o && n) {
                    const rChanges = [];
                    if (o.serieId !== n.serieId) rChanges.push(`série: "${serieNome(o.serieId)}" → "${serieNome(n.serieId)}"`);
                    if (o.palavrasPorAluno !== n.palavrasPorAluno) rChanges.push(`palavras/aluno: ${o.palavrasPorAluno} → ${n.palavrasPorAluno}`);
                    if (o.modoPalavras !== n.modoPalavras) rChanges.push(`modo: "${o.modoPalavras}" → "${n.modoPalavras}"`);
                    const oPalavras = o.palavrasSelecionadas || [];
                    const nPalavras = n.palavrasSelecionadas || [];
                    const oPalavrasStr = JSON.stringify([...oPalavras].sort());
                    const nPalavrasStr = JSON.stringify([...nPalavras].sort());
                    if (oPalavrasStr !== nPalavrasStr) {
                        const byId = {};
                        this.getPalavras().forEach(p => { byId[p.id] = p; });
                        const removed = oPalavras.filter(id => !nPalavras.includes(id));
                        const added = nPalavras.filter(id => !oPalavras.includes(id));
                        const parts = [];
                        if (removed.length) parts.push(`removidas: ${removed.map(id => byId[id]?.texto || id).join(', ')}`);
                        if (added.length) parts.push(`adicionadas: ${added.map(id => byId[id]?.texto || id).join(', ')}`);
                        rChanges.push(`palavras selecionadas (${parts.join('; ')})`);
                    }
                    const oDiscsStr = JSON.stringify((o.disciplinaIds || []).map(id => id).sort());
                    const nDiscsStr = JSON.stringify((n.disciplinaIds || []).map(id => id).sort());
                    if (oDiscsStr !== nDiscsStr) rChanges.push(`disciplinas: "${discNomes(o.disciplinaIds)}" → "${discNomes(n.disciplinaIds)}"`);
                    const oPartStr = JSON.stringify(partNomes(o.participantes));
                    const nPartStr = JSON.stringify(partNomes(n.participantes));
                    if (oPartStr !== nPartStr) rChanges.push(`alunos: "${partNomes(o.participantes)}" → "${partNomes(n.participantes)}"`);
                    if (rChanges.length) changes.push(`Rodada ${i + 1} (${serieNome(n.serieId)}): ${rChanges.join('; ')}`);
                }
            }

            this.addAdminLog('editar', 'Eventos', changes.length ? `Evento "${nomeEvento}" — ${changes.join('; ')}` : `Evento editado: ${nomeEvento}`);
            return all[index];
        }
        return null;
    },

    deleteEvento(id) {
        const all = this.getEventos();
        const evento = all.find(e => e.id === id);
        const filtered = all.filter(e => e.id !== id);
        this.saveEventos(filtered);
        this.addAdminLog('excluir', 'Eventos', `Evento excluído: ${evento?.nome || id}`);
    },

    getEventoById(id) {
        return this.getEventos().find(e => e.id === id);
    },

    getEventosAbertos() {
        return this.getEventos().filter(e => e.status === 'ativo');
    },

    // ===== LOGS =====
    getLogs() {
        let data = JSON.parse(localStorage.getItem(this.KEYS.LOGS) || '[]');
        const old = JSON.parse(localStorage.getItem('soletrando_logs') || '[]');
        if (old.length > 0) {
            const existingIds = new Set(data.map(l => l.id));
            old.forEach(l => {
                if (!existingIds.has(l.id)) {
                    data.push(l);
                }
            });
            this.saveLogs(data);
            localStorage.removeItem('soletrando_logs');
        }
        data = data.map(l => ({
            ...l,
            serieId: l.serieId || l.serie_id || '',
            serieNome: l.serieNome || l.serie_nome || '',
            turmaId: l.turmaId || l.turma_id || '',
            turmaNome: l.turmaNome || l.turma_nome || '',
            disciplinaId: l.disciplinaId || l.disciplina_id || '',
            disciplinaNome: l.disciplinaNome || l.disciplina_nome || '',
            eventoId: l.eventoId || l.evento_id || null,
            eventoNome: l.eventoNome || l.evento_nome || '',
            execucaoId: l.execucaoId || l.execucao_id || null,
            letraDigitada: l.letraDigitada || l.letra_digitada || null,
            letraEsperada: l.letraEsperada || l.letra_esperada || null,
            posicao: l.posicao ?? null,
            isPractice: l.isPractice || l.is_practice || false,
            tempo: l.tempo || l.tempo_segundos || 0,
            data: l.data || l.created_date || new Date().toISOString()
        }));
        return data;
    },

    saveLogs(logs) {
        this._persist(this.KEYS.LOGS, logs);
    },

    // ===== LOGS DE ATIVIDADE DO PROFESSOR =====
    getAdminLogs() {
        return JSON.parse(localStorage.getItem(this.KEYS.ADMIN_LOGS) || '[]');
    },

    addAdminLog(action, section, details) {
        const logs = this.getAdminLogs();
        logs.push({
            id: Utils.generateId(),
            timestamp: new Date().toISOString(),
            action,
            section,
            details: details || ''
        });
        this._persist(this.KEYS.ADMIN_LOGS, logs);
    },

    clearAdminLogs() {
        this._persist(this.KEYS.ADMIN_LOGS, []);
    },

    saveAdminLogs(logs) {
        this._persist(this.KEYS.ADMIN_LOGS, logs);
    },

    addLog(log) {
        const all = this.getLogs();
        const now = new Date().toISOString();
        const newLog = {
            id: Utils.generateId(),
            created_date: now,
            data: now,
            aluno: log.aluno,
            serie_id: log.serieId,
            serieId: log.serieId,
            serie_nome: log.serieNome,
            serieNome: log.serieNome,
            turma_id: log.turmaId,
            turmaId: log.turmaId,
            turma_nome: log.turmaNome || '',
            turmaNome: log.turmaNome || '',
            disciplina_id: log.disciplinaId,
            disciplinaId: log.disciplinaId,
            disciplina_nome: log.disciplinaNome,
            disciplinaNome: log.disciplinaNome,
            palavra: log.palavra,
            sequencia: log.sequencia || [],
            resultado: log.resultado,
            tempo_segundos: log.tempo || 0,
            tempo: log.tempo || 0,
            evento_id: log.eventoId || null,
            eventoId: log.eventoId || null,
            evento_nome: log.eventoNome || '',
            eventoNome: log.eventoNome || '',
            execucao_id: log.execucaoId || null,
            execucaoId: log.execucaoId || null,
            letra_digitada: log.letraDigitada || null,
            letraDigitada: log.letraDigitada || null,
            letra_esperada: log.letraEsperada || null,
            letraEsperada: log.letraEsperada || null,
            posicao: log.posicao ?? null,
            modo_ensaio: log.isPractice || false,
            isPractice: log.isPractice || false
        };
        all.push(newLog);
        this.saveLogs(all);
        return newLog;
    },

    deleteLog(id) {
        const all = this.getLogs().filter(l => l.id !== id);
        this.saveLogs(all);
    },

    clearLogs() {
        this.saveLogs([]);
        this.addAdminLog('excluir', 'Dados', 'Todos os logs de sessão foram apagados');
    },

    getLogsByEvento(eventoId) {
        return this.getLogs().filter(l => l.eventoId === eventoId);
    },

    groupLogsByExecucao(logs) {
        if (!logs || logs.length === 0) return [];
        const sorted = [...logs].sort((a, b) => new Date(a.data) - new Date(b.data));
        const groups = [];
        let current = null;
        sorted.forEach(l => {
            if (l.execucaoId) {
                let found = groups.find(g => g.execucaoId === l.execucaoId);
                if (!found) {
                    found = { execucaoId: l.execucaoId, startTime: l.data, logs: [] };
                    groups.push(found);
                }
                found.logs.push(l);
                if (new Date(l.data) < new Date(found.startTime)) found.startTime = l.data;
            } else {
                const t = new Date(l.data).getTime();
                if (!current || (t - new Date(current.logs[current.logs.length - 1].data).getTime()) > 120000) {
                    current = { execucaoId: null, startTime: l.data, logs: [] };
                    groups.push(current);
                }
                current.logs.push(l);
            }
        });
        return groups.map(g => {
            const totalAcertos = g.logs.filter(l => l.resultado === 'acerto').length;
            return {
                execucaoId: g.execucaoId,
                startTime: g.startTime,
                logs: g.logs,
                total: g.logs.length,
                acertos: totalAcertos,
                taxa: g.logs.length > 0 ? Math.round((totalAcertos / g.logs.length) * 100) : 0
            };
        }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    },

    getLogsByAluno(aluno) {
        return this.getLogs().filter(l => 
            l.aluno.toLowerCase().includes(aluno.toLowerCase())
        );
    },

    getLogsByDateRange(startDate, endDate) {
        return this.getLogs().filter(l => {
            const logDate = new Date(l.data);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && logDate < start) return false;
            if (end && logDate > end) return false;
            return true;
        });
    },

    // ===== CONFIGURAÇÕES =====
    getSettings() {
        const defaults = {
            capitalization: 'upper',
            showHint: false,
            showImage: false,
            showRemaining: true,
            showTimer: true,
            revealWord: true,
            enterConfirm: false,
            autoMode: true,
            theme: 'default',
            darkMode: false,
            soundCorrect: true,
            soundError: true,
            soundCelebration: true,
            soundSuspense: true,
            effectConfetti: true,
            effectShake: true,
            effectFlash: true,
            effectSparkle: true,
            letterAnimation: 'zoom',
            tamanho_ui: 'medio',
            estilo_letra: 'underline',
            lang: 'pt-BR'
        };
        
        const saved = JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || '{}');
        return { ...defaults, ...saved };
    },

    saveSettings(settings) {
        this._persist(this.KEYS.SETTINGS, settings);
    },

    updateSetting(key, value) {
        const settings = this.getSettings();
        const oldVal = settings[key];
        settings[key] = value;
        this.saveSettings(settings);

        if (oldVal !== value && key !== 'darkMode') {
            const labels = {
                darkMode: 'Tema',
                effectConfetti: 'Confete',
                effectFlash: 'Flash',
                effectShake: 'Tremer',
                revealWord: 'Revelar palavra',
                showHint: 'Mostrar dica',
                showImage: 'Mostrar imagem',
                showTimer: 'Mostrar cronômetro',
                autoMode: 'Modo automático',
                letterSpacing: 'Espaçamento das letras',
                lang: 'Idioma'
            };
            const label = labels[key] || key;
            const formatVal = (v) => {
                if (key === 'darkMode') {
                    return v === true ? 'Escuro' : v === false ? 'Claro' : 'Padrão';
                }
                if (v === true) return 'Ativado';
                if (v === false) return 'Desativado';
                if (v === null || v === undefined) return 'Padrão';
                return String(v);
            };
            this.addAdminLog('editar', 'Configurações', `${label}: ${formatVal(oldVal)} → ${formatVal(value)}`);
        }
    },

    // ===== SESSÃO =====
    getSession() {
        return JSON.parse(localStorage.getItem(this.KEYS.SESSION) || 'null');
    },

    saveSession(session) {
        this._persist(this.KEYS.SESSION, session);
    },

    clearSession() {
        localStorage.removeItem(this.KEYS.SESSION);
    },

    // ===== ESTATÍSTICAS =====
    getStats() {
        const logs = this.getLogs().filter(l => !l.isPractice);
        
        const totalGames = logs.length;
        const correct = logs.filter(l => l.resultado === 'acerto').length;
        const wrong = logs.filter(l => l.resultado === 'erro').length;
        const accuracy = totalGames > 0 ? Math.round((correct / totalGames) * 100) : 0;
        const avgTime = totalGames > 0 
            ? Math.round(logs.reduce((sum, l) => sum + l.tempo, 0) / totalGames) 
            : 0;

        // Top 3 alunos
        const alunoStats = {};
        logs.forEach(log => {
            if (!alunoStats[log.aluno]) {
                alunoStats[log.aluno] = { correct: 0, wrong: 0 };
            }
            if (log.resultado === 'acerto') {
                alunoStats[log.aluno].correct++;
            } else {
                alunoStats[log.aluno].wrong++;
            }
        });

        const topAlunos = Object.entries(alunoStats)
            .map(([nome, stats]) => ({ nome, ...stats }))
            .sort((a, b) => b.correct - a.correct)
            .slice(0, 3);

        // Taxa por disciplina
        const disciplinaStats = {};
        logs.forEach(log => {
            if (!disciplinaStats[log.disciplinaNome]) {
                disciplinaStats[log.disciplinaNome] = { correct: 0, total: 0 };
            }
            disciplinaStats[log.disciplinaNome].total++;
            if (log.resultado === 'acerto') {
                disciplinaStats[log.disciplinaNome].correct++;
            }
        });

        const disciplinaAccuracy = Object.entries(disciplinaStats)
            .map(([nome, stats]) => ({
                nome,
                accuracy: Math.round((stats.correct / stats.total) * 100)
            }));

        return {
            totalGames,
            correct,
            wrong,
            accuracy,
            avgTime,
            topAlunos,
            disciplinaAccuracy
        };
    },

    // ===== EXPORTAÇÃO =====
    exportAll() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            series: this.getSeries(),
            turmas: this.getTurmas(),
            disciplinas: this.getDisciplinas(),
            palavras: this.getPalavras(),
            eventos: this.getEventos(),
            logs: this.getLogs(),
            adminLogs: this.getAdminLogs(),
            settings: this.getSettings()
        };
        return JSON.stringify(data, null, 2);
    },

    exportLogs() {
        const logs = this.getLogs();
        return JSON.stringify(logs, null, 2);
    },

    exportLogsCSV() {
        const logs = this.getLogs();
        const headers = ['Data', 'Aluno', 'Série', 'Turma', 'Disciplina', 'Palavra', 'Sequência', 'Resultado', 'Tempo', 'Evento'];
        
        const rows = logs.map(log => [
            Utils.formatDateTime(log.data || log.created_date || ''),
            log.aluno || '',
            log.serieNome || '',
            log.turmaNome || '',
            log.disciplinaNome || '',
            log.palavra || '',
            Array.isArray(log.sequencia) ? log.sequencia.join(' ') : '',
            log.resultado || '',
            Utils.formatTime(log.tempo || 0),
            log.eventoNome || ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(';'))
            .join('\r\n');
        
        return csv;
    },

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            const parts = [];
            if (data.series) { this.saveSeries(data.series); parts.push('séries'); }
            if (data.turmas) { this.saveTurmas(data.turmas); parts.push('turmas'); }
            if (data.disciplinas) { this.saveDisciplinas(data.disciplinas); parts.push('disciplinas'); }
            if (data.palavras) { this.savePalavras(data.palavras); parts.push('palavras'); }
            if (data.eventos) { this.saveEventos(data.eventos); parts.push('eventos'); }
            if (data.logs) { this.saveLogs(data.logs); parts.push('logs'); }
            if (data.adminLogs) { this.saveAdminLogs(data.adminLogs); parts.push('logs de atividades'); }
            if (data.settings) { this.saveSettings(data.settings); parts.push('configurações'); }
            
            this.addAdminLog('importar', 'Dados', `Importação concluída: ${parts.join(', ')}`);
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    },

    _mergeItems(existing, imported, mode) {
        const byId = {};
        existing.forEach(item => { byId[item.id] = item; });
        imported.forEach(item => {
            if (byId[item.id]) {
                if (mode === 'overwrite') {
                    byId[item.id] = item;
                } else if (mode === 'skip') {
                } else if (mode === 'update') {
                    byId[item.id] = { ...byId[item.id], ...item };
                }
            } else {
                byId[item.id] = item;
            }
        });
        return Object.values(byId);
    },

    _mergeItemsFiltered(existing, imported, mode, filter) {
        const byId = {};
        existing.forEach(item => { byId[item.id] = item; });
        imported.forEach(item => {
            if (!filter(item)) return;
            if (byId[item.id]) {
                if (mode === 'overwrite') {
                    byId[item.id] = item;
                } else if (mode === 'update') {
                    byId[item.id] = { ...byId[item.id], ...item };
                }
            } else {
                byId[item.id] = item;
            }
        });
        return Object.values(byId);
    },

    importDataSelective(jsonData, options) {
        try {
            const data = JSON.parse(jsonData);
            const mode = options.mergeMode || 'overwrite';
            const entities = options.entities || [];
            const parts = [];

            if (entities.includes('series') && data.series) {
                this.saveSeries(this._mergeItems(this.getSeries(), data.series, mode));
                parts.push('séries');
            }
            if (entities.includes('turmas') && data.turmas) {
                this.saveTurmas(this._mergeItems(this.getTurmas(), data.turmas, mode));
                parts.push('turmas');
            }
            if (entities.includes('disciplinas') && data.disciplinas) {
                this.saveDisciplinas(this._mergeItems(this.getDisciplinas(), data.disciplinas, mode));
                parts.push('disciplinas');
            }
            if (entities.includes('palavras') && data.palavras) {
                this.savePalavras(this._mergeItems(this.getPalavras(), data.palavras, mode));
                parts.push('palavras');
            }
            if (entities.includes('eventos') && data.eventos) {
                this.saveEventos(this._mergeItems(this.getEventos(), data.eventos, mode));
                parts.push('eventos');
            }
            const wantsLogsAll = entities.includes('logs');
            const wantsLogsAvulsos = entities.includes('logsAvulsos');
            const wantsLogsEventos = entities.includes('logsEventos');
            if ((wantsLogsAll || wantsLogsAvulsos || wantsLogsEventos) && data.logs) {
                const isEvento = l => !!(l && (l.eventoId || l.evento_id));
                let mergedLogs = this.getLogs();
                if (wantsLogsAll) {
                    mergedLogs = this._mergeItems(mergedLogs, data.logs, mode);
                } else {
                    if (wantsLogsAvulsos) {
                        mergedLogs = this._mergeItemsFiltered(mergedLogs, data.logs, mode, l => !isEvento(l));
                    }
                    if (wantsLogsEventos) {
                        mergedLogs = this._mergeItemsFiltered(mergedLogs, data.logs, mode, l => isEvento(l));
                    }
                }
                mergedLogs = mergedLogs.map(l => ({
                    ...l,
                    eventoId: l.eventoId || l.evento_id || null,
                    execucaoId: l.execucaoId || l.execucao_id || null
                }));
                this.saveLogs(mergedLogs);
                const logLabels = [];
                if (wantsLogsAll) logLabels.push('logs');
                else {
                    if (wantsLogsAvulsos) logLabels.push('resultados avulsos');
                    if (wantsLogsEventos) logLabels.push('resultados de eventos');
                }
                parts.push(logLabels.join(' e '));
            }
            if (entities.includes('adminLogs') && data.adminLogs) {
                this.saveAdminLogs(this._mergeItems(this.getAdminLogs(), data.adminLogs, mode));
                parts.push('logs de atividades');
            }
            if (entities.includes('settings') && data.settings) {
                this.saveSettings(data.settings);
                parts.push('configurações');
            }

            const modeLabels = { overwrite: 'sobrescrever', skip: 'ignorar', update: 'atualizar' };
            this.addAdminLog('importar', 'Dados', `Importação seletiva (modo: ${modeLabels[mode] || mode}): ${parts.join(', ')}`);
            return true;
        } catch (error) {
            console.error('Erro ao importar dados seletivo:', error);
            return false;
        }
    },

    // ===== BACKUP LOCAL =====
    _backupDirHandle: null,

    async _requestBackupDir(request = false) {
        if (this._backupDirHandle) {
            try { await this._backupDirHandle.values(); return this._backupDirHandle; } catch { this._backupDirHandle = null; }
        }
        try {
            const root = await Utils.ProjectDB.load('backup_root');
            if (root) {
                let perm = await root.queryPermission({ mode: 'readwrite' });
                if (perm !== 'granted' && request) {
                    try { perm = await root.requestPermission({ mode: 'readwrite' }); } catch { perm = 'prompt'; }
                }
                if (perm === 'granted') {
                    Utils._systemRootCache = root;
                    this._backupDirHandle = await root.getDirectoryHandle('backups', { create: true });
                    return this._backupDirHandle;
                }
            }
        } catch (e) { console.warn(e); }
        if (window.showDirectoryPicker && request) {
            try {
                const root = await this._findProjectRoot(await window.showDirectoryPicker({ mode: 'readwrite' }));
                if (!root) return null;
                await Utils.ProjectDB.save('backup_root', root);
                Utils._systemRootCache = root;
                this._backupDirHandle = await root.getDirectoryHandle('backups', { create: true });
                return this._backupDirHandle;
            } catch { return null; }
        }
        return null;
    },

    async _findProjectRoot(folderHandle) {
        const hasDir = async (dir, name) => {
            try { await dir.getDirectoryHandle(name); return true; } catch { return false; }
        };
        try {
            if (await hasDir(folderHandle, 'img') || await hasDir(folderHandle, 'js')) return folderHandle;
            for await (const [name, handle] of folderHandle.entries()) {
                if (handle.kind === 'directory') {
                    if (await hasDir(handle, 'img') || await hasDir(handle, 'js')) return handle;
                }
            }
        } catch (e) { console.warn(e); }
        return null;
    },

    async connectSystemFolder(forcePicker = false) {
        if (!window.showDirectoryPicker) return null;
        try {
            if (!forcePicker) {
                const existing = await Utils.ProjectDB.load('backup_root');
                if (existing) {
                    let perm = await existing.queryPermission({ mode: 'readwrite' });
                    if (perm !== 'granted') {
                        try { perm = await existing.requestPermission({ mode: 'readwrite' }); } catch { perm = 'prompt'; }
                    }
                    if (perm === 'granted') {
                        Utils._systemRootCache = existing;
                        this._backupDirHandle = await existing.getDirectoryHandle('backups', { create: true });
                        return existing.name;
                    }
                }
            }
            const root = await this._findProjectRoot(await window.showDirectoryPicker({ mode: 'readwrite' }));
            if (!root) return 'not-found';
            await Utils.ProjectDB.save('backup_root', root);
            Utils._systemRootCache = root;
            this._backupDirHandle = await root.getDirectoryHandle('backups', { create: true });
            return root.name;
        } catch {
            return null;
        }
    },

    _buildBackupData() {
        return {
            version: '1.0',
            backupDate: new Date().toISOString(),
            series: this.getSeries(),
            turmas: this.getTurmas(),
            disciplinas: this.getDisciplinas(),
            palavras: this.getPalavras(),
            eventos: this.getEventos(),
            logs: this.getLogs(),
            adminLogs: this.getAdminLogs(),
            settings: this.getSettings()
        };
    },

    async _buildBackupZip() {
        const backupData = this._buildBackupData();
        const jsonBytes = new TextEncoder().encode(JSON.stringify(backupData, null, 2));
        const entries = [{ path: 'dados.json', data: jsonBytes }];
        try {
            const opfsImages = await Utils.collectAllImagesFromOPFS();
            for (const img of opfsImages) entries.push(img);
        } catch (e) { console.warn(e); }
        return Utils.createZip(entries);
    },

    async saveLocalBackup(isAuto) {
        const backupData = this._buildBackupData();
        const meta = {
            backupDate: backupData.backupDate,
            totalSeries: backupData.series.length,
            totalPalavras: backupData.palavras.length,
            totalLogs: backupData.logs.length,
            isAuto: !!isAuto
        };

        const dir = await this._requestBackupDir(true);
        const blob = await this._buildBackupZip();

        if (dir) {
            const prefix = isAuto ? 'soletrando_auto_backup_' : 'soletrando_backup_';
            const fileName = prefix + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.zip';
            const fileHandle = await dir.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            meta.fileName = fileName;
            meta.savedTo = dir.name;
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'soletrando_backup.zip';
            a.click();
            URL.revokeObjectURL(url);
            meta.fileName = 'soletrando_backup.zip (download)';
            meta.downloaded = true;
        }

        return meta;
    },

    async listBackups() {
        const dir = await this._requestBackupDir();
        if (!dir) return [];
        const backups = [];
        for await (const [name, handle] of dir.entries()) {
            if (handle.kind === 'file' && name.endsWith('.zip') && (name.startsWith('soletrando_backup_') || name.startsWith('soletrando_auto_backup_'))) {
                try {
                    const file = await handle.getFile();
                    const isAuto = name.startsWith('soletrando_auto_backup_');
                    const match = name.match(/soletrando(?:_auto)?_backup_(.+)\.zip$/);
                    let date = null;
                    if (match) {
                        const raw = match[1];
                        const dateStr = raw.slice(0, 10) + 'T' + raw.slice(11).replace(/-/g, ':');
                        date = new Date(dateStr);
                    }
                    backups.push({ name, size: file.size, date, invalid: isNaN(date), isAuto });
                } catch (e) { console.warn(e); }
            }
        }
        backups.sort((a, b) => (b.date || 0) > (a.date || 0) ? 1 : -1);
        return backups;
    },

    async restoreLocalBackup(fileName, options) {
        const dir = await this._requestBackupDir(true);
        if (!dir) throw new Error('Selecione a pasta de backups');

        let targetFile = fileName;
        if (!targetFile) {
            for await (const [name, handle] of dir.entries()) {
                if (handle.kind === 'file' && name.endsWith('.zip') && (name.startsWith('soletrando_backup_') || name.startsWith('soletrando_auto_backup_'))) {
                    if (!targetFile || name > targetFile) targetFile = name;
                }
            }
        }
        if (!targetFile) throw new Error('Nenhum backup encontrado na pasta');

        const fileHandle = await dir.getFileHandle(targetFile);
        const file = await fileHandle.getFile();
        const buf = await file.arrayBuffer();
        const zipEntries = await Utils.readZip(buf);

        const dadosEntry = zipEntries.find(e => e.path === 'dados.json');
        if (!dadosEntry) throw new Error('Backup inválido');

        const text = new TextDecoder().decode(dadosEntry.data);
        const entities = options?.entities || [];
        const mergeMode = options?.mergeMode || 'overwrite';
        const success = entities.length > 0
            ? this.importDataSelective(text, { entities, mergeMode })
            : this.importData(text);
        if (!success) throw new Error('Erro ao restaurar dados');

        let imgCount = 0;
        const wantsImages = entities.length === 0 || entities.includes('palavras');
        if (wantsImages) {
            const imageEntries = zipEntries.filter(e => (e.path.startsWith('img/') || e.path.startsWith('imagens/')) && e.data.length > 0);
            if (imageEntries.length) await Utils.importImagesToOPFS(imageEntries);
            imgCount = imageEntries.length;
        }

        const allLogs = this.getLogs();
        const isEvento = l => !!(l && (l.eventoId || l.evento_id));
        const avulsos = allLogs.filter(l => !isEvento(l)).length;
        const eventos = allLogs.filter(l => isEvento(l)).length;

        const entityLabels = {
            series: 'Séries', turmas: 'Turmas', disciplinas: 'Disciplinas', palavras: 'Palavras',
            eventos: 'Eventos', logs: 'Logs', logsAvulsos: 'Resultados Avulsos',
            logsEventos: 'Resultados de Eventos', adminLogs: 'Logs de Atividades', settings: 'Configurações'
        };
        const modeLabels = { overwrite: 'sobrescrever', skip: 'ignorar', update: 'atualizar' };
        const entityLabel = entities.map(e => entityLabels[e] || e).join(', ');
        const detail = entities.length > 0
            ? ` (seletivo: ${entityLabel}, modo: ${modeLabels[mergeMode] || mergeMode}) — agora no sistema: ${avulsos} avulsos, ${eventos} eventos`
            : ' (restauração total)';
        this.addAdminLog('importar', 'Dados', `Backup restaurado: ${targetFile}${detail}`);
        return { file: targetFile, images: imgCount, selective: entities.length > 0, entities, avulsos, eventos };
    },

    async getBackupContents(fileName) {
        const dir = await this._requestBackupDir(true);
        if (!dir) return null;
        try {
            const fileHandle = await dir.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const buf = await file.arrayBuffer();
            const zipEntries = await Utils.readZip(buf);
            const dadosEntry = zipEntries.find(e => e.path === 'dados.json');
            if (!dadosEntry) return null;
            const data = JSON.parse(new TextDecoder().decode(dadosEntry.data));
            return {
                series: (data.series || []).length,
                turmas: (data.turmas || []).length,
                disciplinas: (data.disciplinas || []).length,
                palavras: (data.palavras || []).length,
                eventos: (data.eventos || []).length,
                avulsos: (data.logs || []).filter(l => !(l && (l.eventoId || l.evento_id))).length,
                eventosLogs: (data.logs || []).filter(l => !!(l && (l.eventoId || l.evento_id))).length,
                adminLogs: (data.adminLogs || []).length
            };
        } catch { return null; }
    },

    async deleteSingleBackup(fileName) {
        const dir = await this._requestBackupDir(true);
        if (!dir) return;
        try { await dir.removeEntry(fileName); } catch (e) { console.warn(e); }
    },

    async deleteAllBackups() {
        const dir = await this._requestBackupDir(true);
        if (!dir) return;
        const toDelete = [];
        for await (const [name, handle] of dir.entries()) {
            if (handle.kind === 'file' && (name.startsWith('soletrando_backup_') || name === 'backup_meta.json')) {
                toDelete.push(name);
            }
        }
        for (const name of toDelete) {
            try { await dir.removeEntry(name); } catch (e) { console.warn(e); }
        }
    }
};

// Exportar para uso global
window.Data = Data;