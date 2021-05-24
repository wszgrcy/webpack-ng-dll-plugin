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
              return `\n;module.exports = __webpack_require__;\n`
            }
            return moduleSourcePostContent;
          }
        );
        (
          [
            (compilation.mainTemplate as any).hooks.modules,
            (compilation.chunkTemplate as any).hooks.modules,
          ] as SyncWaterfallHook<string, webpack.compilation.Chunk>[]
        ).forEach((hook) => {
          hook.tap('NgNamedExportPlugin', (e, chunk) => {
            for (let module of chunk.modulesIterable as webpack.SortableSet<NormalModule>) {
              if (!module.context && (module as any).rootModule) {
                module = (module as any).rootModule;
              }
              if (
                module.context &&
                !module.context.includes('node_modules') &&
                module.rawRequest
              ) {
                if (module.userRequest === this.exportFile) {
                  let deps = module.dependencies;
                  deps
                    .filter((dep) => dep.getResourceIdentifier())
                    .map((dep) => dep.module)
                    .filter((item) => item)
                    .forEach((module) => {
                      Object.defineProperty(module, 'used', {
                        get() {
                          return true;
                        },
                        set() {},
                      });
                      // module.used = true;
                      module.usedExports = true;
                      module.addReason(null, null, this.explanation);
                    });
                }
              }
            }
            return e;
          });
        });
        compilation.hooks.optimizeDependencies.tap(
          'NgFilterPlugin',
          (modules) => {
            for (const module of modules) {
              module;
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
