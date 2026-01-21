const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    const target = process.env.REACT_APP_PROXY_TARGET || 'http://localhost:5051';

    console.log(`[setupProxy] proxying /api, /uploads, /socket.io -> ${target}`);

    app.use(
        '/api',
        createProxyMiddleware({
            target,
            changeOrigin: true,
            secure: false,
        })
    );

    app.use(
        '/uploads',
        createProxyMiddleware({
            target,
            changeOrigin: true,
            secure: false,
        })
    );

    app.use(
        '/socket.io',
        createProxyMiddleware({
            target,
            changeOrigin: true,
            secure: false,
            ws: true,
        })
    );
};
