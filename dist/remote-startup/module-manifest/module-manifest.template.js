(function () {
    function loadScript(config) {
        var script = document.createElement('script');
        script.charset = 'utf-8';
        script.src = config.src;
        script.defer = config.defer === '';
        script.noModule = config.nomodule === '';
        if (config.integrity) {
            script.integrity = config.integrity;
        }
        if (config.crossOrigin !== 'none') {
            script.crossOrigin = config.crossOrigin;
        }
        if (config.type) {
            script.type = config.type;
        }
        document.head.appendChild(script);
        return script;
    }
    function loadRemoteModuleManifest(config) {
        var mainScripts = [];
        var preLoading = [];
        config.scripts.forEach(function (item) {
            if (item.name === 'main') {
                mainScripts.push(item);
            }
            else {
                var script_1 = loadScript(item);
                preLoading.push(new Promise(function (res, rej) {
                    script_1.onload = function () {
                        res(true);
                    };
                    script_1.onerror = function () {
                        rej(script_1.src);
                    };
                }));
            }
        });
        preLoading.push.apply(preLoading, config.stylesheets.map(function (item) {
            var style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = item.href;
            document.head.appendChild(style);
            return new Promise(function (res, rej) {
                style.onload = function () {
                    res(true);
                };
                style.onerror = function () {
                    rej(item.href);
                };
            });
        }));
        return Promise.all(preLoading)
            .then(function () {
            return Promise.race(mainScripts.map(function (item) {
                return window.loadRemoteModule(loadScript(item), item.fileName);
            }));
        })
            .catch(function (error) {
            throw error;
        });
    }
    window.loadRemoteModuleManifest = loadRemoteModuleManifest;
})();
