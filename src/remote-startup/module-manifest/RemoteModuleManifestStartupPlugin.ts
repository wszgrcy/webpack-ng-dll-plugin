import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { readFileSync } from 'fs';
import * as path from 'path';
const { Template } = webpack;
/** 远程模块资源启动插件
 * todo 如果有两个以上的main,nomodule module
 * 可以通过全插入,然后后返回Promise
 */
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
