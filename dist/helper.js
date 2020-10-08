"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNgDllPlugin = void 0;
const NgDllPlugin_1 = require("./NgDllPlugin");
function setNgDllPlugin(config, option, angularOptions) {
    if (angularOptions) {
        delete angularOptions.index;
    }
    const entry = config.entry;
    config.entry = entry.main;
    config.output = Object.assign(Object.assign({ library: option.ngDllPluginOptions.name, filename: 'dll.js' }, config.output), (option.output || {}));
    config.plugins.push(new NgDllPlugin_1.NgDllPlugin(option.ngDllPluginOptions));
    config.optimization.runtimeChunk = false;
    for (let i = 0; i < config.plugins.length; i++) {
        const plugin = config.plugins[i];
        if (plugin.constructor.name === 'LicenseWebpackPlugin') {
            config.plugins.splice(i, 1);
            i--;
        }
    }
}
exports.setNgDllPlugin = setNgDllPlugin;
