const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');

const normalizeTarget = (t) => String(t || '').replace(/\/$/, '');

const makeLocalTargets = (base) => {
    const t = normalizeTarget(base);
    if (!t) return [];
    return [t];
};

const makePortRangeTargets = (startPort, count) => {
    const out = [];
    const start = Number(startPort);
    const n = Number(count);
    if (!Number.isFinite(start) || !Number.isFinite(n)) return out;
    for (let i = 0; i < n; i += 1) {
        out.push(`http://localhost:${start + i}`);
    }
    return out;
};

const probeHealth = (target, timeoutMs = 800) =>
    new Promise((resolve) => {
        try {
            const url = new URL('/api/health', normalizeTarget(target));
            const req = http.get(
                {
                    hostname: url.hostname,
                    port: url.port || 80,
                    path: url.pathname,
                    timeout: timeoutMs,
                },
                (res) => {
                    res.resume();
                    resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
                },
            );
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            req.on('error', () => resolve(false));
        } catch (_e) {
            resolve(false);
        }
    });

const resolveBackendTarget = async () => {
    const explicit = process.env.REACT_APP_PROXY_TARGET;
    if (explicit) return normalizeTarget(explicit);

    const candidates = [
        ...makeLocalTargets(process.env.REACT_APP_BACKEND_ORIGIN),
        ...makePortRangeTargets(process.env.REACT_APP_BACKEND_PORT_START || 5050, process.env.REACT_APP_BACKEND_PORT_RANGE || 25),
    ];

    for (const c of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await probeHealth(c);
        if (ok) return normalizeTarget(c);
    }

    return 'http://localhost:5050';
};

module.exports = function (app) {
    let target = 'http://localhost:5050';

    resolveBackendTarget().then((t) => {
        target = normalizeTarget(t);
        console.log(`[setupProxy] resolved backend target -> ${target}`);
    });

    console.log(`[setupProxy] proxying /api, /uploads, /socket.io -> ${target}`);

    const mkProxy = (opts = {}) =>
        createProxyMiddleware({
            target,
            changeOrigin: true,
            secure: false,
            ws: Boolean(opts.ws),
            proxyTimeout: 10000,
            timeout: 10000,
            ...opts,
            // Resolve target on every request so late async detection still works.
            router: () => target,
        });

    // CRA mounts middleware at these prefixes; Express strips the mount path.
    // Rewrite to add the prefix back so backend receives correct routes.
    app.use(
        '/api',
        mkProxy({
            pathRewrite: {
                '^/': '/api/',
            },
        }),
    );

    app.use(
        '/uploads',
        mkProxy({
            pathRewrite: {
                '^/': '/uploads/',
            },
        }),
    );

    app.use(
        '/socket.io',
        mkProxy({
            ws: true,
            pathRewrite: {
                '^/': '/socket.io/',
            },
        }),
    );

    // Legacy fallbacks: if any code hits these without /api, proxy them to the correct /api routes.
    app.use('/banners', mkProxy({ pathRewrite: { '^/': '/api/banners' } }));
    app.use('/products', mkProxy({ pathRewrite: { '^/': '/api/products' } }));
    app.use('/categories', mkProxy({ pathRewrite: { '^/': '/api/categories' } }));
    app.use('/content-settings', mkProxy({ pathRewrite: { '^/': '/api/content-settings' } }));
};
