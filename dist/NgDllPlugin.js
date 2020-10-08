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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgDllPlugin = void 0;
const path = __importStar(require("path"));
const asyncLib = require('neo-async');
const DllEntryPlugin_1 = __importDefault(require("webpack/lib/DllEntryPlugin"));
class NgDllPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.entryOption.tap('NgDllPlugin', (context, entry) => {
            const itemToPlugin = (item, name) => {
                if (Array.isArray(item)) {
                    return new DllEntryPlugin_1.default(context, item, name);
                }
                throw new Error('NgDllPlugin: supply an Array as entry');
            };
            if (typeof entry === 'object' && !Array.isArray(entry)) {
                Object.keys(entry).forEach((name) => {
                    itemToPlugin(entry[name], name).apply(compiler);
                });
            }
            else {
                itemToPlugin(entry, 'main').apply(compiler);
            }
            return true;
        });
        new LibManifestPlugin(this.options).apply(compiler);
        new NgFilterPlugin(this.options.filter).apply(compiler);
    }
}
exports.NgDllPlugin = NgDllPlugin;
class NgFilterPlugin {
    constructor(options = { mode: 'full' }) {
        this.options = options;
        this.explanation = 'NgFilterPlugin';
        if (this.options.mode === 'manual') {
            if (this.options.map) {
                this.unCompressMap = new Map(Object.entries(this.options.map));
            }
            else {
                throw new Error('[manual] mode must have [map] Property');
            }
        }
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('NgFilterPlugin', (compilation) => {
            const hooks = compilation.mainTemplate.hooks;
            hooks.modules.tap('NgFilterPlugin', (e, chunk) => {
                for (const module of chunk.modulesIterable) {
                    if ((!module.context.includes('node_modules') &&
                        module.rawRequest &&
                        !module.rawRequest.endsWith('.scss')) ||
                        (module.context || '').includes('$$_lazy_route_resource')) {
                        chunk.modulesIterable.delete(module);
                    }
                }
                return e;
            });
            compilation.hooks.optimizeDependencies.tap('NgFilterPlugin', (modules) => {
                this.unCompressMap = new Map();
                for (const module of modules) {
                    switch (this.options.mode) {
                        case 'full':
                            module.used = true;
                            module.usedExports = true;
                            module.addReason(null, null, this.explanation);
                            break;
                        case 'auto':
                            if (module.rawRequest &&
                                this.unCompressMap.has(module.rawRequest)) {
                                const oldIsUsed = module.isUsed;
                                const unCompressList = this.unCompressMap.get(module.rawRequest);
                                module.isUsed = function (name) {
                                    if (unCompressList.includes(name)) {
                                        return name;
                                    }
                                    return oldIsUsed.call(this, name);
                                };
                            }
                            module.addReason(null, null, this.explanation);
                            this.setUnCompressMap(module);
                            break;
                        case 'manual':
                            if (module.rawRequest &&
                                this.unCompressMap.has(module.rawRequest)) {
                                const oldIsUsed = module.isUsed;
                                const unCompressList = this.unCompressMap.get(module.rawRequest);
                                module.isUsed = function (name) {
                                    if (unCompressList.includes(name)) {
                                        return name;
                                    }
                                    return oldIsUsed.call(this, name);
                                };
                            }
                            module.addReason(null, null, this.explanation);
                            break;
                        default:
                            break;
                    }
                }
            });
        });
    }
    setUnCompressMap(module) {
        if (!/node_modules/.test(module.context || '') && module.dependencies) {
            if (module.dependencies && module.dependencies.length) {
                module.dependencies.forEach((dependency) => {
                    if (dependency.request &&
                        /(^(@angular(\/|\\)(core|common|router|platform-browser))$)|rxjs/.test(dependency.request) &&
                        dependency.id) {
                        const list = this.unCompressMap.get(dependency.request) || [];
                        if (!list.includes(dependency.id)) {
                            list.push(dependency.id);
                        }
                        this.unCompressMap.set(dependency.request, list);
                    }
                });
            }
        }
    }
}
class LibManifestPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.emit.tapAsync('LibManifestPlugin', (compilation, callback) => {
            asyncLib.forEach(compilation.chunks, (chunk, callback) => {
                if (!chunk.isOnlyInitial()) {
                    callback();
                    return;
                }
                const targetPath = compilation.getPath(this.options.path, {
                    hash: compilation.hash,
                    chunk,
                });
                const name = this.options.name &&
                    compilation.getPath(this.options.name, {
                        hash: compilation.hash,
                        chunk,
                    });
                const manifest = {
                    name,
                    type: this.options.type,
                    content: Array.from(chunk.modulesIterable, (module) => {
                        if (module.libIdent) {
                            const ident = module.libIdent({
                                context: this.options.context || compiler.options.context,
                            });
                            if (ident) {
                                return {
                                    ident,
                                    data: {
                                        id: module.id,
                                        buildMeta: module.buildMeta,
                                    },
                                };
                            }
                        }
                    })
                        .filter(Boolean)
                        .reduce((obj, item) => {
                        obj[item.ident] = item.data;
                        return obj;
                    }, Object.create(null)),
                };
                const manifestContent = this.options.format
                    ? JSON.stringify(manifest, null, 2)
                    : JSON.stringify(manifest);
                const content = Buffer.from(manifestContent, 'utf8');
                compiler.outputFileSystem.mkdirp(path.dirname(targetPath), (err) => {
                    if (err) {
                        return callback(err);
                    }
                    compiler.outputFileSystem.writeFile(targetPath, content, callback);
                });
            }, callback);
        });
    }
}
