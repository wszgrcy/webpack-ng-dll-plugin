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
const ts = __importStar(require("typescript"));
const cyia_code_util_1 = require("cyia-code-util");
function default_1(data) {
    let getAbsolutePath = (moduleSpecifier) => {
        return new Promise((res, rej) => {
            this.resolve(this.context, moduleSpecifier, (err, resource) => {
                if (err) {
                    rej(err);
                }
                res(resource);
            });
        });
    };
    const callback = this.async();
    if (!callback) {
        throw new Error('Invalid webpack version');
    }
    let sf = ts.createSourceFile(this.resourcePath, data, ts.ScriptTarget.ESNext, true);
    let selector = cyia_code_util_1.createCssSelectorForTs(sf);
    let list = selector.queryAll('ImportDeclaration').filter((item) => ts.isNamedImports(item.importClause.namedBindings));
    let pathList = [];
    let exportNamedList = [];
    for (let i = 0; i < list.length; i++) {
        const importDeclaration = list[i];
        pathList.push(getAbsolutePath(importDeclaration.moduleSpecifier.getText()).then((item) => {
            if (!item.includes('node_modules')) {
                exportNamedList.push(...importDeclaration.importClause
                    .namedBindings.elements.map((item) => item.name.text));
            }
        }));
    }
    Promise.all(pathList).then(() => {
        let exportModule = exportNamedList
            .map((item) => `window.exportNgNamed('${item}',${item})`)
            .join(';');
        callback(null, `${data};${exportModule};`);
    });
}
exports.default = default_1;
//# sourceMappingURL=ng-named-export.js.map