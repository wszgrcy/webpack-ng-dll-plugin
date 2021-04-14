(function () {
    var object = {};
    function exportNgNamed(key, instance) {
        object[key] = instance;
    }
    window.exportNgNamed = exportNgNamed;
    function importNgNamed(key) {
        if (!object[key]) {
            throw new TypeError(key + " is not exportNgNamed");
        }
        return object[key];
    }
    window.importNgNamed = importNgNamed;
})();
