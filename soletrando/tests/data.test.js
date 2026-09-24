// Testes do módulo Data (CRUD, import/export, merge, limites MAX_LOGS)
// Executa no Node sem depender de localStorage/DOM — usa store em memória.

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Mock minimal do localStorage para testes
global.localStorage = {
    _store: {},
    getItem(key) { return this._store[key] || null; },
    setItem(key, value) { this._store[key] = String(value); },
    removeItem(key) { delete this._store[key]; },
    clear() { this._store = {}; }
};

// Mock do crypto.randomUUID para geração de IDs determinística nos testes
let uuidCounter = 0;
global.crypto = {
    randomUUID() {
        return `test-uuid-${++uuidCounter}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
};

// Mock do Utils (funções puras necessárias)
const Utils = {
    generateId() {
        return crypto.randomUUID();
    },
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, "'");
    },
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('pt-BR');
    },
    log(...args) { /* silent in tests */ },
    todayKey() { return '2026-1-15'; }
};
global.Utils = Utils;

// Mock T() para i18n
global.T = (str, vars) => {
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            str = str.split('{' + k + '}').join(v);
        }
    }
    return str;
};

// Carregar módulo Data (precisa adaptar para Node)
const fs = require('fs');
const path = require('path');
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

// Extrair apenas o objeto Data (sem window.Data = Data no final)
const dataModuleCode = dataJs.replace(/^const Data = \{/, 'const Data = {').replace(/window\.Data = Data;$/, 'module.exports = { Data };');
eval(dataModuleCode);
const { Data } = module.exports;

// Helper para resetar estado entre testes
function resetData() {
    localStorage.clear();
    // Reset chaves internas
    Data.KEYS = {
        SERIES: 'soletrando_series',
        TURMAS: 'soletrando_turmas',
        DISCIPLINAS: 'soletrando_disciplinas',
        PALAVRAS: 'soletrando_palavras',
        EVENTOS: 'soletrando_entity_Evento',
        LOGS: 'soletrando_entity_LogPartida',
        ADMIN_LOGS: 'soletrando_admin_logs',
        SETTINGS: 'soletrando_settings',
        SESSION: 'soletrando_session',
        DAILY_CHALLENGE: 'soletrando_daily_challenge',
        WORD_HISTORY: 'soletrando_word_history'
    };
    Data.MAX_LOGS = 2000;
    Data.MAX_ADMIN_LOGS = 500;
}

describe('Data Module', () => {
    beforeEach(() => {
        resetData();
        uuidCounter = 0;
    });

    describe('Séries (CRUD)', () => {
        test('addSeries cria série com campos obrigatórios', () => {
            const serie = Data.addSeries({ nome: '6º Ano', professor: 'Prof. João' });
            assert.ok(serie.id);
            assert.equal(serie.nome, '6º Ano');
            assert.equal(serie.professor, 'Prof. João');
            assert.equal(serie.active, true);
            assert.ok(serie.createdAt);
        });

        test('getSeries retorna séries salvas', () => {
            Data.addSeries({ nome: '1º Ano' });
            Data.addSeries({ nome: '2º Ano' });
            const series = Data.getSeries();
            assert.equal(series.length, 2);
        });

        test('updateSeries atualiza campos', () => {
            const serie = Data.addSeries({ nome: 'Antigo', professor: 'Prof. A' });
            const updated = Data.updateSeries(serie.id, { nome: 'Novo', professor: 'Prof. B' });
            assert.equal(updated.nome, 'Novo');
            assert.equal(updated.professor, 'Prof. B');
        });

        test('toggleSeriesActive alterna status', () => {
            const serie = Data.addSeries({ nome: 'Teste' });
            assert.equal(serie.active, true);
            Data.toggleSeriesActive(serie.id);
            const updated = Data.getSeriesById(serie.id);
            assert.equal(updated.active, false);
            Data.toggleSeriesActive(serie.id);
            const reactivated = Data.getSeriesById(serie.id);
            assert.equal(reactivated.active, true);
        });

        test('deleteSeries remove série e dados vinculados', () => {
            const serie = Data.addSeries({ nome: 'Para Excluir' });
            Data.addTurma({ nome: 'Turma 1', serieId: serie.id });
            Data.addDisciplina({ nome: 'Matemática', seriesIds: [serie.id] });
            Data.addPalavra({ texto: 'TESTE', serieId: serie.id, disciplinaId: Data.getDisciplinas()[0].id });
            
            Data.deleteSeries(serie.id);
            
            assert.equal(Data.getSeries().find(s => s.id === serie.id), undefined);
            assert.equal(Data.getTurmas().find(t => t.serieId === serie.id), undefined);
            assert.equal(Data.getDisciplinas().find(d => d.seriesIds?.includes(serie.id)), undefined);
            assert.equal(Data.getPalavras().find(p => p.serieId === serie.id), undefined);
        });
    });

    describe('Turmas (CRUD)', () => {
        test('addTurma vincula à série', () => {
            const serie = Data.addSeries({ nome: 'Série Teste' });
            const turma = Data.addTurma({ nome: '8ºA', serieId: serie.id, professor: 'Prof. Teste' });
            assert.ok(turma.id);
            assert.equal(turma.serieId, serie.id);
            assert.equal(turma.professor, 'Prof. Teste');
        });

        test('getTurmasBySerie filtra corretamente', () => {
            const s1 = Data.addSeries({ nome: 'S1' });
            const s2 = Data.addSeries({ nome: 'S2' });
            Data.addTurma({ nome: 'T1', serieId: s1.id });
            Data.addTurma({ nome: 'T2', serieId: s1.id });
            Data.addTurma({ nome: 'T3', serieId: s2.id });
            
            const turmasS1 = Data.getTurmasBySerie(s1.id);
            assert.equal(turmasS1.length, 2);
            assert.ok(turmasS1.every(t => t.serieId === s1.id));
        });

        test('updateTurma atualiza nome e professor', () => {
            const serie = Data.addSeries({ nome: 'S' });
            const turma = Data.addTurma({ nome: 'Antiga', serieId: serie.id, professor: 'Prof. Velho' });
            Data.updateTurma(turma.id, { nome: 'Nova', professor: 'Prof. Novo' });
            const updated = Data.getTurmaById(turma.id);
            assert.equal(updated.nome, 'Nova');
            assert.equal(updated.professor, 'Prof. Novo');
        });
    });

    describe('Disciplinas (CRUD)', () => {
        test('addDisciplina vincula a séries', () => {
            const s1 = Data.addSeries({ nome: 'S1' });
            const s2 = Data.addSeries({ nome: 'S2' });
            const disc = Data.addDisciplina({ nome: 'Matemática', seriesIds: [s1.id, s2.id] });
            assert.ok(disc.id);
            assert.deepEqual(disc.seriesIds.sort(), [s1.id, s2.id].sort());
        });

        test('getDisciplinasBySerie retorna disciplinas da série', () => {
            const s1 = Data.addSeries({ nome: 'S1' });
            const s2 = Data.addSeries({ nome: 'S2' });
            Data.addDisciplina({ nome: 'D1', seriesIds: [s1.id] });
            Data.addDisciplina({ nome: 'D2', seriesIds: [s1.id, s2.id] });
            Data.addDisciplina({ nome: 'D3', seriesIds: [s2.id] });
            
            const discs = Data.getDisciplinasBySerie(s1.id);
            assert.equal(discs.length, 2);
            assert.ok(discs.every(d => d.seriesIds.includes(s1.id)));
        });

        test('deleteDisciplina remove palavras vinculadas', () => {
            const serie = Data.addSeries({ nome: 'S' });
            const disc = Data.addDisciplina({ nome: 'Matemática', seriesIds: [serie.id] });
            Data.addPalavra({ texto: 'PALAVRA1', serieId: serie.id, disciplinaId: disc.id });
            Data.addPalavra({ texto: 'PALAVRA2', serieId: serie.id, disciplinaId: disc.id });
            
            Data.deleteDisciplina(disc.id);
            
            assert.equal(Data.getDisciplinas().find(d => d.id === disc.id), undefined);
            assert.equal(Data.getPalavras().filter(p => p.disciplinaId === disc.id).length, 0);
        });
    });

    describe('Palavras (CRUD)', () => {
        test('addPalavra normaliza texto para maiúsculas', () => {
            const serie = Data.addSeries({ nome: 'S' });
            const disc = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            const palavra = Data.addPalavra({ texto: 'ação', serieId: serie.id, disciplinaId: disc.id });
            assert.equal(palavra.texto, 'AÇÃO');
        });

        test('getPalavrasBySerieAndDisciplina filtra corretamente', () => {
            const serie = Data.addSeries({ nome: 'S' });
            const d1 = Data.addDisciplina({ nome: 'D1', seriesIds: [serie.id] });
            const d2 = Data.addDisciplina({ nome: 'D2', seriesIds: [serie.id] });
            Data.addPalavra({ texto: 'P1', serieId: serie.id, disciplinaId: d1.id });
            Data.addPalavra({ texto: 'P2', serieId: serie.id, disciplinaId: d1.id });
            Data.addPalavra({ texto: 'P3', serieId: serie.id, disciplinaId: d2.id });
            
            const palavrasD1 = Data.getPalavrasBySerieAndDisciplina(serie.id, d1.id);
            assert.equal(palavrasD1.length, 2);
        });

        test('countPalavrasBySerieAndDisciplinas conta corretamente', () => {
            const serie = Data.addSeries({ nome: 'S' });
            const d1 = Data.addDisciplina({ nome: 'D1', seriesIds: [serie.id] });
            const d2 = Data.addDisciplina({ nome: 'D2', seriesIds: [serie.id] });
            Data.addPalavra({ texto: 'P1', serieId: serie.id, disciplinaId: d1.id });
            Data.addPalavra({ texto: 'P2', serieId: serie.id, disciplinaId: d2.id });
            
            const count = Data.countPalavrasBySerieAndDisciplinas(serie.id, [d1.id, d2.id]);
            assert.equal(count, 2);
        });
    });

    describe('Eventos', () => {
        test('addEvento cria evento com rodadas', () => {
            const serie = Data.addSeries({ nome: 'S' });
            const disc = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            const evento = Data.addEvento({
                nome: 'Feira de Ciências',
                data: '2026-08-15',
                rodadas: [{ serieId: serie.id, disciplinaIds: [disc.id], palavrasPorAluno: 5 }]
            });
            assert.ok(evento.id);
            assert.equal(evento.status, 'ativo');
            assert.equal(evento.rodadas.length, 1);
        });

        test('getEventosAbertos retorna apenas ativos', () => {
            const s = Data.addSeries({ nome: 'S' });
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [s.id] });
            Data.addEvento({ nome: 'Ativo', data: '2026-08-15', rodadas: [] });
            Data.addEvento({ nome: 'Encerrado', data: '2026-08-10', rodadas: [] });
            Data.updateEvento(Data.getEventos()[1].id, { status: 'encerrado' });
            
            const abertos = Data.getEventosAbertos();
            assert.equal(abertos.length, 1);
            assert.equal(abertos[0].nome, 'Ativo');
        });
    });

    describe('Logs de partida', () => {
        test('addLog salva log com todos os campos', () => {
            const log = Data.addLog({
                aluno: 'João',
                serieId: 's1',
                serieNome: '6º Ano',
                turmaId: 't1',
                turmaNome: '8ºA',
                disciplinaId: 'd1',
                disciplinaNome: 'Matemática',
                palavra: 'TESTE',
                sequencia: [0, 1, 2],
                resultado: 'acerto',
                tempo: 30,
                eventoId: null,
                eventoNome: '',
                execucaoId: 'exec-1',
                letraDigitada: 'T',
                letraEsperada: 'T',
                posicao: 0,
                isPractice: false
            });
            assert.ok(log.id);
            assert.equal(log.aluno, 'João');
            assert.equal(log.resultado, 'acerto');
        });

        test('MAX_LOGS limita quantidade de logs (remove mais antigos)', () => {
            Data.KEYS.MAX_LOGS = 5; // teto baixo para teste
            for (let i = 0; i < 10; i++) {
                Data.addLog({ aluno: `Aluno${i}`, serieId: 's', serieNome: 'S', palavra: 'PALAVRA', resultado: 'acerto', tempo: 10, isPractice: false });
            }
            const logs = Data.getLogs();
            assert.equal(logs.length, 5); // deve manter só os 5 mais recentes
            // Verifica que são os últimos 5 (Aluno5 a Aluno9)
            assert.equal(logs[0].aluno, 'Aluno5');
            assert.equal(logs[4].aluno, 'Aluno9');
        });

        test('groupLogsByExecucao agrupa por execucaoId', () => {
            const execId = 'exec-test';
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P1', resultado: 'acerto', tempo: 10, execucaoId: execId, isPractice: false });
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P2', resultado: 'erro', tempo: 15, execucaoId: execId, isPractice: false });
            Data.addLog({ aluno: 'A2', serieId: 's', serieNome: 'S', palavra: 'P3', resultado: 'acerto', tempo: 20, execucaoId: 'outro', isPractice: false });
            
            const groups = Data.groupLogsByExecucao(Data.getLogs());
            const group = groups.find(g => g.execucaoId === execId);
            assert.ok(group);
            assert.equal(group.total, 2);
            assert.equal(group.acertos, 1);
            assert.equal(group.taxa, 50);
        });

        test('getLogsByAluno filtra por nome (case-insensitive)', () => {
            Data.addLog({ aluno: 'João Silva', serieId: 's', serieNome: 'S', palavra: 'P1', resultado: 'acerto', tempo: 10, isPractice: false });
            Data.addLog({ aluno: 'Maria Santos', serieId: 's', serieNome: 'S', palavra: 'P2', resultado: 'acerto', tempo: 10, isPractice: false });
            Data.addLog({ aluno: 'joão souza', serieId: 's', serieNome: 'S', palavra: 'P3', resultado: 'erro', tempo: 10, isPractice: false });
            
            const joao = Data.getLogsByAluno('joão');
            assert.equal(joao.length, 2);
        });
    });

    describe('Logs de atividade do professor', () => {
        test('addAdminLog registra ação', () => {
            Data.addAdminLog('criar', 'Séries', 'Série criada: 6º Ano');
            const logs = Data.getAdminLogs();
            assert.equal(logs.length, 1);
            assert.equal(logs[0].action, 'criar');
            assert.equal(logs[0].section, 'Séries');
        });

        test('MAX_ADMIN_LOGS limita quantidade', () => {
            Data.KEYS.MAX_ADMIN_LOGS = 3;
            for (let i = 0; i < 5; i++) {
                Data.addAdminLog('editar', 'Teste', `Ação ${i}`);
            }
            const logs = Data.getAdminLogs();
            assert.equal(logs.length, 3);
        });
    });

    describe('Configurações', () => {
        test('getSettings retorna defaults + salvos', () => {
            const settings = Data.getSettings();
            assert.equal(settings.darkMode, false);
            assert.equal(settings.palette, 'nord');
            assert.equal(settings.lang, 'pt-BR');
        });

        test('updateSetting atualiza e persiste', () => {
            Data.updateSetting('darkMode', true);
            const settings = Data.getSettings();
            assert.equal(settings.darkMode, true);
        });
    });

    describe('Export/Import', () => {
        test('exportAll gera JSON completo', () => {
            const s = Data.addSeries({ nome: 'S1' });
            Data.addTurma({ nome: 'T1', serieId: s.id });
            Data.addDisciplina({ nome: 'D1', seriesIds: [s.id] });
            Data.addPalavra({ texto: 'TESTE', serieId: s.id, disciplinaId: Data.getDisciplinas()[0].id });
            
            const json = Data.exportAll();
            const data = JSON.parse(json);
            
            assert.ok(data.version);
            assert.ok(data.exportDate);
            assert.equal(data.series.length, 1);
            assert.equal(data.turmas.length, 1);
            assert.equal(data.disciplinas.length, 1);
            assert.equal(data.palavras.length, 1);
        });

        test('importData restaura dados', () => {
            const s = Data.addSeries({ nome: 'Original' });
            const exportJson = Data.exportAll();
            
            // Limpar e importar
            localStorage.clear();
            resetData();
            
            const result = Data.importData(exportJson);
            assert.equal(result, true);
            
            const imported = Data.getSeries();
            assert.equal(imported.length, 1);
            assert.equal(imported[0].nome, 'Original');
        });

        test('_mergeItems mescla com modo overwrite', () => {
            const existing = [{ id: '1', nome: 'A' }, { id: '2', nome: 'B' }];
            const imported = [{ id: '2', nome: 'B_ATUALIZADO' }, { id: '3', nome: 'C' }];
            
            const merged = Data._mergeItems(existing, imported, 'overwrite');
            assert.equal(merged.length, 3);
            assert.equal(merged.find(m => m.id === '2').nome, 'B_ATUALIZADO');
        });

        test('_mergeItems mescla com modo skip', () => {
            const existing = [{ id: '1', nome: 'A' }, { id: '2', nome: 'B' }];
            const imported = [{ id: '2', nome: 'B_ATUALIZADO' }, { id: '3', nome: 'C' }];
            
            const merged = Data._mergeItems(existing, imported, 'skip');
            assert.equal(merged.length, 3);
            assert.equal(merged.find(m => m.id === '2').nome, 'B'); // manteve original
        });

        test('_mergeItems mescla com modo update', () => {
            const existing = [{ id: '1', nome: 'A', extra: 'old' }, { id: '2', nome: 'B' }];
            const imported = [{ id: '1', nome: 'A_NOVO', novo: 'campo' }, { id: '3', nome: 'C' }];
            
            const merged = Data._mergeItems(existing, imported, 'update');
            assert.equal(merged.length, 3);
            const item1 = merged.find(m => m.id === '1');
            assert.equal(item1.nome, 'A_NOVO');
            assert.equal(item1.extra, 'old'); // manteve campo original
            assert.equal(item1.novo, 'campo'); // adicionou campo novo
        });
    });

    describe('Histórico de palavras', () => {
        test('addWordToHistory adiciona ID ao final', () => {
            Data.addWordToHistory('disc1', 'word1');
            Data.addWordToHistory('disc1', 'word2');
            Data.addWordToHistory('disc1', 'word3');
            
            const recent = Data.getRecentWordIds('disc1');
            assert.deepEqual(recent, ['word1', 'word2', 'word3']);
        });

        test('addWordToHistory move ID existente para o final', () => {
            Data.addWordToHistory('disc1', 'word1');
            Data.addWordToHistory('disc1', 'word2');
            Data.addWordToHistory('disc1', 'word1'); // repetido
            
            const recent = Data.getRecentWordIds('disc1');
            assert.deepEqual(recent, ['word2', 'word1']); // word1 movido para o final
        });

        test('addWordToHistory limita tamanho (maxSize)', () => {
            for (let i = 0; i < 60; i++) {
                Data.addWordToHistory('disc1', `word${i}`, 50);
            }
            const recent = Data.getRecentWordIds('disc1', 100);
            assert.equal(recent.length, 50);
            assert.equal(recent[0], 'word10'); // primeiros 10 removidos
        });

        test('addWordsToHistory adiciona múltiplos de uma vez', () => {
            Data.addWordsToHistory('disc1', ['w1', 'w2', 'w3']);
            const recent = Data.getRecentWordIds('disc1');
            assert.deepEqual(recent, ['w1', 'w2', 'w3']);
        });
    });

    describe('Estatísticas', () => {
        test('getStats calcula totais corretamente', () => {
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P1', resultado: 'acerto', tempo: 10, isPractice: false });
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P2', resultado: 'acerto', tempo: 20, isPractice: false });
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P3', resultado: 'erro', tempo: 15, isPractice: false });
            Data.addLog({ aluno: 'A2', serieId: 's', serieNome: 'S', palavra: 'P4', resultado: 'acerto', tempo: 5, isPractice: false });
            
            const stats = Data.getStats();
            assert.equal(stats.totalGames, 4);
            assert.equal(stats.correct, 3);
            assert.equal(stats.wrong, 1);
            assert.equal(stats.accuracy, 75);
            assert.equal(stats.avgTime, 13); // Math.round((10+20+15+5)/4) = Math.round(12.5) = 13
        });

        test('getStats ignora logs de prática (isPractice)', () => {
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P1', resultado: 'acerto', tempo: 10, isPractice: true });
            Data.addLog({ aluno: 'A1', serieId: 's', serieNome: 'S', palavra: 'P2', resultado: 'acerto', tempo: 10, isPractice: false });
            
            const stats = Data.getStats();
            assert.equal(stats.totalGames, 1);
            assert.equal(stats.correct, 1);
        });
    });

    describe('CSV Export', () => {
        test('exportLogsCSV gera CSV válido com cabeçalho', () => {
            Data.addLog({ aluno: 'João', serieId: 's', serieNome: 'S', turmaId: 't', turmaNome: 'T', disciplinaId: 'd', disciplinaNome: 'D', palavra: 'TESTE', sequencia: [0,1], resultado: 'acerto', tempo: 10, eventoNome: '', data: '2026-01-15T10:00:00Z' });
            
            const csv = Data.exportLogsCSV();
            const lines = csv.trim().split('\r\n');
            assert.equal(lines[0], '"Data";"Aluno";"Série";"Turma";"Disciplina";"Palavra";"Sequência";"Resultado";"Tempo";"Evento"');
            assert.ok(lines[1].includes('João'));
            assert.ok(lines[1].includes('TESTE'));
        });
    });
});

// Testes de integração (simulando fluxo real)
describe('Data Integration Flows', () => {
    beforeEach(() => {
        resetData();
        uuidCounter = 0;
    });

    test('Fluxo completo: Série → Turma → Disciplina → Palavra → Log', () => {
        // 1. Criar série
        const serie = Data.addSeries({ nome: '6º Ano', professor: 'Prof. Carlos' });
        
        // 2. Adicionar turmas
        const turma1 = Data.addTurma({ nome: '6ºA', serieId: serie.id, professor: 'Prof. Carlos' });
        const turma2 = Data.addTurma({ nome: '6ºB', serieId: serie.id });
        
        // 3. Criar disciplinas
        const matematica = Data.addDisciplina({ nome: 'Matemática', seriesIds: [serie.id] });
        const portugues = Data.addDisciplina({ nome: 'Português', seriesIds: [serie.id] });
        
        // 4. Adicionar palavras
        Data.addPalavra({ texto: 'FRACAO', serieId: serie.id, disciplinaId: matematica.id, dica: 'Parte de um todo' });
        Data.addPalavra({ texto: 'VERBO', serieId: serie.id, disciplinaId: portugues.id, dica: 'Ação' });
        
        // 5. Simular partida
        Data.addLog({
            aluno: 'Maria',
            serieId: serie.id,
            serieNome: serie.nome,
            turmaId: turma1.id,
            turmaNome: turma1.nome,
            disciplinaId: matematica.id,
            disciplinaNome: matematica.nome,
            palavra: 'FRACAO',
            sequencia: [0,1,2,3,4,5],
            resultado: 'acerto',
            tempo: 25,
            isPractice: false
        });
        
        // Verificações
        assert.equal(Data.getSeries().length, 1);
        assert.equal(Data.getTurmasBySerie(serie.id).length, 2);
        assert.equal(Data.getDisciplinasBySerie(serie.id).length, 2);
        assert.equal(Data.getPalavrasBySerie(serie.id).length, 2);
        assert.equal(Data.getLogs().length, 1);
        
        const stats = Data.getStats();
        assert.equal(stats.totalGames, 1);
        assert.equal(stats.correct, 1);
    });

    test('Bulk import: séries + turmas + disciplinas + palavras', () => {
        const bulkData = {
            series: [
                { id: 's1', nome: '6º Ano', professor: 'P1', active: true, createdAt: new Date().toISOString() },
                { id: 's2', nome: '7º Ano', professor: 'P2', active: true, createdAt: new Date().toISOString() }
            ],
            turmas: [
                { id: 't1', nome: '6ºA', serieId: 's1', professor: 'P1', createdAt: new Date().toISOString() },
                { id: 't2', nome: '7ºA', serieId: 's2', professor: 'P2', createdAt: new Date().toISOString() }
            ],
            disciplinas: [
                { id: 'd1', nome: 'Matemática', seriesIds: ['s1', 's2'], createdAt: new Date().toISOString() }
            ],
            palavras: [
                { id: 'p1', texto: 'SOMA', dica: '', imagem: null, crop: null, serieId: 's1', disciplinaId: 'd1', createdAt: new Date().toISOString() }
            ]
        };
        
        Data.importData(JSON.stringify(bulkData));
        
        assert.equal(Data.getSeries().length, 2);
        assert.equal(Data.getTurmas().length, 2);
        assert.equal(Data.getDisciplinas().length, 1);
        assert.equal(Data.getPalavras().length, 1);
        
        const palavras = Data.getPalavrasBySerieAndDisciplina('s1', 'd1');
        assert.equal(palavras.length, 1);
    });
});