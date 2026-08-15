// Service Worker do Soletrando — permite instalar o app e jogar sem internet.
//
// Estratégia: cache-first para os arquivos do próprio app (HTML/CSS/JS/ícones),
// já que eles só mudam quando o professor atualiza o app; qualquer coisa fora
// da lista (ex: imagem de internet colada numa palavra) é buscada da rede e,
// se conseguir, guardada em cache pra funcionar offline da próxima vez.
//
// IMPORTANTE: sempre que os arquivos do app mudarem, aumente CACHE_VERSION —
// isso invalida o cache antigo e força todo mundo a baixar a versão nova.
const CACHE_VERSION = 'soletrando-v2';

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/base.css',
    './css/home.css',
    './css/game.css',
    './css/admin.css',
    './css/modals.css',
    './css/session-results.css',
    './css/events.css',
    './css/utilities.css',
    './js/i18n.js',
    './js/utils.js',
    './js/data.js',
    './js/sounds.js',
    './js/game.js',
    './js/admin.js',
    './js/app.js',
    './js/language/pt-BR.js',
    './js/language/en.js',
    './js/language/es.js',
    './img/icons/icon-72.png',
    './img/icons/icon-96.png',
    './img/icons/icon-128.png',
    './img/icons/icon-144.png',
    './img/icons/icon-152.png',
    './img/icons/icon-192.png',
    './img/icons/icon-384.png',
    './img/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Só intercepta GET — POST/etc. (não usados aqui, mas por segurança) passam direto.
    if (event.request.method !== 'GET') return;

    // Ignora a query string (?v=...) usada para cache-busting do navegador — o
    // Service Worker cuida da própria versão via CACHE_VERSION, então usamos
    // sempre a URL "limpa" como chave, evitando acumular uma cópia por versão.
    const url = new URL(event.request.url);
    const cacheKey = url.origin + url.pathname;

    event.respondWith(
        caches.match(cacheKey).then((cached) => {
            if (cached) return cached;

            return fetch(event.request)
                .then((response) => {
                    // Só cacheia respostas válidas e do próprio app (evita
                    // guardar erros ou respostas opacas de terceiros sem necessidade).
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const responseClone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(cacheKey, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Sem rede e sem cache: se for navegação de página, cai pro index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    return undefined;
                });
        })
    );
});
