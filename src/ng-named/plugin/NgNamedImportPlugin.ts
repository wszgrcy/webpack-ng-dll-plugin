import * as webpack from 'webpack';
import { NgNamedImportModule } from './NgNamedImportModule';
import * as path from 'path';
/**
 * 引入`声明命名`
 * 将项目中某些引入,转换为导入`声明命名`函数
 */
export class NgNamedImportPlugin {
  /**
   *
   * @param folderList 指定导入的`声明命名`为某些文件夹内的文件,其`声明命名`转换为`声明命名`导入函数
   * @param globalNamespace 目前没有使用
   * 
   */
  constructor(
    private folderList: string[],
    private globalNamespace: string = ''
  ) {}

  private isInFolder(filePath: string): boolean {
    return this.folderList.some(
      (item) => !path.relative(item, filePath).startsWith('..')
    );
  }
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.compile.tap(
      'NgRedirectModulePlugin',
      ({
        normalModuleFactory,
      }: {
        normalModuleFactory: webpack.compilation.NormalModuleFactory;
      }) => {
        normalModuleFactory.hooks.factory.tap(
          'NgRedirectModulePlugin',
          (factory) => (result, callback) => {
            const resolver = normalModuleFactory.hooks.resolver.call(null);

            // Ignored
            if (!resolver) {
              return factory(result, callback);
            }

            resolver(result, (err, data) => {
              if (
                !data ||
                !data.userRequest ||
                !this.isInFolder(data.userRequest)
              ) {
                return factory(result, callback);
              }
              if (err) {
                return callback(err);
              }

              // direct module
              if (typeof data.source === 'function') {
                return callback(null, data);
              }

              normalModuleFactory.hooks.afterResolve.callAsync(
                data,
                (err, result) => {
                  if (err) {
                    return callback(err);
                  }

                  // Ignored
                  if (!result) {
                    return callback();
                  }

                  let createdModule = normalModuleFactory.hooks.createModule.call(
                    result
                  );
                  if (!createdModule) {
                    if (!result.request) {
                      return callback(
                        new Error('Empty dependency (no request)')
                      );
                    }

                    createdModule = new NgNamedImportModule(
                      result,
                      this.globalNamespace
                    );
                  }

                  createdModule = normalModuleFactory.hooks.module.call(
                    createdModule,
                    result
                  );

                  return callback(null, createdModule);
                }
              );
            });
          }
        );
      }
    );
  }
}
