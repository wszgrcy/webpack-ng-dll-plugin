(function () {
    var object = {};
    function exportNgNamed(key, instance) {
        object[key] = instance;
    }
    window.exportNgNamed = exportNgNamed;
    function importNgNamed(key) {
        return object[key];
    }
    window.importNgNamed = importNgNamed;
})();
