import * as webpack from 'webpack';
import * as path from 'path';
import { RawSource } from 'webpack-sources';
import { Module } from '../types';
import * as fs from 'fs-extra';
import { mkdirp, dirname } from 'webpack/lib/util/fs';
import { NormalModule } from 'webpack';
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
  type?: string;
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
    private manifestOptions: NgNamedExportPluginManifestOptions,
    private runtime = 'main'
  ) {
    this.manifestOptions = {
      ...new NgNamedExportPluginManifestOptions(),
      ...manifestOptions,
    };
  }

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      'NgNamedExportPlugin',
      (compilation: webpack.Compilation) => {
        const moduleGraph = compilation.moduleGraph;
        let hooks =
          webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(
            compilation
          );
        hooks.renderModuleContent.tap(
          'NgNamedExportPlugin',
          (source, module: webpack.NormalModule, context) => {
            if (module.userRequest && module.userRequest === this.exportFile) {
              let runtimeRequirements =
                context.chunkGraph.getModuleRuntimeRequirements(
                  module,
                  context.chunk.runtime
                );

              const needModule = runtimeRequirements.has(
                webpack.RuntimeGlobals.module
              );
              let firstArgumentName = needModule
                ? module.moduleArgument
                : '__unused_webpack_' + module.moduleArgument;
              return new RawSource(
                `\n;${firstArgumentName}.exports = __webpack_require__;\n`
              ) as any;
            }
            return source;
          }
        );
        /**
         * 要导出的请求
         * 由于optimizeDependenciesAdvanced钩子发生在optimizeDependencies之后,所以可以采取这种方式传参 */
        let requestSet = new Set<string>();
        compilation.hooks.optimizeDependencies.tap(
          'NgNamedExportPlugin',
          (modules) => {
            let exportModule = [...modules].find(
              (item: NormalModule) => item.userRequest === this.exportFile
            );
            exportModule.dependencies
              .filter((dep) => dep.getResourceIdentifier())
              .filter((item) => item)
              .map((dep) => compilation.moduleGraph.getModule(dep))
              .filter((item) => item)
              .filter((item) => (item as any).userRequest)
              .forEach((item) => {
                requestSet.add((item as any).userRequest);
              });
            for (const module of modules) {
              if (!requestSet.has((module as NormalModule).userRequest)) {
                continue;
              }
              module.getConcatenationBailoutReason = () => {
                return NgNamedExportPluginExplanation;
              };
            }
          }
        );
        compilation.hooks.afterOptimizeDependencies.tap(
          'NgNamedExportPlugin',
          (modules) => {
            for (const module of modules) {
              if (!requestSet.has((module as NormalModule).userRequest)) {
                continue;
              }

              const exportsInfo = moduleGraph.getExportsInfo(module);
              exportsInfo.setUsedInUnknownWay(this.runtime);
              moduleGraph.addExtraReason(
                module,
                NgNamedExportPluginExplanation
              );
              if (module.factoryMeta === undefined) {
                module.factoryMeta = {};
              }
              (module.factoryMeta as any).sideEffectFree = false;
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
      (compilation, callback) => {
        let chunk = Array.from(compilation.chunks).find(
          (chunk) => chunk.name === this.options.entryName
        );
        const chunkGraph = compilation.chunkGraph;
        const moduleGraph = compilation.moduleGraph;
        const targetPath = compilation.getPath(this.options.path, {
          chunk,
        });
        const name =
          this.options.name &&
          compilation.getPath(this.options.name, {
            chunk,
          });
        const manifest = {
          name,
          type: this.options.type,
          content: [
            ...chunkGraph.getOrderedChunkModulesIterable(
              chunk,
              webpack.util.comparators.compareModulesById(chunkGraph)
            ),
          ]
            .filter(
              (module) =>
                module.getConcatenationBailoutReason({
                  chunkGraph,
                  moduleGraph,
                }) === NgNamedExportPluginExplanation
            )
            .map((module: Module) => {
              const ident = module.libIdent({
                context: this.options.context || compiler.options.context,
                associatedObjectForCache: compiler.root,
              });
              if (ident) {
                const exportsInfo = moduleGraph.getExportsInfo(module);
                const providedExports = exportsInfo.getProvidedExports();

                return {
                  ident,
                  data: {
                    id: chunkGraph.getModuleId(module),
                    buildMeta: module.buildMeta,
                    exports: Array.isArray(providedExports)
                      ? providedExports
                      : undefined,
                  },
                };
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
          mkdirp(
            compiler.intermediateFileSystem,
            dirname(compiler.intermediateFileSystem, targetPath),
            (err) => {
              if (err) return callback(err);
              compiler.intermediateFileSystem.writeFile(
                targetPath,
                content,
                callback
              );
            }
          );
        }
      }
    );
  }
}
