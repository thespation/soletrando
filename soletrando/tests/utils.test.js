// Testes automatizados das funções "puras" do js/utils.js — ou seja, as que
// não dependem do navegador (DOM, localStorage, etc.) e por isso dá pra
// testar direto no Node, sem precisar de nenhuma dependência externa.
//
// Como rodar:
//   node --test tests/
// ou, se preferir:
//   npm test

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { Utils } = require('../js/utils.js');

describe('Utils.shuffleArray (Fisher-Yates)', () => {
    test('mantém o mesmo tamanho do array original', () => {
        const original = [1, 2, 3, 4, 5];
        const embaralhado = Utils.shuffleArray(original);
        assert.equal(embaralhado.length, original.length);
    });

    test('contém exatamente os mesmos elementos, só em ordem diferente possível', () => {
        const original = ['A', 'B', 'C', 'D', 'E'];
        const embaralhado = Utils.shuffleArray(original);
        assert.deepEqual([...embaralhado].sort(), [...original].sort());
    });

    test('não modifica o array original (retorna uma cópia nova)', () => {
        const original = [1, 2, 3];
        const originalCopia = [...original];
        Utils.shuffleArray(original);
        assert.deepEqual(original, originalCopia);
    });

    test('funciona com array vazio', () => {
        assert.deepEqual(Utils.shuffleArray([]), []);
    });

    test('funciona com array de 1 elemento', () => {
        assert.deepEqual(Utils.shuffleArray([42]), [42]);
    });

    test('produz uma distribuição razoável (não retorna sempre a mesma ordem)', () => {
        // Não é uma prova estatística formal — só uma checagem de sanidade de
        // que o embaralhamento está de fato acontecendo, rodando várias vezes.
        const original = [1, 2, 3, 4, 5, 6, 7, 8];
        const resultados = new Set();
        for (let i = 0; i < 30; i++) {
            resultados.add(Utils.shuffleArray(original).join(','));
        }
        assert.ok(resultados.size > 1, 'esperava várias ordens diferentes em 30 tentativas');
    });
});

describe('Utils.normalizeLetter', () => {
    test('remove acentos e converte para maiúscula', () => {
        assert.equal(Utils.normalizeLetter('ã'), 'A');
        assert.equal(Utils.normalizeLetter('é'), 'E');
        assert.equal(Utils.normalizeLetter('ç'), 'C');
        assert.equal(Utils.normalizeLetter('ô'), 'O');
    });

    test('mantém letras sem acento, só maiuscula', () => {
        assert.equal(Utils.normalizeLetter('a'), 'A');
        assert.equal(Utils.normalizeLetter('Z'), 'Z');
    });
});

describe('Utils.capitalizeLetter', () => {
    test('modo "upper" (padrão) deixa tudo maiúsculo', () => {
        assert.equal(Utils.capitalizeLetter('ação'), 'AÇÃO');
    });

    test('modo "lower" deixa tudo minúsculo', () => {
        assert.equal(Utils.capitalizeLetter('AÇÃO', 'lower'), 'ação');
    });

    test('modo "capitalize" deixa só a primeira letra maiúscula', () => {
        assert.equal(Utils.capitalizeLetter('AÇÃO', 'capitalize'), 'Ação');
        assert.equal(Utils.capitalizeLetter('ação', 'capitalize'), 'Ação');
    });
});

describe('Utils.formatTime', () => {
    test('formata segundos como MM:SS', () => {
        assert.equal(Utils.formatTime(0), '00:00');
        assert.equal(Utils.formatTime(5), '00:05');
        assert.equal(Utils.formatTime(65), '01:05');
        assert.equal(Utils.formatTime(3600), '60:00');
    });
});

describe('Utils.generateId', () => {
    test('gera um ID no formato UUID', () => {
        const id = Utils.generateId();
        assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('gera IDs diferentes a cada chamada', () => {
        const ids = new Set(Array.from({ length: 100 }, () => Utils.generateId()));
        assert.equal(ids.size, 100, 'esperava 100 IDs únicos, sem colisão');
    });
});

describe('Utils.debounce', () => {
    test('só executa a função uma vez após várias chamadas rápidas', (t, done) => {
        let chamadas = 0;
        const fn = Utils.debounce(() => { chamadas++; }, 20);
        fn(); fn(); fn();
        setTimeout(() => {
            assert.equal(chamadas, 1);
            done();
        }, 50);
    });
});
