var loadedRemoteModuleMap = {};
var loadingRemoteModuleMap = {};
function getDefaultModuleName(name) {
    if (name === void 0) { name = ''; }
    return name.split(/(\/|\\)/g).pop();
}
function loadRemoteModule(url, moduleName) {
    !moduleName && (moduleName = getDefaultModuleName(url));
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
    if (loadingRemoteModuleMap[name]) {
        loadingRemoteModuleMap[name](module);
        delete loadingRemoteModuleMap[name];
    }
}
window.loadRemoteModule = loadRemoteModule;
window.loadRemoteModuleJsonpCallback = loadRemoteModuleJsonpCallback;
function requireEnsure(url, rej, name) {
    var script = document.createElement('script');
    var onScriptComplete;
    script.charset = 'utf-8';
    script.timeout = 120;
    script.src = url;
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
                message: "Loading remote module [" + name + "]:[" + url + "] failed",
            });
        }
    };
    var timeout = setTimeout(function () {
        onScriptComplete({ type: 'timeout', target: script });
    }, 120000);
    script.onerror = onScriptComplete;
    document.head.appendChild(script);
}
