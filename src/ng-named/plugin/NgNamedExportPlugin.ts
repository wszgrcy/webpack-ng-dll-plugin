import * as webpack from 'webpack';
import * as path from 'path';
import { ConcatSource, Source } from 'webpack-sources';
import { Module } from '../../types';
import * as fs from 'fs-extra';
export class NgNamedExportPluginManifestOptions {
  path: string;
  format?: boolean = true;
  name: string;
  context?: string;
  /** 入口名,目前只允许一个入口 */
  entryName?: string = 'main';
  watchWrite?: boolean = false;
}

const NgNamedExportPluginExplanation = 'NgNamedExportPlugin';
export class NgNamedExportPlugin {
  /**
   *
   * @param exportFile 导出文件绝对路径,用于匹配导出模块,替换导出方式
   * @param [manifestOptions]
   * @memberof NgNamedExportPlugin
   */
  constructor(
    private exportFile: string,
    private manifestOptions: NgNamedExportPluginManifestOptions
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
            moduleSourcePostContent: Source,
            module,
            options,
            dependencyTemplates
          ) => {
            if (!module.context && (module as any).rootModule) {
              module = (module as any).rootModule;
            }
            if (module.userRequest && module.userRequest === this.exportFile) {
              if ((moduleSourcePostContent as ConcatSource).add) {
                (moduleSourcePostContent as ConcatSource).add(
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
          (modules: Module[]) => {
            let exportModule = modules.find(
              (item) => item.userRequest === this.exportFile
            );
            let requestSet = new Set();
            exportModule.dependencies
              .filter((dep) => dep.getResourceIdentifier())
              .filter((dep) => dep.module)
              .map((dep) => dep.module)
              .forEach((item) => {
                requestSet.add(item.userRequest);
              });
            for (const module of modules) {
              let isExportModule = requestSet.has(module.userRequest);
              if (!isExportModule) {
                continue;
              }
              module.buildMeta = module.buildMeta || {};
              module.buildMeta.moduleConcatenationBailout =
                NgNamedExportPluginExplanation;

              Object.defineProperty(module, 'used', {
                get() {
                  return true;
                },
                set() {},
              });
              // module.used = true;
              module.usedExports = true;
              module.addReason(null, null, NgNamedExportPluginExplanation);
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
  private writeUseFs(filePath: string, content: Buffer) {
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
  }
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
            .map((module: Module) => {
              if (
                !module.buildMeta ||
                module.buildMeta.moduleConcatenationBailout !==
                  NgNamedExportPluginExplanation
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
                      buildMeta: {
                        ...module.buildMeta,
                        moduleConcatenationBailout: undefined,
                      },
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
        if (this.options.watchWrite) {
          this.writeUseFs(targetPath, content);
          callback();
        } else {
          compiler.outputFileSystem.mkdirp(path.dirname(targetPath), (err) => {
            if (err) {
              callback(err);
            }
            compiler.outputFileSystem.writeFile(targetPath, content, callback);
          });
        }
      }
    );
  }
}
