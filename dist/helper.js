"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanOutputFile = exports.setNgDllPlugin = void 0;
const NgDllPlugin_1 = require("./NgDllPlugin");
function setNgDllPlugin(config, option, angularOptions) {
    cleanOutputFile(config, {
        index: true,
        runtimeChunk: true,
        license: true,
    }, angularOptions);
    const entry = config.entry;
    config.entry = entry.main;
    config.output = Object.assign(Object.assign({ library: option.ngDllPluginOptions.name, filename: 'dll.js' }, config.output), (option.output || {}));
    config.plugins.push(new NgDllPlugin_1.NgDllPlugin(option.ngDllPluginOptions));
}
exports.setNgDllPlugin = setNgDllPlugin;
function cleanOutputFile(config, option, angularOptions) {
    if (option.runtimeChunk && angularOptions) {
        delete angularOptions.index;
    }
    if (option.runtimeChunk) {
        config.optimization.runtimeChunk = false;
    }
    if (option.license) {
        for (let i = 0; i < config.plugins.length; i++) {
            const plugin = config.plugins[i];
            if (plugin.constructor.name === 'LicenseWebpackPlugin') {
                config.plugins.splice(i, 1);
                break;
            }
        }
    }
}
exports.cleanOutputFile = cleanOutputFile;
//# sourceMappingURL=helper.js.map