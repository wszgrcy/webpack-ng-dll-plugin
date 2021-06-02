import webpack from 'webpack';
const { ConcatSource } = require('webpack-sources');
import { SyncWaterfallHook } from 'tapable';
/**
 * 普通模块转换为远程模块
 * 转换为由函数包裹的`JsonPCallback`方式,类似`webpack`的懒加载分包加载方式
 */
export class LoadRemoteModulePlugin {
  private readonly varExpression = 'loadRemoteModuleJsonpCallback';
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
        this.run(compilation);
      }
    );
  }
  private run(compilation: webpack.compilation.Compilation): void {
    const { mainTemplate, chunkTemplate } = compilation;

    const onRenderWithEntry = (
      source,
      chunk: webpack.compilation.Chunk,
      hash
    ) => {
      if (!this.entryNames.includes(chunk.name)) {
        return source;
      }
      const pathAndInfo = (compilation as any).getPathWithInfo(
        compilation.outputOptions.filename,
        { chunk, contentHashType: 'javascript', hash }
      );
      return new ConcatSource(
        `loadRemoteModuleJsonpCallback('${
          this.exportName || pathAndInfo.path
        }',`,
        source,
        `)`
      );
    };

    for (const template of [mainTemplate, chunkTemplate]) {
      ((template as any).hooks.renderWithEntry as SyncWaterfallHook).tap(
        'LoadRemoteModulePlugin',
        onRenderWithEntry
      );
    }

    (mainTemplate.hooks as any).globalHashPaths.tap(
      'LoadRemoteModulePlugin',
      (paths: any[]) => {
        paths.push(this.varExpression);
        return paths;
      }
    );
    mainTemplate.hooks.hash.tap('LoadRemoteModulePlugin', (hash) => {
      hash.update(`set remote module ${this.varExpression}`);
    });
  }
}
