hexo.extend.filter.register('theme_inject', function (injects) {
    injects.header.raw('load-web-font', '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/style.css" />', {}, {cache: true})
    //injects.style.push('source/_data/webfont.styl');
});