import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { readFileSync } from 'fs';
import * as path from 'path';
const { Template } = webpack;
/** 远程模块启动
 * 插入一段脚本,用于加载`RemoteModuleMainTemplatePlugin`处理过的项目
 */
export class RemoteModuleStartupPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'RemoteModuleStartupPlugin',
      (compilation) => {
        ((compilation.mainTemplate.hooks as any)
          .bootstrap as SyncWaterfallHook).tap(
          'addInsertLoadModule',
          (source) => {
            return Template.asString([
              '// RemoteModuleStartupPlugin',
              readFileSync(
                path.resolve(__dirname, './module.template.js')
              ).toString(),
              source,
            ]);
          }
        );
      }
    );
  }
}
