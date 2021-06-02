import * as webpack from 'webpack';
import * as path from 'path';
import { Source } from 'webpack-sources';
import { Module } from '../types';
import * as fs from 'fs-extra';
export class NgNamedExportPluginManifestOptions {
  /** 与LibManifestPlugin相同,资源文件生成的路径 */
  path: string;
  /** 与LibManifestPlugin相同,格式化资源文件 */
  format?: boolean = true;
  /** 与LibManifestPlugin相同,链接库名字(与output.library相同) */
  name: string;
  /** 与LibManifestPlugin相同,依赖上下文(决定导出依赖的路径) */
  context?: string;
  /** 入口名,目前只允许一个入口 */
  entryName?: string = 'main';
  /** 是否在watch模式下写入到磁盘上(fs) */
  watchWrite?: boolean = false;
}

const NgNamedExportPluginExplanation = 'NgNamedExportPlugin';
/** 命名导出插件,是执行脚本,同时返回导出的命名 */
export class NgNamedExportPlugin {
  /**
   *
   * @param exportFile 导出文件绝对路径,用于匹配导出模块,替换导出方式
   * @param [manifestOptions] 资源清单配置
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
            if (module.userRequest && module.userRequest === this.exportFile) {
              return `\n;module.exports = __webpack_require__;\n`;
            }
            return moduleSourcePostContent;
          }
        );
        /**
         * 要导出的请求
         * 由于optimizeDependenciesAdvanced钩子发生在optimizeDependencies之后,所以可以采取这种方式传参 */
        let requestSet = new Set<string>();
        compilation.hooks.optimizeDependencies.tap(
          'NgNamedExportPlugin',
          (modules: Module[]) => {
            let exportModule = modules.find(
              (item) => item.userRequest === this.exportFile
            );
            exportModule.dependencies
              .filter((dep) => dep.getResourceIdentifier())
              .filter((item) => item)
              .map((dep) => dep.module)
              .filter((item) => item)
              .filter((item) => item.userRequest)
              .forEach((item) => {
                requestSet.add(item.userRequest);
              });
            for (const module of modules) {
              if (!requestSet.has(module.userRequest)) {
                continue;
              }
              module.buildMeta = module.buildMeta || {};
              module.buildMeta.moduleConcatenationBailout =
                NgNamedExportPluginExplanation;
            }
          }
        );
        compilation.hooks.optimizeDependenciesAdvanced.tap(
          'NgNamedExportPlugin',
          (modules: Module[]) => {
            for (const module of modules) {
              if (!requestSet.has(module.userRequest)) {
                continue;
              }
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

    new NgNamedExportManifestPlugin(this.manifestOptions!).apply(compiler);
  }
}

export class NgNamedExportManifestPlugin {
  constructor(private options: NgNamedExportPluginManifestOptions) {}
  private writeUseFs(filePath: string, content: Buffer) {
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
  }
  apply(compiler: webpack.Compiler) {
    compiler.hooks.emit.tapAsync(
      'NgNamedExportManifestPlugin',
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
            .filter(
              (module) =>
                module.buildMeta &&
                module.buildMeta.moduleConcatenationBailout ===
                  NgNamedExportPluginExplanation
            )
            .map((module: Module) => {
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
            .reduce((obj, item) => {
              obj[item.ident] = item.data;
              return obj;
            }, Object.create(null)),
        };
        const manifestContent = this.options.format
          ? JSON.stringify(manifest, null, 2)
          : JSON.stringify(manifest);
        const content = Buffer.from(manifestContent, 'utf8');
        // 由于watch下无法生成实体文件供其他项目调用,所以直接写入硬盘...
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
