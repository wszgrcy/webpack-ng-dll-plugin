import * as webpack from 'webpack';
import { readFileSync } from 'fs';
import * as path from 'path';
import { RuntimeGlobals } from 'webpack';
const { Template } = webpack;
/** 远程模块启动
 * 插入一段脚本,用于加载`LoadRemoteModulePlugin`处理过的项目
 */
export class RemoteModuleStartupMainTemplatePlugin {
  constructor(private chunkName: string = 'main') {}
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(
      'RemoteModuleStartupMainTemplatePlugin',
      (compilation) => {
        compilation.hooks.additionalChunkRuntimeRequirements.tap(
          'RemoteModuleStartupMainTemplatePlugin',
          (chunk, set) => {
            if (chunk.name === this.chunkName) {
              set.add(RuntimeGlobals.startup);
              compilation.addRuntimeModule(
                chunk,
                new RemoteModuleStartupMainTemplateModule(),
                compilation.chunkGraph
              );
            }
          }
        );
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
      '// RemoteModuleStartupMainTemplateModule',
      readFileSync(path.resolve(__dirname, './module.template.js')).toString(),
    ]);
  }
}
