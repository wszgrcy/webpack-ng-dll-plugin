import * as webpack from 'webpack';
import * as path from 'path';
import { Module } from '../types';
/** 检查导入的命名是否是已经导出 */
export class NgNamedImportCheckPlugin {
  /**
   *
   * @param [folderList=[]] 包含在文件夹内的文件会进行检查
   * @param [filter] 返回false为警告
   * @param [customHint] 自定义提示警告
   * @memberof NgNamedImportCheckPlugin
   */
  constructor(
    private folderList: string[] = [],
    private filter?: (module: Module) => boolean,
    private customHint?: (module: Module) => void
  ) {}
  private isInFolder(filePath: string): boolean {
    return this.folderList.some(
      (item) => !path.relative(item, filePath).startsWith('..')
    );
  }
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      'NgNamedImportCheckPlugin',
      (compilation: webpack.compilation.Compilation) => {
        compilation.hooks.optimizeDependencies.tap(
          'NgNamedImportCheckPlugin',
          (modules: Module[]) => {
            for (const module of modules) {
              if (!module.userRequest) {
                continue;
              }

              if (this.filter && !this.filter(module)) {
                this.warnHint(module);
                continue;
              }
              // 代理模块判断,防止多个webpack没有使用instanceof判断
              if (
                module.identifier &&
                module.identifier() ===
                  `delegated ${JSON.stringify(module.request)} from ${
                    module.sourceRequest
                  }`
              ) {
                continue;
              }
              if (this.isInFolder(module.userRequest)) {
                this.warnHint(module);
              }
            }
          }
        );
      }
    );
  }
  private warnHint(module: Module) {
    if (this.customHint) {
      this.customHint(module);
    } else {
      console.warn(`${module.userRequest} not export from main project!`);
    }
  }
}
