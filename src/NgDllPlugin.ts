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
      const itemToPlugin = (item, name) => {
        if (Array.isArray(item)) {
          return new DllEntryPlugin(context, item, name);
        }
        throw new Error('NgDllPlugin: supply an Array as entry');
      };
      if (typeof entry === 'object' && !Array.isArray(entry)) {
        Object.keys(entry).forEach((name) => {
          itemToPlugin(entry[name], name).apply(compiler);
        });
      } else {
        itemToPlugin(entry, 'main').apply(compiler);
      }
      return true;
    });
    new LibManifestPlugin({ ...this.options, entryOnly: false }).apply(
      compiler
    );

    new NgFilterPlugin(this.options.filter).apply(compiler);
  }
}

interface NormalModule extends webpack.compilation.Module {
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
  constructor(private options: NgFilterPluginOptions = { mode: 'full' }) {
    // this.options.mode = this.options.mode || 'full';
    if (this.options.mode === 'filter') {
      if (!this.options.filter) {
        throw new Error('[filter] mode must have [filter] Property');
      }
    }
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compile.tap(
      'NgFilterPlugin',
      ({
        normalModuleFactory,
      }: {
        normalModuleFactory: webpack.compilation.NormalModuleFactory;
      }) => {
        normalModuleFactory.hooks.parser
          .for('javascript/auto')
          .tap('NgFilterPlugin', (parser) => {
            parser.hooks.importCall.tap('NgFilterPlugin', () => {
              return false;
            });
          });
      }
    );
    compiler.hooks.thisCompilation.tap('NgFilterPlugin', (compilation) => {
      const hooks: {
        modules: SyncWaterfallHook<string, webpack.compilation.Chunk>;
      } = compilation.mainTemplate.hooks as any;
      hooks.modules.tap('NgFilterPlugin', (e, chunk) => {
        for (const module of chunk.modulesIterable as webpack.SortableSet<NormalModule>) {
          if (
            (!module.context.includes('node_modules') && module.rawRequest) ||
            (module.context || '').includes('$$_lazy_route_resource')
          ) {
            chunk.modulesIterable.delete(module);
          }
        }
        return e;
      });

      compilation.hooks.optimizeDependencies.tap(
        'NgFilterPlugin',
        (modules) => {
          // this.unCompressMap = new Map();
          for (const module of modules as NormalModule[]) {
            switch (this.options.mode) {
              case 'full':
                Object.defineProperty(module, 'used', {
                  get() {
                    return true;
                  },
                  set() {},
                });
                // module.used = true;
                module.usedExports = true;
                module.addReason(null, null, this.explanation);
                break;
              case 'auto':
                if (
                  module.rawRequest &&
                  this.unCompressMap.has(module.rawRequest)
                ) {
                  const oldIsUsed = module.isUsed;
                  const unCompressList = this.unCompressMap.get(
                    module.rawRequest
                  );
                  module.isUsed = function (name: string) {
                    if (unCompressList.includes(name)) {
                      return name;
                    }
                    return oldIsUsed.call(this, name);
                  };
                }
                module.addReason(null, null, this.explanation);
                this.setUnCompressMap(module);
                break;
              case 'filter':
                if (this.options.filter(module)) {
                  Object.defineProperty(module, 'used', {
                    get() {
                      return true;
                    },
                    set() {},
                  });
                  // module.used = true;
                  module.usedExports = true;
                  module.addReason(null, null, this.explanation);
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

  /**
   * 查找模块中引用.不压缩名字的
   *
   * @author cyia
   * @date 2020-10-08
   * @param module
   */
  setUnCompressMap(module: NormalModule) {
    if (!/node_modules/.test(module.context || '') && module.dependencies) {
      if (module.dependencies && module.dependencies.length) {
        module.dependencies.forEach((dependency) => {
          if (
            dependency.request &&
            /(^(@angular(\/|\\)(core|common|router|platform-browser|forms))$)|rxjs/.test(
              dependency.request
            ) &&
            dependency.id
          ) {
            const list: string[] =
              this.unCompressMap.get(dependency.request) || [];
            if (!list.includes(dependency.id)) {
              list.push(dependency.id);
            }
            this.unCompressMap.set(dependency.request, list);
          }
        });
      }
    }
  }
}
