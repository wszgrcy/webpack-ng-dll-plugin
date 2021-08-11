import webpack from 'webpack';
import { getRuntime } from '../util/get-runtime';
import { ConcatSource } from 'webpack-sources';
/**
 * 普通模块转换为远程模块
 * 转换为由函数包裹的`JsonPCallback`方式,类似`webpack`的懒加载分包加载方式
 */
export class LoadRemoteModulePlugin {
  private moduleName = '';
  /**
   *
   * @param [exportName] 导出命名,默认与文件名相同
   * @param [entryNames=['main']] 指定导出出口(config.entry)
   */
  constructor(
    private exportName?: string,
    private entryNames: string[] = ['main']
  ) {}
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      'LoadRemoteModulePlugin',
      (compilation) => {
        const hooks =
          webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(
            compilation
          );

        hooks.renderStartup.tap(
          'LoadRemoteModulePlugin',
          (source, module, renderContext) => {
            let chunk = renderContext.chunk;
            if (!this.entryNames.includes(chunk.name)) {
              return source;
            }
            const pathAndInfo = compilation.getPathWithInfo(
              compilation.outputOptions.filename,
              { chunk, contentHashType: 'javascript', hash: compilation.hash }
            );
            this.moduleName = this.exportName || pathAndInfo.path;
            return new ConcatSource(
              source as any,
              `;loadRemoteModuleJsonpCallback('${this.moduleName}',`,
              `__webpack_exports__`,
              `);`
            ) as any;
          }
        );
        compilation.hooks.finishModules.tap(
          'LoadRemoteModulePlugin',
          (modules) => {
            let runtime = getRuntime(compilation);
            let entry = [...compilation.entries].find(([name]) =>
              this.entryNames.includes(name)
            )[1];
            let dep = entry.dependencies[entry.dependencies.length - 1];
            let module = compilation.moduleGraph.getModule(dep);
            const exportsInfo = compilation.moduleGraph.getExportsInfo(module);
            exportsInfo.setUsedInUnknownWay(runtime);
          }
        );
        hooks.chunkHash.tap(
          'LoadRemoteModulePlugin',
          (chunk, hash, context) => {
            hash.update('LoadRemoteModulePlugin');
            hash.update(this.moduleName);
          }
        );
      }
    );
  }
}
