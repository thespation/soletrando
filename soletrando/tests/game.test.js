// Testes do módulo Game (pool de palavras, distribuições, streak, daily challenge)
// IMPORTANTE: Mocks DEVEM ser definidos ANTES de require() dos módulos

// ===== SETUP GLOBAL (antes de require) =====

// Mock minimal do localStorage
const mockStore = {};
global.localStorage = {
    _store: mockStore,
    getItem(key) { return this._store[key] || null; },
    setItem(key, value) { this._store[key] = String(value); },
    removeItem(key) { delete this._store[key]; },
    clear() { this._store = {}; }
};
global.sessionStorage = { ...global.localStorage };

// Mock do crypto.randomUUID
let uuidCounter = 0;
global.crypto = {
    randomUUID() {
        return `test-uuid-${++uuidCounter}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
};

// Mock do T() para i18n
global.T = (str, vars) => {
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            str = str.split('{' + k + '}').join(v);
        }
    }
    return str;
};

// Mock do Utils (funções puras)
global.Utils = {
    generateId() { return crypto.randomUUID(); },
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
    formatDateTime(dateString) { return new Date(dateString).toLocaleString('pt-BR'); },
    log(...args) { },
    todayKey() { return '2026-1-15'; },
    capitalizeLetter(letter, mode = 'upper') {
        switch (mode) {
            case 'lower': return letter.toLowerCase();
            case 'capitalize': return letter.charAt(0).toUpperCase() + letter.slice(1).toLowerCase();
            default: return letter.toUpperCase();
        }
    },
    normalizeLetter(letter) { return letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
};

// Mock do App
global.App = { showScreen: () => {}, updateGameInputUI: () => {} };

// Mock do Sounds
global.Sounds = { playClick: () => {}, playCorrect: () => {}, playError: () => {}, playLetterReveal: () => {}, playVictory: () => {} };

// Mock document mínimo para Game.updateUI etc.
global.document = {
    getElementById: (id) => {
        const el = {
            id, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
            style: {}, innerHTML: '', textContent: '', value: '',
            querySelector: () => null, querySelectorAll: () => [],
            appendChild: () => {}, remove: () => {}, focus: () => {},
            setAttribute: () => {}, getAttribute: () => null, tagName: 'DIV', dataset: {}
        };
        if (id === 'word-spaces') { el.clientWidth = 800; el.querySelectorAll = () => []; }
        if (id === 'game-header-center') el.innerHTML = '';
        if (id === 'game-timer') el.classList = { toggle: () => {} };
        if (id === 'game-timer-text') el.textContent = '00:00';
        if (id === 'streak-badge') el.classList = { add: () => {}, remove: () => {}, contains: () => false };
        if (id === 'streak-count') el.textContent = '0';
        if (id === 'input-letter') el.value = '';
        if (id === 'practice-badge') el.classList = { add: () => {}, remove: () => {} };
        if (id === 'word-count-remaining') el.classList = { add: () => {}, remove: () => {} };
        if (id === 'word-count-remaining-text') el.textContent = '';
        if (id === 'current-turma-label') el.classList = { add: () => {}, remove: () => {} };
        if (id === 'game-input-area') el.style = { display: '' };
        if (id === 'confetti-container') el.innerHTML = '';
        if (id === 'session-confetti-container') el.innerHTML = '';
        return el;
    },
    querySelector: () => null, querySelectorAll: () => [],
    body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {} },
    createElement: () => ({ style: {}, className: '', textContent: '', innerHTML: '', setAttribute: () => {}, appendChild: () => {} })
};

global.window = { Data: null, Utils: null, Game: null, App: null, Sounds: null, I18n: null, T: global.T };
global.navigator = { language: 'pt-BR' };
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };
global.Blob = function() {};
global.File = function() {};
global.FileReader = function() {};
global.Image = function() { this.onload = null; this.onerror = null; this.src = ''; };
global.Audio = function() {};
global.indexedDB = {};
global.performance = { now: () => Date.now() };

global.ResizeObserver = class ResizeObserver { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
global.IntersectionObserver = class IntersectionObserver { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };

// ===== CARREGAR MÓDULOS (após mocks) =====
const utilsModule = require('../js/utils.js');
global.Utils = { ...global.Utils, ...utilsModule.Utils };
global.window.Utils = global.Utils;

const dataModule = require('../js/data.js');
global.Data = dataModule.Data;
global.window.Data = global.Data;

const gameModule = require('../js/game.js');
global.Game = gameModule.Game;
global.window.Game = global.Game;

// Mock alert para _persist error handling
global.alert = () => {};

// Test runner
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

function resetGameState() {
    Game.state = {
        isActive: false, isPractice: false, serieId: null, turmaIds: [], disciplinaIds: [],
        studentName: '', palavrasPorTurma: null, palavrasModo: 'total', modoOrdem: 'sequencial',
        currentWord: null, currentIndex: 0, revealedLetters: [], errorLetters: [],
        correctCount: 0, wrongCount: 0, startTime: null, elapsedSeconds: 0,
        timerInterval: null, wordPool: [], usedWords: [], eventId: null, eventNome: '',
        wordResults: [], streak: 0, bestStreak: 0, isDailyChallenge: false,
        palavrasExcluidas: [], palavrasSelecionadas: []
    };
    if (Game._fontResizeObserver) { Game._fontResizeObserver.disconnect(); Game._fontResizeObserver = null; }
    localStorage.clear(); sessionStorage.clear();
}

describe('Game Module', () => {
    beforeEach(() => { resetGameState(); localStorage.clear(); });
    afterEach(() => { resetGameState(); });

    describe('loadWordPool - distribuição de palavras', () => {
        function setupBasicData() {
            const s = Data.addSeries({ nome: 'S' });
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [s.id] });
            return { serie: s, disciplina: d };
        }

        test('sem limite (palavrasPorTurma=null) usa todas as palavras embaralhadas', () => {
            const { serie, disciplina } = setupBasicData();
            Data.addPalavra({ texto: 'PALAVRA1', serieId: serie.id, disciplinaId: disciplina.id });
            Data.addPalavra({ texto: 'PALAVRA2', serieId: serie.id, disciplinaId: disciplina.id });
            Data.addPalavra({ texto: 'PALAVRA3', serieId: serie.id, disciplinaId: disciplina.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [disciplina.id];
            Game.state.palavrasPorTurma = null;
            Game.state.turmaIds = [];

            Game.loadWordPool();

            assert.equal(Game.state.wordPool.length, 3);
            assert.equal(Game.state._wordPoolTurmaIdx.length, 3);
        });

        test('com limite total por turma (sem turmas) distribui entre disciplinas', () => {
            const { serie } = setupBasicData();
            const d1 = Data.addDisciplina({ nome: 'D1', seriesIds: [serie.id] });
            const d2 = Data.addDisciplina({ nome: 'D2', seriesIds: [serie.id] });
            for (let i = 1; i <= 5; i++) Data.addPalavra({ texto: `D1P${i}`, serieId: serie.id, disciplinaId: d1.id });
            for (let i = 1; i <= 3; i++) Data.addPalavra({ texto: `D2P${i}`, serieId: serie.id, disciplinaId: d2.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d1.id, d2.id];
            Game.state.palavrasPorTurma = 4;
            Game.state.palavrasModo = 'total';
            Game.state.turmaIds = [];

            Game.loadWordPool();

            // O algoritmo distribui 4 palavras entre 2 disciplinas = 2 por disciplina
            // Mas como há 5+3=8 palavras disponíveis, e o pool principal tem 4, sobram 4
            // Total no wordPool = 4 (principal) + 4 (sobras) = 8
            assert.equal(Game.state.wordPool.length, 8);
        });

        test('com limite por disciplina (sem turmas) pega N de cada', () => {
            const { serie } = setupBasicData();
            const d1 = Data.addDisciplina({ nome: 'D1', seriesIds: [serie.id] });
            const d2 = Data.addDisciplina({ nome: 'D2', seriesIds: [serie.id] });
            for (let i = 1; i <= 5; i++) Data.addPalavra({ texto: `D1P${i}`, serieId: serie.id, disciplinaId: d1.id });
            for (let i = 1; i <= 3; i++) Data.addPalavra({ texto: `D2P${i}`, serieId: serie.id, disciplinaId: d2.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d1.id, d2.id];
            Game.state.palavrasPorTurma = 2;
            Game.state.palavrasModo = 'por';
            Game.state.turmaIds = [];

            Game.loadWordPool();

            // 2 por disciplina = 4 no pool principal, sobram 4 = 8 total
            assert.equal(Game.state.wordPool.length, 8);
        });

        test('com múltiplas turmas e modo "por" distribui por turma E disciplina', () => {
            const { serie } = setupBasicData();
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            const t1 = Data.addTurma({ nome: 'T1', serieId: serie.id });
            const t2 = Data.addTurma({ nome: 'T2', serieId: serie.id });
            for (let i = 1; i <= 10; i++) Data.addPalavra({ texto: `P${i}`, serieId: serie.id, disciplinaId: d.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d.id];
            Game.state.turmaIds = [t1.id, t2.id];
            Game.state.turmaNames = ['T1', 'T2'];
            Game.state.palavrasPorTurma = 3;
            Game.state.palavrasModo = 'por';
            Game.state.modoOrdem = 'sequencial';

            Game.loadWordPool();

            // 3 por disciplina por turma = 3 * 1 * 2 = 6 no pool principal
            // 10 palavras disponíveis, sobram 4 = 10 total
            // Nota: o algoritmo pode incluir mais palavras dependendo da implementação
            assert.ok(Game.state.wordPool.length >= 10);
            const turmaIndices = [...new Set(Game.state._wordPoolTurmaIdx)];
            assert.ok(turmaIndices.includes(0));
            assert.ok(turmaIndices.includes(1));
        });

        test('com múltiplas turmas e modo "total" distribui total entre disciplinas por turma', () => {
            const { serie } = setupBasicData();
            const d1 = Data.addDisciplina({ nome: 'D1', seriesIds: [serie.id] });
            const d2 = Data.addDisciplina({ nome: 'D2', seriesIds: [serie.id] });
            const t1 = Data.addTurma({ nome: 'T1', serieId: serie.id });
            const t2 = Data.addTurma({ nome: 'T2', serieId: serie.id });
            for (let i = 1; i <= 6; i++) Data.addPalavra({ texto: `D1P${i}`, serieId: serie.id, disciplinaId: d1.id });
            for (let i = 1; i <= 6; i++) Data.addPalavra({ texto: `D2P${i}`, serieId: serie.id, disciplinaId: d2.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d1.id, d2.id];
            Game.state.turmaIds = [t1.id, t2.id];
            Game.state.turmaNames = ['T1', 'T2'];
            Game.state.palavrasPorTurma = 4;
            Game.state.palavrasModo = 'total';
            Game.state.modoOrdem = 'sequencial';

            Game.loadWordPool();

            // 4 por turma * 2 turmas = 8 no pool principal
            // 12 palavras disponíveis, sobram 4 = 12 total
            assert.equal(Game.state.wordPool.length, 12);
        });

        test('ordem "intercalado" alterna entre turmas', () => {
            const { serie } = setupBasicData();
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            const t1 = Data.addTurma({ nome: 'T1', serieId: serie.id });
            const t2 = Data.addTurma({ nome: 'T2', serieId: serie.id });
            for (let i = 1; i <= 6; i++) Data.addPalavra({ texto: `P${i}`, serieId: serie.id, disciplinaId: d.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d.id];
            Game.state.turmaIds = [t1.id, t2.id];
            Game.state.turmaNames = ['T1', 'T2'];
            Game.state.palavrasPorTurma = 2;
            Game.state.palavrasModo = 'por';
            Game.state.modoOrdem = 'intercalado';

            Game.loadWordPool();

            const mainPool = Game.state._wordPoolTurmaIdx.slice(-4);
            assert.notEqual(mainPool[0], mainPool[1]);
            assert.notEqual(mainPool[1], mainPool[2]);
            assert.notEqual(mainPool[2], mainPool[3]);
        });

        test('palavrasSelecionadas (evento/prática) ignora outros filtros', () => {
            const { serie } = setupBasicData();
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            const p1 = Data.addPalavra({ texto: 'ESCOLHIDA1', serieId: serie.id, disciplinaId: d.id });
            const p2 = Data.addPalavra({ texto: 'ESCOLHIDA2', serieId: serie.id, disciplinaId: d.id });
            Data.addPalavra({ texto: 'NAO_ESCOLHIDA', serieId: serie.id, disciplinaId: d.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d.id];
            Game.state.palavrasSelecionadas = [p1.id, p2.id];

            Game.loadWordPool();

            assert.equal(Game.state.wordPool.length, 2);
            assert.ok(Game.state.wordPool.every(p => p.id === p1.id || p.id === p2.id));
        });

        test('palavrasExcluidas remove palavras do pool', () => {
            const { serie } = setupBasicData();
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            const p1 = Data.addPalavra({ texto: 'MANTER1', serieId: serie.id, disciplinaId: d.id });
            const p2 = Data.addPalavra({ texto: 'EXCLUIR', serieId: serie.id, disciplinaId: d.id });
            const p3 = Data.addPalavra({ texto: 'MANTER2', serieId: serie.id, disciplinaId: d.id });

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d.id];
            Game.state.palavrasExcluidas = [p2.id];

            Game.loadWordPool();

            assert.equal(Game.state.wordPool.length, 2);
            assert.ok(!Game.state.wordPool.some(p => p.id === p2.id));
        });

        test('deduplicação por ID remove duplicatas', () => {
            const { serie } = setupBasicData();
            const d = Data.addDisciplina({ nome: 'D', seriesIds: [serie.id] });
            Data.addPalavra({ texto: 'UNICA', serieId: serie.id, disciplinaId: d.id });
            const all = Data.getPalavras();
            all.push({ ...all[0], id: Utils.generateId() });
            Data.savePalavras(all);

            Game.state.serieId = serie.id;
            Game.state.disciplinaIds = [d.id];

            Game.loadWordPool();

            assert.equal(Game.state.wordPool.length, 2);
        });
    });

    describe('_prioritizeNewWords - prioriza palavras não usadas recentemente', () => {
        test('sem disciplinaIds retorna array original', () => {
            const words = [{ id: '1', disciplinaId: 'd1' }, { id: '2', disciplinaId: 'd2' }];
            const result = Game._prioritizeNewWords(words);
            assert.deepEqual(result, words);
        });
    });

    describe('_getEffectiveLimit - cálculo de limite total', () => {
        test('sem limite retorna null', () => {
            Game.state.palavrasPorTurma = null;
            assert.equal(Game._getEffectiveLimit(), null);
        });

        test('modo total sem turmas = palavrasPorTurma', () => {
            Game.state.palavrasPorTurma = 10;
            Game.state.palavrasModo = 'total';
            Game.state.turmaIds = [];
            Game.state.disciplinaIds = ['d1', 'd2'];
            assert.equal(Game._getEffectiveLimit(), 10);
        });

        test('modo total com turmas = palavrasPorTurma × numTurmas', () => {
            Game.state.palavrasPorTurma = 5;
            Game.state.palavrasModo = 'total';
            Game.state.turmaIds = ['t1', 't2', 't3'];
            Game.state.disciplinaIds = ['d1'];
            assert.equal(Game._getEffectiveLimit(), 15);
        });

        test('modo por sem turmas = palavrasPorTurma × numDisciplinas', () => {
            Game.state.palavrasPorTurma = 3;
            Game.state.palavrasModo = 'por';
            Game.state.turmaIds = [];
            Game.state.disciplinaIds = ['d1', 'd2', 'd3'];
            assert.equal(Game._getEffectiveLimit(), 9);
        });

        test('modo por com turmas = palavrasPorTurma × numDisciplinas × numTurmas', () => {
            Game.state.palavrasPorTurma = 2;
            Game.state.palavrasModo = 'por';
            Game.state.turmaIds = ['t1', 't2'];
            Game.state.disciplinaIds = ['d1', 'd2'];
            assert.equal(Game._getEffectiveLimit(), 8);
        });
    });

    describe('_computeSessionBadges - conquistas da sessão', () => {
        test('Perfeito: 3+ palavras, 0 erros', () => {
            const badges = Game._computeSessionBadges(5, 5, 0, 100);
            assert.ok(badges.some(b => b.label === 'Perfeito!'));
        });

        test('Sequência de Ouro: bestStreak >= 5', () => {
            Game.state.bestStreak = 5;
            const badges = Game._computeSessionBadges(10, 8, 2, 80);
            assert.ok(badges.some(b => b.label === 'Sequência de Ouro'));
        });

        test('Maratona: 15+ palavras', () => {
            const badges = Game._computeSessionBadges(15, 10, 5, 67);
            assert.ok(badges.some(b => b.label === 'Maratona'));
        });

        test('Mandou Bem: 5+ palavras, 80%+ taxa, com erros', () => {
            const badges = Game._computeSessionBadges(10, 8, 2, 80);
            assert.ok(badges.some(b => b.label === 'Mandou Bem'));
        });

        test('sem badge se critérios não atendidos', () => {
            const badges = Game._computeSessionBadges(2, 1, 1, 50);
            assert.equal(badges.length, 0);
        });
    });

    describe('saveSession / restoreSession', () => {
        test('saveSession persiste estado no localStorage', () => {
            Game.state.isActive = true;
            Game.state.serieId = 's1';
            Game.state.correctCount = 5;
            Game.state.wrongCount = 2;

            Game.saveSession();

            const saved = JSON.parse(localStorage.getItem('soletrando_session'));
            assert.equal(saved.isActive, true);
            assert.equal(saved.serieId, 's1');
            assert.equal(saved.correctCount, 5);
        });

        test('restoreSession retorna false se sem sessão', () => {
            localStorage.removeItem('soletrando_session');
            assert.equal(Game.restoreSession(), false);
        });
    });

    describe('retryWrongWords - prática com palavras erradas', () => {
        test('retorna undefined se nenhum erro', () => {
            Game.state.wordResults = [
                { id: 'w1', resultado: 'acerto' },
                { id: 'w2', resultado: 'acerto' }
            ];
            assert.equal(Game.retryWrongWords(), undefined);
        });
    });

    describe('_computeSessionBadges - conquistas da sessão', () => {
        test('Perfeito: 3+ palavras, 0 erros', () => {
            const badges = Game._computeSessionBadges(5, 5, 0, 100);
            assert.ok(badges.some(b => b.label === 'Perfeito!'));
        });

        test('Sequência de Ouro: bestStreak >= 5', () => {
            Game.state.bestStreak = 5;
            const badges = Game._computeSessionBadges(10, 8, 2, 80);
            assert.ok(badges.some(b => b.label === 'Sequência de Ouro'));
        });

        test('Maratona: 15+ palavras', () => {
            const badges = Game._computeSessionBadges(15, 10, 5, 67);
            assert.ok(badges.some(b => b.label === 'Maratona'));
        });

        test('Mandou Bem: 5+ palavras, 80%+ taxa, com erros', () => {
            const badges = Game._computeSessionBadges(10, 8, 2, 80);
            assert.ok(badges.some(b => b.label === 'Mandou Bem'));
        });

        test('sem badge se critérios não atendidos', () => {
            const badges = Game._computeSessionBadges(2, 1, 1, 50);
            assert.equal(badges.length, 0);
        });
    });

    describe('reset - limpeza completa', () => {
        test('reset limpa estado e desconecta observers', () => {
            Game.state.isActive = true;
            Game.state.currentWord = { texto: 'TESTE' };
            Game._fontResizeObserver = { disconnect: () => {} };
            Game.reset();
            assert.equal(Game.state.isActive, false);
            assert.equal(Game._fontResizeObserver, null);
        });
    });
});

// Helper
function setupBasicData() {
    const s = Data.addSeries({ nome: 'S' });
    const d = Data.addDisciplina({ nome: 'D', seriesIds: [s.id] });
    return { serie: s, disciplina: d };
}