module.exports = {
    staticFileGlobs: [
        'build/**/*.js',
        'build/**/*.css',
        'build/static/media/*.jpg',
        'build/static/media/*.svg',
        'build/static/media/*.woff2',
        'build/200.html'
    ],
    dontCacheBustUrlsMatching: /./,
    swFilePath: 'build/service-worker.js',
    stripPrefix: 'build/',
    navigateFallback: '/200.html',
    cacheId: 'drawasaurus-cache',
    runtimeCaching: [{
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'cacheFirst'
    }, {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'cacheFirst'
    }, {
        urlPattern: /static/,
        handler: 'cacheFirst'
    }]
}