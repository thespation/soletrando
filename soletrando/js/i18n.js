// ===== SISTEMA DE IDIOMAS =====
// As chaves são o texto original em português (com placeholders {var}).
// I18n.t('...') resolve para o idioma atual ou retorna o próprio texto.
// Dicionários ficam em js/language/<idioma>.js e registram em window.I18N_DICTS.
// O index.html carrega somente o dicionário do idioma ativo antes dos demais scripts.

const T = (str, vars) => (typeof I18n !== 'undefined' && I18n.current) ? I18n.t(str, vars) : str;

window.I18N_DICTS = window.I18N_DICTS || {};

// ===== TRADUÇÃO DE DETALHES DO LOG DE ATIVIDADES =====
// Os logs são gravados como texto final em pt-BR (com valores interpolados),
// por isso a tradução acontece na renderização — cobre também logs antigos.
// As regras só são aplicadas quando o idioma ativo não é pt-BR.
// LOG_VOCAB concentra o vocabulário de tradução por idioma (en, es).

const _logSplit = (s) => {
    const out = []; let depth = 0, cur = '';
    for (const ch of s) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        if (ch === ';' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
        cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
};

const _logVal = (v, s) => {
    const str = String(s);
    return (v.values && v.values[str]) || str;
};

const _logTxt = (v, s) => {
    let out = String(s);
    for (const [re, rep] of v.txtRules) out = out.replace(re, rep);
    return out;
};

const _logSelecao = (v, s) => _logSplit(s).map(part => {
    for (const [k, rep] of Object.entries(v.selecao)) {
        if (part.startsWith(k + ': ')) return rep + ': ' + part.slice(k.length + 2);
    }
    return part;
}).join('; ');

const _logItem = (v, s) => {
    for (const [re, fn] of v.items) {
        const m = re.exec(s);
        if (m) return fn(m, v);
    }
    return s;
};

const _logItems = (v, s) => _logSplit(s).map(p => _logItem(v, p)).join('; ');

const _isLogItem = (v, s) => _logItem(v, s) !== s;

const LOG_VOCAB = {
    en: {
        values: {
            'ativo': 'active', 'inativo': 'inactive', 'encerrado': 'closed', 'vazio': 'empty',
            'sorteio': 'draw', 'selecao': 'selection', 'Escuro': 'Dark', 'Claro': 'Light',
            'Padrão': 'Default', 'Ativado': 'Enabled', 'Desativado': 'Disabled'
        },
        settings: {
            'Tema': 'Theme', 'Confete': 'Confetti', 'Flash': 'Flash', 'Tremer': 'Shake',
            'Revelar palavra': 'Reveal word', 'Mostrar dica': 'Show hint', 'Mostrar imagem': 'Show image',
            'Mostrar cronômetro': 'Show timer', 'Modo automático': 'Auto mode',
            'Espaçamento das letras': 'Letter spacing', 'Idioma': 'Language'
        },
        txtRules: [
            [/Professor\(a\):/g, 'Teacher:'],
            [/sem professor\(a\)/g, 'no teacher'],
            [/— Série:/g, '— Grade:'],
            [/(\d+) rodada(s?)/g, '$1 round$2'],
            [/\bvazio\b/g, 'empty']
        ],
        selecao: { removidas: 'removed', adicionadas: 'added' },
        items: [
            [/^Nome: "(.*)" → "(.*)"$/, (m, v) => `Name: "${m[1]}" → "${m[2]}"`],
            [/^Professor\(a\): "(.*)" → "(.*)"$/, (m, v) => `Teacher: "${_logVal(v, m[1])}" → "${_logVal(v, m[2])}"`],
            [/^Séries: "(.*)" → "(.*)"$/, (m, v) => `Grades: "${m[1]}" → "${m[2]}"`],
            [/^Série: "(.*)" → "(.*)"$/, (m, v) => `Grade: "${m[1]}" → "${m[2]}"`],
            [/^Disciplina: "(.*)" → "(.*)"$/, (m, v) => `Subject: "${m[1]}" → "${m[2]}"`],
            [/^Disciplinas: (.*)$/, (m, v) => `Subjects: ${m[1]}`],
            [/^Texto: "(.*)" → "(.*)"$/, (m, v) => `Word: "${m[1]}" → "${m[2]}"`],
            [/^Dica: "(.*)" → "(.*)"$/, (m, v) => `Hint: "${m[1]}" → "${m[2]}"`],
            [/^Data: "(.*)" → "(.*)"$/, (m, v) => `Date: "${m[1]}" → "${m[2]}"`],
            [/^Status: "(.*)" → "(.*)"$/, (m, v) => `Status: "${_logVal(v, m[1])}" → "${_logVal(v, m[2])}"`],
            [/^Imagem alterada$/, () => 'Image changed'],
            [/^Enquadramento da imagem ajustado$/, () => 'Image framing adjusted'],
            [/^Rodada (\d+) \((.*)\): criada(.*)$/, (m, v) => m[3] ? `Round ${m[1]} (${m[2]}): created — ${_logItems(v, m[3].replace(/^ — /, ''))}` : `Round ${m[1]} (${m[2]}): created`],
            [/^Rodada (\d+) \((.*)\): removida$/, (m, v) => `Round ${m[1]} (${m[2]}): removed`],
            [/^Rodada (\d+) \((.*)\): (.*)$/, (m, v) => `Round ${m[1]} (${m[2]}): ${_logItem(v, m[3])}`],
            [/^série: "(.*)" → "(.*)"$/, (m, v) => `grade: "${m[1]}" → "${m[2]}"`],
            [/^palavras\/aluno: (.*) → (.*)$/, (m, v) => `words/student: ${m[1]} → ${m[2]}`],
            [/^modo: "(.*)" → "(.*)"$/, (m, v) => `mode: "${_logVal(v, m[1])}" → "${_logVal(v, m[2])}"`],
            [/^palavras selecionadas \((.*)\)$/, (m, v) => `selected words (${_logSelecao(v, m[1])})`],
            [/^disciplinas: "(.*)" → "(.*)"$/, (m, v) => `subjects: "${m[1]}" → "${m[2]}"`],
            [/^alunos: "(.*)" → "(.*)"$/, (m, v) => `students: "${m[1]}" → "${m[2]}"`],
            [/^disciplinas: (.*)$/, (m, v) => `subjects: ${m[1]}`],
            [/^palavras: (.*)$/, (m, v) => `words: ${m[1]}`],
            [/^alunos: (.*)$/, (m, v) => `students: ${m[1]}`],
            [/^(.+?): "(.*)" → "(.*)"$/, (m, v) => `${v.settings[m[1]] || m[1]}: "${_logVal(v, m[2])}" → "${_logVal(v, m[3])}"`]
        ],
        rules: [
            [/^Série criada: (.+)$/, (m, v) => `Grade created: ${_logTxt(v, m[1])}`],
            [/^Série ativada: (.+)$/, (m, v) => `Grade activated: ${m[1]}`],
            [/^Série desativada: (.+)$/, (m, v) => `Grade deactivated: ${m[1]}`],
            [/^Série editada: (.+)$/, (m, v) => `Grade edited: ${m[1]}`],
            [/^Série excluída: (.+)$/, (m, v) => `Grade deleted: ${m[1]}`],
            [/^Turma criada: (.+)$/, (m, v) => `Class created: ${_logTxt(v, m[1])}`],
            [/^Turma editada: (.+)$/, (m, v) => `Class edited: ${m[1]}`],
            [/^Turma excluída: (.+)$/, (m, v) => `Class deleted: ${m[1]}`],
            [/^Disciplina criada: (.+)$/, (m, v) => `Subject created: ${m[1]}`],
            [/^Disciplina editada: (.+)$/, (m, v) => `Subject edited: ${m[1]}`],
            [/^Disciplina excluída: (.+)$/, (m, v) => `Subject deleted: ${m[1]}`],
            [/^Palavra criada: (.+)$/, (m, v) => `Word created: ${m[1]}`],
            [/^Palavra editada: (.+)$/, (m, v) => `Word edited: ${m[1]}`],
            [/^Palavra excluída: (.+)$/, (m, v) => `Word deleted: ${m[1]}`],
            [/^Palavra (.+?): (.+)$/, (m, v) => `Word ${m[1]}: ${_logItems(v, m[2])}`],
            [/^Evento criado: (.+)$/, (m, v) => `Event created: ${m[1].replace(/\((\d+) rodada(s?)\)/, '($1 round$2)')}`],
            [/^Evento editado: (.+)$/, (m, v) => `Event edited: ${m[1]}`],
            [/^Evento excluído: (.+)$/, (m, v) => `Event deleted: ${m[1]}`],
            [/^Evento "(.+)" — (.+)$/, (m, v) => `Event "${m[1]}" — ${_logItems(v, m[2])}`],
            [/^Execução excluída: (.+)$/, (m, v) => `Run deleted: ${m[1]}`],
            [/^Execução de evento excluída: (.+)$/, (m, v) => `Event run deleted: ${m[1]}`],
            [/^Todos os resultados avulsos excluídos \((\d+) registros\) — backup: (.+)$/, (m, v) => `All standalone results deleted (${m[1]} records) — backup: ${m[2]}`],
            [/^Todos os resultados de eventos excluídos \((\d+) registros\) — backup: (.+)$/, (m, v) => `All event results deleted (${m[1]} records) — backup: ${m[2]}`],
            [/^Todos os logs de sessão foram apagados$/, () => 'All session logs were cleared'],
            [/^Importação concluída: (.+)$/, (m, v) => `Import completed: ${m[1]}`],
            [/^Importação seletiva \(modo: (.+)\): (.+)$/, (m, v) => `Selective import (mode: ${m[1]}): ${m[2]}`],
            [/^Backup restaurado: (.+)$/, (m, v) => `Backup restored: ${m[1]}`],
            [/^Resumo da migração para "img": (\d+) copiada\(s\), (\d+) já existente\(s\), (\d+) com erro(.+)$/, (m, v) => `Migration summary to "img": ${m[1]} copied, ${m[2]} already existing, ${m[3]} with error${m[4]}`],
            [/^(.+): já estava em img \((.+)\)$/, (m, v) => `${m[1]}: was already in img (${m[2]})`],
            [/^(.+): sucesso — copiada como (.+)$/, (m, v) => `${m[1]}: success — copied as ${m[2]}`],
            [/^(.+): erro — (.+)$/, (m, v) => `${m[1]}: error — ${m[2]}`],
            [/^Imagem de (.+): download falhou \((.+)\) — salvando link externo$/, (m, v) => `Image of ${m[1]}: download failed (${m[2]}) — saving external link`],
            [/^Imagem de (.+): referência gravada como disk:(.+)$/, (m, v) => `Image of ${m[1]}: reference saved as disk:${m[2]}`],
            [/^Imagem de (.+): gravada embutida em base64 \(não foi salva em disco\)$/, (m, v) => `Image of ${m[1]}: saved embedded in base64 (not saved to disk)`],
            [/^Imagem de (.+): gravada como link externo \((.+)\)$/, (m, v) => `Image of ${m[1]}: saved as external link (${m[2]})`],
            [/^Imagem de (.+): removida$/, (m, v) => `Image of ${m[1]}: removed`]
        ]
    },

    es: {
        values: {
            'ativo': 'activo', 'inativo': 'inactivo', 'encerrado': 'finalizado', 'vazio': 'vacío',
            'sorteio': 'sorteo', 'selecao': 'selección', 'Escuro': 'Oscuro', 'Claro': 'Claro',
            'Padrão': 'Predeterminado', 'Ativado': 'Activado', 'Desativado': 'Desactivado'
        },
        settings: {
            'Tema': 'Tema', 'Confete': 'Confeti', 'Flash': 'Flash', 'Tremer': 'Sacudir',
            'Revelar palavra': 'Revelar palabra', 'Mostrar dica': 'Mostrar pista', 'Mostrar imagem': 'Mostrar imagen',
            'Mostrar cronômetro': 'Mostrar cronómetro', 'Modo automático': 'Modo automático',
            'Espaçamento das letras': 'Espaciado de las letras', 'Idioma': 'Idioma'
        },
        txtRules: [
            [/Professor\(a\):/g, 'Profesor(a):'],
            [/sem professor\(a\)/g, 'sin profesor(a)'],
            [/— Série:/g, '— Serie:'],
            [/(\d+) rodada(s?)/g, '$1 ronda$2'],
            [/\bvazio\b/g, 'vacío']
        ],
        selecao: { removidas: 'eliminadas', adicionadas: 'añadidas' },
        items: [
            [/^Nome: "(.*)" → "(.*)"$/, (m, v) => `Nombre: "${m[1]}" → "${m[2]}"`],
            [/^Professor\(a\): "(.*)" → "(.*)"$/, (m, v) => `Profesor(a): "${_logVal(v, m[1])}" → "${_logVal(v, m[2])}"`],
            [/^Séries: "(.*)" → "(.*)"$/, (m, v) => `Series: "${m[1]}" → "${m[2]}"`],
            [/^Série: "(.*)" → "(.*)"$/, (m, v) => `Serie: "${m[1]}" → "${m[2]}"`],
            [/^Disciplina: "(.*)" → "(.*)"$/, (m, v) => `Asignatura: "${m[1]}" → "${m[2]}"`],
            [/^Disciplinas: (.*)$/, (m, v) => `Asignaturas: ${m[1]}`],
            [/^Texto: "(.*)" → "(.*)"$/, (m, v) => `Palabra: "${m[1]}" → "${m[2]}"`],
            [/^Dica: "(.*)" → "(.*)"$/, (m, v) => `Pista: "${m[1]}" → "${m[2]}"`],
            [/^Data: "(.*)" → "(.*)"$/, (m, v) => `Fecha: "${m[1]}" → "${m[2]}"`],
            [/^Status: "(.*)" → "(.*)"$/, (m, v) => `Estado: "${_logVal(v, m[1])}" → "${_logVal(v, m[2])}"`],
            [/^Imagem alterada$/, () => 'Imagen cambiada'],
            [/^Enquadramento da imagem ajustado$/, () => 'Encaje de la imagen ajustado'],
            [/^Rodada (\d+) \((.*)\): criada(.*)$/, (m, v) => m[3] ? `Ronda ${m[1]} (${m[2]}): creada — ${_logItems(v, m[3].replace(/^ — /, ''))}` : `Ronda ${m[1]} (${m[2]}): creada`],
            [/^Rodada (\d+) \((.*)\): removida$/, (m, v) => `Ronda ${m[1]} (${m[2]}): eliminada`],
            [/^Rodada (\d+) \((.*)\): (.*)$/, (m, v) => `Ronda ${m[1]} (${m[2]}): ${_logItem(v, m[3])}`],
            [/^série: "(.*)" → "(.*)"$/, (m, v) => `serie: "${m[1]}" → "${m[2]}"`],
            [/^palavras\/aluno: (.*) → (.*)$/, (m, v) => `palabras/alumno: ${m[1]} → ${m[2]}`],
            [/^modo: "(.*)" → "(.*)"$/, (m, v) => `modo: "${_logVal(v, m[1])}" → "${_logVal(v, m[2])}"`],
            [/^palavras selecionadas \((.*)\)$/, (m, v) => `palabras seleccionadas (${_logSelecao(v, m[1])})`],
            [/^disciplinas: "(.*)" → "(.*)"$/, (m, v) => `asignaturas: "${m[1]}" → "${m[2]}"`],
            [/^alunos: "(.*)" → "(.*)"$/, (m, v) => `alumnos: "${m[1]}" → "${m[2]}"`],
            [/^disciplinas: (.*)$/, (m, v) => `asignaturas: ${m[1]}`],
            [/^palavras: (.*)$/, (m, v) => `palabras: ${m[1]}`],
            [/^alunos: (.*)$/, (m, v) => `alumnos: ${m[1]}`],
            [/^(.+?): "(.*)" → "(.*)"$/, (m, v) => `${v.settings[m[1]] || m[1]}: "${_logVal(v, m[2])}" → "${_logVal(v, m[3])}"`]
        ],
        rules: [
            [/^Série criada: (.+)$/, (m, v) => `Serie creada: ${_logTxt(v, m[1])}`],
            [/^Série ativada: (.+)$/, (m, v) => `Serie activada: ${m[1]}`],
            [/^Série desativada: (.+)$/, (m, v) => `Serie desactivada: ${m[1]}`],
            [/^Série editada: (.+)$/, (m, v) => `Serie editada: ${m[1]}`],
            [/^Série excluída: (.+)$/, (m, v) => `Serie eliminada: ${m[1]}`],
            [/^Turma criada: (.+)$/, (m, v) => `Clase creada: ${_logTxt(v, m[1])}`],
            [/^Turma editada: (.+)$/, (m, v) => `Clase editada: ${m[1]}`],
            [/^Turma excluída: (.+)$/, (m, v) => `Clase eliminada: ${m[1]}`],
            [/^Disciplina criada: (.+)$/, (m, v) => `Asignatura creada: ${m[1]}`],
            [/^Disciplina editada: (.+)$/, (m, v) => `Asignatura editada: ${m[1]}`],
            [/^Disciplina excluída: (.+)$/, (m, v) => `Asignatura eliminada: ${m[1]}`],
            [/^Palavra criada: (.+)$/, (m, v) => `Palabra creada: ${m[1]}`],
            [/^Palavra editada: (.+)$/, (m, v) => `Palabra editada: ${m[1]}`],
            [/^Palavra excluída: (.+)$/, (m, v) => `Palabra eliminada: ${m[1]}`],
            [/^Palavra (.+?): (.+)$/, (m, v) => `Palabra ${m[1]}: ${_logItems(v, m[2])}`],
            [/^Evento criado: (.+)$/, (m, v) => `Evento creado: ${m[1].replace(/\((\d+) rodada(s?)\)/, '($1 ronda$2)')}`],
            [/^Evento editado: (.+)$/, (m, v) => `Evento editado: ${m[1]}`],
            [/^Evento excluído: (.+)$/, (m, v) => `Evento eliminado: ${m[1]}`],
            [/^Evento "(.+)" — (.+)$/, (m, v) => `Evento "${m[1]}" — ${_logItems(v, m[2])}`],
            [/^Execução excluída: (.+)$/, (m, v) => `Ejecución eliminada: ${m[1]}`],
            [/^Execução de evento excluída: (.+)$/, (m, v) => `Ejecución de evento eliminada: ${m[1]}`],
            [/^Todos os resultados avulsos excluídos \((\d+) registros\) — backup: (.+)$/, (m, v) => `Todos los resultados sueltos eliminados (${m[1]} registros) — respaldo: ${m[2]}`],
            [/^Todos os resultados de eventos excluídos \((\d+) registros\) — backup: (.+)$/, (m, v) => `Todos los resultados de eventos eliminados (${m[1]} registros) — respaldo: ${m[2]}`],
            [/^Todos os logs de sessão foram apagados$/, () => 'Todos los registros de sesión fueron borrados'],
            [/^Importação concluída: (.+)$/, (m, v) => `Importación completada: ${m[1]}`],
            [/^Importação seletiva \(modo: (.+)\): (.+)$/, (m, v) => `Importación selectiva (modo: ${m[1]}): ${m[2]}`],
            [/^Backup restaurado: (.+)$/, (m, v) => `Respaldo restaurado: ${m[1]}`],
            [/^Resumo da migração para "img": (\d+) copiada\(s\), (\d+) já existente\(s\), (\d+) com erro(.+)$/, (m, v) => `Resumen de la migración a "img": ${m[1]} copiada(s), ${m[2]} ya existente(s), ${m[3]} con error${m[4]}`],
            [/^(.+): já estava em img \((.+)\)$/, (m, v) => `${m[1]}: ya estaba en img (${m[2]})`],
            [/^(.+): sucesso — copiada como (.+)$/, (m, v) => `${m[1]}: éxito — copiada como ${m[2]}`],
            [/^(.+): erro — (.+)$/, (m, v) => `${m[1]}: error — ${m[2]}`],
            [/^Imagem de (.+): download falhou \((.+)\) — salvando link externo$/, (m, v) => `Imagen de ${m[1]}: descarga fallida (${m[2]}) — guardando enlace externo`],
            [/^Imagem de (.+): referência gravada como disk:(.+)$/, (m, v) => `Imagen de ${m[1]}: referencia guardada como disk:${m[2]}`],
            [/^Imagem de (.+): gravada embutida em base64 \(não foi salva em disco\)$/, (m, v) => `Imagen de ${m[1]}: guardada incrustada en base64 (no se guardó en disco)`],
            [/^Imagem de (.+): gravada como link externo \((.+)\)$/, (m, v) => `Imagen de ${m[1]}: guardada como enlace externo (${m[2]})`],
            [/^Imagem de (.+): removida$/, (m, v) => `Imagen de ${m[1]}: eliminada`]
        ]
    }
};

const I18n = {
    defaultLang: 'pt-BR',

    languages: {
        'pt-BR': { name: 'Português (Brasil)', short: 'PT' },
        'en': { name: 'English', short: 'EN' },
        'es': { name: 'Español', short: 'ES' }
    },

    dicts: window.I18N_DICTS,

    resolveLang() {
        try {
            const saved = JSON.parse(localStorage.getItem('soletrando_settings') || '{}').lang;
            if (saved && this.languages[saved]) return saved;
        } catch (e) {}
        const nav = (navigator.language || '').toLowerCase();
        if (nav.startsWith('pt')) return 'pt-BR';
        if (nav.startsWith('en')) return 'en';
        if (nav.startsWith('es')) return 'es';
        return this.defaultLang;
    },

    getLang() {
        const lang = this.resolveLang();
        return this.dicts[lang] ? lang : this.defaultLang;
    },

    init() {
        this.current = this.getLang();
        if (!this.dicts[this.current]) this.current = this.defaultLang;
        document.documentElement.lang = this.current;
        this.apply();
        this.syncSelectors();
        return this.current;
    },

    t(str, vars) {
        if (str === null || str === undefined) return str;
        const dict = this.dicts[this.current] || this.dicts[this.defaultLang];
        let out = (dict && dict[str]) || str;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                out = out.split('{' + k + '}').join(v);
            }
        }
        return out;
    },

    locale() {
        if (this.current === 'pt-BR') return 'pt-BR';
        if (this.current === 'en') return 'en-US';
        return 'es-ES';
    },

    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = this.t(key);
            if (el.tagName === 'IMG') el.alt = value;
            else if (el.tagName === 'INPUT') el.value = value;
            else el.textContent = value;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = this.t(el.getAttribute('data-i18n-title'));
        });
        const title = document.title;
        if (this.t(title) !== title) {
            document.title = this.t(title);
        }
    },

    syncSelectors() {
        document.querySelectorAll('[data-lang-btn]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langBtn === this.current);
        });
        const selects = document.querySelectorAll('[data-lang-select]');
        if (selects.length) {
            selects.forEach(sel => { sel.value = this.current; });
        }
    },

    logDetails(str) {
        if (str === null || str === undefined || this.current === 'pt-BR') return str;
        const v = LOG_VOCAB[this.current];
        if (!v) return str;

        const items = _logSplit(str);
        if (items.length > 1 && items.every(p => _isLogItem(v, p))) {
            return _logItems(v, str);
        }

        for (const [re, fn] of v.rules) {
            const m = re.exec(str);
            if (m) return fn(m, v);
        }

        if (_isLogItem(v, str)) return _logItem(v, str);

        const cm = /^(.+): (.+) → (.+)$/.exec(str);
        if (cm) return `${v.settings[cm[1]] || cm[1]}: ${_logVal(v, cm[2])} → ${_logVal(v, cm[3])}`;

        return str;
    },

    setLang(code) {
        if (!this.languages[code]) return;
        this.current = code;
        try {
            const settings = JSON.parse(localStorage.getItem('soletrando_settings') || '{}');
            settings.lang = code;
            localStorage.setItem('soletrando_settings', JSON.stringify(settings));
        } catch (e) {}
        if (typeof Data !== 'undefined' && Data.updateSetting) {
            try { Data.updateSetting('lang', code); } catch (e) {}
        }
        location.reload();
    }
};

window.I18n = I18n;
