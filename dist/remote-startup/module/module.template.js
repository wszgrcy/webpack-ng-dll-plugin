(function () {
    var loadedRemoteModuleMap = {};
    var loadingRemoteModuleMap = {};
    function getDefaultModuleName(name) {
        if (name === void 0) { name = ''; }
        return name.split(/(\/|\\)/g).pop();
    }
    function loadRemoteModule(url, moduleName) {
        if (typeof url === 'string') {
            !moduleName && (moduleName = getDefaultModuleName(url));
        }
        if (loadedRemoteModuleMap[moduleName]) {
            return loadedRemoteModuleMap[moduleName];
        }
        var resolve;
        var reject;
        var promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        loadedRemoteModuleMap[moduleName] = promise;
        loadingRemoteModuleMap[moduleName] = resolve;
        requireEnsure(url, reject, moduleName);
        return promise;
    }
    function loadRemoteModuleJsonpCallback(name, module) {
        if (loadingRemoteModuleMap[name] && module) {
            loadingRemoteModuleMap[name](module);
            delete loadingRemoteModuleMap[name];
        }
        else {
            console.error('moduleName:', name, ',moduleExport:', module);
            throw new Error("no " + name + " found");
        }
    }
    window.loadRemoteModule = loadRemoteModule;
    window.loadRemoteModuleJsonpCallback = loadRemoteModuleJsonpCallback;
    function requireEnsure(arg, rej, name) {
        var script;
        if (typeof arg == 'string') {
            var url = arg;
            script = document.createElement('script');
            script.src = url;
        }
        else {
            script = arg;
        }
        var onScriptComplete;
        script.charset = 'utf-8';
        script.timeout = 120;
        onScriptComplete = function (event) {
            script.onerror = script.onload = null;
            clearTimeout(timeout);
            if (event.type === 'timeout') {
                rej({
                    type: event.type,
                    message: 'timeout',
                });
            }
            else if (event.type === 'error') {
                rej({
                    type: event.type,
                    message: "Loading remote module [" + name + "]:[" + script.src + "] failed",
                });
            }
        };
        var timeout = setTimeout(function () {
            onScriptComplete({ type: 'timeout', target: script });
        }, 120000);
        script.onerror = onScriptComplete;
        document.head.appendChild(script);
    }
})();
