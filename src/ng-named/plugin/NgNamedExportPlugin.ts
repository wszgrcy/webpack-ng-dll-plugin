import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
interface NormalModule extends webpack.compilation.Module {
  request: string;
  userRequest: string;
  rawRequest: string | null;
  context: string | null;
  dependencies: any[];
}
/**
 * 引入`声明命名`
 * 将项目中某些引入,转换为导入`声明命名`函数
 */
export class NgNamedExportPlugin {
  private explanation = 'NgNamedExportPlugin';
  /**
   *
   * @param folderList 指定导入的`声明命名`为某些文件夹内的文件,其`声明命名`转换为`声明命名`导入函数
   * @param globalNamespace 目前没有使用
   *
   */
  constructor(
    private folderList: string[],
    private globalNamespace: string = '',
    private exportFile: string
  ) {}

  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      'NgNamedExportPlugin',
      (compilation: webpack.compilation.Compilation) => {
        const hooks: {
          modules: SyncWaterfallHook<string, webpack.compilation.Chunk>;
        } = compilation.mainTemplate.hooks as any;
        (
          (compilation.chunkTemplate as any).hooks.modules as SyncWaterfallHook<
            string,
            webpack.compilation.Chunk
          >
        ).tap('NgNamedExportPlugin', (e, chunk) => {
          for (const module of chunk.modulesIterable as webpack.SortableSet<NormalModule>) {
            if (!module.context.includes('node_modules') && module.rawRequest) {
              if (module.userRequest === this.exportFile) {
                chunk.modulesIterable.delete(module);
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
      }
    );
  }
}
