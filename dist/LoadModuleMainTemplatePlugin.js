"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteModuleMainTemplatePlugin = void 0;
const { ConcatSource } = require('webpack-sources');
class RemoteModuleMainTemplatePlugin {
    constructor(exportName) {
        this.exportName = exportName;
        this.varExpression = 'loadRemoteModuleJsonpCallback';
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('RemoteModuleMainTemplatePlugin', (compilation) => {
            this.run(compilation);
        });
    }
    run(compilation) {
        const { mainTemplate, chunkTemplate } = compilation;
        const onRenderWithEntry = (source, chunk, hash) => {
            const pathAndInfo = compilation.getPathWithInfo(compilation.outputOptions.filename, { chunk, contentHashType: 'javascript', hash });
            return new ConcatSource(`loadRemoteModuleJsonpCallback('${this.exportName || pathAndInfo.path}',`, source, `)`);
        };
        for (const template of [mainTemplate, chunkTemplate]) {
            template.hooks.renderWithEntry.tap('RemoteModuleMainTemplatePlugin', onRenderWithEntry);
        }
        mainTemplate.hooks.globalHashPaths.tap('RemoteModuleMainTemplatePlugin', (paths) => {
            if (this.varExpression) {
                paths.push(this.varExpression);
            }
            return paths;
        });
        mainTemplate.hooks.hash.tap('RemoteModuleMainTemplatePlugin', (hash) => {
            hash.update(`set remote module ${this.varExpression}`);
        });
    }
}
exports.RemoteModuleMainTemplatePlugin = RemoteModuleMainTemplatePlugin;
//# sourceMappingURL=LoadModuleMainTemplatePlugin.js.map