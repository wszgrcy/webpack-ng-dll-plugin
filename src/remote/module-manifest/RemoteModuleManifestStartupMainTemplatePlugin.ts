import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { readFileSync } from 'fs';
import * as path from 'path';
import { RuntimeGlobals } from 'webpack';
const { Template } = webpack;
/** 
 *  
 * 远程资源清单启动
 * 远程模块的加强版
 * 可以处理多个 js 及多个 css 的启动
 * 插入一段脚本,用于加载 `RemoteModuleMainTemplatePlugin`处理过的项目
使用此插件时需要先引入`RemoteModuleStartupMainTemplatePlugin`插件
 */
export class RemoteModuleManifestStartupMainTemplatePlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'RemoteModuleManifestStartupMainTemplatePlugin',
      (compilation) => {
        compilation.hooks.additionalChunkRuntimeRequirements.tap(
          'RemoteModuleManifestStartupMainTemplatePlugin',
          (chunk, set) => {
            if (chunk.name === 'main') {
              set.add(RuntimeGlobals.startup);
              compilation.addRuntimeModule(
                chunk,
                new RemoteModuleManifestStartupMainTemplateModule(),
                compilation.chunkGraph
              );
            }
          }
        );
      }
    );
  }
}
class RemoteModuleManifestStartupMainTemplateModule extends webpack.RuntimeModule {
  constructor() {
    super('RemoteModuleManifestStartupMainTemplateModule');
  }
  generate() {
    return Template.asString([
      '// RemoteModuleManifestStartupMainTemplateModule',
      readFileSync(
        path.resolve(__dirname, './module-manifest.template.js')
      ).toString(),
    ]);
  }
}
