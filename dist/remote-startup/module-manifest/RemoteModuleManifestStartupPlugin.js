"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModuleManifestStartupPlugin = void 0;
const webpack = __importStar(require("webpack"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const { Template } = webpack;
class RemoteModuleManifestStartupPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('RemoteModuleManifestStartupPlugin', (compilation) => {
            compilation.mainTemplate.hooks
                .startup.tap('RemoteModuleManifestStartupPlugin', (source) => {
                return Template.asString([
                    '// RemoteModuleManifestStartupPlugin',
                    fs_1.readFileSync(path.resolve(__dirname, './module-manifest.template.js')).toString(),
                    source,
                ]);
            });
        });
    }
}
exports.RemoteModuleManifestStartupPlugin = RemoteModuleManifestStartupPlugin;
//# sourceMappingURL=RemoteModuleManifestStartupPlugin.js.map