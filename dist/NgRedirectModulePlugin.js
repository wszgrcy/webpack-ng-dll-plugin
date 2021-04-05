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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgRedirectModulePlugin = void 0;
const NgRedirectModule_1 = require("./NgRedirectModule");
const path = __importStar(require("path"));
class NgRedirectModulePlugin {
    constructor(folderList, globalNamespace = '') {
        this.folderList = folderList;
        this.globalNamespace = globalNamespace;
    }
    isInFolder(filePath) {
        return this.folderList.some((item) => !path.relative(item, filePath).startsWith('..'));
    }
    apply(compiler) {
        compiler.hooks.compile.tap('NgRedirectModulePlugin', ({ normalModuleFactory, }) => {
            normalModuleFactory.hooks.factory.tap('NgRedirectModulePlugin', (factory) => (result, callback) => {
                const resolver = normalModuleFactory.hooks.resolver.call(null);
                if (!resolver) {
                    return factory(result, callback);
                }
                resolver(result, (err, data) => {
                    if (!data ||
                        !data.userRequest ||
                        !this.isInFolder(data.userRequest)) {
                        return factory(result, callback);
                    }
                    if (err) {
                        return callback(err);
                    }
                    if (typeof data.source === 'function') {
                        return callback(null, data);
                    }
                    normalModuleFactory.hooks.afterResolve.callAsync(data, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        if (!result) {
                            return callback();
                        }
                        let createdModule = normalModuleFactory.hooks.createModule.call(result);
                        if (!createdModule) {
                            if (!result.request) {
                                return callback(new Error('Empty dependency (no request)'));
                            }
                            createdModule = new NgRedirectModule_1.NgRedirectModule(result, this.globalNamespace);
                        }
                        createdModule = normalModuleFactory.hooks.module.call(createdModule, result);
                        return callback(null, createdModule);
                    });
                });
            });
        });
    }
}
exports.NgRedirectModulePlugin = NgRedirectModulePlugin;
