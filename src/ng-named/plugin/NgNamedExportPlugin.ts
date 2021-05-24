import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import * as path from 'path';
import { ConcatSource } from 'webpack-sources';
interface NormalModule extends webpack.compilation.Module {
  request: string;
  userRequest: string;
  rawRequest: string | null;
  context: string | null;
  dependencies: any[];
}

export class NgNamedExportPluginManifestOptions {
  path: string;
  format?: boolean = true;
  name: string;
  context?: string;
  /** 入口名,目前只允许一个入口 */
  entryName?: string = 'main';
}

export class NgNamedExportPlugin {
  private readonly explanation = 'NgNamedExportPlugin';

  /**
   *
   * @param exportFile 导出文件绝对路径,用于匹配导出模块,替换导出方式
   * @param [manifestOptions]
   * @memberof NgNamedExportPlugin
   */
  constructor(
    private exportFile: string,
    private manifestOptions?: NgNamedExportPluginManifestOptions
  ) {
    this.manifestOptions = {
      ...new NgNamedExportPluginManifestOptions(),
      ...manifestOptions,
    };
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      'NgNamedExportPlugin',
      (compilation: webpack.compilation.Compilation) => {
        compilation.moduleTemplates.javascript.hooks.module.tap(
          'NgNamedExportPlugin',
          (
            moduleSourcePostContent: ConcatSource,
            module,
            options,
            dependencyTemplates
          ) => {
            if (!module.context && (module as any).rootModule) {
              module = (module as any).rootModule;
            }
            if (module.userRequest && module.userRequest === this.exportFile) {
              if (moduleSourcePostContent.add) {
                moduleSourcePostContent.add(
                  `\n;module.exports = __webpack_require__;\n`
                );
                return moduleSourcePostContent;
              }
              return `\n;module.exports = __webpack_require__;\n`;
            }
            return moduleSourcePostContent;
          }
        );
        compilation.hooks.optimizeDependencies.tap(
          'NgFilterPlugin',
          (modules) => {
            let exportModule = modules.find(
              (item) => (item as any).userRequest === this.exportFile
            );
            let requestSet = new Set();
            ((exportModule as any).dependencies as any[])
              .filter((dep) => dep.getResourceIdentifier())
              .filter((dep) => dep.module)
              .map((dep) => dep.module)
              .forEach((item) => {
                requestSet.add(item.userRequest);
              });
            for (const module of modules) {
              let isExportModule = requestSet.has((module as any).userRequest);
              if (isExportModule) {
                // if ((module as any).userRequest.includes('index.ts')) {
                //   continue;
                // }
                let dep = (module as any).dependencies

                  // Get reference info only for harmony Dependencies
                  .map((dep) => {
                    if (!(dep.request && dep.userRequest)) return null;
                    if (!compilation) return dep.getReference();
                    return (compilation as any).getDependencyReference(
                      module,
                      dep
                    );
                  })

                  // Reference is valid and has a module
                  // Dependencies are simple enough to concat them
                  .filter(
                    (ref) =>
                      ref &&
                      ref.module &&
                      (Array.isArray(ref.importedNames) ||
                        Array.isArray(ref.module.buildMeta.providedExports))
                  )

                  // Take the imported module
                  .map((ref) => ref.module);

                Object.defineProperty(module, 'used', {
                  get() {
                    return true;
                  },
                  set() {},
                });
                // module.used = true;
                module.usedExports = true;
                if (dep.length === 0) {
                  module.addReason(null, null, this.explanation);
                }
              }
            }
          }
        );
      }
    );

    new NgNamedExportManifest(this.manifestOptions!).apply(compiler);
  }
}

class NgNamedExportManifest {
  constructor(private options: NgNamedExportPluginManifestOptions) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapAsync(
      'NgNamedExportManifest',
      (compilation: webpack.compilation.Compilation, callback) => {
        let chunk = (compilation.chunks as webpack.compilation.Chunk[]).find(
          (chunk) => chunk.name === this.options.entryName
        );
        const targetPath = compilation.getPath(this.options.path, {
          hash: compilation.hash,
          chunk,
        });
        const name =
          this.options.name &&
          compilation.getPath(this.options.name, {
            hash: compilation.hash,
            chunk,
          });
        const manifest = {
          name,
          content: [...chunk.modulesIterable]
            .map((module: any) => {
              let rootModule = module.context
                ? module
                : (module as any).rootModule;
              if (!(rootModule.usedExports && rootModule.used)) {
                return;
              }
              if (
                module.reasons[0] &&
                module.reasons[0].dependency &&
                module.reasons[0].dependency.loc &&
                module.reasons[0].dependency.loc.name
              ) {
                return;
              }
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
            .filter((item) => !item.ident.includes('$$_lazy_route_resource'))
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
            callback(err);
          }
          compiler.outputFileSystem.writeFile(targetPath, content, callback);
        });
      }
    );
  }
}
