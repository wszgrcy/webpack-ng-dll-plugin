import * as webpack from 'webpack';
import * as path from 'path';
import { Module } from '../../types';

export class NgNamedImportCheckPlugin {
  /**
   *
   * @param folderList 包含文件夹内会进行检查
   * @param filter 返回false为警告
   * @memberof NgNamedImportCheckPlugin
   */
  constructor(
    private folderList: string[] = [],
    private filter?: (module: Module) => boolean
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
              // 代理模块判断
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
  warnHint(module: Module) {
    console.warn(`${module.userRequest} 没有使用引用`);
  }
}
