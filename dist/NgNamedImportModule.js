"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgNamedImportModule = void 0;
const NormalModule = require('webpack/lib/NormalModule');
const { LineToLineMappedSource, OriginalSource, RawSource, } = require('webpack-sources');
const asString = (buf) => {
    if (Buffer.isBuffer(buf)) {
        return buf.toString('utf-8');
    }
    return buf;
};
class NgNamedImportModule extends NormalModule {
    constructor(options, globalNamespace) {
        super(options);
        this.options = options;
        this.globalNamespace = globalNamespace;
    }
    createSource(source, resourceBuffer, sourceMap) {
        source = this.options.dependencies
            .map((item) => item.id)
            .filter((item) => item)
            .map((item) => `window.importNgNamed('${item}');`)
            .join('\n');
        if (!this.identifier) {
            return new RawSource(source);
        }
        const identifier = this.identifier();
        if (this.lineToLine && resourceBuffer) {
            return new LineToLineMappedSource(source, identifier, asString(resourceBuffer));
        }
        if (this.useSourceMap) {
            return new OriginalSource(source, identifier);
        }
        if (Buffer.isBuffer(source)) {
            return new RawSource(source);
        }
        return new OriginalSource(source, identifier);
    }
}
exports.NgNamedImportModule = NgNamedImportModule;
//# sourceMappingURL=NgNamedImportModule.js.map