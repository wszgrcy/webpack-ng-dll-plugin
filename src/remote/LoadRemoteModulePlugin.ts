import webpack from 'webpack';
const { ConcatSource } = require('webpack-sources');
/**
 * 普通模块转换为远程模块
 * 转换为由函数包裹的`JsonPCallback`方式,类似`webpack`的懒加载分包加载方式
 */
export class LoadRemoteModulePlugin {
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
            return new ConcatSource(
              source,
              `;loadRemoteModuleJsonpCallback('${
                this.exportName || pathAndInfo.path
              }',`,
              `__webpack_exports__`,
              `);`
            );
          }
        );
      }
    );
  }
}
