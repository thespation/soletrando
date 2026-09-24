// Service Worker do Soletrando — permite instalar o app e jogar sem internet.
//
// Estratégia: stale-while-revalidate para os arquivos do próprio app (HTML/CSS/JS/ícones).
// - Retorna do cache imediatamente (rápido, offline-first)
// - Em background, busca na rede e atualiza o cache para a próxima vez
// - Se falhar a rede, usa o cache (funciona offline)
//
// IMPORTANTE: sempre que os arquivos do app mudarem, aumente CACHE_VERSION —
// isso invalida o cache antigo e força todo mundo a baixar a versão nova.
const CACHE_VERSION = 'soletrando-v14';

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
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
    // Só intercepta GET — POST/etc. passam direto.
    if (event.request.method !== 'GET') return;

    // Ignora a query string (?v=...) usada para cache-busting do navegador.
    const url = new URL(event.request.url);
    const cacheKey = url.origin + url.pathname;

    // Navegação de página: network-first (sempre tenta pegar o HTML mais novo)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_VERSION).then((cache) => {
                            cache.put(cacheKey, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Demais recursos (CSS/JS/imagens/fonts): stale-while-revalidate
    // - Retorna do cache imediatamente se tiver
    // - Em background, busca na rede e atualiza o cache
    event.respondWith(
        caches.match(cacheKey).then((cached) => {
            const fetchPromise = fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const responseClone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(cacheKey, responseClone);
                    });
                    return response;
                })
                .catch(() => undefined);

            return cached || fetchPromise;
        })
    );
});