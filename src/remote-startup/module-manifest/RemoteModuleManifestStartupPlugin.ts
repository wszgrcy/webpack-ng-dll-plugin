import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { readFileSync } from 'fs';
import * as path from 'path';
const { Template } = webpack;
/** 
 *  
 * 远程资源清单启动
 * 远程模块的加强版
 * 可以处理多个 js 及多个 css 的启动
 * 插入一段脚本,用于加载 `RemoteModuleMainTemplatePlugin`处理过的项目
使用此插件时需要先引入`RemoteModuleStartupPlugin`插件
 */
export class RemoteModuleManifestStartupPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'RemoteModuleManifestStartupPlugin',
      (compilation) => {
        ((compilation.mainTemplate.hooks as any)
          .bootstrap as SyncWaterfallHook).tap(
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
