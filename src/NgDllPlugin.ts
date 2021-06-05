import * as webpack from 'webpack';
import { SyncWaterfallHook } from 'tapable';

import DllEntryPlugin from 'webpack/lib/DllEntryPlugin';
import LibManifestPlugin from 'webpack/lib/LibManifestPlugin';
export interface NgDllPluginOptions {
  /** 模块是否会在dll中生成的相关配置 */
  filter?: NgFilterPluginOptions;
  /** manifest 生成的位置 */
  path: string;
  /** dll的名字 */
  name: string;
  /** 传入 LibManifestPlugin 生成 manifest 时是否格式化 */
  format?: boolean;
  runtime?: string;
}

/**
 * `webpack` `DllPlugin`的修改版本,用于实现 ng 的 dll
 *
 *
 */
export class NgDllPlugin {
  constructor(private options: NgDllPluginOptions) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.entryOption.tap('NgDllPlugin', (context, entry) => {
      if (typeof entry !== 'function') {
        for (const name of Object.keys(entry)) {
          const options = {
            name,
            filename: entry.filename,
          };
          new DllEntryPlugin(context, entry[name].import, options).apply(
            compiler
          );
        }
      } else {
        throw new Error(
          "DllPlugin doesn't support dynamic entry (function) yet"
        );
      }
      return true;
    });
    new LibManifestPlugin({ ...this.options, entryOnly: false }).apply(
      compiler
    );

    new NgFilterPlugin(this.options.filter, this.options.runtime).apply(
      compiler
    );
  }
}

interface NormalModule extends webpack.Module {
  rawRequest: string | null;
  context: string | null;
  dependencies: any[];
}

export interface NgFilterPluginOptions {
  /** 过滤插件的过滤模式,默认full */
  mode: 'full' | 'auto' | 'filter';
  /** mode==='filter' 下使用,通过逻辑控制 */
  filter?: (module: NormalModule) => boolean;
}

class NgFilterPlugin {
  explanation = 'NgFilterPlugin';
  unCompressMap: Map<string, string[]> = new Map();
  constructor(
    private options: NgFilterPluginOptions = { mode: 'full' },
    private runtime: string = 'main'
  ) {
    // this.options.mode = this.options.mode || 'full';
    if (this.options.mode === 'filter') {
      if (!this.options.filter) {
        throw new Error('[filter] mode must have [filter] Property');
      }
    }
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compile.tap('NgFilterPlugin', ({ normalModuleFactory }) => {
      normalModuleFactory.hooks.parser
        .for('javascript/auto')
        .tap('NgFilterPlugin', (parser) => {
          parser.hooks.importCall.tap('NgFilterPlugin', () => {
            return false;
          });
        });
    });
    compiler.hooks.thisCompilation.tap('NgFilterPlugin', (compilation) => {
      const moduleGraph = compilation.moduleGraph;

      compilation.hooks.renderManifest.tap(
        'NgFilterPlugin',
        (list, options) => {
          let modules = options.chunkGraph.getChunkModulesIterable(
            options.chunk
          );
          for (const module of modules) {
            if (
              (!(module.context || '').includes('node_modules') &&
                (module as any).rawRequest) ||
              (module.context || '').includes('$$_lazy_route_resource')
            ) {
              (modules as any).delete(module);
              continue;
            }
            if (!moduleGraph.getUsedExports(module, this.runtime)) {
              (modules as any).delete(module);
            }
          }
          return list;
        }
      );

      compilation.hooks.optimizeDependencies.tap(
        'NgFilterPlugin',
        (modules) => {
          for (const module of modules as NormalModule[]) {
            switch (this.options.mode) {
              case 'full':
                const exportsInfo = moduleGraph.getExportsInfo(module);
                exportsInfo.setHasUseInfo();
                exportsInfo.setUsedInUnknownWay(this.runtime);
                moduleGraph.addExtraReason(module, this.explanation);
                moduleGraph.getUsedExports(module, this.runtime);
                if (module.factoryMeta === undefined) {
                  module.factoryMeta = {};
                }
                (module.factoryMeta as any).sideEffectFree = false;
                break;
              case 'filter':
                if (this.options.filter(module)) {
                  module.getConcatenationBailoutReason = () => {
                    return this.explanation;
                  };
                  const exportsInfo = moduleGraph.getExportsInfo(module);
                  exportsInfo.setHasUseInfo();
                  exportsInfo.setUsedInUnknownWay(this.runtime);
                  moduleGraph.addExtraReason(module, this.explanation);
                  if (module.factoryMeta === undefined) {
                    module.factoryMeta = {};
                  }
                  (module.factoryMeta as any).sideEffectFree = false;
                } else {
                }
                break;
              default:
                throw new Error(`unknown mode [${this.options.mode}]`);
            }
          }
        }
      );
    });
  }
}
