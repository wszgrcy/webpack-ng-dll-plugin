import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { readFileSync } from 'fs';
import * as path from 'path';
const { Template } = webpack;
/** 远程模块启动插件 */
export class RemoteModuleManifestStartupPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'RemoteModuleManifestStartupPlugin',
      (compilation) => {
        ((compilation.mainTemplate.hooks as any)
          .startup as SyncWaterfallHook).tap(
          'RemoteModuleManifestStartupPlugin',
          (source) => {
            return Template.asString([
              '// RemoteModuleManifestStartupPlugin',
              readFileSync(
                path.resolve(__dirname, './module-manifest.template.js')
              ).toString(),
              source,
            ]);
          }
        );
      }
    );
  }
}
