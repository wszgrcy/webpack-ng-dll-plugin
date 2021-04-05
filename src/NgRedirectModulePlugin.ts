import * as webpack from 'webpack';
import { NgRedirectModule } from './NgRedirectModule';
import * as path from 'path';
export class NgRedirectModulePlugin {
  constructor(
    private folderList: string[],
    private globalNamespace: string = ''
  ) {}

  isInFolder(filePath: string): boolean {
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

                    createdModule = new NgRedirectModule(
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
