import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';
import { readFileSync } from 'fs';
import * as path from 'path';
import { RuntimeGlobals } from 'webpack';
const { Template } = webpack;
/** 远程模块启动
 * 插入一段脚本,用于加载`LoadRemoteModulePlugin`处理过的项目
 */
export class RemoteModuleStartupMainTemplatePlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'RemoteModuleStartupMainTemplatePlugin',
      (compilation) => {
        compilation.hooks.additionalChunkRuntimeRequirements.tap(
          'RemoteModuleStartupMainTemplatePlugin',
          (chunk, set) => {
            console.log(chunk.name);

            if (chunk.name === 'main') {
              set.add(RuntimeGlobals.startup);
              compilation.addRuntimeModule(
                chunk,
                new RemoteModuleStartupMainTemplateModule(),
                compilation.chunkGraph
              );
            }
          }
        );
        (
          (compilation.mainTemplate.hooks as any)
            .bootstrap as SyncWaterfallHook<any>
        ).tap('RemoteModuleStartupMainTemplatePlugin', (source) => {
          return Template.asString([
            '// RemoteModuleStartupMainTemplatePlugin',
            readFileSync(
              path.resolve(__dirname, './module.template.js')
            ).toString(),
            source,
          ]);
        });
      }
    );
  }
}

class RemoteModuleStartupMainTemplateModule extends webpack.RuntimeModule {
  constructor() {
    super('RemoteModuleStartupMainTemplateModule');
  }
  generate() {
    return Template.asString([
      '// RemoteModuleStartupMainTemplatePlugin',
      readFileSync(path.resolve(__dirname, './module.template.js')).toString(),
    ]);
  }
}
