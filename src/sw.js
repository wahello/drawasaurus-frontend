module.exports = {
    staticFileGlobs: [
        'build/**/*.js',
        'build/**/*.css',
        'build/static/media/*',
        'build/index.html',
        'build/room/index.html',
        'build/200.html'
    ],
    stripPrefix: 'build/',
    swFilePath: './build/service-worker.js',
    navigateFallback: '/200.html',
    navigateFallbackWhitelist: [/^(?!.*[.]zip$).*$/],
    cacheId: 'drawasaurus-cache',
    runtimeCaching: [{
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'networkFirst'
    }]
}